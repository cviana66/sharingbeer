// config/passport.js

// load all the things we need
var LocalStrategy = require('passport-local').Strategy;

//var FacebookStrategy  = require('passport-facebook').Strategy;

// load up the user model
var User = require('../app/models/user');

//var transporter     = require('./mailerXOAuth2');
var transporter = require('./mailerMailgun');

// load the auth variables
var configAuth = require('./auth');

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
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-signup', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
        },
        function(req, email, password, done) {

            // asynchronous
            // User.findOne wont fire unless data is sent back
            process.nextTick(function() {

                console.log("signup");
                // find a user whose email is the same as the forms email
                // we are checking to see if the user trying to login already exists
                User.findOne({ 'email' :  email }, function(err, user) {
                    
                    // if there are any errors, return the error
                    if (err) { return done(err); }
                    
                    // check to see if theres already a user with that email
                    if (user) {
                        return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
                    } else {

                        // if there is no user with that email create the user
                        var newUser = new User();

                        // set the user's local credentials
                        newUser.email    = email;
                        newUser.password = newUser.generateHash(password);

                        // save the user
                        newUser.save(function(err) {
                            if (err)
                                throw err;
                            return done(null, newUser);
                        });
                    }
                });
            });

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
        function(req, email, password, done) { // callback with email and password from our form
            
            console.log("LOGIN");
            
            // find a user whose email is the same as the forms email
            // we are checking to see if the user trying to login already exists
            User.findOne({ 'email' :  email }, function(err, user) {
                // if there are any errors, return the error before anything else
                if (err) {
                    req.flash('error','Something bad happened! There are problems with the network connection. Please try again later');
                    return done(err); 
                }

                // if no user is found, return the message
                if (!user)
                    // req.flash is the way to set flashdata using connect-flash
                    return done(null, false, req.flash('loginMessage', 'No user found.')); 

                // if the user is found but the password is wrong, return the message
                if (!user.validPassword(password))
                    // create the loginMessage and save it to session as flashdata
                    return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); 

                // all is well, return successful user
                console.log('ID PASSPORT: ', user._id);

                // if the user status  is "new" then it is the first access --> validation put status = confirmed
                if (user.status == 'new') {
                    User.findByIdAndUpdate(user._id, { $set: { status: "confirmed" }}, function (err, req) {
                        
                        if (err) { 
                            req.flash('error','Something bad happened! There are problems with the network connection. Please try again later');
                            return done(err) }
                        else {

                            // booze to add to parent for invitatition done
                            User.findOne({'_id': user.idParent }, function(err, parent) {
                                // if there are any errors, return the error
                                if (err) {
                                    req.flash('error','Something bad happened! There are problems with the network connection. Please try again later'); 
                                    return done(err); 
                                }

                                console.log('PARENT ID: ', parent._id);

                                parent.booze += global.cost; //add Booze to Parent
                                
                                User.update({'_id':parent._id}, {$set: {booze: parent.booze}}, function (err, req, res) {
                                  
                                  if (err) { 
                                    req.flash('error','Something bad happened! There are problems with the network connection. Please try again later'); 
                                    return done(err);      
                                    }
                                });     
                            });
                        };
                    });
                } 
                return done(null, user)
            });
        }
    ));
    /*
    // =========================================================================
    // FACEBOOK ================================================================
    // =========================================================================
    passport.use('facebook', new FacebookStrategy({

        // pull in our app id and secret from our auth.js file
        clientID        : configAuth.facebookAuth.clientID,
        clientSecret    : configAuth.facebookAuth.clientSecret,
        callbackURL     : configAuth.facebookAuth.callbackURL

    },

    // facebook will send back the token and profile
    function(token, refreshToken, profile, done) {

        // asynchronous
        process.
        nextTick(function() {

            // find the user in the database based on their facebook id
            User.findOne({ 'facebook.id' : profile.id }, function(err, user) {

                // if there is an error, stop everything and return that
                // ie an error connecting to the database
                if (err)
                    return done(err);

                // if the user is found, then log them in
                if (user) {
                    return done(null, user); // user found, return that user
                } else {
                    // if there is no user found with that facebook id, create them
                    var newUser            = new User();

                    // set all of the facebook information in our user model
                    newUser.facebook.id    = profile.id; // set the users facebook id
                    newUser.facebook.token = token; // we will save the token that facebook provides to the user
                    newUser.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName; // look at the passport user profile to see how names are returned
                    newUser.facebook.email = profile.emails[0].value; // facebook can return multiple emails so we'll take the first

                    // save our user to the database
                    newUser.save(function(err) {
                        if (err)
                            throw err;

                        // if successful, return the new user
                        return done(null, newUser);
                    });
                }
            });
        });
    })); */
};