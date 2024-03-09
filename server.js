#!/bin/env node
//develop
const express  = require('express');                // Express. https://expressjs.com/
const fs       = require('fs');                     // File System. https://nodejs.org/api/fs.html
const util     = require('util');                   // Utilità. https://nodejs.org/api/util.html
//const mongoose = require('mongoose');               // Gestione MongoDB. https://mongoosejs.com/docs/
const MongoStore    = require("connect-mongo");
const passport = require('passport');               // Autenticazione. https://www.passportjs.org
const flash    = require('connect-flash');          // Gestione messaggi in sessione. https://www.npmjs.com/package/connect-flash

const morgan        = require('morgan');            // LOGGER. https://www.npmjs.com/package/morgan
const cookieParser  = require('cookie-parser');     // Gestione Cookies. https://www.npmjs.com/package/cookie-parser
const bodyParser    = require('body-parser');       // Parser info body prima di route. https://www.npmjs.com/package/body-parser
const session       = require('express-session');   // Gestione sessione. https://www.npmjs.com/package/express-session
const paypal        = require('paypal-rest-sdk');   // PayPal
const qr            = require('qr-image');          // Generazione QR Code. https://www.npmjs.com/package/qr-image
const nunjucks      = require('nunjucks');          // Template per Javascript. https://mozilla.github.io/nunjucks/
//const cons          = require('consolidate');       // Consolida il framework da utilizzare per package. NON USATO?. https://github.com/tj/consolidate.js
const moment        = require("moment-timezone");            // Formattazione delle date. https://www.npmjs.com/package/moment

moment().tz("Europe/Rome").format();

//const env           = require('node-env-file');     // Gestione del file ENV. Alternativa a dotenv. https://www.npmjs.com/package/node-env-file

const fastcsv       = require("fast-csv");          // Gestione dei file CSV. https://c2fo.github.io/fast-csv/docs/introduction/getting-started

// config environment variables /
//env(__dirname + '/.env');

//=================================================
// Connect to our database
const mongoose = require('./config/database.js');
//=================================================

// set the form to post and then create a hidden field _method (DELETE, PUT)
//const methodOverride  = require('method-override'); //commentato in data 15/10/22 per capire se usato no

// authentication ==============================================================
const routesAuth      = require('./app/routesAuth.js');

// ecommerce ===================================================================
const routesShop      = require('./app/routesShop.js');

// friends registration ========================================================
const routesRegister  = require('./app/routesRegister.js');

// QRCode ======================================================================
const routesQrcode   = require('./app/routesQrcode.js');

// paypal v2 ===================================================================
const routesPaypal    = require('./app/routesPaypal');

// Axerve ======================================================================
const routesAxerve    = require('./app/routesAxerve');

// passport ====================================================================
const pass            = require('./config/passport');

// transMsgPost=================================================================
const {transMsgPost}  = require('./app/msgHandler');

// transMsgPost=================================================================
const {getDistancePost} = require('./app/geoCoordHandler');

// geoMap ======================================================================
const {geoMap}        = require('./app/routesGeoMap');

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

var isDebugMode = true;
console.debug = function(arg1,arg2)
{
  if (isDebugMode){
    console.log(arg1,arg2);
  }
}

/*  =======================================================================
/*  Settings Host
/*  ======================================================================= */
/*
if (process.env.NODE_ENV== "development") {
  global.server = "http://localhost:8080";
} else if (process.env.NODE_ENV == "production") {
  global.server = "https://sharingbeer.it";
}
*/

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
    self.setupVariables = function() {
        //  Set the environment variables we need.
        self.port = process.env.PORT || 3000;
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
        routesAuth(self.app, passport, moment);
        routesShop(self.app);
        routesRegister(self.app, moment, mongoose, fastcsv, fs, util);
        routesQrcode(self.app, qr, moment);
        routesPaypal(self.app, mongoose, moment);
        routesAxerve(self.app, mongoose, moment);
        transMsgPost(self.app);
        getDistancePost(self.app);
        geoMap(self.app, moment);
    };

    /**
     *  Initialize the server (express)
     */
    self.initializeServer = function() {
        self.app = express();
/*
        db.on('error', err => {
          console.error(moment().format()+' [ERROR] MONGODB CONNECTIO: '+err);
        });

        db.once('open', function callback() {
          console.info(moment().format()+' [INFO] MONGODB OPEN');
        });
*/
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

        console.info(moment().format()+' [INFO] ENVIRONMENT: '+process.env.NODE_ENV);

        if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'pre-production') {
            self.app.use(morgan('dev')); // log every request to the console
            self.app.use(session({
              name: '_sb',
              secret: process.env.SESSION_SECRET,
              saveUninitialized: false,
              resave: false,
              cookie: { secure: false,
                        expires: 6000000,
                        sameSite: 'strict'}, //Cookies will only be sent in a first-party context and not be sent along with requests initiated by third party websites.
              //store: MongoStore.create({mongoUrl: process.env.MONGODB_URL})
              store: MongoStore.create({
                client: mongoose.connection.getClient(),
                dbName: "dbm1",
                stringify: false,
                autoRemove: 'interval',
                autoRemoveInterval: 1 // removing expired sessions, using defined interval in minutes
              })

            }));
        } else {
            self.app.set('trust proxy', true); // trust first proxy
            self.app.use(session({secret: process.env.SESSION_SECRET, //modify: 18/02/2022
                              saveUninitialized: false,
                              resave: false,
                              cookie: { secure: true, // serve secure cookies
                                        expires: 600000,
                                        sameSite: 'strict'}, //Cookies will only be sent in a first-party context and not be sent along with requests initiated by third party websites.
                              //store: MongoStore.create({mongoUrl: process.env.MONGODB_URL})
                              store: MongoStore.create({
                                client: mongoose.connection.getClient(),
                                dbName: "cluster0",
                                stringify: false,
                                autoRemove: 'interval',
                                autoRemoveInterval: 2 // emoving expired sessions, using defined interval in minutes
                              })
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
          console.info(moment().format()+' [INFO] NODE SERVER STARTED');
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
