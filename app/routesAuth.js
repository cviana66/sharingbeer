// app/routes.js

var transporter   = require('../config/mailerMailgun');

var Friends       = require('../app/models/friend');
var Users         = require('../app/models/user');
var lib           = require('./libfunction');
const moment      = require("moment");

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
      res.render('login.njk', { message: req.flash('loginMessage'),
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
        let msg = req.flash('success');
        console.log('MESSAGGIO',msg );
        res.render('profile.njk', {
            user : req.user, // get the user out of session and pass to template
            numFriends  : friends.length,
            friendsMap  : friends,
            message     : msg,
            type        : "info"
        });
    });
  });

// =====================================
// LOGOUT ==============================
// =====================================
//GET
app.get('/logout', function(req, res, next) {

  req.logout(function(err) {
    if (err) { return next(err); }
    req.session.destroy();
    res.redirect('/');
      //req.session.destroy();
      //req.logout();
      //res.redirect('/');
  });
});

// =====================================
// FORGOT =================== 21-12-2021: Handle error: best practicies
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
          let msg = 'Something bad happened! Please retry';
          console.error(moment().format()+' [ERROR][RECOVERY:NO] "POST /forgot" EMAIL: {"email":"'+req.body.email+'"} FUNCTION: Users.findOne: '+err+' FLASH: '+msg);
          req.flash('error', msg);
          return res.render('info.njk', {message: req.flash('error'), type: "danger"});

        };

        if (!user) {
          let msg = 'No account with that email address exists.';
          console.info(moment().format()+' [INFO][RECOVERY:NO] "POST /forgot" EMAIL: {"email":"'+req.body.email+'"} FUNCTION: User.findOne: '+err+' FLASH: '+msg);
          req.flash('info', 'No account with that email address exists.');
          return res.render('forgot.njk', {message: req.flash('info')});
        } else {
          var token = lib.generateToken(20);
          user.resetPasswordToken = token;
          user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

          console.log('POST FORGOT USER: ',user)

          user.save(function(err) {

            if(err) {
              let msg = 'Something bad happened! Please retry';
              console.error(moment().format()+' [ERROR][RECOVERY:NO] "POST /forgot" EMAIL: {"email":"'+req.body.email+'"} FUNCTION: user.save: '+err+' FLASH: '+msg);
              req.flash('error',msg);
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
                  let msg = 'Something bad happened! I can not send the email. Please retry';
                  console.error(moment().format()+' [ERROR][RECOVERY:NO] "POST /forgot" EMAIL: {"email":"'+req.body.email+'"} FUNCTION: transporter.sendMail: '+err+' FLASH: '+msg);
                  req.flash('error',msg);
                  return res.render('info.njk', {message: req.flash('error'), type: "danger"});
                } else {
                  let msg = 'Message reset password sent!';
                  console.info(moment().format()+' [INFO][RECOVERY:NO] "POST /forgot" EMAIL: {"email":"'+req.body.email+'"} FUNCTION: User.findOne: '+err+' FLASH: '+msg);
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

    Users.findOne({ resetPasswordToken: req.query.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {

      if(err) {
        let msg = 'Something bad happened! Please retry';
        req.flash('error', msg);
        console.error(moment().format()+' [ERROR][RECOVERY:NO] "GET /reset" TOKEN: {"resetPasswordToken":"'+req.query.token+'"} FUNCTION: Users.findOne: '+err+' FLASH: '+msg);
        return res.render('info.njk', {message: req.flash('error'), type: "danger"});
      }

      if (!user) {
        req.flash('error', 'Password reset: token is invalid or has expired.');
        res.render('forgot.njk', {message: req.flash('error')});
      } else {
        res.render('reset.njk', { token: req.query.token,
                                  email: user.email
                                });
      };
    });
  });
//POST
  app.post('/reset', function(req, res) {

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
          res.render('forgot.njk', {message: req.flash('error')});
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
              res.redirect('profile')
            });
          });
        };
      });
    }
  });

// =====================================
// CHANGE PASSWORD =========== 04/3/2022
// =====================================
//GET
  app.get('/change', lib.isLoggedIn, function(req, res) {

    Users.findOne({ email: req.user.email }, function(err, user) {

      if(err) {
        let msg = 'Something bad happened! Please retry';
        req.flash('error', msg);
        console.error(moment().format()+' [ERROR][RECOVERY:NO] "GET /change" email: {"email":"'+req.user.email+'"} FUNCTION: Users.findOne: '+err+' FLASH: '+msg);
        return res.render('info.njk', {message: req.flash('error'), type: "danger"});
      }
      res.render('change.njk');
    });
  });
//POST
  app.post('/change', function(req, res) {

    if (req.body.password != req.body.confirm) {

      req.flash('error', 'Password do not match');
      res.render('Change.njk', {message: req.flash('error') });

    } else {

      Users.findOne({ email: req.user.email }, function(err, user) {

        if(err) {
          let msg = 'Something bad happened! Please retry';
          req.flash('error', msg);
          console.error(moment().format()+' [ERROR][RECOVERY:NO] "POST /change" email: {"email":"'+req.user.email+'"} FUNCTION: Users.findOne: '+err+' FLASH: '+msg);
          return res.render('info.njk', {message: req.flash('error'), type: "danger"});
        }

        var common = new Users();
        user.password = common.generateHash(req.body.password);

        user.save(function(err) {

          if(err) {
            let msg = 'Something bad happened! Please retry';
            req.flash('error', msg);
            console.error(moment().format()+' [ERROR][RECOVERY:NO] "POST /change" email: {"email":"'+req.user.email+'"} FUNCTION: Users.save: '+err+' FLASH: '+msg);
            return res.render('info.njk', {message: req.flash('error'), type: "danger"});
          }

          req.flash('success', 'Success! Your password has been changed.');
          res.redirect('/profile')
        });
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
    console.log(msgFlash);
    console.log(msgError)
    res.render('info.njk', {message: msgFlash, type: "danger"});
  });

};
