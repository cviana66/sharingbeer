// config/passport.js

// load all the things we need
var LocalStrategy = require('passport-local').Strategy;

//var FacebookStrategy  = require('passport-facebook').Strategy;

// load up the user model
var User = require('../app/models/user');

//var transporter     = require('./mailerXOAuth2');
//var transporter = require('./mailer');

// date and time utility
const moment  = require("moment");
const lib     = require('../app/libfunction');

// expose this function to our app using module.exports
module.exports = function(passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
	 passport.deserializeUser(async (id, done) => {
		 try {
			  const user = await User.findById(id);
			  done(null, user);
		 } catch (err) {
			  done(err, null);
		 }
	});


    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

	passport.use('local-signup', new LocalStrategy({
		 // by default, local strategy uses username and password, we will override with email
		 usernameField: 'email',
		 passwordField: 'password',
		 passReqToCallback: true // allows us to pass back the entire request to the callback
	}, async (req, email, password, done) => {
		 try {
			  console.log("signup");

			  // Trova un utente con la stessa email
			  const user = await User.findOne({ 'local.email': email.toLowerCase() });

			  // Se ci sono errori, restituisci l'errore
			  if (!user) {
					// Se non esiste un utente con quella email, creiamo un nuovo utente
					const newUser = new User();

					// Imposta le credenziali locali dell'utente
					newUser.local.email = email;
					newUser.local.password = newUser.generateHash(password);

					// Salva l'utente
					await newUser.save();
					return done(null, newUser);
			  } else {
					// Se l'email è già in uso, restituisci un messaggio di errore
					return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
			  }
		 } catch (err) {
			  // Gestisci eventuali errori
			  return done(err);
		 }
	}));

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
        },
        async (req, email, password, done) => { // callback with email and password from our form
            // find a user whose email is the same as the forms email
            // we are checking to see if the user trying to login already exists
            try {
					 const user = await User.findOne({ 'local.email' :  email.toLowerCase().trim() })
                // if no user is found, return the message
                if (!user) {
                    console.info(lib.logDate("Europe/Rome") + ' [INFO][RECOVERY:NO] "POST /logn" User Not Found"');
                    // req.flash is the way to set flashdata using connect-flash
                    return done(null, false, req.flash('loginMessage', 'Utente sconosciuto'));
                }
                // if the user is found but the password is wrong, return the message
                if (!user.validPassword(password)) {
                    console.info(lib.logDate("Europe/Rome") + ' [INFO][RECOVERY:NO] "POST /logn" Wrong Password');
                    // create the loginMessage and save it to session as flashdata
                    return done(null, false, req.flash('loginMessage', 'La password è errata'));
                }
                // all is well, return successful user
                console.info(lib.logDate("Europe/Rome")+' [INFO] "/login" USERS_ID: {"_id":ObjectId("'+user._id+'")}');
                return done(null, user)
             } catch (err) {
						  let msg = 'Something bad happened! There are problems with the network connection. Please try again later';
                    req.flash('error', msg);
                    console.error(lib.logDate("Europe/Rome") + ' [ERROR][RECOVERY:NO] "POST /logn" email: {"email":"' + email + '"} FUNCTION: User.findOne: ' + err + ' FLASH: ' + msg);
                    return done(err);
             }
       }));
 } // end module
