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

const https = require('https');

//const assert = require('assert');

module.exports = function(app, db, moment, mongoose, fastcsv, fs, util) {

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
                  console.log(req.session.elements);
                  res.send('{"status":"200", "statusText":"OK"}');
                } catch (e) {
                  console.log('Error', e);
                  res.send('{"status":"500","statusText":'+e+'"}'); 
                }
              });
          
      });
      request.on('error', (error) => {
          console.log('An error', error);
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
        console.log("city : ", req.body.city);
        CityIstat.find({'Comune': new RegExp('^' + req.body.city,"i")},
                     null,
                     {sort: {Comune: 1}},
                     function(err, city) {
                       console.log("Got city : ", city);
                       res.send(city)
                     })
    });

    app.post('/caps', function(req, res) {
        //res.send(mailfriend('Roberta', 'rbtvna@gmail.com', '123XyZ', 'Carlo', 'Viana'));
        //res.render('validation.dust', { message: req.flash('validation') });
        console.log("city : ", req.body.city);
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
            resetPasswordToken: req.query.token,
            resetPasswordExpires: {
                $gt: Date.now()
            }
        }, function(err, user) {
            if (err) {
                let msg = 'Token non più valido o scaduto'; //'Token is invalid or has expired'
                req.flash('error', msg);
                console.error(moment().format() + ' [ERROR][RECOVERY:NO] "GET /validation" TOKEN: {"resetPasswordToken":"' + req.query.token + '"} FUNCTION: User.findOne: ' + err + ' FLASH: ' + msg);
                return res.render('info.njk', {
                    message: req.flash('error'),
                    type: "warming"
                });
            }
        /************************************************************************************************************
         *                                              IMPORTANTE
         *  Quando la pagin la pagina friend.njk efettua la chiamata navigator.share() 
         *  avviene il test del link specifcato con conseuente chiamata in GET del /validation e
         *  non essendo ancora salvato lo User il log riporta "Invito non più valido o scaduto" 
         *  che non rappresenta un vero errore. 
        /************************************************************************************************************/
            if (!user) {
                let msg = 'Invito non più valido o scaduto'; //Invitation is invalid or has expired';
                req.flash('info', msg);
                console.info(moment().format() + ' [INFO][RECOVERY:NO] "GET /validation" TOKEN: {"resetPasswordToken":"' + req.query.token + '"} FUNCTION: User.findOne: ' + err + ' FLASH: ' + msg);
                res.render('info.njk', {
                    message: req.flash('info'),
                    type: "warning"
                });
            } else {
                res.render('validation.njk', {
                    prospect: user,
                    message: req.flash('validateMessage'),
                    type: "info"
                });
            }
            ;
        });
    });
    //POST
    app.post('/validation', function(req, res) {
        User.findOne({
            resetPasswordToken: req.body.token,
            resetPasswordExpires: {
                $gt: Date.now()
            }
        }, function(err, user) {
            if (err) {
                let msg = 'Token non più valido o scaduto'; //'Token is invalid or has expired';
                req.flash('error', msg);
                console.error(moment().format() + ' [ERROR][RECOVERY:NO] "POST /validation" TOKEN: {"resetPasswordToken":"' + req.body.token + '"} FUNCTION: User.findOne: ' + err + ' FLASH: ' + msg);
                console.log('POST VALIDATION ERROR: ', err);
                return res.render('info.njk', {
                    message: req.flash('error'),
                    type: "danger"
                });
            } else {

                // TODO Validare i dati inseriti lato SERVER perchè potrebbero essere stati disabilitati i Javascript lato CLIENT
                // FATTO solo per mail

                //email validation
                if (!lib.emailValidation(req.body.email)) {
                    let msg = 'Indirizzo Email non valido'; //'Please provide a valid email';
                    req.flash('validateMessage', msg)
                    console.info(moment().format() + ' [WARNING][RECOVERY:NO] "POST /validation" EMAIL: {"resetPasswordToken":"' + req.body.email + '"} FLASH: ' + msg);
                    return res.redirect("/validation?token=" + req.body.token);
                }
                //end email validation

                var U = new User();
                user.password = U.generateHash(req.body.password);
                user.name.first = lib.capitalizeFirstLetter(req.body.firstName);
                if (user.email != req.body.email) {
                    user.email = req.body.email;
                }
                /*
                console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
                console.log('!!!!!!!!!!! ATTENZIONE !!!! CODICE COMMENTATO !!!!');
                console.log('!!!!!!!!!!!!       NON DA PRODUZIONE  !!!!!!!!!!!!');
                console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
                */
                user.status = 'validated';
                user.resetPasswordToken = undefined;
                user.resetPasswordExpires = undefined;

                ///////////////////////////////////////////////
                user.booze += global.oneBottleBoozeEquivalent;
                ///////////////////////////////////////////////
                user.save(function(err) {
                    if (err) {
                        let msg = 'Something bad happened! Validation faild';
                        req.flash('error', msg);
                        console.error(moment().format() + ' [ERROR][RECOVERY:NO] "POST /validation" EMAIL: {"email":"' + req.body.email + '"} FUNCTION: User.save: ' + err + ' FLASH: ' + msg);
                        return res.render('info.njk', {
                            message: req.flash('error'),
                            type: "danger"
                        });
                    } else {
                        req.logIn(user, function(err) {
                            if (err) {
                                let msg = 'Something bad happened! Login faild';
                                req.flash('error', msg);
                                console.info(moment().format() + ' [WARNING][RECOVERY:NO] "POST /validation" EMAIL: {"resetPasswordToken":"' + req.body.email + '"} FLASH: ' + msg);
                                res.render('info.njk', {
                                    message: req.flash('error'),
                                    type: "danger"
                                })
                            } else {
                                let msg = 'Invito accettato e autenticato'; //'Validated and Logged';
                                req.flash('info', msg);
                                console.info(moment().format() + ' [INFO][RECOVERY:NO] "POST /validation" EMAIL: {"resetPasswordToken":"' + req.body.email + '"} FLASH: ' + msg);
                                res.redirect('/shop');
                            }
                        });
                    }
                });
            }
        })
    });

    // =====================================
    // Registrazione come cliente
    // =====================================
    //GET
    app.get('/register', lib.isLoggedIn, function(req, res) {

        if (req.user.status == 'validated') {

            res.render('registration.njk', {
                firstName: req.user.name.first,
                lastName: req.user.name.last,
                user: req.user,
                numProducts : req.session.numProducts
                // get the user out of session and pass to template
            });

        } else if (req.user.status == 'customer' && req.session.numProducts > 0) {
            res.redirect('/addresses');

        } else {
            console.log('User: ', req.user);
            res.redirect('/cart');
        }
    });
    //POST
    app.post('/register', lib.isLoggedIn, async function(req, res, next) {
        try {
            console.log('ID: ',req.user._id);
            const doc = await User.findById(req.user._id);
            //console.log('FORM Register: ',doc);     //TODO fare il controllo di inserimento se l'arreay è vuota
            doc.name.first              = req.body.firstName;
            doc.name.last               = req.body.lastName;
            doc.status                  = 'customer'; // to change in 'customer' after session  of testing
            doc.addresses.push({
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
            await doc.save();
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
                firstName: req.user.name.first,
                lastName: req.user.name.last,
                user: req.user,
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
        Friend.countDocuments({ emailParent: req.user.email }, function(err, numFriends) {
            if (err) {
                console.error(moment().format() + ' [ERROR][RECOVERY:NO] "GET /recomm" USERS_ID: {"_id":ObjectId("' + req.user.id + '")} FUNCTION: Friend.countDocuments: ' + err);
                req.flash('error', 'Something bad happened!');
                return res.render('info.njk', {
                    message: req.flash('error'),
                    type: "danger"
                });
            }
            // recupero le informazioni dell'utente
            User.findOne({ email: req.user.email }, function(err, user) {
                if (err) {
                    console.error(moment().format() + ' [ERROR][RECOVERY:NO] "GET /recomm" USERS_ID: {"_id":ObjectId("' + req.user.id + '")} FUNCTION: User.findOne: ' + err);
                    req.flash('error', 'Something bad happened!');
                    return res.render('info.njk', {
                        message: req.flash('error'),
                        type: "danger"
                    });
                }

                req.session.invitationAvailable = parseInt(user.eligibleFriends, 10); //numero di inviti disponibili = amici ammissibili
                req.session.friendsInvited = parseInt(numFriends, 10);                //numero di amici già invitati

                let error = "";
                let controlSates = "";
                let flag = "false";
                
                // controllo che ci siano ancora inviti diposnibili
                if (req.session.friendsInvited >= req.session.invitationAvailable) {
                    req.flash('info', "Non hai inviti disponibili!");
                    req.flash('info', "Acquista un Box4beer per avere un nuovo invito");                    
                    controlSates = "disabled";
                    flag = "true";
                }

                res.render('friend.njk', {
                    controlSates: controlSates,
                    flag: flag,
                    message: req.flash('info'),
                    type: "info",
                    user: req.user,
                    invitationAvailable: req.session.invitationAvailable - req.session.friendsInvited,
                    friendsInvited: req.session.friendsInvited,
                    percentage: Math.round(req.session.friendsInvited * 100 / req.session.invitationAvailable), //numProducts : req.session.numProducts
                    token: lib.generateToken(20),
                    parentName: req.user.name.first,
                    server: global.server
                });
            });
        });
    });
    //POST
    app.post('/recomm', lib.isLoggedIn, async (req, res) => {

        // controllo che ci siano ancora inviti diposnibili
        if (req.session.friendsInvited >= req.session.invitationAvailable) {
            req.flash('error', "Purtropo non hai inviti disponibili! Acquista per ricevere nuovi Punti Invitamici");
            return res.render('friend.njk', {
                message: req.flash('error'),
                type: "warning",
                invitationAvailable: req.session.invitationAvailable - req.session.friendsInvited,
                friendsInvited: req.session.friendsInvited,
                percentage: Math.round(req.session.friendsInvited * 100 / req.session.invitationAvailable)
            });
        }
        //START TRANSACTION
        const session = await db.startSession();
        session.startTransaction();

        try {
          const opts = { session };

          // creo nuovo user con i dati segnalati dal PARENT
          var password = lib.generatePassword(6);
          const newUser = await new User();
          const nome = lib.capitalizeFirstLetter(req.body.firstName)
          console.log('NOME: ',nome);
          // set the user's local credentials
          newUser.password = newUser.generateHash(password);
          newUser.name.first = nome;
          newUser.idParent = req.user._id;
          //id parent
          newUser.status = 'new';  // status
          let token = req.body.token;
          newUser.email = token+"@sb.sb";
          newUser.inviteEmail = token+"@sb.sb";
          newUser.resetPasswordToken = token; // token
          // 1 hour in secondi * 24 * 365 = 1 anno
          newUser.resetPasswordExpires = Date.now() + (3600000 * 24 * 365);
/*******/
		  await newUser.save(opts);
/*******/
          // Save a new friends in mongodb
          var newFriend = new Friend();
          newFriend.id = req.user._id;	// id parent
          newFriend.emailParent = req.user.email;	// mail parent
          newFriend.emailFriend = token+"@sb.sb";	// mail friend
          newFriend.firstNameFriend = newUser.name.first;	//name's friend
/*******/
		  await newFriend.save(opts);
/*******/
           
/*******/ //send email to Friend         
          await lib.sendmailToPerson(req.user.name.first, req.user.email, '', token, newUser.name.first, '', newUser.email, 'invite')
/*******/
          await session.commitTransaction();
          await session.endSession();

          req.session.friendsInvited += 1;
          let flag = false;
          if (req.session.friendsInvited < req.session.invitationAvailable) {
			  flag= true;
		  }
          
          res.render('share.njk', {
              firstName: nome,
              flag: flag             
          });
          
        } catch (e) {
            await session.abortTransaction();
            await session.endSession();
            let msg = 'Something bad happened! Please try again';
            req.flash('error', msg);
            console.error(moment().format()+' [ERROR][RECOVERY:NO] "POST /recomm" USERS_ID: {"_id":ObjectId("' + req.user._id + '")} TRANSACTION: '+e+' FLASH: '+msg);
            return res.render('info.njk', {message: req.flash('error'), type: "danger"});
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
        const session = await db.startSession();
        session.startTransaction();

        try {
          const opts = { session };

          // creo nuovo user con i dati segnalati dal PARENT
          var password = lib.generatePassword(6);
          const newUser = await new User();
          // set the user's local credentials
          newUser.email = req.body.email;
          newUser.inviteEmail = req.body.email;
          newUser.password = newUser.generateHash(password);
          newUser.name.first = lib.capitalizeFirstLetter(req.body.firstName);
          newUser.idParent = req.user._id;
          //id parent
          newUser.status = 'new';
          // status
          newUser.resetPasswordToken = lib.generateToken(20);
          // token
          newUser.resetPasswordExpires = Date.now() + (3600000 * 24 * 365);
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
    // visualizza in formato HTML la mail Friend
    app.get('/mailfriend', function(req, res) {

        console.log("SERVER:", global.server);
        res.send(mailfriend('Name', 'Email', 'Token', 'userName', 'userSurname', global.server))

    })
    // visualizza in formato HTML la mail User
    app.get('/mailparent', function(req, res) {
        console.log("SERVER:", global.server);
        res.send(mailparent('Name', 'Email', 'userName', 'userEmail', global.server))
    })

    app.get('/mailinvite', function(req, res) {
        console.log("SERVER:", global.server);
        res.send(mailinvite('Name', 'Email', 'Token', 'userName', global.server))
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
}
