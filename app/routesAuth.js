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
// PROFILE SECTION ========== 17-12-2021
// =====================================
//GET
  // we will want this protected so you have to be logged in to visit
  // we will use route middleware to verify this (the isLoggedIn function)
  app.get('/profile', lib.isLoggedIn, function(req, res) {
      
    console.log('REQ.USER: ', req.user)

    Friends.find({id : req.user._id }, function(err, friends) {
        
        if (err) {
          req.flash('error','Something bad happened while retriving friends! Please retry');
          console.log('ERROR PROFILE FIND FRIENDS:', err );
          return res.render('info.njk', {message: req.flash('error'), type: "danger"});
        }

        res.render('profile.njk', {
            user : req.user, // get the user out of session and pass to template
            numFriends  : friends.length,
            friendsMap  : friends,
            message     : req.flash('success')
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
// FORGOT =================== 21-12-2021
// =====================================
//GET
  app.get('/forgot', function(req, res) {
      res.render('forgot.njk');
  });
//POST
  app.post('/forgot', function(req, res) {
    Users.findOne({ email: req.body.email }, function(err, user) {
        // Handle error: best practicies
        if (err) {
          req.flash('error','Something bad happened! Please retry');
          console.log('ERROR RESET PASSWORD:', err );
          return res.render('info.njk', {message: req.flash('error'), type: "danger"}); 
         
        }; 

        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          res.render('forgot.njk', {message: req.flash('error')});
        } else {
          var token = lib.generateToken(20);
          user.resetPasswordToken = token;
          user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

          console.log('POST FORGOT USER: ',user)
          
          user.save(function(err) {
          
            if(err) {
              req.flash('error','Something bad happened! Please retry');
              console.log('ERROR RESET PASSWORD:', err );
              return res.render('info.njk', {message: req.flash('error'), type: "danger"});
            }
          
            var mailOptions = {
              to: user.email,
              from: 'info@sharingbeer.com',
              subject: 'SharingBeer Password Reset',
              text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                'https://' + req.headers.host + '/reset?token=' + token + '\n\n' +
                'If you did not request this, please ignore this email and your password will remain unchanged.\n'
            };
        
            transporter.sendMail(mailOptions, function(err, info){
                if(err){
                  req.flash('error','Something bad happened! I can not send the email. Please retry');
                  console.log('ERROR RESET PASSWORD SEND EMAIL:', err );
                  return res.render('info.njk', {message: req.flash('error'), type: "danger"});
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
// RESET PASSWORD ============ 21/2/2021
// =====================================
//GET
  app.get('/reset', function(req, res) {

    console.log('GET RESET TOKEN: ', req.query.token);
  
    Users.findOne({ resetPasswordToken: req.query.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {

      if(err) {
        req.flash('error','Something bad happened! Please retry');
        console.log('ERROR RESET PASSWORD BY TOKEN:', err );
        return res.render('info.njk', {message: req.flash('error'), type: "danger"});
      }

      if (!user) {
        req.flash('error', 'Password reset token is invalid or has expired.');
        res.render('forgot.dust', {message: req.flash('error')});
      } else {
        res.render('reset.njk', { user: req.user, token: req.query.token });
      };
    });
  });
//POST
  app.post('/reset', function(req, res) {

    console.log('POST RESET TOKEN: ', req.body.token);

    if (req.body.password != req.body.confirm) {
    
      req.flash('error', 'Password do not match');
      res.render('reset.njk', {message: req.flash('error'), token:req.body.token });          
    
    } else {
      
      Users.findOne({ resetPasswordToken: req.body.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        
        if(err) {
          req.flash('error','Something bad happened! Please retry');
          console.log('ERROR RESET PASSWORD BY TOKEN:', err );
          return res.render('info.njk', {message: req.flash('error'), type: "danger"});
        }

        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          res.render('forgot.dust', {message: req.flash('error')});          
        } else {

          var common = new Users();
          user.password = common.generateHash(req.body.password);
          user.resetPasswordToken = undefined;
          user.resetPasswordExpires = undefined;

          user.save(function(err) {
            
            if(err) {
              req.flash('error','Something bad happened! Please retry');
              console.log('ERROR RESET PASSWORD BY TOKEN:', err );
              return res.render('info.njk', {message: req.flash('error'), type: "danger"});
            }

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

// =====================================
// PASSPORT ERROR HANDLE ==== 18/12/2021
// =====================================
  app.use( function(error, req, res, next) {
  // Error gets here

    let msgFlash = req.flash('error');
    let msgError = error;
    console.error(msgFlash);
    res.render('info.njk', {message: msgFlash, type: "danger"});
  });

};

