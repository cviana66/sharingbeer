#!/bin/env node
//  OpenShift sample Node application
var express = require('express');
var fs      = require('fs');
var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');

var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');
var paypal       = require('paypal-rest-sdk');
var qr           = require('qr-image');
var fs           = require('fs');
//var async        = require('async');
    
var cons = require('consolidate');

// config and connect to our database
var configDB = require('./config/database.js');
mongoose.connect(configDB.url);
var db = mongoose.connection;


// set the form to post and then create a hidden field _method (DELETE, PUT)
var methodOverride = require('method-override');

// authentication ==============================================================
var routesAuth      = require('./app/routesAuth.js');

// ecommerce ===================================================================
var routesShop      = require ('./app/routesShop.js');

// friends registration ========================================================
var routesRegister  = require ('./app/routesRegister.js');

// paypal ======================================================================
var routesPayment    = require ('./app/routesPayment.js');

// passport ====================================================================
var pass            = require('./config/passport');

// paypal ======================================================================

var configPayPal = require('./config/paypal.js');


/**
 *  Define the sample application.
 */
var SharingBeer = function() {

    //  Scope.
    var self = this;


    /*  ================================================================  */
    /*  Helper functions.                                                 */
    /*  ================================================================  */

    /**
     *  Set up server IP address and port # using env variables/defaults.
     */
    self.setupVariables = function() {
        //  Set the environment variables we need.
        self.ipaddress = process.env.OPENSHIFT_NODEJS_IP;
        self.port      = process.env.OPENSHIFT_NODEJS_PORT || 8080;

        if (typeof self.ipaddress === "undefined") {
            //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
            //  allows us to run/test the app locally.
            console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
            self.ipaddress = "127.0.0.1";
        };
    };

    /**
     *  terminator === the termination handler
     *  Terminate server on receipt of the specified signal.
     *  @param {string} sig  Signal to terminate on.
     */
    self.terminator = function(sig){
        if (typeof sig === "string") {
           console.log('%s: Received %s - terminating sample app ...',
                       Date(Date.now()), sig);
           process.exit(1);
        }
        console.log('%s: Node server stopped.', Date(Date.now()) );
    };


    /**
     *  Setup termination handlers (for exit and a list of signals).
     */
    self.setupTerminationHandlers = function(){
        //  Process on exit and signals.
        process.on('exit', function() { self.terminator(); });

        // Removed 'SIGPIPE' from the list - bugz 852598.
        ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
         'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
        ].forEach(function(element, index, array) {
            process.on(element, function() { self.terminator(element); });
        });
    };


    /*  ================================================================  */
    /*  App server functions (main app logic here).                       */
    /*  ================================================================  */

    /**
     *  Create the routing table entries + handlers for the application.
     */
    self.createRoutes = function() {
        routesAuth(self.app, passport);
        routesShop(self.app);
        routesRegister(self.app);
        routesPayment(self.app, paypal, qr, fs);
    };

    /**
     *  Initialize the server (express) 
     */
    self.initializeServer = function() {
        self.app = express();
        paypal.configure(configPayPal.api);
        db.on('error', console.error.bind(console, 'connection error:'));
        db.once('open', function callback() {
            console.log('db connection open');
        }); 
        pass(passport);

        // set up our express application
        self.app.use(morgan('dev')); // log every request to the console
        self.app.use(cookieParser()); // read cookies (needed for auth)
        self.app.use(bodyParser()); // get information from html forms

        //To serve static files such as images, CSS files, and JavaScript files
        self.app.use(express.static(__dirname + '/public'));

        //use to ovwrride method in form: put, delete
        self.app.use(methodOverride('_method'));

        self.app.engine('dust', cons.dust);
        self.app.set('views', __dirname + '/views');
        self.app.set('view engine', 'dust'); // set up dust for templating

        // required for passport
        self.app.use(session({ secret: 'Sam66Kar' })); // session secret
        self.app.use(passport.initialize());
        self.app.use(passport.session()); // persistent login sessions
        self.app.use(flash()); // use connect-flash for flash messages stored in session        
    };


    /**
     *  Initializes the sample application.
     */
    self.initialize = function() {
        self.setupVariables();
        self.setupTerminationHandlers();

        // Create the express server and routes.
        self.initializeServer();
        self.createRoutes();
    };


    /**
     *  Start the server (starts up the sample application).
     */
    self.start = function() {
        //  Start the app on the specific interface (and port).
        self.app.listen(self.port, self.ipaddress, function() {
            console.log('%s: Node server started on %s:%d ...',
                        Date(Date.now() ), self.ipaddress, self.port);
        });
    };

};   /*  Sample Application.  */



/**
 *  main():  Main code.
 */
var zapp = new SharingBeer();
zapp.initialize();
zapp.start();

