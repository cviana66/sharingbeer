// app/routes.js

var transporter   = require('../config/mailerMailgun');

var Friends       = require('../app/models/friend');
var Users         = require('../app/models/user');
var lib           = require('./libfunction');

module.exports = function(app, passport) {

// =====================================
// HOME PAGE (with login links) ========
// =====================================
//GET
  app.get('/', function(req, res) {
      res.render('index.njk', {
          user: req.user,
          numProducts : req.session.numProducts
      }); // load the index.ejs file
  });

// =====================================
// LOGIN ===============================
// =====================================
//GET
  // show the login form
  app.get('/login', function(req, res) {
      // render the page and pass in any flash data if it exists
      res.render('login.njk', { message: req.flash('loginMessage') });
  });

  app.get('/login/:user', function(req, res) {
      // render the page and pass in any flash data if it exists
      res.render('login.dust', { message: req.flash('loginMessage'), 
                                 user: req.params.user });
  });
//POST
  // process the login form
  app.post('/login', passport.authenticate('local-login', {
      successRedirect : '/shop', // redirect to the secure profile section
      failureRedirect : '/login', // redirect back to the signup page if there is an error
      failureFlash : true 
  }));

// =====================================
// PROFILE SECTION =====================
// =====================================
//GET
  // we will want this protected so you have to be logged in to visit
  // we will use route middleware to verify this (the isLoggedIn function)
  app.get('/profile', lib.isLoggedIn, function(req, res) {
      
    console.log('REQ.USER: ', req.user)

    Friends.find({id : req.user._id }, function(err, friends) {
        
        if (err) { res.send(err); }

        res.render('profile.dust', {
            user : req.user, // get the user out of session and pass to template
            numFriends  : friends.length,
            friendMap   : friends,
            message: req.flash('success')
        });
    });
  });

// =====================================
// LOGOUT ==============================
// =====================================
//GET
app.get('/logout', function(req, res) {
      req.session.destroy();
      req.logout();
      res.redirect('/');
  });

// =====================================
// FORGOT ==============================
// =====================================
//GET
  app.get('/forgot', function(req, res) {
      res.render('forgot.dust');
  });
//POST
  app.post('/forgot', function(req, res, next) {
    Users.findOne({ email: req.body.email }, function(err, user) {
        
        if (err) { return console.error('error',err); next(err)}; //TODO verificare simulando comportamento con errore

        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          res.render('forgot.dust', {message: req.flash('error')});
        } else {
          var token = lib.generateToken(20);
          user.resetPasswordToken = token;
          user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

          console.log('POST FORGOT USER: ',user)
          
          user.save(function(err) {
          
            if(err) return console.log('error: ', err); //TODO la gestione in caso di errore
          
            var mailOptions = {
              to: user.email,
              from: 'info@sharingbeer.com',
              subject: 'SharingBeer Password Reset',
              text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                'https://' + req.headers.host + '/reset?token=' + token + '\n\n' +
                'If you did not request this, please ignore this email and your password will remain unchanged.\n'
            };
        
            transporter.sendMail(mailOptions, function(error, info){
                if(error){
                  return console.log('ERROR: ', error);
                } else {
                 console.log('Message reset password sent!', info);
                 req.flash('loginMessage', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
                 res.redirect('/login');
                };
            });
          });
        };
      });      
    });

// =====================================
// RESET PASSWORD ======================
// =====================================
//GET
  app.get('/reset', function(req, res) {

    console.log('GET RESET TOKEN: ', req.query.token);
  
    Users.findOne({ resetPasswordToken: req.query.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {

      if(err) return console.log('ERROR: ', err);
      
      if (!user) {
        req.flash('error', 'Password reset token is invalid or has expired.');
        res.render('forgot.dust', {message: req.flash('error')});
      } else {
        res.render('reset.dust', { user: req.user, token: req.query.token });
      };
    });
  });
//POST
  app.post('/reset', function(req, res) {

    console.log('POST RESET TOKEN: ', req.body.token);

    if (req.body.password != req.body.confirm) {
    
      req.flash('error', 'Password do not match');
      res.render('reset.dust', {message: req.flash('error'), token:req.body.token });          
    
    } else {
      
      Users.findOne({ resetPasswordToken: req.body.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        
        if(err) return console.log('ERROR: ', err);

        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          res.render('forgot.dust', {message: req.flash('error')});          
        } else {

          var common = new Users();
          user.password = common.generateHash(req.body.password);
          user.resetPasswordToken = undefined;
          user.resetPasswordExpires = undefined;

          user.save(function(err) {
            
            if(err) return console.log('ERROR: ', err);
            
            req.logIn(user, function(err) {
              if(err) return console.log('ERROR: ', err);
              req.flash('success', 'Success! Your password has been changed.'); 
              res.redirect('/profile')
            });
          });
        };
      });
    }
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
      })
  );
};

