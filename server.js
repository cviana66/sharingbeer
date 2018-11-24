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
    
var cons = require('consolidate');

// config and connect to our database
var configDB = require('./config/database.js');
mongoose.connect(configDB.url, 
                 {useCreateIndex: true,
                  useNewUrlParser: true});
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
        //self.ipaddress = process.env.IP;
        self.port      = process.env.PORT || 8080;

        if (typeof self.port === 8080) {
            console.warn('LOCAL SERVER');
        } else {
            console.warn('REMOTE SERVER');
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
        db.on('error', console.error.bind(console, 'DataBase connection error:'));
        db.once('open', function callback() {
            console.log('db connection open');
        }); 
        pass(passport);

        // set up our express application
        self.app.use(morgan('dev')); // log every request to the console
        self.app.use(cookieParser()); // read cookies (needed for auth)
        self.app.use(bodyParser.urlencoded({extended: true})); // get information from html forms

        //To serve static files such as images, CSS files, and JavaScript files
        self.app.use(express.static(__dirname + '/public'));

        //use to ovwrride method in form: put, delete
        self.app.use(methodOverride('_method'));

        self.app.engine('dust', cons.dust);
        self.app.set('views', __dirname + '/views');
        self.app.set('view engine', 'dust'); // set up dust for templating

        // required for passport
        self.app.use(session({secret: '1234567890', 
                              saveUninitialized: true,
                              resave: true,
                              cookie: { secure: false }
                            })); // session secret

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
        self.app.listen(self.port, function() {
            console.log('Node server started: %s',
                        Date(Date.now() ));
        });
    };

};   /*  Sample Application.  */



/**
 *  main():  Main code.
 */
var sb = new SharingBeer();
sb.initialize();
sb.start();

