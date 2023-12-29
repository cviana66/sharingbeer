// =============================================================================
// FRIENDS MANAGEMENT ==========================================================
// =============================================================================

// load up the user model

var User = require('../app/models/user');
var Friend = require('../app/models/friend');
var CityCap = require('../app/models/cityCap');
var CityIstat = require('../app/models/cityIstat');
var MultipleCap = require('../app/models/multipleCap');
var Address = require('../app/models/address')
var bcrypt = require('bcrypt-nodejs');
//TODO da spostare in libfunction
var lib = require('./libfunction');

var mailfriend = require('../config/mailFriend');
var mailparent = require('../config/mailParent');
var mailinvite = require('../config/mailInvite');
var mailconferme = require('../config/mailConferme');

const https = require('https');

//const assert = require('assert');

module.exports = function(app, moment, mongoose, fastcsv, fs, util) {

    // TESTING
    app.get('/test', function(req, res) {
          req.session.elements = [];
          res.render('testRegistrationV2.njk', {
          });
    });

    app.get('/share', function(req, res) {
          console.log("FISRT NAME: ",req.body.firstName);
          res.render('share.njk', {
                firstName : req.body.firstName // encodeURIComponent("Ciao \n come stai")
          });
    });

    app.get('/qrq', function(req, res) {
          res.render('square.njk', {
          });
    });

    app.get('/redirect', function(req, res) {
        req.flash('info', 'SHOP');
        res.redirect('/shop');
    });
    app.get('/redirectType', function(req, res) {
        req.flash('info', 'SHOP');
        res.redirect('/shop/warning');
    });

    app.get('/testflash', function(req,res) {
      let msg = 'Email Verificata. Utente validato e autenticato';
      req.flash('info', msg);
      console.info(moment().format() + ' [INFO][RECOVERY:NO] "GET /validation" EMAIL:  FLASH: ' + msg);
      res.redirect('/shop');
    });

    app.get('/emailvalidation', function(req,res) {
      res.render('emailValidation.njk', { email: 'indirizzo@email.mio'});  
    });
    

// =====================================
// API =================================
// =====================================
//https://www.istat.it/storage/codici-unita-amministrative/Elenco-comuni-italiani.csv
//https://www.istat.it/storage/codici-unita-amministrative/Elenco-comuni-italiani.xlsx

    app.post('/overpass/:istat', function(req, res) {

      option = '[out:json];'+
               'area[name="'+req.body.city+'"]["ref:ISTAT"="'+req.params.istat+'"];' +
               'way(area)[highway][name];'+
               'for (t["name"])(make x name=_.val;out;);'

      const url = 'https://overpass-api.de/api/interpreter?data='+option;

      console.log('OVERPASS: ',option);

      const request = https.request(url, (response) => {
          let data = ''; // !!!!! inserire/tolgiere  > per creare/eliminare errore
          response.on('data', (chunk) => {
              data = data + chunk.toString();
          });
          
              response.on('end', () => {
                try {
                  const parseJSON = JSON.parse(data);
                  const elements = parseJSON.elements;
                  req.session.elements = elements;
                  //console.log(req.session.elements);
                  res.send('{"status":"200", "statusText":"OK"}');
                } catch (e) {
                  console.log('Error', e);
                  res.send('{"status":"500","statusText":'+e+'"}'); 
                }
              });
          
      });
      request.on('error', (error) => {
          console.log('Error', error);
            res.send('{"status":"500","statusText":'+error+'"}');
      });
      request.end()
    });

    app.post('/streets', function(req, res) {
        var rates = req.session.elements;
        var index, value, result;
        var newArr = [];
        for (index = 0; index < rates.length; ++index) {
            name = rates[index].tags.name.toLowerCase();
            if (name.indexOf(req.body.street.toLowerCase()) != -1) {
                newArr.push(rates[index].tags.name);
            }
        }
        res.send(newArr);
    });

    app.post('/cities',  function(req, res) {
        req.session.elements = [];
        //throw('Genera ERRORE');
        //console.log("city : ", req.body.city);
        CityIstat.find({'Comune': new RegExp('^' + req.body.city,"i")},
                     null,
                     {sort: {Comune: 1}},
                     function(err, city) {
                       //console.log("Got city : ", city);
                       res.send(city)
                     })
    });

    app.post('/caps', function(req, res) {
        //res.send(mailfriend('Roberta', 'rbtvna@gmail.com', '123XyZ', 'Carlo', 'Viana'));
        //res.render('validation.dust', { message: req.flash('validation') });
        //console.log("city : ", req.body.city);
        MultipleCap.find({
            'Comune': req.body.city
        }).sort('CAP').exec(function(err, caps) {
            if (caps.length == 0) {
                CityCap.find({'Comune': req.body.city},
                              null,
                              {sort: {Comune: 1}},
                              function(err, cap) {
                                  console.log('CAP: ', cap);
                                  res.send(cap)
                              });
            } else {
                console.log('CAPS: ', caps);
                res.send(caps)
            }
        });
    });

//------------------------------------------------------------------------------
// UTILITY per importare i Comuni Italiani
//------------------------------------------------------------------------------
    app.get('/importCityIstat/:csvname', (req,res,next) => {
      console.log('PARAM: ',req.params.csvname);
      let stream = fs.createReadStream('./data/'+ req.params.csvname +'.csv');
      let csvData = [];
      let csvStream = fastcsv
        .parse()
        .on("data", function(data) {
          csvData.push({
            Istat: data[0],
            Comune: data[1],
            ZonaGeo: data[2],
            Regione: data[3],
            Provincia: data[4],
            SiglaAuto: data[5],
            CodCatasto: data[6]
          });
        })
        .on("end", function() {
          // remove the first line: header
          csvData.shift();

          console.log(csvData);

          CityIstat.insertMany(csvData, (err, res) => {
            if (err) throw err;
            numDocInserted = res.length;
            console.log('Inserted: '+ res.length);
          });

       });
       stream.pipe(csvStream);
       res.send('Collection CityIstat');
     });

    // =====================================
    // TOKEN VALIDATION ========= 05-01-2022
    // =====================================
    //GET
    app.get('/validation', function(req, res) {

        User.findOne({
            'local.resetPasswordToken': req.query.token,
            'local.resetPasswordExpires': { $gt: Date.now() }
        }, async function(err, user) {
            if (err) {
                let msg = 'Token non più valido o scaduto'; //'Token is invalid or has expired'
                req.flash('error', msg);
                console.error(moment().format() + ' [ERROR][RECOVERY:NO] "GET /validation" TOKEN: {"resetPasswordToken":"' + req.query.token + '"} FUNCTION: User.findOne: ' + err + ' FLASH: ' + msg);
                return res.render('info.njk', {
                                message: req.flash('error'),
                                type: "warning"
                        });
            }

        /*===========================================================================================
          |                                              IMPORTANTE
          |  Quando la pagina friend.njk efettua la chiamata navigator.share() 
          |  avviene il test del link specifcato con conseuente chiamata in GET del /validation e
          |  non essendo ancora salvato lo User il log riporta "Invito non più valido o scaduto" 
          |  che non rappresenta un vero errore. 
          ===========================================================================================*/
            
            if (!user) {
                let msg = 'Invito non più valido o scaduto'; //Invitation is invalid or has expired';
                req.flash('warning', msg);
                console.info(moment().format() + ' [INFO][RECOVERY:NO] "GET /validation" TOKEN: {"resetPasswordToken":"' + req.query.token + '"} FUNCTION: User.findOne: ' + err);
                return res.render('info.njk', {
                                    message: req.flash('warning'),
                                    type: "warning"
                                  });
            } else {
              if (user.local.status == 'new') {
                res.render('validation.njk', {prospect: user.local,});
              } else if (user.local.status == 'waiting') { 
                //START TRANSACTION.local
                const session = await mongoose.startSession();
                session.startTransaction();
                const opts = { session };
                try {
                  user.local.status = 'validated';
                  user.local.resetPasswordToken = undefined;
                  user.local.resetPasswordExpires = undefined;
                  await user.save(opts);

                  await session.commitTransaction();

                } catch (e) {
                  console.log("errore: ",e)
                  
                  await session.abortTransaction();
                  req.flash('error', 'L\'applicazione ha riscontrato un errore non previsto.');
                  req.flash('error', 'Riprova ad effetuare la validazione della mail');
                  req.flash('error', 'Esamineremo il problema con la massima urgenza!');
                  console.error(moment().format()+' [ERROR][RECOVERY:NO] "GET /validation" USERS_ID: {_id:ObjectId("' + user._id + '")} TRANSACTION: '+e);
                  return res.render('info.njk', {message: req.flash('error'), type: "danger"});

                } finally {
                  await session.endSession();
                }
                req.logIn(user, function(err) {
                  if (err) {
                      req.flash('error', 'L\'applicazione ha riscontrato un errore non previsto.');
                      req.flash('error', 'Riprova ad effettuare il logIn');
                      req.flash('error', 'Esamineremo il problema con la massima urgenza!');
                      console.info(moment().format() + ' [ERROR][RECOVERY:NO] "GET /validation" FUNCTION: req.logIn ERROR: ' +err);
                      res.render('info.njk', {message: req.flash('error'), type: "danger"});
                  } else {
                      let msg = 'Email Verificata';
                      let msg1 = 'Utente validato e autenticato';                      
                      console.info(moment().format() + ' [INFO][RECOVERY:NO] "GET /validation" USER_ID: {_id:bjectId("' + req.user._id + '"}');
                      res.render('conferme.njk', { email: req.user.email});
                  }
                });
              }
            };
        });
    });
    //POST
    app.post('/validation', function(req, res) {
    
        User.findOne({
          'local.resetPasswordToken': req.body.token,
          'local.resetPasswordExpires': {$gt: Date.now()}
        }, async function(err, user) {
            if (err || user == null) { 
                let msg = 'Token non più valido o scaduto'; //'Token is invalid or has expired';
                req.flash('error', msg);
                console.error(moment().format() + ' [ERROR][RECOVERY:NO] "POST /validation" TOKEN - USER: {resetPasswordToken:"' + req.body.token + '", _id:'+ user._id + '"}  FUNCTION: User.findOne: ' + err + ' FLASH: ' + msg);
                console.log('POST VALIDATION ERROR: ', err);
                return res.render('info.njk', {
                    message: req.flash('error'),
                    type: "danger"
                });

            } else {
                //start email validation
                if (!lib.emailValidation(req.body.email)) {
                    let msg = 'Indirizzo mail non valido'; //'Please provide a valid email';
                    req.flash('validateMessage', msg)
                    console.info(moment().format() + ' [WARNING][RECOVERY:NO] "POST /validation" OKEN - USER: {resetPasswordToken:"' + req.body.token + '", _id:'+ user._id + '"} FLASH: ' + msg);
                    return res.redirect("/validation?token=" + req.body.token);
                }
                //end email validation
                
                let server;
                if (process.env.NODE_ENV== "development") {
                  server = req.protocol+'://'+req.hostname+':'+process.env.PORT
                } else {
                  server = req.protocol+'://'+req.hostname;
                }

                //START TRANSACTION
                const session = await mongoose.startSession();
                session.startTransaction();

                const friend = await Friend.findOne({ 'emailFriend': req.body.token+'@sb.sb' }).session(session);

                try {
                  const token = lib.generateToken(20);
                  const opts = { session };
                  //const filter = { resetPasswordToken: req.body.token };
                  //const doc = await User.findOne(filter);
                  friend.emailFriend = req.body.email;
                  friend.firstNameFriend = lib.capitalizeFirstLetter(req.body.firstName);
                  await friend.save(opts);
                  user.local.email = req.body.email;
                  user.local.password = user.generateHash(req.body.password);
                  user.local.name.first =  lib.capitalizeFirstLetter(req.body.firstName);
                  user.local.resetPasswordToken = token
                  user.local.status = "waiting"
                  await user.save(opts);

                  await lib.sendmailToPerson(req.body.firstName,req.body.email, '', token, req.body.firstName, '', req.body.email, 'conferme',server);
                  let msg = 'Inviata email di verifica'; //'Validated and Logged';
                  console.info(moment().format() + ' [INFO][RECOVERY:NO] "POST /validation" USER: {_id:"' + user._id + '"} FLASH: ' + msg);

                  await session.commitTransaction();

                  res.render('emailValidation.njk', { email: req.body.email});

                } catch (e) {
                  console.log("errore: ",e)
                  await session.abortTransaction();
                  
                  if (e.code === 11000) {
                    let msg = 'Indirizzo e-mail già registrato';
                    req.flash('validateMessage', msg);
                    console.info(moment().format() + ' [INFO][RECOVERY:NO] "POST /validation" EMAIL: {"email":"' + req.body.email + '"} FUNCTION: User.save: ' + e +' FLASH: ' + msg);
                    res.redirect("/validation?token=" + req.body.token);
                  } else {
                    let msg = 'Spiacente ma qualche cosa non ha funzionato nella validazione della tua e-mail! Riprova';      
                    req.flash('error', msg);
                    console.error(moment().format() + ' [ERROR][RECOVERY:NO] "POST /validation" EMAIL: {"email":"' + req.body.email + '"} FUNCTION: User.save: ' + e + ' FLASH: ' + msg);
                    return res.render('info.njk', {
                        message: req.flash('error'),
                        type: "danger"
                    })              
                  }

                } finally {
                  await session.endSession();
                }
            }
          });
      });

    // =====================================
    // Registrazione come cliente
    // =====================================
    //GET
    app.get('/register', lib.isLoggedIn, function(req, res) {

        if (req.user.local.status == 'validated') {
            var model = { firstName: req.user.local.name.first,
                          lastName: req.user.local.name.last,
                          user: req.user,
                          numProducts : req.session.numProducts
                        }
            res.render('registration.njk', model);

        } else if (req.user.local.status == 'customer' && req.session.numProducts > 0) {
            res.redirect('/addresses');

        } else {
            console.log('User: ', req.user); //TODO: gestire il caso anomalo con un messaggio di warning e loggare
            res.redirect('/cart');
        }
    });
    //POST
    app.post('/register', lib.isLoggedIn, async function(req, res, next) {
        try {
            console.log('ID: ',req.user._id);
            const user = await User.findById(req.user._id);
            //console.log('FORM Register: ',user);     //TODO fare il controllo di inserimento se l'arreay è vuota
            user.local.name.first              = req.body.firstName;
            user.local.name.last               = req.body.lastName;
            user.local.status                  = 'customer'; // to change in 'customer' after session  of testing
            user.addresses.push({
                                first           : req.body.firstName,     
                                last            : req.body.lastName,
                                mobilePrefix    : '+39',
                                mobileNumber    : req.body.mobile,
                                city            : req.body.city, 
                                province        : req.body.provincia,
                                address         : req.body.street,
                                numciv          : req.body.numberciv,
                                main            : 'yes',
                                preference      : 'yes'
            });
            await user.save();
            res.redirect('/addresses');
        } catch(err) {
                console.log('error', err);
                req.flash('error', 'The application has encountered an unknown error.It doesn\'t appear to have affected your data, but our technical staff have been automatically notified and will be looking into this with the utmost urgency.');
                res.render('info.njk', {
                    message: req.flash('error'),
                    type: "danger"
                });
        }
    });

    app.get('/addresses',lib.isLoggedIn, async function(req, res) {
        // TODO:
        //  1. elencare in schede gli indirizzi già presenti e permetterne la selezione
        //  2. permettere l'inserimento di un nuovo indirizzo
        //  3. richiamare cart con il riepilogo 
        try {
            const doc = await User.findById(req.user._id);         
            console.log('DOC:', doc )

            res.render('addresses.njk', {
                addresses   : req.user.addresses,
                firstName   : req.user.local.name.first,
                lastName    : req.user.local.name.last,
                user        : req.user,
                numProducts : req.session.numProducts
            });

        } catch (err) {
            console.log('error', err);
            req.flash('error', err) 
            res.render('info.njk', {
                message: req.flash('error'),
                type: "danger"
            });
        }

    });

    // =====================================
    // FRIEND - gestione degli inviti
    // 24-12-2021
    // 05-02-2022
    // 12-02-2022 introddotto il logger
    // 24-11-2022 uso della Trasaction
    // =====================================
    //GET
    app.get('/recomm', lib.isLoggedIn, function(req, res) {


        // conto quanti amici ha già lo User
        Friend.countDocuments({ emailParent: req.user.local.email }, function(err, numFriends) {
            if (err) {
                console.error(moment().format() + ' [ERROR][RECOVERY:NO] "GET /recomm" USERS_ID: {"_id":ObjectId("' + req.user.id + '")} FUNCTION: Friend.countDocuments: ' + err);
                req.flash('error', 'L\'applicazione ha riscontrato un errore non previsto.');
                req.flash('error', 'Riprova ad effettuare l\'invito');
                req.flash('error', 'Esamineremo il problema con la massima urgenza!');
                return res.render('info.njk', {
                    message: req.flash('error'),
                    type: "danger"
                });
            }
            // recupero le informazioni dell'utente
            User.findOne({ 'local.email': req.user.local.email }, function(err, user) {
                if (err) {
                    console.error(moment().format() + ' [ERROR][RECOVERY:NO] "GET /recomm" USERS_ID: {"_id":ObjectId("' + req.user.id + '")} FUNCTION: User.findOne: ' + err);
                    req.flash('error', 'L\'applicazione ha riscontrato un errore non previsto.');
                    req.flash('error', 'Riprova ad effettuare l\'invito');
                    req.flash('error', 'Esamineremo il problema con la massima urgenza!');
                    return res.render('info.njk', {
                        message: req.flash('error'),
                        type: "danger"
                    });
                }

                req.session.invitationAvailable = parseInt(user.local.eligibleFriends, 10); //numero di inviti disponibili = amici ammissibili
                req.session.friendsInvited = parseInt(numFriends, 10);                      //numero di amici già invitati

                let error = "";
                let controlSates = "";
                let flag = "false";
                
                // controllo che ci siano ancora inviti diposnibili
                if (req.session.friendsInvited >= req.session.invitationAvailable) {
                    req.flash('info', "Non hai inviti disponibili!");
                    req.flash('info', "Acquista un BoxNbeer per avere un nuovo invito");                    
                    controlSates = "disabled";
                    flag = "true";
                }

                let server;
                if (process.env.NODE_ENV== "development") {
                  server = req.protocol+'://'+req.hostname+':'+process.env.PORT
                } else {
                  server = req.protocol+'://'+req.hostname;
                }
                res.render('friend.njk', {
                    controlSates: controlSates,
                    flag: flag,
                    message: req.flash('info'),
                    type: "info",
                    user: req.user.local,
                    invitationAvailable: req.session.invitationAvailable - req.session.friendsInvited,
                    friendsInvited: req.session.friendsInvited,
                    percentage: Math.round(req.session.friendsInvited * 100 / req.session.invitationAvailable), //numProducts : req.session.numProducts
                    //token: lib.generateToken(20),
                    parentName: req.user.local.name.first,
                    parentEmail: req.user.local.email,
                    server: server
                });
            });
        });
    });
    //POST
    app.post('/recomm', lib.isLoggedIn, async (req, res) => {

        // controllo che ci siano ancora inviti diposnibili
        if (req.session.friendsInvited >= req.session.invitationAvailable) {
            req.flash('info', "Non hai inviti disponibili!");
            req.flash('info', "Acquista un BoxNbeer per avere un nuovo invito");
            return res.render('friend.njk', {
                message: req.flash('info'),
                type: "info",
                invitationAvailable: req.session.invitationAvailable - req.session.friendsInvited,
                friendsInvited: req.session.friendsInvited,
                percentage: Math.round(req.session.friendsInvited * 100 / req.session.invitationAvailable)
            });
        }
        let server;
        if (process.env.NODE_ENV== "development") {
          server = req.protocol+'://'+req.hostname+':'+process.env.PORT
        } else {
          server = req.protocol+'://'+req.hostname;
        }
        //START TRANSACTION
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
          const opts = { session };

          // creo nuovo user con i dati segnalati dal PARENT
          const newUser   = await new User();
          const password  = lib.generatePassword(6);
          
          const firstName = lib.capitalizeFirstLetter(req.body.firstName);
          const token     = lib.generateToken(20);
          console.log('TOKEN: ',token);
          
          // Set the newUser's local credentials
          newUser.local.password        = newUser.generateHash(password);
          newUser.local.name.first      = firstName;
          newUser.local.idParent        = req.user.id; //id parent
          newUser.local.status          = 'new';  // status
          newUser.local.email           = token+"@sb.sb";
          newUser.local.token           = token;
          newUser.local.resetPasswordToken   = token; 
          newUser.local.resetPasswordExpires = Date.now() + (3600000 * 24 * 365); // 1 hour in secondi * 24 * 365 = 1 anno
          
		      await newUser.save(opts);

          // Push a new Friend in Parent
          const user = await User.findById(req.user.id);
          user.friends.push({ 'name.first'  : firstName,
                              'token'       : token,
                              'status'      : 'new'                              
          });

          await user.save(opts);

          //send email to Parent         
          await lib.sendmailToPerson(req.user.local.name.first, req.user.local.email, '', token, newUser.local.name.first, '', newUser.local.email, 'invite',server)

          await session.commitTransaction();

          req.session.friendsInvited += 1;
          let flag = false;
          if (req.session.friendsInvited < req.session.invitationAvailable) {
			     flag= true;
		      }
          
          res.render('shareShare.njk', {
              friendName: firstName,
              parentName: req.user.local.name.first,
              flag      : flag,
              token     : token,
              server    : server        
          });
          
        } catch (e) {
            await session.abortTransaction();
            req.flash('error', 'L\'applicazione ha riscontrato un errore non previsto.');
            req.flash('error', 'Riprova ad effettuare l\'invito');
            req.flash('error', 'Esamineremo il problema con la massima urgenza!');
            console.error(moment().format()+' [ERROR][RECOVERY:NO] "POST /recomm" USERS_ID: {"_id":ObjectId("' + req.user._id + '")} TRANSACTION: '+e);
            return res.render('info.njk', {message: req.flash('error'), type: "danger"});
        } finally {
            await session.endSession();
        }
    });

    /************************************
    /* versione con invio mail che 
    /* per privacy non si può utilizzare
    /************************************
    app.post('/recomm', lib.isLoggedIn, async (req, res) => {

        // controllo che ci siano ancora inviti diposnibili
        if (req.session.friendsInvited >= req.session.invitationAvailable) {
            req.flash('error', "Purtropo non hai inviti disponibili! Acquista per ricevere nuoi Punti Invitamici");
            return res.render('friend.njk', {
                message: req.flash('error'),
                type: "warning",
                invitationAvailable: req.session.invitationAvailable - req.session.friendsInvited,
                friendsInvited: req.session.friendsInvited,
                percentage: Math.round(req.session.friendsInvited * 100 / req.session.invitationAvailable)
            });
        }
        //START TRANSACTION
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
          const opts = { session };

          // creo nuovo user con i dati segnalati dal PARENT
          var password = lib.generatePassword(6);
          const newUser = await new User();
          // set the user's local credentials
          newUser.local.email = req.body.email;
          newUser.local.invitationEmail = req.body.email;
          newUser.local.password = newUser.generateHash(password);
          newUser.local.name.first = lib.capitalizeFirstLetter(req.body.firstName);
          newUser.local.idParent = req.user._id;
          //id parent
          newUser.local.status = 'new';
          // status
          newUser.local.resetPasswordToken = lib.generateToken(20);
          // token
          newUser.local.resetPasswordExpires = Date.now() + (3600000 * 24 * 365);
          // 1 hour in secondi * 24 * 365 = 1 anno

          await newUser.save(opts);

          // Save a new friends in mongodb
          var newFriend = new Friend();
          newFriend.id = req.user._id;            // id parent
          newFriend.emailParent = req.user.email; // mail user
          newFriend.emailFriend = newUser.email;  // mail friend
          newFriend.firstNameFriend = newUser.name.first; //name's friend

          await newFriend.save(opts);

          // send email to Friend
          await lib.sendmailToPerson(newUser.name.first, newUser.email, '', newUser.resetPasswordToken, req.user.name.first, req.user.name.last, req.user.email, 'friend')
          await lib.sendmailToPerson(req.user.name.first, req.user.email, '', '', newUser.name.first, '', newUser.email, 'parent')

          await session.commitTransaction();
          await session.endSession();

          req.session.friendsInvited += 1;
          req.flash('message', 'You have added a new Friend');
          res.render('friend.njk', {
              message: req.flash('message'),
              type: "info",
              invitationAvailable: req.session.invitationAvailable - req.session.friendsInvited,
              friendsInvited: req.session.friendsInvited,
              percentage: Math.round(req.session.friendsInvited * 100 / req.session.invitationAvailable)
          });

        } catch (e) {
          console.log("ERRORE TRANSAZIONE", e);
          await session.abortTransaction();
          await session.endSession();
          if (e.code === 11000) {
            //duplicate key: email
            let msg = 'That email is already taken, please try another';
            req.flash('error', msg);
            res.render('friend.njk', {
                message: req.flash('error'),
                type: "warning",
                invitationAvailable: req.session.invitationAvailable - req.session.friendsInvited,
                friendsInvited: req.session.friendsInvited,
                percentage: Math.round(req.session.friendsInvited * 100 / req.session.invitationAvailable)
            });
          } else {
            let msg = 'Something bad happened! Please try again';
            req.flash('error', msg);
            console.error(moment().format()+' [ERROR][RECOVERY:NO] "POST /recomm" USERS_ID: {"_id":ObjectId("' + req.user._id + '")} TRANSACTION: '+e+' FLASH: '+msg);
            return res.render('info.njk', {message: req.flash('error'), type: "danger"});
          }
        }
    }); */

    // =====================================
    // Utility =============================
    // =====================================
    // visualizza in formato HTML la mail conferma
    app.get('/mailconferme', function(req, res) {
      let server;
      if (process.env.NODE_ENV == "development") {
        server = req.protocol+'://'+req.hostname+':'+process.env.PORT
      } else {
        server = req.protocol+'://'+req.hostname;
      } 
      res.send(mailconferme('Name', 'Email', 'Token', 'userName', 'userSurname', server))
    })

    // visualizza in formato HTML la mail Friend
    app.get('/mailfriend', function(req, res) {
      let server;
      if (process.env.NODE_ENV== "development") {
        server = req.protocol+'://'+req.hostname+':'+process.env.PORT
      } else {
        server = req.protocol+'://'+req.hostname;
      }
      res.send(mailfriend('Name', 'Email', 'Token', 'userName', 'userSurname', server))

    })
    // visualizza in formato HTML la mail User
    app.get('/mailparent', function(req, res) {
      let server;
      if (process.env.NODE_ENV== "development") {
        server = req.protocol+'://'+req.hostname+':'+process.env.PORT
      } else {
        server = req.protocol+'://'+req.hostname;
      }
      res.send(mailparent('Name', 'Email', 'userName', 'userEmail', server))
    })

    app.get('/mailinvite', function(req, res) {
      let server;
      if (process.env.NODE_ENV== "development") {
        server = req.protocol+'://'+req.hostname+':'+process.env.PORT
      } else {
        server = req.protocol+'://'+req.hostname;
      }
      res.send(mailinvite('Name', 'Email', 'Token', 'userName', server))
    })   

    app.get('/infoMessage', (req, res) => {
      let msg = req.query.msg;
      let msgType = req.query.type;
      req.flash('message', msg);
      res.render('info.njk', {
          message: req.flash('message'),
          type: msgType,
      })
    });

    app.post('/infoMessage', (req, res) => {
      let msg = req.body.msg;
      let msgType = req.body.type;
      let err = req.body.err;
      console.error(moment().format()+' [WARNING][RECOVERY:NO] "POST /infoMessage" USERS_ID: {"_id":ObjectId("' + req.user._id + '")} ERROR: '+err+' FLASH: '+msg);
      req.flash('message', msg);
      res.render('info.njk', {
          message: req.flash('message'),
          type: msgType,
          err: err
      })
    });

    app.get('/videoPromo', (req, res) => {
          res.render('video.njk')
    });
}
