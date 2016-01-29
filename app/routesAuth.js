// app/routes.js

var transporter   = require('../config/mailerMailgun');
var async         = require('async');
var crypto        = require('crypto');
var User          = require('../app/models/user');

module.exports = function(app, passport) {

  // =====================================
  // HOME PAGE (with login links) ========
  // =====================================
  app.get('/', function(req, res) {
      res.render('index.dust', {
          user: req.user,
          numProducts : req.session.numProducts
      }); // load the index.ejs file
  });

  // =====================================
  // LOGIN ===============================
  // =====================================
  // show the login form
  app.get('/login', function(req, res) {
      //set session variable
      req.session.cost = 3;
      req.session.change = 1;


      // render the page and pass in any flash data if it exists
      res.render('login.dust', { message: req.flash('loginMessage') });
  });

  // process the login form
  app.post('/login', passport.authenticate('local-login', {
      successRedirect : '/shop', // redirect to the secure profile section
      failureRedirect : '/login', // redirect back to the signup page if there is an error
      failureFlash : true // allow flash messages
  }));

  // =====================================
  // SIGNUP ==============================
  // =====================================
  // show the signup form
  app.get('/signup', isLoggedIn, function(req, res) {

      // render the page and pass in any flash data if it exists
      res.render('signup.dust', { 
          message: req.flash('signupMessage'),
          numProducts : req.session.numProducts 
      });
  });

  // process the signup form
  app.post('/signup', passport.authenticate('local-signup', {
      successRedirect : '/profile', // redirect to the secure profile section
      failureRedirect : '/signup', // redirect back to the signup page if there is an error
      failureFlash : true // allow flash messages
  }));

  // =====================================
  // PROFILE SECTION =====================
  // =====================================
  // we will want this protected so you have to be logged in to visit
  // we will use route middleware to verify this (the isLoggedIn function)
  app.get('/profile', isLoggedIn, function(req, res) {
      res.render('profile.dust', {
          user : req.user, // get the user out of session and pass to template
          numProducts : req.session.numProducts
      });
  });

  // =====================================
  // FACEBOOK ROUTES =====================
  // =====================================
  // route for facebook authentication and login
  app.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' }));

  // handle the callback after facebook has authenticated the user
  app.get('/auth/facebook/callback',
      passport.authenticate('facebook', {
          successRedirect : '/profile',
          failureRedirect : '/'
      }));


  // =====================================
  // LOGOUT ==============================
  // =====================================
  app.get('/logout', function(req, res) {
      req.session.destroy();
      req.logout();
      res.redirect('/');
  });

  // =====================================
  // FORGOT ==============================
  // =====================================
  app.get('/forgot', function(req, res) {
      res.render('forgot', {
        user: req.user
      });
  });

  app.post('/forgot', function(req, res) {
      User.findOne({ email: req.body.email }, function(err, user) {
          if (!user) {
            req.flash('error', 'No account with that email address exists.');
            res.render('forgot.dust', {message: req.flash('error')});
          } else {
            var token = generateToken(20);
            user.resetPasswordToken = token;
            user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

            console.log('USER: ',user)
            
            user.save(function(err) {
              if(err){
                return console.log('ERROR: ', err);
              }

              var mailOptions = {
                to: user.email,
                from: 'info@sharingbeer.com',
                subject: 'SharingBeer Password Reset',
                text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                  'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                  'http://' + req.headers.host + '/reset/' + token + '\n\n' +
                  'If you did not request this, please ignore this email and your password will remain unchanged.\n'
              };
          
              transporter.sendMail(mailOptions, function(error, info){
                  if(error){
                    return console.log('ERROR: ', error);
                  }else{
                   console.log('Message reset password sent!', info);
                   req.flash('info', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
                   res.render('forgot.dust', {message: req.flash('info')});
                  };
              });
            });
          };
        });      
    });

  app.get('/reset/:token', function(req, res) {
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
      if (!user) {
        req.flash('error', 'Password reset token is invalid or has expired.');
        res.render('forgot.dust', {message: req.flash('error')});
      } else {
        res.render('reset.dust', { user: req.user });
      };
    });
  });


}; // close module

// route middleware to make sure a user is logged in ===========================
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/login');
}

function generateToken(n) {
  var length = n,
    charset = "abcdefghijklnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
    retVal = "";
  for (var i = 0, n = charset.length; i < length; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * n));
  }
  return retVal;
}
