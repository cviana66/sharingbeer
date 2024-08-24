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
var {getAddressFromOSM} = require('../app/overpassQuery')

var mailfriend = require('../config/mailFriend');
var mailparent = require('../config/mailParent');
var mailinvite = require('../config/mailInvite');
var mailconferme = require('../config/mailConferme');
var mailorder = require('../config/mailOrder');

var {getDistance} = require('../app/geoCoordHandler');

const fetch = require("node-fetch");
const https = require('https');


module.exports = function(app, moment, mongoose, fastcsv, fs, util) {

// =================================================================================================
// API OVERPASS OPENSTREETMAPS
// =================================================================================================
//https://www.istat.it/storage/codici-unita-amministrative/Elenco-comuni-italiani.csv
//https://www.istat.it/storage/codici-unita-amministrative/Elenco-comuni-italiani.xlsx


  app.get('/testOverpass', async function(req,res){
    //getAddressFromOSM('Candelo','096012','Via Moglia','10','13878')
    //getAddressFromOSM('Biella','096004','Piazza Gaudenzio Sella','1','13900')
    getAddressFromOSM('Milano','015146','Corso Buenos Aires','2')
    //getAddressFromOSM('Buonconvento','052003','Via Bruno Buozzi','10')
    //getAddressFromOSM('Torino','001272','Corso Stati Uniti','101')
  })


  app.post('/overpass/istat', lib.isLoggedIn, async function(req, res) {
    var newArr = [];
    var option = '[out:json];'+
             'area[name="'+req.body.city+'"]["ref:ISTAT"="'+req.body.istat+'"]->.a;' +
             '(node(area.a)["addr:street"];for (t["addr:street"])(make via name=_.val;out;););' +
             '(way(area.a)[highway]["name"];for (t["name"])(make via name=_.val;out;););'

    const url = 'https://overpass-api.de/api/interpreter?data='+option;

    console.debug('OVERPASS: ',option);

    const request = await https.request(url, (response) => {
        let data = '';
        response.on('data', (chunk) => {
            data = data + chunk.toString();
        });
        
            response.on('end', () => {
              try {
                const parseJSON = JSON.parse(data);
                const elements = parseJSON.elements;
                //console.debug('STREET: ', elements);
                for (var index = 0; index < elements.length; ++index) {
                  newArr.push(elements[index].tags.name);
                }
                //console.debug('STREET: ', newArr);
                req.session.elements = newArr.filter((elem,indexx,self) => {return indexx === self.indexOf(elem);});
                
                res.send('{"status":"200", "statusText":"OK"}');
              } catch (e) {
                console.debug('Error', e);
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


  app.post('/overpass/cap', async function(req,res) {
    const comune  = req.body.comune;
    const istat   = req.body.istat;
    const via     = req.body.via;
    const numero  = req.body.numero;
    const cap     = req.body.cap;
    var indirizzo = {}

    try{
      indirizzo = await getAddressFromOSM(comune, istat, via, numero, cap);      
      console.debug('INDIRIZZO',indirizzo);
      res.send(indirizzo)
    } catch (e) {
      console.log('ERRORE in overpass/cap',e)
      res.send(indirizzo)
    }
  });


  app.post('/cities', function(req, res) {
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

  app.post('/streets', function(req, res) {
      var rates = req.session.elements;
      var newArr = [];
      for (var index = 0; index < rates.length; ++index) {
          name = rates[index].toLowerCase();
          if (name.indexOf(req.body.street.toLowerCase()) != -1) {
              newArr.push(rates[index]);
          }
      }
      res.send(newArr);
  });


//==================================================================================================
// UTILITY per importare i Comuni Italiani
//==================================================================================================
    app.get('/importCityIstat/:csvname', (req,res) => {
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

          //console.log(csvData);

          CityIstat.insertMany(csvData, (err, res) => {
            if (err) throw err;
            numDocInserted = res.length;
            //console.log('Inserted: '+ res.length);
          });

       });
       stream.pipe(csvStream);
       res.send('Collection CityIstat');
     });

//==================================================================================================
// TOKEN VALIDATION ========= 05-01-2022
//==================================================================================================
//GET
    app.get('/validation', function(req, res) {

        User.findOne({
            'local.resetPasswordToken': req.query.token,
            'local.resetPasswordExpires': { $gt: Date.now() }
        }, async function(err, user) {
            if (err) {
                let msg = 'Token non più valido o scaduto'; //'Token is invalid or has expired'
                req.flash('error', msg);
                console.error(moment().utc("Europe/Rome").format() + ' [ERROR][RECOVERY:NO] "GET /validation" TOKEN: {"resetPasswordToken":"' + req.query.token + '"} FUNCTION: User.findOne: ' + err + ' FLASH: ' + msg);
                return res.render('info.njk', {
                                message: req.flash('error'),
                                type: "warning"
                        });
            }
            
            if (!user) {
                let msg = 'Invito non più valido o scaduto'; //Invitation is invalid or has expired';
                req.flash('warning', msg);
                console.info(moment().utc("Europe/Rome").format() + ' [INFO][RECOVERY:NO] "GET /validation" TOKEN: {"resetPasswordToken":"' + req.query.token + '"} FUNCTION: User.findOne: utente non trovato' + msg);
                return res.render('info.njk', {
                                    message: req.flash('warning'),
                                    type: "warning"
                                  });
            } else {
              if (user.local.status == 'new') {
                var video = "video/BirraViannaColor_Final_Logo_38.mp4";
                //console.debug(req.session)
                if (process.env.NODE_ENV === 'development') {
                  video = "";
                }
                res.render('validation.njk', {
                  prospect: user.local,
                  message : req.flash('validateMessage'),
                  type    : "danger",
                  video   : video
                });
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
                  console.debug("errore: ",e)
                  await session.abortTransaction();
                  req.flash('error', 'L\'applicazione ha riscontrato un errore non previsto.');
                  console.error(moment().utc("Europe/Rome").format()+' [ERROR][RECOVERY:NO] "GET /validation" USERS_ID: {_id:ObjectId("' + user._id + '")} TRANSACTION: '+e);
                  return res.render('info.njk', {message: req.flash('error'), type: "danger"});

                } finally {
                  await session.endSession();
                }
                req.logIn(user, function(err) {
                  if (err) {
                      req.flash('error', 'L\'applicazione ha riscontrato un errore non previsto.');
                      console.info(moment().utc("Europe/Rome").format() + ' [ERROR][RECOVERY:NO] "GET /validation" FUNCTION: req.logIn ERROR: ' +err);
                      res.render('info.njk', {message: req.flash('error'), type: "danger"});
                  } else {
                      // Email Verificata - Utente validato e autenticato'
                      console.info(moment().utc("Europe/Rome").format() + ' [INFO][RECOVERY:NO] "GET /validation" USER_ID: {_id:bjectId("' + req.user._id + '"}');
                      res.render('conferme.njk', { 
                        user: req.user,
                        numProducts : req.session.numProducts
                      });
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
                console.error(moment().utc("Europe/Rome").format() + ' [ERROR][RECOVERY:NO] "POST /validation" TOKEN - USER: {resetPasswordToken:"' + req.body.token + '"}  FUNCTION: User.findOne: ' + err + ' FLASH: ' + msg);
                console.debug('POST VALIDATION ERROR: ', err);
                return res.render('info.njk', {
                    message: req.flash('error'),
                    type: "danger"
                });
            } else {
                const email = req.body.email.toLowerCase();
                
                //start email validation
                if (!lib.emailValidation(email)) {
                    let msg = 'Indirizzo mail non valido'; //'Please provide a valid email';
                    req.flash('validateMessage', msg)
                    console.info(moment().utc("Europe/Rome").format() + ' [WARNING][RECOVERY:NO] "POST /validation" TOKEN - USER: {resetPasswordToken:"' + req.body.token + '", _id:'+ user._id + '"} FLASH: ' + msg);
                    return res.redirect("/validation?token=" + req.body.token);
                }
                //end email validation
                
                var server = lib.getServer(req)

                //START TRANSACTION
                const session = await mongoose.startSession();

                try {         
                  await session.startTransaction();
                  if (user.local.status == "new") {         
                                      
                    const filter =  {'friends.token':req.body.token };
                    const update =  {'friends.$.status':'accepted',
                                     'friends.$.email':email,
                                     'friends.$.name.first':lib.capitalizeFirstLetter(req.body.firstName),
                                     'friends.$.id': user._id.toString()
                                    }                  
                    await User.findOneAndUpdate(filter,{'$set':update}).session(session);
                  }
                  await session.commitTransaction();
                } catch (e) {
                  //console.log("errore: ",e)
                  await session.abortTransaction();
                  let msg = 'Spiacente ma si è verificato un errore inatteso.';      
                  req.flash('error', msg);
                  console.error(moment().utc("Europe/Rome").format() + ' [ERROR][RECOVERY:NO] "POST /validation" EMAIL: {"email":"' + email + '"} FUNCTION: User.save: ' + e + ' FLASH: ' + msg);
                  return res.render('info.njk', {
                      message: req.flash('error'),
                      type: "danger"
                  })                                
                } finally {
                  await session.endSession();
                }

                //START TRANSACTION
                const session1 = await mongoose.startSession();
                
                try {         
                  await session1.startTransaction();
                  const opts = { session1 };
                  if (user.local.status == "new") {         
                    
                    const newToken = lib.generateToken(20);
                    user.local.email = email;
                    user.local.password = user.generateHash(req.body.password);
                    user.local.name.first =  lib.capitalizeFirstLetter(req.body.firstName);
                    user.local.resetPasswordToken = newToken
                    user.local.status = "waiting"                    
                    await user.save(opts);

                    await lib.sendmailToPerson(req.body.firstName, email, '', newToken, req.body.firstName, '', email, 'conferme',server);
                    let msg = 'Inviata email di verifica'; //'Validated and Logged';
                    console.info(moment().utc("Europe/Rome").format() + ' [INFO][RECOVERY:NO] "POST /validation" USER: {_id:"' + user._id + '"} FLASH: ' + msg);
                  }

                  await session1.commitTransaction();
                  res.render('emailValidation.njk', { email: email});

                } catch (e) {
                  //console.log("errore: ",e)
                  await session1.abortTransaction();
                  
                  if (e.code === 11000) {
                    let msg = 'Indirizzo e-mail già registrato';
                    req.flash('validateMessage', msg);
                    console.info(moment().utc("Europe/Rome").format() + ' [INFO][RECOVERY:NO] "POST /validation" EMAIL: {"email":"' + email + '"} FUNCTION: User.save: ' + e +' FLASH: ' + msg);
                    res.redirect("/validation?token=" + req.body.token);
                  } else {
                    let msg = 'Spiacente ma qualche cosa non ha funzionato nella validazione della tua e-mail';      
                    req.flash('error', msg);
                    console.error(moment().utc("Europe/Rome").format() + ' [ERROR][RECOVERY:NO] "POST /validation" EMAIL: {"email":"' + email + '"} FUNCTION: User.save: ' + e + 'e.code='+e.code+' FLASH: ' + msg);
                    return res.render('info.njk', {
                        message: req.flash('error'),
                        type: "danger"
                    })              
                  }

                } finally {
                  await session1.endSession();
                }

                
            }
          });
      });

//==================================================================================================
// REGISTRAZIONE CLIENTE
//==================================================================================================
//-------------------------------------------
//GET
//-------------------------------------------
    app.get('/register', lib.isLoggedIn, function(req, res) {

        if (req.user.local.status == "validated") {
            var model = { firstName: req.user.local.name.first,
                          lastName: req.user.local.name.last,
                          user: req.user,
                          numProducts : req.session.numProducts,
                          message : req.flash('validateMessage'),
                          type: "warning"
                        }
            res.render('registration.njk', model);

        } else if (req.user.local.status == 'customer' && req.session.numProducts > 0) {
          res.redirect('/addresses');
        } else {
          var msg = "Devi validare la tua identità attraverso la mail che ti abbiamo inviato in fase di accettazione dell'invito";
          console.error(moment().utc("Europe/Rome").format() + ' [WARNING][RECOVERY:NO] "GET /register" USERS_ID: {"_id":ObjectId("' + req.user.id + '")} FLASH:'+msg+'');
          req.flash('warning', msg);
          return res.render('info.njk', {
                  message: req.flash('warning'),
                  type: "warning"
          })
        }
    });

//-------------------------------------------
//POST
//-------------------------------------------
    app.post('/register', lib.isLoggedIn, async function(req, res) {

      const session = await mongoose.startSession();
      session.startTransaction();
      const opts = { session };
      try {        

        console.log('ID POST REGISTER: ',req.user.id);

        // Conta quanti indirizzi main=yes ci sono 
        const Nadr = await User.aggregate([
          {$match:{"_id":req.user._id}}, 
          {$unwind: "$addresses"}, 
          {$match :{ "addresses.main":"yes"}},
          {$project:{_id:0,friends:0,orders:0,local:0}},
          {$group:{_id:null,count:{$count:{ }}}}
          ])
        //console.log('AGGREGATE: ',Nadr.length);
        var main = 'yes';
        if (Nadr.length >= 1) {
          main = 'no';
          await User.findOneAndUpdate(
            {_id:req.user._id},
            {$set:{'addresses.$[elem].preferred':'no'}},
            {arrayFilters: [{"elem.preferred":{$eq:'yes'}}]}
            ).session(session)
        };
          
        const user = await User.findById(req.user._id);
        const numMobil = req.body.mobile.replace(/\s/g,"");

        if (user.local.status != 'customer') {
          console.log('FORM Register: ',user);     //TODO fare il controllo di inserimento se l'arreay è vuota
          
          //Test unicità del num. tel           
          const countMobileNumber = await User.aggregate([{$match:{"local.mobileNumber":numMobil}},{$count:"count"}])
          console.debug('REGISTER countMobileNumber:',countMobileNumber, 'LENGTH',countMobileNumber.length)
          if (countMobileNumber.length > 0) throw({code:11000})

          user.local.name.first              = req.body.firstName;
          user.local.name.last               = req.body.lastName;
          user.privacy.optional              = req.body.checkPrivacyOptional;
          user.privacy.transfer              = req.body.checkPrivacyCessione;
          user.local.status                  = 'customer';
          user.local.mobilePrefix    = '+39';
          user.local.mobileNumber    = numMobil;
          console.debug('USER in REGISTER',user)
          console.debug('req.body.checkPrivacyOptional in REGISTER',req.body.checkPrivacyOptional)
          console.debug('req.body.checkPrivacyCessione in REGISTER',req.body.checkPrivacyCessione)
        }
        // genero un nuovo _id
        const addressId = new mongoose.Types.ObjectId() 

        user.addresses.push({
                _id             : addressId,
                'name.first'    : req.body.firstName,     
                'name.last'     : req.body.lastName,
                mobilePrefix    : '+39',
                mobileNumber    : numMobil,
                city            : req.body.city, 
                province        : req.body.provincia,
                address         : req.body.street,
                houseNumber     : req.body.numberciv,
                postcode        : req.body.hiddenCAP,
                main            : main,
                preferred       : 'yes',
                affidability    : req.body.hiddenAddressIsValid,
                desAffidability : req.body.descValidAddress,
                'coordinateGPS.latitude' : req.body.lat,
                'coordinateGPS.longitude' : req.body.lon
        });
        await user.save(opts);
        await session.commitTransaction();

      //------------------------------------------------------------------------
      // Caso di spedizione presso indirizzo inserito appena prima del pagamento
      //------------------------------------------------------------------------

        req.session.deliveryType =  "Consegna"

        address = await User.aggregate([
          {$match:{"_id":req.user._id}}, 
          {$unwind: "$addresses"}, 
          {$match :{ "addresses._id":addressId}},
          {$project:{_id:0,friends:0,orders:0,local:0}}
          ])
        req.session.shippingAddress = address[0].addresses;         
        //console.debug('ADDRESS[0]: ',address[0].addresses)

        let customerAddress = address[0].addresses.address + ' ' + 
                          address[0].addresses.houseNumber + ' ' +
                          address[0].addresses.city +  ' ' +
                          address[0].addresses.province;
        let customerCoordinate = null;
        let birrificioAddress ='Via Molignati 12 Candelo Biella';
        let birrificioCoordinate =  {'latitude': 45.5447643, 'longitude': 8.1130519};
        let dist = JSON.parse( await getDistance(customerAddress, birrificioAddress, customerCoordinate, birrificioCoordinate));

        console.log('DISTANZA = ', dist.distanceInMeters)

        if ( Number(dist.distanceInMeters) > 15000) {
          req.session.shippingCost = priceCurier[req.session.numProducts-1];
        } else {
          if (req.session.numProducts > 5) {
            req.session.shippingCost = '0.00';
          } else {
            console.debug('PRICE: ',req.session.numProducts,  priceLocal[req.session.numProducts-1])
            req.session.shippingCost = priceLocal[req.session.numProducts-1]
          }
        }

        //==============================================================================
        // Vantaggio dai tuoi amici 
        // Il prezzo totale di acquisto/numero di bottigli => costo di una bottiglia
        // se i booze >= costo di una bottiglia allora faccio lo sconto
        // lo sconto massimo è del 50% su totale di acquisto  
        //==============================================================================
        const c1b = req.session.totalPrc/req.session.numProducts/numBottigliePerBeerBox
        console.debug('COSTO DI 1 BOTTIGLIA: ', c1b)
        if (req.user.local.booze >= c1b && req.user.local.booze <= req.session.totalPrc/2 ) {
          req.session.pointDiscount = req.user.local.booze.toFixed(2);  
        } else if (req.user.local.booze > req.session.totalPrc/2) {
          req.session.pointDiscount = (req.session.totalPrc/2).toFixed(2)
        } else {
          req.session.pointDiscount = 0.00.toFixed(2); 
        }
        
        console.debug('req.user.local.status = ',req.user.local.status);
        if (req.user.local.status == 'validated') {
            req.user.local.status = 'customer'
            res.redirect('/addresses');
        } else {
          res.render('orderSummary.njk', {
                  cartItems   : req.session.cartItems,
                  address     : address[0].addresses,
                  numProducts : req.session.numProducts,
                  userStatus  : req.user.local.status,
                  shipping    : req.session.shippingCost,
                  deliveryType      : req.session.deliveryType,
                  deliveryDate      : lib.deliveryDate('Europe/Rome','TXT','dddd DD MMMM',req.session.deliveryType),
                  discount    : req.session.pointDiscount,
                  user        : req.user,
                  payType     : "axerve" //"paypal"  "axerve"
                  
                })
        }      
      } catch(e) {
        await session.abortTransaction();
        if (e.code === 11000) {
          let msg = 'Numero telefonico già registrato. Ti ricordo che tutte le comunicazioni importanti relative alla consegna e al ritiro dei prodotti saranno trasmesse via messaggistica telefonica. Inserisci un numero di telefono che ti appartiene.';
          req.flash('validateMessage', msg);
          console.info(moment().utc("Europe/Rome").format() + ' [INFO][RECOVERY:NO] "POST /register" ID: {"id":"' + req.user.id + '"} FUNCTION: User.save: ' + e +' FLASH: ' + msg);
          res.redirect("/register");
        } else {
          let msg = 'Spiacente ma l\'applicazione ha riscontrato un errore inatteso. Riprova';      
          req.flash('error', msg);
          console.error(moment().utc("Europe/Rome").format() + ' [ERROR][RECOVERY:NO] "POST /register" ID: {"id":"' + req.user.id + '"} FUNCTION: User.save: ' + e + ' FLASH: ' + msg);
          return res.render('info.njk', {
              message: req.flash('error'),
              type: "danger"
          })              
        }
      } finally {
        await session.endSession();
      }
    });

//-------------------------------------------
//GET
//-------------------------------------------
    app.get('/addresses',lib.isLoggedIn, async function(req, res) {
      
      try {
          res.render('addresses.njk', {
              addresses   : req.user.addresses,
              firstName   : req.user.local.name.first,
              lastName    : req.user.local.name.last,
              user        : req.user,
              numProducts : req.session.numProducts
          });

      } catch (err) {
          console.log('error', err);
          req.flash('error', 'L\'applicazione ha riscontrato un errore inatteso') 
          res.render('info.njk', {
              message: req.flash('error'),
              type: "danger"
          });
      }

    });

  // ===============================================================================================
  // FRIEND - gestione degli inviti
  // 24-12-2021
  // 05-02-2022
  // 12-02-2022 introddotto il logger
  // 24-11-2022 uso della Trasaction
  // ===============================================================================================
  //GET
  app.get('/recomm', lib.isLoggedIn, function(req, res) {

      // conto quanti amici ha già lo User
      User.findOne({'_id': mongoose.Types.ObjectId(req.user.id)}, async function(err, user) {
          if (err) {
              console.error(moment().utc("Europe/Rome").format() + ' [ERROR][RECOVERY:NO] "GET /recomm" USERS_ID: {"_id":ObjectId("' + req.user.id + '")} FUNCTION: Friend.countDocuments: ' + err);
              req.flash('error', 'L\'applicazione ha riscontrato un errore non previsto.');
              return res.render('info.njk', {
                  message: req.flash('error'),
                  type: "danger"
              });
          } else {
            /* Conta quanti amici ssono "new" ---> al momento non usato ma funzionante
              const u = await User.aggregate([
                {$match:{"_id":mongoose.Types.ObjectId("656af6eca93c31dc18501d06")}}, 
                {$unwind: "$friends"}, 
                {$match :{ "friends.status":"new"}},
                {$project:{_id:0,addresses:0,orders:0,local:0}},
                {$group:{_id:null,count:{$count:{ }}}}
                ])
              console.log('AGGREGATE: ',u)
            */
              req.session.invitationAvailable = parseInt(user.local.eligibleFriends, 10); //numero di inviti disponibili = amici ammissibili
              req.session.friendsInvited = parseInt(user.friends.length, 10);             //numero di amici già invitati

              let error = "";
              let controlSates = "";
              let flag = "false";
              
              // controllo che ci siano ancora inviti diposnibili
              if (req.session.friendsInvited >= req.session.invitationAvailable) {
                  req.flash('info', "Non hai inviti disponibili! Acquista un beerBox per avere nuovi inviti");                
                  controlSates = "disabled";
                  flag = "true";
              }

              var server = lib.getServer(req);
              
              res.render('friend.njk', {
                  controlSates: controlSates,
                  flag: flag,
                  message: req.flash('info'),
                  type: "info",
                  numProducts: req.session.numProducts, //numero di proodotti nel carrello
                  user: req.user.local,
                  invitationAvailable: req.session.invitationAvailable - req.session.friendsInvited,
                  friendsInvited: req.session.friendsInvited,
                  percentage: Math.round(req.session.friendsInvited * 100 / req.session.invitationAvailable), //numProducts : req.session.numProducts
                  //token: lib.generateToken(20),
                  parentName: req.user.local.name.first,
                  parentEmail: req.user.local.email,
                  server: server
              });
          };
      });
  });

//-------------------------------------------
//POST
//-------------------------------------------
  app.post('/recomm', lib.isLoggedIn, async (req, res) => {

      // controllo che ci siano ancora inviti diposnibili
      if (req.session.friendsInvited >= req.session.invitationAvailable) {
          req.flash('info', "Non hai inviti disponibili! Acquista un BoxNbeer per avere un nuovo invito");
          return res.render('friend.njk', {
              message: req.flash('info'),
              type: "info",
              invitationAvailable: req.session.invitationAvailable - req.session.friendsInvited,
              friendsInvited: req.session.friendsInvited,
              percentage: Math.round(req.session.friendsInvited * 100 / req.session.invitationAvailable)
          });
      }

      var server = lib.getServer(req);

      //START TRANSACTION
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const opts = { session };
        //-------------------------------------------------
        // creo nuovo user con i dati segnalati dal PARENT
        //-------------------------------------------------
        const newUser   = await new User();
        const password  = lib.generatePassword(6);
        const firstName = lib.capitalizeFirstLetter(req.body.firstName);
        const token     = lib.generateToken(20);
        
        console.debug('TOKEN: ',token);

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
        
        //-------------------------------------------------
        // Push a new Friend in PARENT
        //-------------------------------------------------
        const user = await User.findById(req.user.id);
        user.friends.push({ 'name.first'  : firstName,
                            'token'       : token,
                            'status'      : 'new',
                            'insertDate'  : moment().utc("Europe/Rome").format()                            
        });
        await user.save(opts);
        //throw new Error('ERROR in RECOMM generato da me');

        //-------------------------------------------------
        //send email to Parent 
        //-------------------------------------------------
        lib.sendmailToPerson(req.user.local.name.first, req.user.local.email, '', token, newUser.local.name.first, '', newUser.local.email, 'invite',server)

        await session.commitTransaction();

        req.session.friendsInvited += 1;
        let flag = false;
        if (req.session.friendsInvited < req.session.invitationAvailable) {
		     flag = true;
	      }

        res.send({
            friendName: firstName,
            parentName: req.user.local.name.first,
            flag      : flag,
            token     : token,
            server    : server,
            ok        : true       
        })
      } catch (e) {
          await session.abortTransaction();
          console.error(moment().utc("Europe/Rome").format()+' [ERROR][RECOVERY:NO] "POST /recomm" USERS_ID: {"_id":ObjectId("' + req.user._id + '")} TRANSACTION: '+e);
          return res.status(500).send({err:e, ok:false})
      } finally {
          await session.endSession();
      }
  });

// =================================================================================================
// MESSAGGISTICA
// =================================================================================================
    app.get('/infoMessage', (req, res) => {
      let msg = req.query.msg;
      let msgType = req.query.type;
      let err = req.body.err;
      console.error(moment().utc("Europe/Rome").format()+' [WARNING][RECOVERY:NO] "GET /infoMessage" USERS_ID: {"_id":ObjectId("' + req.user._id + '")} ERROR: '+err+' FLASH: '+msg);
      req.flash('message', msg);
      res.render('info.njk', {
          message : req.flash('message'),
          type    : msgType,
          user    : req.user,
          numProducts : req.session.numProducts
      })
    });

    app.post('/infoMessage', (req, res) => {
      let msg = req.body.msg;
      let msgType = req.body.type;
      let err = req.body.err;
      console.error(moment().utc("Europe/Rome").format()+' [WARNING][RECOVERY:NO] "POST /infoMessage" USERS_ID: {"_id":ObjectId("' + req.user._id + '")} ERROR: '+err+' FLASH: '+msg);
      req.flash('message', msg);
      res.render('info.njk', {
          message : req.flash('message'),
          type    : msgType,
          user    : req.user,
          numProducts : req.session.numProducts
      })
    });

    app.post('/infoShare', (req,res) => {
       res.render('share.njk', {
              firstName : req.body.firstName,
              flag      : req.body.flag,
              user      : req.user,
              numProducts : req.session.numProducts
          });
    });

    app.get('/videoPromo', (req, res) => {
          res.render('video.njk')
    });

// =================================================================================================
// UTILITY
// =================================================================================================
// visualizza in formato HTML la mail conferma
    app.get('/mailconferme', function(req, res) {
      var server = lib.getServer(req);
      res.send(mailconferme('Name', 'Email', 'Token', 'userName', 'userSurname', server))
    })

    // visualizza in formato HTML la mail Friend
    app.get('/mailfriend', function(req, res) {
      var server = lib.getServer(req);
      res.send(mailfriend('Name', 'Email', 'Token', 'userName', 'userSurname', server))

    })

    // visualizza in formato HTML la mail User
    app.get('/mailparent', function(req, res) {
      var server = lib.getServer(req);
      res.send(mailparent('Name', 'Email', 'userName', 'userEmail', server))
    })

    app.get('/mailinvite', function(req, res) {
      var server = lib.getServer(req);      
      res.send(mailinvite('Name', 'Email', 'Token', 'userName', server))
    })   

    app.get('/mailorder', function(req, res) {
      var server = lib.getServer(req);
      
      const html = mailorder(req.user.local.name.first, '6684224d12814800a635bcb5', lib.deliveryDate('Europe/Rome','TXT','dddd DD MMMM','Consegna'), server)
      lib.sendmailToPerson(req.user.local.name.first, req.user.local.email, '', '', '', '', '', 'order',server, html)
      res.send(mailorder(req.user.local.name.first, '6684224d12814800a635bcb5', lib.deliveryDate('Europe/Rome','TXT','dddd DD MMMM', 'Consegna'), server))
      return

    }) 

    
// =================================================================================================
// TESTING 
// =================================================================================================
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
      console.info(moment().utc("Europe/Rome").format() + ' [INFO][RECOVERY:NO] "GET /validation" EMAIL:  FLASH: ' + msg);
      res.redirect('/shop');
    });

    app.get('/emailvalidation', function(req,res) {
      res.render('emailValidation.njk', { email: 'indirizzo@email.mio'});  
    });

}
