//libfunction.js

//email settings
const transporter = require('../config/mailer');
const mailfriend = require('../config/mailFriend');
const mailparent = require('../config/mailParent');
const mailinvite = require('../config/mailInvite');
const mailconferme = require('../config/mailConferme');
const mailvalidatemail = require('../config/mailValidateMail');
const moment = require("moment-timezone");

const Users = require('../app/models/user');

//=================================================
// Connect to our database
const mongoose = require('../config/database.js'); //TODO: per la PRO impostare parametro per connessione ambiente di produzione su fly.io
//=================================================

module.exports = {

  // route middleware to make sure a user is logged in ===========================
  isLoggedIn: async (req, res, next) => {
    if (req.isAuthenticated()) {
      // Controllo se ho amici da invitare per attivare nel menu il lampeggio del bottome +Invita
      const invitiDisponibili = await getFriendsInfo(req)
      console.debug('isLoggedIn -> AMICI DA INVITARE?:',invitiDisponibili.isInviteAvialable)
      if (invitiDisponibili.isInviteAvialable) {
        req.session.haiAmiciDaInvitare = true;
      } else {
        req.session.haiAmiciDaInvitare = false;
      }
      return next();
    } else {
      req.session.haiAmiciDaInvitare = false;
      console.debug('INDIRIZZO DA DOVE ARRIVO: ', req.originalUrl);
      req.session.returnTo = req.originalUrl;
      res.redirect('/login');
    }
  },
  isAdmin: (req, res, next) => {
    if (req.isAuthenticated() && req.user.local.role == 'admin') {
      return next();
    } else {
      res.render('info.njk', { messaggio: 'Accesso negato' })
    }
  },
  getInviteAvailable: (req) => {
    return getFriendsInfo(req)
  },
  generateToken: function generateToken(n) {
    var length = n,
    charset = "abcdefghijklnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
    retVal = "";
    for (var i = 0, n = charset.length; i < length; ++i) {
      retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
  },
  // route middleware to make sure a user is logged in
  generatePassword: (n) => {
    var length = n,
    charset = "abcdefghijklnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
    retVal = "";
    for (var i = 0, n = charset.length; i < length; ++i) {
      retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
  },
  capitalizeFirstLetter: function capitalizeFirstLetter(string) {
    if (typeof (string) != "undefined") {
      return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    }
  },
  getServer: (req) => {
    var server;
    if (process.env.NODE_ENV == "development") {
      if (req.hostname == "sb.sharingbeer.it") {
        server = req.protocol + '://' + req.hostname
      } else {
        server = req.protocol + '://' + req.hostname + ':' + process.env.PORT
      }
    } else {
      server = req.protocol + '://' + req.hostname;
    }
    return server;
  },
  sendmailToPerson: async (Name, Email, Password, Token, userName, userSurname, userEmail, typeOfMail, server, html) => {
    console.debug('MAIL TYPE: ', typeOfMail);
    console.debug("SERVER:", server);

    if (typeOfMail == 'friend') {
      var mailOptions = {
        from: '"Birrificio Viana by Sharingbeer" birrificioviana@gmail.com', // sender address
        to: Email,    //'cviana66@gmail.com', // list of receivers
        subject: userName + ' ' + userSurname + ' ti invita a bere birra Viana', // Subject line
        html: mailfriend(Name, Email, Token, userName, userSurname, server)
      }
    } else if (typeOfMail == 'parent') {
      var mailOptions = {
        from: '"Birrificio Viana by Sharingbeer" birrificioviana@gmail.com', // sender address
        to: Email, //'cviana66@gmail.com', // list of receivers
        subject: 'Grazie dal Birrificio Viana', // Subject line
        html: mailparent(Name, Email, userName, userEmail, server)
      }
    } else if (typeOfMail == 'invite') {
      var mailOptions = {
        from: '"Birrificio Viana by Sharingbeer" birrificioviana@gmail.com', // sender address
        to: Email, //'cviana66@gmail.com', // list of receivers
        subject: 'Invito - Birrificio Viana', // Subject line
        html: mailinvite(Name, Email, Token, userName, server)
      }
    } else if (typeOfMail == 'conferme') {
      var mailOptions = {
        from: '"Birrificio Viana by Sharingbeer" birrificioviana@gmail.com', // sender address
        to: Email, //'cviana66@gmail.com', // list of receivers
        subject: 'Conferma email - Birrificio Viana', // Subject line
        html: mailconferme(Name, Email, Token, userName, server)
      }
    } else if (typeOfMail == 'reset') {
      var mailOptions = {
        from: '"Birrificio Viana by Sharingbeer" birrificioviana@gmail.com', // sender address
        to: Email, //'cviana66@gmail.com', // list of receivers
        subject: 'Imposta nuova password - Birrificio Viana', // Subject line
        html: mailvalidatemail(Token, server)
      }
    } else if (typeOfMail == 'order') {
      var mailOptions = {
        from: '"Birrificio Viana by Sharingbeer" birrificioviana@gmail.com', // sender address
        to: Email, //'cviana66@gmail.com', // list of receivers
        subject: 'Conferma d\'ordine - Birrificio Viana', // Subject line
        html: html
      }
    } else if (typeOfMail == 'notificaClienteConOrdiniFatti') {
      var mailOptions = {
        from: '"Birrificio Viana by Sharingbeer" birrificioviana@gmail.com', // sender address
        to: Email, //'cviana66@gmail.com', // list of receivers
        subject: 'Avviso - Birrificio Viana', // Subject line
        html: html
      }
    } else if (typeOfMail == 'notificaClienteSenzaOrdiniFatti') {
      var mailOptions = {
        from: '"Birrificio Viana by Sharingbeer" birrificioviana@gmail.com', // sender address
        to: Email, //'cviana66@gmail.com', // list of receivers
        subject: 'Avviso - Birrificio Viana', // Subject line
        html: html
      }
    }
    // effettua l'invio della mail
    try {
      let info = await transporter.sendMail(mailOptions);
      console.log("MAIL INFO: ", info);
    } catch (e) {
      console.log("MAIL ERROR: ", e);
      throw new Error('SENDMAIL' + e);
    }
  },
  retriveCart: (req) => {
    //Retrieve the shopping cart from memory
    var cart = req.session.cart || null
    cartItems = { items: [], totalPrice: 0, totalQty: 0 },
    totalPrice = 0,
    totalQty = 0
    req.session.numProducts = 0;
    req.session.numProductsPerId = [];

    console.debug('CART IN LIB: ', cart)

    if (cart) { //se ho rpodotti in carrello
      for (var item in cart) {
        if (cart[item].qty > 0) {
          cartItems.items.push(cart[item]);
          totalPrice += (cart[item].qty * cart[item].price);
          totalQty += cart[item].qty;
          req.session.numProducts += cart[item].qty;
          let npXid = { "id": cart[item].id.toString(), "qty": cart[item].qty }
          req.session.numProductsPerId.push(npXid);  //serve poi per decrementare la quantità in magazzino
          console.debug('PRODOTTI NEL CARRELLO: ITEM =', item, ' PRODOTTO: ', cart[item])
        }
      }
      console.debug('NUMERO PRODOTTI PER ID: ', req.session.numProductsPerId.length, req.session.numProductsPerId)
      req.session.cartItems = cartItems;
      req.session.totalPrc = cartItems.totalPrice = totalPrice.toFixed(2);
      req.session.totalQty = cartItems.totalQty = totalQty;
      console.debug("TOTAL PRICE:", req.session.totalPrc, "TOTAL QTY BeeBox:", req.session.totalQty)
    }
    req.session.cart = cart
  },
  emailValidation: (email) => {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (email == "" || !re.test(String(email))) {
      return false;
    } else {
      return true;
    }
  },
  deliveryDate: (timeZone, dataType, format, deliveryType) => {
    moment.locale('it');
    var d = moment(data).utc(timeZone).format('dddd');
    var data = new Date();

    Date.prototype.addDays = function (days) {
      var date = new Date(this.valueOf());
      date.setDate(date.getDate() + days);
      return date;
    }

    if (deliveryType == 'Consegna') {
      var daysToAdd = 0
      if (d == "sabato") {
        daysToAdd = 4
      } else if (d == "domenica") {
        daysToAdd = 3
      } else if (d == "lunedì") {
        daysToAdd = 3
      } else if (d == "martedì") {
        daysToAdd = 3
      } else if (d == "mercoledì") {
        daysToAdd = 3
      } else if (d == "giovedì") {
        daysToAdd = 4
      } else if (d == "venerdì") {
        daysToAdd = 4
      }
    } else if (deliveryType == 'Ritiro') {
      if (d == "sabato") {
        daysToAdd = 10
      } else if (d == "domenica") {
        daysToAdd = 9
      } else if (d == "lunedì") {
        daysToAdd = 9
      } else if (d == "martedì") {
        daysToAdd = 9
      } else if (d == "mercoledì") {
        daysToAdd = 9
      } else if (d == "giovedì") {
        daysToAdd = 11
      } else if (d == "venerdì") {
        daysToAdd = 11
      }
    }

    var dataDelivery = data.addDays(daysToAdd)

    var a = moment.tz(dataDelivery, timeZone);
    a.utc(timeZone).format();
    var now = new Date(moment(a).format());
    //console.debug('DATA-ORA deliveryDate',timeZone,now);

    if (dataType == 'DATA') {
      giornoLavorativo = now
    } else if (dataType == 'TXT') {
      giornoLavorativo = moment(now).utc().format(format)
    }
    console.debug('DATA-ORA deliveryDate', dataType, giornoLavorativo)
    return giornoLavorativo
  },
  nowDate: (timeZone) => {
    var data = new Date();
    var a = moment.tz(data, timeZone);
    a.utc(timeZone).format();
    var now = new Date(moment(a).format());
    console.debug('DATA-ORA', timeZone, now);
    return now;
  },
  formatTextDate: (data, format) => {
    var d = moment(data).utc().format(format)
    console.debug('DATA-ORA formatTextDate', d)
    return d;
  },
  logDate: (timeZone) => {
    var data = new Date();
    var a = moment.tz(data, timeZone);
    a.utc(timeZone).format();
    var now = new Date(moment(a).format());
    var d = moment(now).utc().format('YYYY-MM-DD hh:mm');
    return d;
  },
  getServer: (req) => {
    if (process.env.NODE_ENV == "development") {
      if (req.hostname == 'sb.sharingbeer.it') {
        server = req.protocol + '://' + req.hostname
      } else {
        server = req.protocol + '://' + req.hostname + ':' + process.env.PORT
      }
    } else {
      server = req.protocol + '://' + req.hostname;
    }
    return server;
  },

  findClosestCombination: (products, T) => {
    let closestSum = 0;
    let bestCombination = [];

    function backtrack(start, currentCombination, currentSum) {
      // Se la somma corrente è inferiore a T e più vicina alla somma migliore trovata
      if (currentSum <= T && currentSum >= closestSum) {
        closestSum = currentSum;
        bestCombination = [...currentCombination];
      }

      // Esplora le combinazioni
      for (let i = start; i < products.length; i++) {
        currentCombination.push(products[i]);
        backtrack(i + 1, currentCombination, currentSum + products[i]);
        currentCombination.pop(); // Rimuovi l'ultimo prodotto per tornare indietro
      }
    }

    backtrack(0, [], 0);
    return { closestSum, bestCombination };
  },

  generaArrayPrezzi: (prezzi, quantita) => {
    /* esempio di utilizzo
     *	const prezzi = [{ "A": 4.5 },{ "B": 4.7 },{ "C": 5.0 }];
     *	const quantita = [{ "A": 4 },{ "B": 2 },{ "C": 3 },{ "A": 2 }];
     */
    const risultati = {};
    // sommo assieme le quantità dello stesso tipo
    const somma = quantita.reduce((acc, curr) => {
      for (const key in curr) {
        if (acc[key]) {
          acc[key] += curr[key];
        } else {
          acc[key] = curr[key];
        }
      }
      return acc;
    }, {});
    quantita = Object.keys(somma).map(key => ({ [key]: somma[key] }));

    // Itera ttrverso l'array dei prezzi
    prezzi.forEach(prezzo => {
      const tipo = Object.keys(prezzo)[0]; // Ottieni il tipo (A, B, C, ecc.)
      const valorePrezzo = prezzo[tipo]; // Ottieni il prezzo

      // Trova la quantità corrispondente
      const quantitaTipo = quantita.find(q => q[tipo] !== undefined);
      const valoreQuantita = quantitaTipo ? quantitaTipo[tipo] : 0; // Ottieni la quantità

      // Inizializza l'array per il tipo se non esiste già
      if (!risultati[tipo]) {
        risultati[tipo] = [];
      }

      // Aggiungi il prezzo ripetuto per la quantità all'array corrispondente
      for (let i = 0; i < valoreQuantita; i++) {
        risultati[tipo].push(valorePrezzo);
      }
    });

    return risultati;
  }
}
//========================================= LOCAL FUNCTION ========================================

// Funzione per trovare gli gli amici nel documento friends dell'utente clasterizzati per status
async function getFriendsInfo(req) {
  //conteggio dei friends dello user raggruppato per staus
  const users = await Users.aggregate([
    { $match: { '_id': req.user._id } },
    { $unwind: "$friends" },
    {
      $group: {
        _id: "$_id",
        accepted: { $sum: { $cond: [{ $eq: ["$friends.status", "accepted"] }, 1, 0] } },
        new: { $sum: { $cond: [{ $eq: ["$friends.status", "new"] }, 1, 0] } },
        expired: { $sum: { $cond: [{ $eq: ["$friends.status", "expired"] }, 1, 0] } }
      }
    }
  ]);
  console.debug('getFriendsInfo -> ELIGIBLEFRIENDS',req.user.local.eligibleFriends )
  if (users.length > 0) {
    users[0].numInviteAvialable = req.user.local.eligibleFriends - users[0].new - users[0].accepted
    users[0].numFriendsInvited = users[0].new + users[0].accepted
    users[0].isInviteAvialable = (users[0].numInviteAvialable == 0) ? false : true;
    console.debug('getFriendsInfo -> SITUAZIONE INVITI:',users[0])
    return users[0];
  } else {
    numInviteAvialable = (req.user.friends.length == 0) ? req.user.local.eligibleFriends : 0
    isInviteAvialable = (req.user.friends.length == 0 && req.user.local.eligibleFriends > 0) ? true : false
    let users = []
    users[0] = {  numInviteAvialable : numInviteAvialable,
                  numFriendsInvited : req.user.friends.length,
                  isInviteAvialable : isInviteAvialable }

    console.debug('getFriendsInfo -> SITUAZIONE INVITI:',users)
    return users[0];
  }
}