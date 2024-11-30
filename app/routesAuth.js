// app/routes.js

const transporter   = require('../config/mailer');

const Users         = require('./models/user');

const lib           = require('./libfunction');

var mailvalidatemail = require('../config/mailValidateMail');

module.exports = function(app, passport, moment) {

// =====================================
// HOME PAGE (with login links) ========
// =====================================
//GET
  app.get('/', function(req, res) {
      //var video = "video/BiarraViannaColor_Final_Logo_ligth_24.mp4";
      var video = "video/BirraViannaColor_Final_Logo_38.mp4";
      //console.debug(req.session)
      if (process.env.NODE_ENV === 'development') {
        video = ""
      }
      res.render('index.njk', {
          user: req.user,
          numProducts : req.session.numProducts,
          video : video
      }); // load the index.ejs file
  });

// =====================================
// LOGIN ===============================
// =====================================
//GET
  // show the login form
  app.get('/login', function(req, res) {
      console.debug('IN LOGIN req.session.returnTo',req.session.returnTo)
      // render the page and pass in any flash data if it exists
      res.render('login.njk', { message: req.flash('loginMessage'), returnTo: req.session.returnTo });
  });

  app.get('/login/:user', function(req, res) {
      // render the page and pass in any flash data if it exists
      res.render('login.njk', { message: req.flash('loginMessage'),
                                 user: req.params.user });
  });
//POST
  // process the login form
  // https://stackoverflow.com/questions/41475626/passport-authenticate-successredirect-condition
  app.post('/login',  passport.authenticate('local-login', {
                        failureRedirect : '/login', // redirect back to the signup page if there is an error
                        failureFlash : true 
                      }),
                      function (req, res) {
                        console.debug('LOGIN RETURN TO :',req.body.returnTo)
                        res.redirect(req.body.returnTo || '/shop');
                      }
  );

// =====================================
// PROFILE SECTION ========== 17-12-2021
// =====================================
//GET
// we will want this protected so you have to be logged in to visit
// we will use route middleware to verify this (the isLoggedIn function)
app.get('/profile', lib.isLoggedIn, async function(req, res) {

    try {
      // Conta quanti amici hai mandato l'invito 
      const nF = await Users.aggregate([
        {$match:{"_id":req.user._id}}, 
        {$unwind: "$friends"}, 
        {$project:{_id:0,addresses:0,orders:0,local:0}}        
        ]);
      console.debug('INVITI MANDATI', nF)
      // Conta quanti amici invitati hanno accettato 
      const nFa = await Users.aggregate([
        {$match:{"_id":req.user._id}}, 
        {$unwind: "$friends"}, 
        {$match :{ "friends.status":"accepted"}},
        {$project:{_id:0,addresses:0,orders:0,local:0}}
        //{$group:{_id:null,count:{$count:{ }}}}
        ]);      
      console.debug('INVITI ACCETTATI', nFa)
      
      var pinta = (req.user.local.booze / valoreUnPuntoPinta).toFixed(1)
      
      let msg = req.flash('infoProfile');
      console.log('MESSAGGIO',msg, req.user.privacy );
      
      res.render('profile.njk', {
          user     		: req.user.local, // get the user out of session and pass to template
          privacy		: req.user.privacy,
          pinta    		: pinta,
          friends  		: nFa,         
          invites  		: nF,
          message  	: msg,
          type     		: "info",
          numProducts : req.session.numProducts, //numero di proodotti nel carrello
      });

    } catch (e) {
          req.flash('error','Qualche cosa non ha funzionato nella conta dei tui amici. Per favore riprova');
          console.log('ERROR PROFILE FIND FRIENDS:', e );
          return res.render('info.njk', {message: req.flash('error'), type: "danger"});
    }
        
});

app.post('/profile', lib.isLoggedIn, async function(req, res) {
	try {
		const optional = (req.body.checkPrivacyOptional == undefined) ? false : true
		const cessione = (req.body.checkPrivacyCessione == undefined) ? false : true
		
		const user = await Users.findById(req.user._id)
		user.privacy.optional              = optional
		user.privacy.transfer              = cessione
		
		console.debug('req.body.checkPrivacyOptional in PROFILE', optional)
		console.debug('req.body.checkPrivacyCessione in PROFILE', cessione)
		
		await user.save();
		req.flash('infoProfile','La scelta di consenso alla Privacy è stata aggionata');
		res.redirect('/profile')
		
	} catch (e) {
			req.flash('error','Qualche cosa non ha funzionato nella scelta privacy');
          console.log('PROFILE PRIVACY:', e );
          return res.render('info.njk', {message: req.flash('error'), type: "danger"});
	}
})

// =====================================
// LOGOUT ==============================
// =====================================
//GET
app.get('/logout', function(req, res, next) {

  req.logout(function(err) {
    if (err) { return next(err); }
    req.session.destroy();
    req.session = null;
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
    var email =  req.body.email.toLowerCase();
    Users.findOne({'local.email': email }, function(err, user) {
        // Handle error: best practicies
        if (err) {
          let msg = 'Spiacente, si è verificato un errore inatteso! Per cortesia riprova';
          console.error(lib.logDate("Europe/Rome")+' [ERROR][RECOVERY:NO] "POST /forgot" EMAIL: {"email":"'+email+'"} FUNCTION: Users.findOne: '+err+' FLASH: '+msg);
          req.flash('error', msg);
          return res.render('info.njk', {message: req.flash('error'), type: "danger"});

        };

        if (!user) {
          let msg = 'Nessun utente è registrato con l\'indirizzo email '+email;
          console.info(lib.logDate("Europe/Rome")+' [INFO][RECOVERY:NO] "POST /forgot" EMAIL: {"email":"'+email+'"} FUNCTION: User.findOne: '+err+' FLASH: '+msg);
          req.flash('info', msg);
          return res.render('forgot.njk', {message: req.flash('info'), type: "warning"});
        } else {
          var token = lib.generateToken(20);
          user.local.resetPasswordToken = token;
          user.local.resetPasswordExpires = Date.now() + 3600000; // 1 hour

          console.log('POST FORGOT USER: ',user)

          user.save(async function(err) {

            if(err) {
              let msg = 'Spiacente, si è verificato un errore inatteso! Per cortesia riprova';
              console.error(lib.logDate("Europe/Rome")+' [ERROR][RECOVERY:NO] "POST /forgot" EMAIL: {"email":"'+email+'"} FUNCTION: user.save: '+err+' FLASH: '+msg);
              req.flash('error',msg);
              return res.render('info.njk', {message: req.flash('error'), type: "danger"});
            }
            const server = lib.getServer(req);
            try {
              await lib.sendmailToPerson('',user.local.email,'',token,'','','','reset',server);
              let msg = '!';
              console.info(lib.logDate("Europe/Rome")+' [INFO][RECOVERY:NO] "POST /forgot" EMAIL: {"email":"'+email+'"} FUNCTION: User.findOne: '+err+' FLASH: '+msg);
              req.flash('loginMessage', 'Il messaggio con le istruzioni per reimpostare la password è stato inviato a ' + user.local.email );
              res.redirect('/login');
            } catch (e) {
              let msg = 'Spiacente ma qualche cosa non ha funzionato nell\'invio dell\'email. Per cortesia riprova';
              console.error(lib.logDate("Europe/Rome")+' [ERROR][RECOVERY:NO] "POST /forgot" EMAIL: {"email":"'+email+'"} FUNCTION: transporter.sendMail: '+err+' FLASH: '+msg);
              req.flash('error',msg);
              return res.render('info.njk', {message: req.flash('error'), type: "danger"});
            }
            
          });
        };
      });
    });

// =====================================
// RESET PASSWORD ============ 21/2/2021
// =====================================
//GET
  app.get('/reset', function(req, res) {

    Users.findOne({ 'local.resetPasswordToken': req.query.token, 'local.resetPasswordExpires': { $gt: Date.now() } }, function(err, user) {

      if(err) {
        let msg = 'Spiacente, si è verificato un errore inatteso! Per cortesia riprova';
        req.flash('error', msg);
        console.error(lib.logDate("Europe/Rome")+' [ERROR][RECOVERY:NO] "GET /reset" TOKEN: {"resetPasswordToken":"'+req.query.token+'"} FUNCTION: Users.findOne: '+err+' FLASH: '+msg);
        return res.render('info.njk', {message: req.flash('error'), type: "danger"});
      }

      if (!user) {
        req.flash('error', 'Token non più valido o scaduto.');
        res.render('forgot.njk', {message: req.flash('error')});
      } else {
        res.render('reset.njk', { token: req.query.token,
                                  email: user.local.email
                                });
      };
    });
  });
//POST 
  app.post('/reset', function(req, res) {

    if (req.body.password != req.body.confirmPassword) {

      req.flash('error', 'Le password non corrispondono');
      res.render('reset.njk', {message: req.flash('error'), token:req.body.token });

    } else {

      Users.findOne({ "local.resetPasswordToken": req.body.token, "local.resetPasswordExpires": { $gt: Date.now() } }, function(err, user) {

        if(err) {
          req.flash('error','Spiacente, si è verificato un errore inatteso! Per cortesia riprova');
          console.log('ERROR RESET PASSWORD BY TOKEN:', err );
          return res.render('info.njk', {message: req.flash('error'), type: "danger"});
        }

        if (!user) {
          req.flash('error', 'Token non più valido o scaduto.');
          res.render('forgot.njk', {message: req.flash('error')});
        } else {

          var common = new Users();
          user.local.password = common.generateHash(req.body.confirmPassword);
          user.local.resetPasswordToken = undefined;
          user.local.resetPasswordExpires = undefined;

          user.save(function(err) {

            if(err) {
              req.flash('error','Spiacente, si è verificato un errore inatteso! Per cortesia riprova');
              console.log('ERROR RESET PASSWORD BY TOKEN:', err );
              return res.render('info.njk', {message: req.flash('error'), type: "danger"});
            }

            req.logIn(user, function(err) {
              if(err) return console.log('ERROR: ', err);
              req.flash('success', 'Perfetto! La tua password è stata cambianta.');
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

    Users.findOne({ "local.email": req.user.local.email }, function(err, user) {

      if(err) {
        let msg = 'Something bad happened! Please retry';
        req.flash('error', msg);
        console.error(lib.logDate("Europe/Rome")+' [ERROR][RECOVERY:NO] "GET /change" email: {"email":"'+req.user.local.email+'"} FUNCTION: Users.findOne: '+err+' FLASH: '+msg);
        return res.render('info.njk', {message: req.flash('error'), type: "danger"});
      }
      res.render('change.njk',{        
        user        : req.user,
        numProducts : req.session.numProducts
      });
    });
  });

//POST
  app.post('/change', function(req, res) {

    if (req.body.password != req.body.confirm) {

      req.flash('error', 'Password do not match');
      res.render('change.njk', {message: req.flash('error') });

    } else {

      Users.findOne({ "local.email": req.user.local.email }, function(err, user) {

        if(err) {
          let msg = 'Something bad happened! Please retry';
          req.flash('error', msg);
          console.error(lib.logDate("Europe/Rome")+' [ERROR][RECOVERY:NO] "POST /change" email: {"email":"'+req.user.local.email+'"} FUNCTION: Users.findOne: '+err+' FLASH: '+msg);
          return res.render('info.njk', {message: req.flash('error'), type: "danger"});
        }

        var common = new Users();
        user.local.password = common.generateHash(req.body.password);

        user.save(function(err) {

          if(err) {
            let msg = 'Something bad happened! Please retry';
            req.flash('error', msg);
            console.error(lib.logDate("Europe/Rome")+' [ERROR][RECOVERY:NO] "POST /change" email: {"email":"'+req.user.local.email+'"} FUNCTION: Users.save: '+err+' FLASH: '+msg);
            return res.render('info.njk', {message: req.flash('error'), type: "danger"});
          }

          req.flash('infoProfile', 'Your password has been changed.');
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

  //UTILITY
  app.get('/mailvalidatemail', function(req, res) {
      var server = lib.getServer(req);      
      res.send(mailvalidatemail('Token', server))
    }); 

  app.get('/infoCookie', (req,res) => {
    res.render('infoCookie.njk')
  });

  app.get('/infoPrivacy', (req,res) => {
    res.render('infoPrivacy.njk')
  });

  app.get('/infoCondizioniVendita', (req,res) => {
    res.render('infoCondizioniVendita.njk')
  });

};
