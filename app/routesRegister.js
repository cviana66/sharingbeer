// =============================================================================
// FRIENDS MANAGEMENT ==========================================================
// =============================================================================

// load up the user model

var User = require('../app/models/user');
var CityCap = require('../app/models/cityCap');
var CityIstat = require('../app/models/cityIstat');
var MultipleCap = require('../app/models/multipleCap');
var bcrypt = require('bcrypt-nodejs');
//TODO: da spostare in libfunction
var lib = require('./libfunction');
var { getAddressFromOSM } = require('../app/overpassQuery')

var mailfriend = require('../config/mailFriend');
var mailparent = require('../config/mailParent');
var mailfriendstatus = require('../config/mailFriendStatus');
var mailinvite = require('../config/mailInvite');
var mailconferme = require('../config/mailConferme');
var mailorder = require('../config/mailOrder');

var { getDistance } = require('../app/geoCoordHandler');

const fetch = require("node-fetch");
const https = require('https');


module.exports = function (app, moment, mongoose, fastcsv, fs, util) {

  // =================================================================================================
  // API OVERPASS OPENSTREETMAPS
  // =================================================================================================
  //https://www.istat.it/storage/codici-unita-amministrative/Elenco-comuni-italiani.csv
  //https://www.istat.it/storage/codici-unita-amministrative/Elenco-comuni-italiani.xlsx


  app.get('/testOverpass', async function (req, res) {
    //getAddressFromOSM('Candelo','096012','Via Moglia','10','13878')
    //getAddressFromOSM('Biella','096004','Piazza Gaudenzio Sella','1','13900')
    getAddressFromOSM('Milano', '015146', 'Corso Buenos Aires', '2')
    //getAddressFromOSM('Buonconvento','052003','Via Bruno Buozzi','10')
    //getAddressFromOSM('Torino','001272','Corso Stati Uniti','101')
  })


  app.post('/overpass/istat', lib.isLoggedIn, async function (req, res) {
    var newArr = [];
    var option = '[out:json];' +
      'area[name="' + req.body.city + '"]["ref:ISTAT"="' + req.body.istat + '"]->.a;' +
      '(node(area.a)["addr:street"];for (t["addr:street"])(make via name=_.val;out;););' +
      '(way(area.a)[highway]["name"];for (t["name"])(make via name=_.val;out;););'

    const url = 'https://overpass-api.de/api/interpreter?data=' + option;

    console.debug('OVERPASS: ', option);

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
          req.session.elements = newArr.filter((elem, indexx, self) => { return indexx === self.indexOf(elem); });

          res.send('{"status":"200", "statusText":"OK"}');
        } catch (e) {
          console.debug('Error', e);
          res.send('{"status":"500","statusText":' + e + '"}');
        }
      });

    });
    request.on('error', (error) => {
      console.log('Error', error);
      res.send('{"status":"500","statusText":' + error + '"}');
    });
    request.end()
  });


  app.post('/overpass/cap', async function (req, res) {
    const comune = req.body.comune;
    const istat = req.body.istat;
    const via = req.body.via;
    const numero = req.body.numero;
    const cap = req.body.cap;
    var indirizzo = {}

    try {
      indirizzo = await getAddressFromOSM(comune, istat, via, numero, cap);
      console.debug('INDIRIZZO', indirizzo);
      res.send(indirizzo)
    } catch (e) {
      console.log('ERRORE in overpass/cap', e)
      res.send(indirizzo)
    }
  });


  app.post('/cities', lib.isLoggedIn, async function (req, res) {
    try {
      req.session.elements = [];
      // throw('Genera ERRORE');
      // console.log("city : ", req.body.city);

      const cities = await CityIstat.find(
        { 'Comune': new RegExp('^' + req.body.city, "i") },
        null,
        { sort: { Comune: 1 } }
      );

      // console.log("Got city : ", cities);
      return res.send(cities);

    } catch (err) {
      console.error('Error fetching cities:', err);
      return res.status(500).send('An error occurred while fetching cities.');
    }
  });


  app.post('/streets', function (req, res) {
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
  app.get('/importCityIstat/:csvname', (req, res) => {
    console.debug('PARAM: ', req.params.csvname);
    let stream = fs.createReadStream('./data/' + req.params.csvname + '.csv');
    let csvData = [];
    let csvStream = fastcsv
      .parse()
      .on("data", function (data) {
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
      .on("end", function () {
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

  app.get('/validation', async function (req, res) {
    console.debug('QUERY',req.query);
    try {
      //--------------------------------------------------
      //verifico che l'utente abbia ancora l'invito valido 
      //--------------------------------------------------
      const user = await User.findOne({
        'local.resetPasswordToken': req.query.token,
        'local.resetPasswordExpires': { $gt: Date.now() }
      });
      console.debug('VALIDATION USER:',user)

      //se l'utente non è stato trovato è perchè il token non è più valido o l'invito è già stato accettato
      if (!user) {
        const userByToken = await User.findOne({
          'local.token': req.query.token
        });
        console.debug('USERBYTOKEN',userByToken)

        if (!userByToken || userByToken.local.status === 'new' || userByToken.local.status === 'waiting' || userByToken.local.status === 'customer') {
          
          if (userByToken.local.status === 'customer') {
            var msg = 'Ti sei già registrato. Accedi con il tuo indirizzo email e password.';
          } else {
            var msg = 'Invito non più valido o scaduto. Se ti sei già registrato accedi con il tuo indirizzo email e password.';
          }

          req.flash('loginMessage', msg);
          console.info(lib.logDate("Europe/Rome") + ' [INFO][RECOVERY:NO] "GET /validation" TOKEN: {"resetPasswordToken":"' + req.query.token + '"} FLASH:' + msg);          
          return res.redirect('/login');
        }

        if (!req.user && userByToken.local.status === 'validated') {
          let msg = 'L\'invito è già stato accettato e la mail validata. Puoi accedere con le credenziali con cui ti sei registrato';
          req.flash('loginMessage', msg);
          console.info(lib.logDate("Europe/Rome") + ' [INFO][RECOVERY:NO] "GET /validation" USER_ID: {"resetPasswordToken":"' + userByToken.id + '"} FLASH' + msg);
          return res.redirect('/login');
        } else {}
          //return res.redirect('/shop');
          return res.render('conferme.njk', {
                user: req.user,
                numProducts: req.session.numProducts,
                numInviti: invitiPerOgniInvito,
                amiciDaInvitare: true
              });

      } else {
        if (user.local.status === 'new') {
          const video = process.env.NODE_ENV === 'development' ? "" : "video/BirraViannaColor_Final_Logo_38.mp4";         
          console.debug('INVITO VISITATO = TRUE')
          user.local.invitoVisitato = true;          
          //TODO: inseirie anche la data di qunado è stata l'ultima visita
          await user.save()

          user.local.email = (user.local.email == req.query.token+'@sb.sb') ? '' : user.local.email //per non far visualizzare l'email farlocca
          return res.render('validation.njk', {
            prospect: user.local,
            message: req.flash('validateMessage'),
            type: "danger",
            video: video,
            user: req.user,
            numProducts: req.session.numProducts,
            amiciDaInvitare: req.session.haiAmiciDaInvitare
          });
        } else if (user.local.status === 'waiting') {
          console.debug('WAITING VS VALIDATED')
          const session = await mongoose.startSession();
          session.startTransaction();
          const opts = { session };

          try {
            user.local.status = 'validated';
            user.local.token = req.query.token;
            user.local.resetPasswordToken = undefined;
            user.local.resetPasswordExpires = undefined;
            user.local.eligibleFriends = invitiPerOgniInvito;
            await user.save(opts);
            //----------------------------------------------------------------------------------
            // aggiungo per ogni invito accettato Punti Pinta al PARENT => booze(€)=global.valoreUnInvito
            //----------------------------------------------------------------------------------
            await User.findOneAndUpdate(
              {'_id': new mongoose.Types.ObjectId(user.local.idParent)},
              {'$inc': {'local.booze':valoreUnInvito}}
              ).session(session);

            await session.commitTransaction();
          } catch (e) {
            console.debug("errore: ", e);
            await session.abortTransaction();
            req.flash('error', 'L\'applicazione ha riscontrato un errore imprevisto.');
            console.error(lib.logDate("Europe/Rome") + ' [ERROR][RECOVERY:NO] "GET /validation" USERS_ID: {_id:ObjectId("' + user._id + '")} TRANSACTION: ' + e);
            return res.render('info.njk', { 
              message: req.flash('error'), 
              type: "danger",
              user: req.user,
              numProducts: req.session.numProducts,
              amiciDaInvitare: req.session.haiAmiciDaInvitare
            });
          } finally {
            await session.endSession();
          }

          req.logIn(user, function (err) {
            console.debug('LOGIN in VALIDATE')
            if (err) {
              req.flash('error', 'L\'applicazione ha riscontrato un errore non previsto.');
              console.info(lib.logDate("Europe/Rome") + ' [ERROR][RECOVERY:NO] "GET /validation" FUNCTION: req.logIn ERROR: ' + err);
              return res.render('info.njk', { 
                message: req.flash('error'), 
                type: "danger",
                user: req.user,
                numProducts: req.session.numProducts,
                amiciDaInvitare: false
              });
            } else {
              console.info(lib.logDate("Europe/Rome") + ' [INFO][RECOVERY:NO] "GET /validation" USER_ID: {_id:ObjectId("' + req.user._id + '")}');
              return res.render('conferme.njk', {
                user: req.user,
                numProducts: req.session.numProducts,
                numInviti: invitiPerOgniInvito,
                amiciDaInvitare: true
              });
            }
          });
        };
      };
    } catch (err) {
      let msg = 'Token non più valido o scaduto';
      req.flash('error', msg);
      console.error(lib.logDate("Europe/Rome") + ' [ERROR][RECOVERY:NO] "GET /validation" TOKEN: {"resetPasswordToken":"' + req.query.token + '"} FUNCTION: User.findOne: ' + err + ' FLASH: ' + msg);
      return res.render('info.njk', {
        message: req.flash('error'),
        type: "warning",
        user: req.user,
        numProducts: req.session.numProducts,
        amiciDaInvitare: req.session.haiAmiciDaInvitare
      });
    }
  });
//=====
//POST
//=====
  app.post('/validation', async function (req, res) {
    try {
      //--------------------------------------------------
      //verifico che l'utente abbia ancora l'invito valido 
      //--------------------------------------------------
      const user = await User.findOne({
        'local.resetPasswordToken': req.body.token,
        'local.resetPasswordExpires': { $gt: Date.now() }
      });

      if (!user) {
        let msg = 'Token non più valido o scaduto';
        req.flash('error', msg);
        console.error(lib.logDate("Europe/Rome") + ' [ERROR][RECOVERY:NO] "POST /validation" TOKEN - USER: {resetPasswordToken:"' + req.body.token + '"} FUNCTION: User.findOne: utente non trovato' + msg);
        return res.render('info.njk', {
          message: req.flash('error'),
          type: "danger",
          user: req.user,
          numProducts: req.session.numProducts,
          amiciDaInvitare: req.session.haiAmiciDaInvitare
        });
      }
      
      //--------------------------------------------------
      // Validazione dell'email
      //--------------------------------------------------
      const email = req.body.email.toLowerCase().trim();
      if (!lib.emailValidation(email)) {
        let msg = 'Indirizzo mail non valido';
        req.flash('validateMessage', msg);
        console.info(lib.logDate("Europe/Rome") + ' [WARNING][RECOVERY:NO] "POST /validation" TOKEN - USER: {resetPasswordToken:"' + req.body.token + '", _id:' + user._id + '"} FLASH: ' + msg);
        return res.redirect("/validation?token=" + req.body.token);
      }

      var server = lib.getServer(req);

      //==============================================
      // Inizializzo la Transazione
      //==============================================
      const session = await mongoose.startSession();
      session.startTransaction();
      const opts = { session };

      try {
        if (user.local.status === "new") {
          const optional = req.body.checkPrivacyOptional !== undefined;
          const cessione = req.body.checkPrivacyCessione !== undefined;
          console.debug('req.body.checkPrivacyOptional in REGISTER', optional);
          console.debug('req.body.checkPrivacyCessione in REGISTER', cessione);

          const newToken = lib.generateToken(20);
          user.local.email = email;
          user.local.password = user.generateHash(req.body.password);
          user.local.name.first = lib.capitalizeFirstLetterOfEachWord(req.body.firstName);
          user.local.resetPasswordToken = newToken;
          user.privacy.optional = optional;
          user.privacy.transfer = cessione;
          user.local.status = "waiting";

          await user.save(opts);

          const filter = { 'friends.token': req.body.token };
          const update = {
            'friends.$.status': 'accepted',
            'friends.$.email': email,
            'friends.$.name.first': lib.capitalizeFirstLetterOfEachWord(req.body.firstName),
            'friends.$.id': user._id.toString()
          };
          await User.findOneAndUpdate(filter, { '$set': update }, opts);

          await lib.sendmailToPerson(req.body.firstName, email, '', newToken, req.body.firstName, '', email, 'conferme', server);
          let msg = 'Inviata email di verifica';
          console.info(lib.logDate("Europe/Rome") + ' [INFO][RECOVERY:NO] "POST /validation" USER: {_id:"' + user._id + '"} FLASH: ' + msg);
          await session.commitTransaction();
        }

        return res.render('emailValidation.njk', { 
          email: email,
          user: req.user,
          numProducts: req.session.numProducts,
          amiciDaInvitare: req.session.haiAmiciDaInvitare
        });

      } catch (e) {
        await session.abortTransaction();
        if (e.code === 11000) {
          let msg = 'Indirizzo e-mail già registrato';
          req.flash('validateMessage', msg);
          console.info(lib.logDate("Europe/Rome") + ' [INFO][RECOVERY:NO] "POST /validation" TOKEN: {"token":"' + req.body.token + '"} FUNCTION: User.save: ' + e + ' FLASH: ' + msg);
          return res.redirect("/validation?token=" + req.body.token);
        } else {
          let msg = 'Spiacente ma qualche cosa non ha funzionato nella validazione della tua e-mail! Riprova';
          req.flash('error', msg);
          console.error(lib.logDate("Europe/Rome") + ' [ERROR][RECOVERY:NO] "POST /validation" EMAIL: {"email":"' + email + '"} FUNCTION: User.save: ' + e + ' e.code: ' + e.code + ' FLASH: ' + msg);
          return res.render('info.njk', {
            message: req.flash('error'),
            type: "danger",
            user: req.user,
            numProducts: req.session.numProducts,
            amiciDaInvitare: req.session.haiAmiciDaInvitare
          });
        }
      } finally {
        // Chiudi la sessione
        await session.endSession();
      }

    } catch (err) {
      let msg = 'Si è verificato un errore durante la validazione.';
      req.flash('error', msg);
      console.error(lib.logDate("Europe/Rome") + ' [ERROR][RECOVERY:NO] "POST /validation" FUNCTION: User.findOne: ' + err + ' FLASH: ' + msg);
      return res.render('info.njk', {
        message: req.flash('error'),
        type: "danger",
        user: req.user,
        numProducts: req.session.numProducts,
        amiciDaInvitare: req.session.haiAmiciDaInvitare
      });
    }
  });

  //==================================================================================================
  // REGISTRAZIONE CLIENTE
  //==================================================================================================
  //-------------------------------------------
  //GET
  //-------------------------------------------
  app.get('/register', lib.isLoggedIn, function (req, res) {
    console.debug("USER STATUS =", req.user.local.status)
    console.debug("NUM PRODOTTI IN CARRELLO", req.session.numProducts)
    if (req.user.local.status == "validated") {
      var model = {
        firstName: req.user.local.name.first,
        lastName: req.user.local.name.last,
        user: req.user,
        numProducts: req.session.numProducts,
        message: req.flash('validateMessage'),
        type: "warning",        
        amiciDaInvitare: req.session.haiAmiciDaInvitare
      }
      res.render('registration.njk', model);

    } else if (req.user.local.status == 'customer' && req.session.numProducts > 0) {
      res.redirect('/addresses');
    } else if (req.user.local.status == 'customer' && (req.session.numProducts == 0 || req.session.numProducts == undefined)) {
      res.redirect('/shop');
    } else {
      var msg = "Devi validare la tua identità attraverso la mail che ti abbiamo inviato in fase di accettazione dell'invito";
      console.error(lib.logDate("Europe/Rome") + ' [WARNING][RECOVERY:NO] "GET /register" USERS_ID: {"_id":ObjectId("' + req.user.id + '")} FLASH:' + msg + '');
      req.flash('warning', msg);
      return res.render('info.njk', {
        message: req.flash('warning'),
        type: "warning",
        user: req.user,
        numProducts: req.session.numProducts,
        amiciDaInvitare: req.session.haiAmiciDaInvitare
      })
    }
  });

  //-------------------------------------------
  //POST
  //-------------------------------------------
  app.post('/register', lib.isLoggedIn, async function (req, res) {

    //const session = await mongoose.startSession();
    //session.startTransaction();
    //const opts = { session };
    try {

      console.debug('ID POST REGISTER: ', req.user.id);

      // Conta quanti indirizzi main=yes ci sono
      const Nadr = await User.aggregate([
        { $match: { "_id": req.user._id } },
        { $unwind: "$addresses" },
        { $match: { "addresses.main": "yes" } },
        { $project: { _id: 0, friends: 0, orders: 0, local: 0 } },
        { $group: { _id: null, count: { $count: {} } } }
      ])
      console.debug('AGGREGATE: ', Nadr.length);
      var main = 'yes';
      if (Nadr.length >= 1) {
        main = 'no';
        await User.findOneAndUpdate(
          { _id: req.user._id },
          { $set: { 'addresses.$[elem].preferred': 'no' } },
          { arrayFilters: [{ "elem.preferred": { $eq: 'yes' } }] }
        )//.session(session)
      };

      const user = await User.findById(req.user._id);
      const numMobil = req.body.mobile.replace(/\s/g, "");

      if (user.local.status != 'customer') {
        console.debug('FORM Register: ', user);     //TODO: fare il controllo di inserimento se l'arreay è vuota

        //Test unicità del num. tel
        const countMobileNumber = await User.aggregate([{ $match: { "local.mobileNumber": numMobil } }, { $count: "count" }])
        console.debug('REGISTER countMobileNumber:', countMobileNumber, 'LENGTH', countMobileNumber.length)
        if (countMobileNumber.length > 0) throw ({ code: 11000 })

        user.local.name.first = lib.capitalizeFirstLetterOfEachWord(req.body.firstName);
        user.local.name.last = lib.capitalizeFirstLetterOfEachWord(req.body.lastName);
        //user.privacy.optional              = req.body.checkPrivacyOptional;
        //user.privacy.transfer              = req.body.checkPrivacyCessione;
        user.local.status = 'customer';
        user.local.mobilePrefix = '+39';
        user.local.mobileNumber = numMobil;        

        console.debug('USER in REGISTER', user)
        //console.debug('req.body.checkPrivacyOptional in REGISTER',req.body.checkPrivacyOptional)
        //console.debug('req.body.checkPrivacyCessione in REGISTER',req.body.checkPrivacyCessione)
      }

      // genero un nuovo _id
      const addressId = new mongoose.Types.ObjectId()

      user.addresses.push({
        _id: addressId,
        'name.first': req.body.firstName,
        'name.last': req.body.lastName,
        mobilePrefix: '+39',
        mobileNumber: numMobil,
        city: req.body.city,
        province: req.body.provincia,
        address: req.body.street,
        houseNumber: req.body.numberciv,
        postcode: req.body.hiddenCAP,
        main: main,
        preferred: 'yes',
        affidability: req.body.hiddenAddressIsValid,
        desAffidability: req.body.descValidAddress,
        'coordinateGPS.latitude': req.body.lat,
        'coordinateGPS.longitude': req.body.lon
      });
      //await user.save(opts);
      await user.save();
      //await session.commitTransaction();

      //------------------------------------------------------------------------
      // Caso di spedizione presso indirizzo inserito appena prima del pagamento
      //------------------------------------------------------------------------

      req.session.deliveryType = "Consegna"

      address = await User.aggregate([
        { $match: { "_id": req.user._id } },
        { $unwind: "$addresses" },
        { $match: { "addresses._id": addressId } },
        { $project: { _id: 0, friends: 0, orders: 0, local: 0 } }
      ])
      req.session.shippingAddress = address[0].addresses;
      //console.debug('ADDRESS[0]: ',address[0].addresses)

      /*-----------------------------------------------------
       * Calcolo della distanza
       * ----------------------------------------------------*/
      let customerAddress = address[0].addresses.address + ' ' +
        //address[0].addresses.houseNumber + ' ' +
        address[0].addresses.city + ' ' +
        address[0].addresses.province;
      let customerCoordinate = null;
      let birrificioAddress = 'Via Molignati 12 Candelo Biella';
      let birrificioCoordinate = { 'latitude': 45.5447643, 'longitude': 8.1130519 };
      let dist = JSON.parse(await getDistance(customerAddress, birrificioAddress, customerCoordinate, birrificioCoordinate));

      console.debug('DISTANZA = ', dist.distanceInMeters)
      req.session.distance = Number(dist.distanceInMeters)

      if (Number(dist.distanceInMeters) > 15000) {
        req.session.shippingCost = priceCurier[req.session.numProducts - 1];
      } else {
        if (req.session.numProducts > 5) {
          req.session.shippingCost = '0.00';
        } else {
          console.debug('COSTO SPEDIZIONE: ', req.session.numProducts, priceLocal[req.session.numProducts - 1])
          req.session.shippingCost = priceLocal[req.session.numProducts - 1]
        }
      }
      //==============================================================================
      // Vantaggio dai tuoi amici
      // Il prezzo totale di acquisto/numero di bottigli => costo di una bottiglia
      // se i booze >= costo di una bottiglia allora faccio lo sconto
      // lo sconto massimo è del 50% su totale di acquisto
      //==============================================================================
      const c1b = (req.session.totalPrc / req.session.numProducts / numBottigliePerBeerBox).toFixed(2)
      //-------------------------------------------
      // Verifica se è il primo ordine
      //-------------------------------------------
      var nOrders
      const resNorder = await User.aggregate([
        { $match: { "_id": req.user._id } },
        { $unwind: "$orders" },
        { $match: { "orders.payment.s2sStatus": "OK" } },
        { $project: { _id: 0, friends: 0, addresses: 0, local: 0, privacy: 0 } },
        { $group: { _id: null, count: { $count: {} } } }
      ])
      if (resNorder.length > 0) {
        nOrders = resNorder[0].count
        req.session.omaggioPrimoAcquisto = 0
      } else {
        nOrders = 0
        req.session.omaggioPrimoAcquisto = c1b
      }
      console.debug("N° ORDINI COMPLETATI", nOrders)
      //--------------------------------------------
      console.debug('COSTO DI 1 BOTTIGLIA!!: ', c1b)
      if (req.user.local.booze >= c1b && req.user.local.booze <= req.session.totalPrc / 2) {
        req.session.pointDiscount = req.user.local.booze.toFixed(2);
      } else if (req.user.local.booze > req.session.totalPrc / 2) {
        req.session.pointDiscount = (req.session.totalPrc / 2).toFixed(2)
      } else {
        req.session.pointDiscount = 0.00.toFixed(2);
      }

      console.debug('STATO UTENTE = ', req.user.local.status);
      if (req.user.local.status == 'validated') {
        req.user.local.status = 'customer'
        res.redirect('/addresses');
      } else {
        res.render('orderSummary.njk', {
          cartItems: req.session.cartItems,
          cart: req.session.newcart,
          address: address[0].addresses,
          numProducts: req.session.numProducts,
          userStatus: req.user.local.status,
          shipping: req.session.shippingCost,
          deliveryType: req.session.deliveryType,
          deliveryDate: lib.deliveryDate('Europe/Rome', 'TXT', 'dddd DD MMMM', req.session.deliveryType),
          friendsDiscount: req.session.pointDiscount,
          user: req.user,
          payType: "axerve", //"paypal"  "axerve"
          nOrders: nOrders,
          omaggio: req.session.omaggioPrimoAcquisto,
          amiciDaInvitare: req.session.haiAmiciDaInvitare

        })
      }
    } catch (e) {
      //await session.abortTransaction();
      if (e.code === 11000) {
        let msg = 'Numero telefonico già registrato. Ti ricordo che tutte le comunicazioni importanti relative alla consegna e al ritiro dei prodotti saranno trasmesse via messaggistica telefonica. Inserisci un numero di telefono che ti appartiene.';
        req.flash('validateMessage', msg);
        console.info(lib.logDate("Europe/Rome") + ' [INFO][RECOVERY:NO] "POST /register" ID: {"id":"' + req.user.id + '"} FUNCTION: User.save: ' + e + ' FLASH: ' + msg);
        res.redirect("/register");
      } else {
        let msg = 'Spiacente ma l\'applicazione ha riscontrato un errore inatteso. Riprova';
        req.flash('error', msg);
        console.error(lib.logDate("Europe/Rome") + ' [ERROR][RECOVERY:NO] "POST /register" ID: {"id":"' + req.user.id + '"} FUNCTION: User.save: ' + e + ' FLASH: ' + msg);
        return res.render('info.njk', {
          message: req.flash('error'),
          type: "danger",
          amiciDaInvitare: req.session.haiAmiciDaInvitare,
          user: req.user,
          numProducts: req.session.numProducts,
        })
      }
    } finally {
      //await session.endSession();
    }
  });

  //-------------------------------------------
  //GET
  //-------------------------------------------
  app.get('/addresses', lib.isLoggedIn, async function (req, res) {

    try {
      res.render('addresses.njk', {
        addresses: req.user.addresses,
        firstName: req.user.local.name.first,
        lastName: req.user.local.name.last,
        user: req.user,
        numProducts: req.session.numProducts,
        amiciDaInvitare: req.session.haiAmiciDaInvitare
      });

    } catch (err) {
      console.log('error', err);
      req.flash('error', 'L\'applicazione ha riscontrato un errore inatteso')
      res.render('info.njk', {
        message: req.flash('error'),
        type: "danger",
        user: req.user,
        numProducts: req.session.numProducts,
        amiciDaInvitare: req.session.haiAmiciDaInvitare
      });
    }

  });

  app.post('/removeAddress', lib.isLoggedIn, async (req, res) => {
    try {
      console.debug('ADDRESSID in removeAddress', req.body.addressID)

      const user = await User.findOne({ _id: new mongoose.Types.ObjectId(req.user.id) });
      //console.debug('USER',user)
      user.addresses.pull({ _id: new mongoose.Types.ObjectId(req.body.addressID) })
      await user.save()

      res.redirect('/addresses');
    } catch (e) {
      console.debug("ERRORE", e)
      req.flash('error', 'L\'applicazione ha riscontrato un errore non previsto.');
      return res.render('info.njk', {
        message: req.flash('error'),
        type: "danger",
        user: req.user,
        numProducts: req.session.numProducts,
        amiciDaInvitare: req.session.haiAmiciDaInvitare
      });

    }
  })

  // ===============================================================================================
  // FRIEND - gestione degli inviti
  // 24-12-2021
  // 05-02-2022
  // 12-02-2022 introddotto il logger
  // 24-11-2022 uso della Trasaction
  // ===============================================================================================
  //GET
  app.get('/recomm', lib.isLoggedIn, async function (req, res) {
    try {
      // Conto quanti amici ha già lo User
      const user = await User.findOne({ '_id': req.user._id });

      if (!user) {
        throw new Error('User not found');
      }

      const inviti = await lib.getInviteAvailable(req) 
        
      req.session.invitationAvailable = parseInt(user.local.eligibleFriends, 10); // Numero di inviti disponibili = amici ammissibili
      req.session.friendsInvited = parseInt(inviti.numFriendsInvited, 10);        // Numero di amici già invitati

      console.debug("INVITI DISPONIBILI=", req.session.invitationAvailable);
      console.debug("AMICI INVITATI= ", req.session.friendsInvited);

      let controlSates = "";
      let flag = "false";

      // Controllo che ci siano ancora inviti disponibili
      if (!inviti.isInviteAvialable) {
        req.flash('info', "Non hai inviti disponibili! Acquista un beerBox per averne di nuovi");
        controlSates = "disabled";
        flag = "true";
      }

      const server = lib.getServer(req);

      console.debug('MAIL PARENT', req.user.local.email.toLowerCase());
      const isBirrificioEmail = req.user.local.email.toLowerCase() === 'birrificioviana@gmail.com';
      const dataScadenzaInvito = new Date(Date.now() + giorniScadenzaInvito)

      const model = {
        controlSates: controlSates,
        flag: flag,
        message: req.flash('info'),
        type: "info",
        numProducts: req.session.numProducts, // Numero di prodotti nel carrello
        user: req.user,
        invitationAvailable: req.session.invitationAvailable - req.session.friendsInvited,
        friendsInvited: req.session.friendsInvited,
        percentage: Math.round(req.session.friendsInvited * 100 / req.session.invitationAvailable), // Percentuale di amici invitati
        parentName: req.user.local.name.first,
        parentEmail: req.user.local.email,
        server: server,
        amiciDaInvitare: req.session.haiAmiciDaInvitare,
        scadenzaInvito : dataScadenzaInvito.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })
      };

      if (isBirrificioEmail) {
        res.render('birrificioToFriend.njk', model); //il funzionamento è identico al friends.njk tranne il messaggio che viene costruito per l'invio al prospect
      } else {
        res.render('friend.njk', model);
      }

    } catch (err) {
      console.error(lib.logDate("Europe/Rome") + ' [ERROR][RECOVERY:NO] "GET /recomm" USERS_ID: {"_id":ObjectId("' + req.user.id + '")} ERROR: ' + err);
      req.flash('error', 'L\'applicazione ha riscontrato un errore non previsto.');
      return res.render('info.njk', {
        message: req.flash('error'),
        type: "danger",
        user: req.user,
        numProducts: req.session.numProducts,
        amiciDaInvitare: req.session.haiAmiciDaInvitare
      });
    }
  });

  app.post('/recomm', lib.isLoggedIn, async (req, res) => {

    // controllo che ci siano ancora inviti diposnibili
    if (req.session.friendsInvited >= req.session.invitationAvailable) {
      req.flash('info', "Non hai inviti disponibili! Acquista un BoxNbeer per averne di nuovi");
      return res.render('friend.njk', {
        message: req.flash('info'),
        type: "info",
        invitationAvailable: req.session.invitationAvailable - req.session.friendsInvited,
        friendsInvited: req.session.friendsInvited,
        percentage: Math.round(req.session.friendsInvited * 100 / req.session.invitationAvailable),
        user: req.user,
        numProducts: req.session.numProducts,
        amiciDaInvitare: req.session.haiAmiciDaInvitare
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
      const newUser = await new User();
      const password = lib.generatePassword(6);
      const firstName = lib.capitalizeFirstLetterOfEachWord(req.body.firstName);
      const token = lib.generateToken(20);

      console.debug('TOKEN: ', token);

      // Set the newUser's local credentials
      newUser.local.password = newUser.generateHash(password);
      newUser.local.name.first = firstName;
      newUser.local.idParent = req.user.id; //id parent
      newUser.local.status = 'new';  // status
      newUser.local.email = token + "@sb.sb";
      newUser.local.token = token;
      newUser.local.resetPasswordToken = token;
      //newUser.local.resetPasswordExpires = Date.now() + (3600000 * 24 * 365); // 1 hour in secondi * 24 * 365 = 1 anno
      newUser.local.resetPasswordExpires = Date.now() + giorniScadenzaInvito //(3600000 * 24 * 15); // 1 hour in secondi * 24 * 15 = 2 settimane
      await newUser.save(opts);

      //-------------------------------------------------
      // Push a new Friend in PARENT
      //-------------------------------------------------
      const user = await User.findById(req.user.id);
      user.friends.push({
        'name.first': firstName,
        'token': token,
        'status': 'new',
        'insertDate': lib.nowDate("Europe/Rome")
      });
      await user.save(opts);
      //throw new Error('ERROR in RECOMM generato da me');

      //-------------------------------------------------
      //send email to Parent con l'invito da copiare e inviare se non ancora fatto
      //-------------------------------------------------
      const dataScadenzaInvito = new Date(Date.now() + giorniScadenzaInvito)
      const html = mailinvite(req.user.local.name.first, req.user.local.email, token, newUser.local.name.first, server, dataScadenzaInvito.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }) )
      lib.sendmailToPerson(req.user.local.name.first, req.user.local.email, '', token, newUser.local.name.first, '', newUser.local.email, 'invite', server, html)

      await session.commitTransaction();

      req.session.friendsInvited += 1;
      let flag = false;
      if (req.session.friendsInvited < req.session.invitationAvailable) {
        flag = true;
      }

      res.send({
        friendName: firstName,
        parentName: req.user.local.name.first,
        flag: flag,
        token: token,
        server: server,
        ok: true
      })
    } catch (e) {
      await session.abortTransaction();
      console.error(lib.logDate("Europe/Rome") + ' [ERROR][RECOVERY:NO] "POST /recomm" USERS_ID: {"_id":ObjectId("' + req.user._id + '")} TRANSACTION: ' + e);
      return res.status(500).send({ err: e, ok: false })
    } finally {
      await session.endSession();
    }
  });

  /*/-------------------------------------------
  //POST
  //-------------------------------------------
  app.get('/invite/:Id', async (req, res) => {

    var server = lib.getServer(req);

    //START TRANSACTION
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const opts = { session };
      //-------------------------------------------------
      // creo nuovo user con i dati segnalati dal PARENT
      //-------------------------------------------------
      const newUser = await new User();
      const password = lib.generatePassword(6);
      const firstName = ""; //lib.capitalizeFirstLetterOfEachWord(req.body.firstName);
      const token = lib.generateToken(20);

      console.debug('INVITE TOKEN: ', token);

      // Set the newUser's local credentials
      newUser.local.password = newUser.generateHash(password);
      newUser.local.name.first = firstName;
      newUser.local.idParent = req.params.Id; //id parent
      newUser.local.status = 'new';  // status
      newUser.local.email = token + "@sb.sb";
      newUser.local.token = token;
      newUser.local.resetPasswordToken = token;
      //newUser.local.resetPasswordExpires = Date.now() + (3600000 * 24 * 365); // 1 hour in secondi * 24 * 365 = 1 anno
      newUser.local.resetPasswordExpires = Date.now() + giorniScadenzaInvito //(3600000 * 24 * 15); // 1 hour in secondi * 24 * 15 = 2 settiamana
      await newUser.save(opts);

      //-------------------------------------------------
      // Push a new Friend in PARENT
      //-------------------------------------------------
      const user = await User.findById(req.params.Id);
      user.friends.push({
        'name.first': firstName,
        'token': token,
        'status': 'new',
        'insertDate': lib.nowDate("Europe/Rome")
      });
      await user.save(opts);
      //throw new Error('ERROR in RECOMM generato da me');

      //-------------------------------------------------
      //send email to Parent
      //-------------------------------------------------
      //lib.sendmailToPerson(user.local.name.first, user.local.email, '', token, newUser.local.name.first, '', newUser.local.email, 'invite',server)

      await session.commitTransaction();

      res.redirect("/validation?token=" + token)

    } catch (e) {
      await session.abortTransaction();
      console.error(lib.logDate("Europe/Rome") + ' [ERROR][RECOVERY:NO] GET /invite/' + req.params.Id + ' - TRANSACTION: ' + e);
      return res.status(500).send({ err: e, ok: false })
    } finally {
      await session.endSession();
    }
  }); */

  app.get('/selfInvite', (req,res) => {
    res.render('selfInvite.njk', {
      message: req.flash('validateMessage'),
      user: req.user,
      numProducts: req.session.numProducts,
      amiciDaInvitare: req.session.haiAmiciDaInvitare
    })
  }) 

  app.post('/selfInvite', async (req,res) => {
    var server = lib.getServer(req);
    
    const email = req.body.email.toLowerCase().trim();
    //--------------------------
    // Validazione dell'email
    //--------------------------
    if (!lib.emailValidation(email)) {
      let msg = 'Indirizzo mail non valido';
      req.flash('validateMessage', msg);
      console.info(lib.logDate("Europe/Rome") + ' [WARNING][RECOVERY:NO] "POST /validation" TOKEN - USER: {resetPasswordToken:"' + req.body.token + '", _id:' + user._id + '"} FLASH: ' + msg);
      return res.redirect("/selfInvite");
    }

    try {
      //-------------------------------------------------
      // creo nuovo user 
      //-------------------------------------------------
      const newUser = await new User();
      const password = req.body.password;
      const firstName = lib.capitalizeFirstLetterOfEachWord(req.body.firstName);
      const token = lib.generateToken(20);

      console.debug('TOKEN: ', token);

      // Set the newUser's local credentials
      newUser.local.password = newUser.generateHash(password);
      newUser.local.name.first = firstName;
      newUser.local.idParent = req.body.id; //id parent
      newUser.local.status = 'waiting';  // status
      newUser.local.email = email;
      newUser.local.token = token;
      newUser.local.resetPasswordToken = token;
      newUser.local.resetPasswordExpires = Date.now() + giorniScadenzaInvito //(3600000 * 24 * 15); // 1 hour in secondi * 24 * 15 = 2 settimane
      newUser.local.organization = 'BNI'//req.body.organization //TODO: settare dinamicamente ma per ora metto BNI
      await newUser.save();

      console.debug('BNI NEW USER',newUser)

      //-------------------------------------------------
      // Push a new Friend in PARENT
      //-------------------------------------------------
      const user = await User.findById(req.body.id);
      user.friends.push({
        'name.first': firstName,
        'token': token,
        'status': 'accepted',
        'insertDate': lib.nowDate("Europe/Rome")
      });
      await user.save();
      
      await lib.sendmailToPerson(firstName, email, '', token, firstName, '', email, 'conferme', server);
      let msg = 'Inviata email di verifica';
      console.info(lib.logDate("Europe/Rome") + ' [INFO][RECOVERY:NO] "POST /selfInvite" USER: {id:"' + req.body.id + '"} FLASH: ' + msg);
      
      res.render('emailValidation.njk', { 
        email: email,
        user: req.user,
        numProducts: req.session.numProducts,
        amiciDaInvitare: req.session.haiAmiciDaInvitare 
      });

    } catch (e) {
      
      if (e.code === 11000) {
        let msg = 'Indirizzo e-mail già registrato. Puoi accedere con le credenziali con cui ti sei iscritto.';
        req.flash('loginMessage', msg);
        console.info(lib.logDate("Europe/Rome") + ' [INFO][RECOVERY:NO] "POST /selfInvite" EMAIL: {"email":"' + email + '"} FUNCTION: User.save: ' + e + ' FLASH: ' + msg);
        return res.redirect("/login");
      } else {
        let msg = 'Spiacente ma qualche cosa non ha funzionato nella richiesta di invito. Riprova';
        req.flash('error', msg);
        console.error(lib.logDate("Europe/Rome") + ' [ERROR][RECOVERY:NO] "POST /selfInvite" EMAIL: {"email":"' + email + '"} FUNCTION: User.save: ' + e + ' e.code: ' + e.code + ' FLASH: ' + msg);
        return res.render('info.njk', {
          message: req.flash('error'),
          type: "danger",
          user: req.user,
          numProducts: req.session.numProducts,
          amiciDaInvitare: req.session.haiAmiciDaInvitare
        });
      }
    }
  })

  app.get('/inviteQrcode', lib.isAdmin, (req, res) => {
    console.debug('NODE_ENV =', process.env.NODE_ENV)
    res.render('qrcode4Invite.njk', {
      user: req.user,
      nodeEnv: process.env.NODE_ENV,
      user: req.user,
      numProducts: req.session.numProducts,
      amiciDaInvitare: req.session.haiAmiciDaInvitare
    })
  })

  app.get('/Vcard', lib.isAdmin, (req, res) => {
    console.debug('NODE_ENV =', process.env.NODE_ENV)
    res.render('Vcard.njk', {
      user: req.user,
      nodeEnv: process.env.NODE_ENV,
      numProducts: req.session.numProducts,
      amiciDaInvitare: req.session.haiAmiciDaInvitare
    })
  })
  // =================================================================================================
  // MESSAGGISTICA
  // =================================================================================================
  app.get('/infoMessage', (req, res) => {
    let msg = req.query.msg;
    let msgType = req.query.type;
    let err = req.body.err;
    console.error(lib.logDate("Europe/Rome") + ' [WARNING][RECOVERY:NO] "GET /infoMessage" USERS_ID: {"_id":ObjectId("' + req.user._id + '")} ERROR: ' + err + ' FLASH: ' + msg);
    req.flash('message', msg);
    res.render('info.njk', {
      message: req.flash('message'),
      type: msgType,      
      user: req.user,
      numProducts: req.session.numProducts,
      amiciDaInvitare: req.session.haiAmiciDaInvitare
    })
  });

  app.post('/infoMessage', (req, res) => {
    let msg = req.body.msg;
    let msgType = req.body.type;
    let err = req.body.err;
    console.error(lib.logDate("Europe/Rome") + ' [WARNING][RECOVERY:NO] "POST /infoMessage" USERS_ID: {"_id":ObjectId("' + req.user._id + '")} ERROR: ' + err + ' FLASH: ' + msg);
    req.flash('message', msg);
    res.render('info.njk', {
      message: req.flash('message'),
      type: msgType,
      user: req.user,
      numProducts: req.session.numProducts,
      amiciDaInvitare: req.session.haiAmiciDaInvitare
    })
  });

  app.post('/infoShare', (req, res) => {
    res.render('share.njk', {
      firstName: req.body.firstName,
      flag: req.body.flag,
      user: req.user,
      numProducts: req.session.numProducts,
      amiciDaInvitare: req.session.haiAmiciDaInvitare
    });
  });

  app.get('/videoPromo', (req, res) => {
    res.render('video.njk')
  });

  // =================================================================================================
  // UTILITY
  // =================================================================================================
  // visualizza in formato HTML la mail conferma
  app.get('/mailconferme', lib.isAdmin, function (req, res) {
    var server = lib.getServer(req);
    res.send(mailconferme('Name', 'Email', 'Token', 'userName', 'userSurname', server))
  })

  // visualizza in formato HTML la mail Friend
  app.get('/mailfriend', lib.isAdmin, function (req, res) {
    var server = lib.getServer(req);
    res.send(mailfriend('Name', 'Email', 'Token', 'userName', 'userSurname', server))

  })

  // visualizza in formato HTML la mail User
  app.get('/mailparent', lib.isAdmin, function (req, res) {
    var server = lib.getServer(req);
    res.send(mailparent('Name', 'Email', 'userName', 'userEmail', server))
  })

  // visualizza in formato HTML la mail User
  app.get('/mailfriendstatus', lib.isAdmin, function (req, res) {
    var server = lib.getServer(req);
    res.send(mailfriendstatus('Name', 'Email', 'userName', 'userEmail', server))
  })

  app.get('/mailinvite', lib.isAdmin, function (req, res) {
    const server = lib.getServer(req);
    const dataScadenzaInvito = new Date(Date.now() + giorniScadenzaInvito)
    res.send(mailinvite('Name', 'Email', 'Token', 'userName', server, dataScadenzaInvito.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })))
  })

  app.get('/mailorder', lib.isAdmin, function (req, res) {
    var server = lib.getServer(req);
    console.debug('SERVER MAILORDER', server)

    const html = mailorder(req.user.local.name.first, '56787f4cb61693f94f5c17d4', lib.deliveryDate('Europe/Rome', 'TXT', 'dddd DD MMMM', 'Consegna'), 'Ritiro', server)
    lib.sendmailToPerson(req.user.local.name.first, req.user.local.email, '', '', '', '', '', 'order', server, html)
    res.send(mailorder(req.user.local.name.first, '56787f4cb61693f94f5c17d4', lib.deliveryDate('Europe/Rome', 'TXT', 'dddd DD MMMM', 'Consegna'), 'Ritiro', server))
    return

  })


  // =================================================================================================
  // TESTING
  // =================================================================================================
  app.get('/test', lib.isAdmin, function (req, res) {
    req.session.elements = [];
    res.render('testRegistrationV2.njk', {
    });
  });

  app.get('/delta', lib.isAdmin, function (req, res) {
    // Esempio di utilizzo
    const groupA = [5, 5]; // 2 prodotti nel gruppo A
    const groupB = [20, 20, 20]; // 3 prodotti nel gruppo B
    const groupC = [30]; // 1 prodotto nel gruppo C
    const groupD = [50]; // 1 prodotto nel gruppo D

    const products = [...groupA, ...groupB, ...groupC, ...groupD];
    const T = 195;

    const result = lib.findClosestCombination(products, T);
    console.debug(`Somma più vicina a ${T}: ${result.closestSum}`);
    console.debug(`Combinazione: ${result.bestCombination}`);
    res.send("Somma più vicina a " + T + ":" + result.closestSum + " | Combinazione:" + result.bestCombination)
  });

  app.get('/prezzo', lib.isAdmin, function (req, res) {
    // Esempio di utilizzo
    const prezzi = [
      { "A": 4.5 },
      { "B": 4.7 },
      { "C": 5.0 }
    ];

    const quantita = [
      { "A": 4 },
      { "B": 2 },
      { "C": 3 },
      { "A": 2 }
    ];

    const risultato = lib.generaArrayPrezzi(prezzi, quantita);

    // Stampa i risultati
    let txt = ""
    for (const tipo in risultato) {
      console.debug(`Array ${tipo}:`, risultato[tipo]);
      txt = txt + `Array ${tipo}:[` + risultato[tipo] + "]"
    }
    res.send(txt);
  });

  app.get('/share', lib.isAdmin, function (req, res) {
    console.debug("FISRT NAME: ", req.body.firstName);
    res.render('share.njk', {
      firstName: req.body.firstName // encodeURIComponent("Ciao \n come stai")
    });
  });

  app.get('/testval', lib.isAdmin, function (req, res) {
    res.render('validation.njk');
  });

  app.get('/testbni', lib.isAdmin, function (req, res) {
    res.render('selfInvite.njk');
  });

  app.get('/testreg', lib.isAdmin, function (req, res) {
    res.render('registration.njk');
  });

  app.get('/qrq', lib.isAdmin, function (req, res) {
    res.render('square.njk', {
    });
  });

  app.get('/redirect', lib.isAdmin, function (req, res) {
    req.flash('info', 'SHOP');
    res.redirect('/shop');
  });
  app.get('/redirectType', lib.isAdmin, function (req, res) {
    req.flash('info', 'SHOP');
    res.redirect('/shop/warning');
  });

  app.get('/testflash', lib.isAdmin, function (req, res) {
    let msg = 'Email Verificata. Utente validato e autenticato';
    req.flash('info', msg);
    console.info(lib.logDate("Europe/Rome") + ' [INFO][RECOVERY:NO] "GET /validation" EMAIL:  FLASH: ' + msg);
    res.redirect('/shop');
  });

  app.get('/emailvalidation', lib.isAdmin, function (req, res) {
    res.render('emailValidation.njk', { email: 'indirizzo@email.mio' });
  });

}
