#!/bin/env node

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
const fastcsv       = require("fast-csv");          // Gestione dei file CSV. https://c2fo.github.io/fast-csv/docs/introduction/getting-started
//const cons          = require('consolidate');       // Consolida il framework da utilizzare per package. NON USATO?. https://github.com/tj/consolidate.js
const moment        = require("moment-timezone");            // Formattazione delle date. https://www.npmjs.com/package/moment

moment.locale('it');


/*
moment.tz.setDefault("America/Los_Angeles"); 
d = moment().utc("America/Los_Angeles").format()
console.debug(d)
giornoLavorativo = new Date(moment(d).format())
console.debug(giornoLavorativo)
*/

data = new Date()
console.log('New Date',data) 

var c = moment.tz(data, "Europe/Rome");
c.utc("Europe/Rome").format()

console.debug('TZ Europe/Rome =' ,c.format()); 
console.debug('UTC Europe/Rome =' ,c.utc("Europe/Rome").format()); 
console.debug("Date Europe/Rome =",new Date(moment(c).format()))

console.debug(moment().utc("Europe/Rome").format('dddd'))

//=================================================
// Connect to our database
const mongoose = require('./config/database.js'); //TODO: per la PRO impostare parametro per connessione ambiente di produzione su fly.io
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

// percorso consegne ===========================================================
const routesDelivery  = require('./app/routesDelivery');

// ================================
// Gestione Debug
// ================================
global.debug = true
if (process.env.NODE_DEBUG === false) {
    global.debug = false;
}
console.log("DEBUG SETTING=", global.debug);
// ================================

console.log('NODE ENVIRONMENT =', process.env.NODE_ENV);
console.log('GESTPAY =', process.env.SHOPLOGIN);


/*=======================================================================
    Delivery price
    ======================================================================= */

global.priceLocal = ['5.50','4.20','2.80','1.50','0.40'];
global.priceCurier =  ['7.70','7.90','6.60','6.60','5.20','11.10','9.80','8.40','7.70','11.40','10.00','8.70','8.60','7.30','9.90','4.60','3.20'];

/*  =======================================================================
    inviti per ogni acquisto e punti pinta per 1 birra gratis0
    1 punto Pinta = 1 beerbox acquistato
    ======================================================================= */
global.numBottigliePerBeerBox = 6
global.invitiPerOgniAcquisto = 4;
global.numAcquistiPerUnaBottigliaOmaggio = 12;
global.valoreUnPuntoPinta = 0.05 // euro 
//global.puntiPintaPerAcquisto = 1;
// equivalente in € di 1 Punto Pinta = PrezzoBirra / numBottigliePerBeerBox / puntiPintaPerUnaBottiglia
//global.mkt = 0.45;

/*  =======================================================================
    Debug utility
    ======================================================================= */
console.debug = function()
{
  if (global.debug){
     var args = Array.prototype.slice.call(arguments);
     console.log.apply(console,args);
  }
}



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
        console.info(moment().utc("Europe/Rome").format()+' [INFO] SERVER PORT: '+self.port);
    };

    /**
     *  terminator === the termination handler
     *  Terminate server on receipt of the specified signal.
     *  @param {string} sig  Signal to terminate on.
     */
    self.terminator = function(sig){
        if (typeof sig === "string") {
            console.info(moment().utc("Europe/Rome").format()+' [INFO] RECEIVED '+sig+': TERMINATING SHARINGBEER APP ...');
            process.exit(1);
        }
        console.info(moment().utc("Europe/Rome").format()+' [INFO] NODE SERVER STOPPED!');

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
        routesShop(self.app, moment, mongoose);
        routesRegister(self.app, moment, mongoose, fastcsv, fs, util);
        routesQrcode(self.app, qr, moment);
        routesPaypal(self.app, mongoose, moment);
        routesAxerve(self.app, mongoose, moment);
        transMsgPost(self.app);
        getDistancePost(self.app);
        geoMap(self.app, moment);
        routesDelivery(self.app, mongoose, moment);
    };

    /**
     *  Initialize the server (express)
     */
    self.initializeServer = function() {
        self.app = express();
/*
        db.on('error', err => {
          console.error(moment().utc("Europe/Rome").format()+' [ERROR] MONGODB CONNECTIO: '+err);
        });

        db.once('open', function callback() {
          console.info(moment().utc("Europe/Rome").format()+' [INFO] MONGODB OPEN');
        });
*/
        // set up our express application
        self.app.use(cookieParser()); // read cookies (needed for auth)
        self.app.use(bodyParser.json({limit: '50mb'}));
        self.app.use(bodyParser.urlencoded({limit: '50mb', extended: true, parameterLimit: 50000})); // get information from html forms

        //To serve static files such as images, CSS files, and JavaScript files
        self.app.use(express.static(__dirname + '/public'));
        self.app.use(express.static(__dirname + '/views/info'));

        //use to ovwrride method in form: put, delete
        //self.app.use(methodOverride('_method')); //commentato in data 15/10/22 per capire se usato no

        //template engine
        nunjucks.configure('views', {
          autoescape:  true,
          express:  self.app
        });

        // required for passport and session for persistent login
        pass(passport);

        console.info(moment().utc("Europe/Rome").format()+' [INFO] ENVIRONMENT: '+process.env.NODE_ENV);

        if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'pre-production') {
            self.app.use(morgan('dev')); // log every request to the console
            self.app.use(session({
                name: '_sb',
                secret: process.env.SESSION_SECRET,
                saveUninitialized: false,
                resave: false,
                cookie: {   secure: false,
                            expires: 3600000,
                            sameSite: 'Lax'
                        }, //Cookies will only be sent in a first-party context and not be sent along with requests initiated by third party websites.
                //store: MongoStore.create({mongoUrl: process.env.MONGODB_URL})
                store: MongoStore.create({
                    client: mongoose.connection.getClient(),
                    stringify: false,
                    autoRemove: 'interval',
                    autoRemoveInterval: 1 // removing expired sessions, using defined interval in minutes
                })

            }));
        } else {
            self.app.set('trust proxy', true); // trust first proxy
            self.app.use(morgan('tiny'));
            self.app.use(session({
                name: '_sb',
                secret: process.env.SESSION_SECRET, //modify: 18/02/2022
                saveUninitialized: false,
                resave: false,
                cookie: {   secure: true, // serve secure cookies
                            expires: 3600000,
                            sameSite: 'Lax'
                        }, //Cookies will only be sent in a first-party context and not be sent along with requests initiated by third party websites.
                  //store: MongoStore.create({mongoUrl: process.env.MONGODB_URL})
                  store: MongoStore.create({
                    client: mongoose.connection.getClient(),                    
                    stringify: false,
                    autoRemove: 'interval',
                    autoRemoveInterval: 1 // emoving expired sessions, using defined interval in minutes
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
          console.info(moment().utc("Europe/Rome").format()+' [INFO] NODE SERVER STARTED');
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
