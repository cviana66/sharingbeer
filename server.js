#!/bin/env node

const express  = require('express');
const fs       = require('fs');
const util     = require('util');
const mongoose = require('mongoose');
const passport = require('passport');
const flash    = require('connect-flash');

const morgan        = require('morgan');
const cookieParser  = require('cookie-parser');
const bodyParser    = require('body-parser');
const session       = require('express-session');
const paypal        = require('paypal-rest-sdk');
const qr            = require('qr-image');
const nunjucks      = require('nunjucks');
const cons          = require('consolidate');
const moment        = require("moment");
const env           = require('node-env-file'); // si può usare anche il pkg dotenv

const fastcsv       = require("fast-csv");


// config environment variables /
env(__dirname + '/.env');

// connect to our database
const db = require('./config/database.js');


// set the form to post and then create a hidden field _method (DELETE, PUT)
//const methodOverride  = require('method-override'); //commentato in data 15/10/22 per capire se usato no

// authentication ==============================================================
const routesAuth      = require('./app/routesAuth.js');

// ecommerce ===================================================================
const routesShop      = require('./app/routesShop.js');

// friends registration ========================================================
const routesRegister  = require('./app/routesRegister.js');

// QRCode ===================================================================
const routesQrcode   = require('./app/routesQrcode.js');

// paypal v2 ===================================================================
const routesPaypal    = require('./app/routesPaypal');

// passport ====================================================================
const pass            = require('./config/passport');

global.debug = true;

//global.cost = 3;

/*  =======================================================================
    Settings Booze

    1 bottiglia ogni  12  booze
    2 bottiglie ogni  24  booze
    3 bottiglie ogni  36  booze
    4 bottiglie ogni  48  booze

   ======================================================================= */
global.oneBottleBoozeEquivalent   = 12;
global.twoBottleBoozeEquivalent   = 24;
global.threeBottleBoozeEquivalent = 36;
global.fourBottleBoozeEquivalent  = 48;

global.mktBoozeXParent = 1;
global.mktBoozeXFriends = 4; //sono i Booze destinatia al marketing per ogni PKGx4 aquistato
global.numAcquistiXunaBottigliaXunAmico = global.oneBottleBoozeEquivalent / global.mktBoozeXFriends;


/*  =======================================================================
/*  Settings Host
/*  ======================================================================= */
if (process.env.NODE_ENV== "development") {
  global.server = "http://localhost:8080";
} else if (process.env.NODE_ENV == "production") {
  global.server = "https://sharingbeer.it";
}


/*  =======================================================================
/*  Logger in file   DISATTIVATO perchè l'hosting HEROKU non lo permette
/*  Attivato il servizio LogDNA
/*  =======================================================================
var log_file_action = fs.createWriteStream(__dirname + '/actionTODO.log', {flags : 'w'});
var log_file_info = fs.createWriteStream(__dirname + '/applicationInfo.log', {flags : 'w'});
console.log ('################### '+__dirname+' ###################');

var log_stdout = process.stdout;

console.err = function(d) {
  log_file_action.write(util.format(d) + '\n');
  log_stdout.write(util.format(d) + '\n');
};

console.info = function(d) {
  log_file_info.write(util.format(d) + '\n');
  log_stdout.write(util.format(d) + '\n');

}; */

/**
 *  Define the application.
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
    self.setupVariables = function() {const moment = require("moment");
        //  Set the environment variables we need.
        self.port = process.env.PORT;
        console.info(moment().format()+' [INFO] SERVER PORT: '+self.port);
    };

    /**
     *  terminator === the termination handler
     *  Terminate server on receipt of the specified signal.
     *  @param {string} sig  Signal to terminate on.
     */
    self.terminator = function(sig){
        if (typeof sig === "string") {
            console.info(moment().format()+' [INFO] RECEIVED '+sig+': TERMINATING SHARINGBEER APP ...');
            process.exit(1);
        }
        console.info(moment().format()+' [INFO] NODE SERVER STOPPED!');

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
        routesRegister(self.app, db, moment, mongoose, fastcsv, fs, util);
        routesQrcode(self.app, qr);
        routesPaypal(self.app);
    };

    /**
     *  Initialize the server (express)
     */
    self.initializeServer = function() {
        self.app = express();

        db.on('error', err => {
          console.error(moment().format()+' [ERROR] MONGODB CONNECTIO: '+err);
        });

        db.once('open', function callback() {
          console.info(moment().format()+' [INFO] MONGODB OPEN');
        });

        // set up our express application
        self.app.use(cookieParser()); // read cookies (needed for auth)
        self.app.use(bodyParser.json({limit: '50mb'}));
        self.app.use(bodyParser.urlencoded({limit: '50mb', extended: true, parameterLimit: 50000})); // get information from html forms

        //To serve static files such as images, CSS files, and JavaScript files
        self.app.use(express.static(__dirname + '/public'));

        //use to ovwrride method in form: put, delete
        //self.app.use(methodOverride('_method')); //commentato in data 15/10/22 per capire se usato no

        //template engine
        nunjucks.configure('views', {
          autoescape:  true,
          express:  self.app
        });

        // required for passport and session for persistent login
        pass(passport);

        console.info(moment().format()+' [INFO] ENVIRONMENT: '+self.app.get('env'));

        if (self.app.get('env') === 'development') {
            self.app.use(morgan('dev')); // log every request to the console
            self.app.use(session({
              name: '_sb',
              secret: process.env.SESSION_SECRET,
              saveUninitialized: false,
              resave: false,
              cookie: { secure: false,
                        expires: 600000,
                        sameSite: 'strict'} //Cookies will only be sent in a first-party context and not be sent along with requests initiated by third party websites.
            }));
        } else {
            self.app.set('trust proxy', true); // trust first proxy
            self.app.use(session({secret: process.env.SESSION_SECRET, //modify: 18/02/2022
                              saveUninitialized: false,
                              resave: false,
                              cookie: { secure: true, // serve secure cookies
                                        expires: 600000,
                                        sameSite: 'strict'} //Cookies will only be sent in a first-party context and not be sent along with requests initiated by third party websites.
                            }));
        }

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
          console.info(moment().format()+' [INFO] NODE SERVER STARTED, PORT: '+self.port);
        });
    };

};   /*  Sharingbeer Application.  */
/**
 *  main():  Main code.
 */
var sb = new SharingBeer();
sb.initialize();
sb.start();

/*  =========================================================================
    |                 NOTE DI FUNZIONAMENTO DI PROCESSO                     |
    | 1) E'ad invito quindi non è disponibile la funzionalità di SIGN-UP    |
*/

/*  =========================================================================
    |                               TODO                                    |
    | 1) Funzionalità amministrativa di cancellazione di un user            |
*/
