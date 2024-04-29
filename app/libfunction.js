//libfunction.js

//email settings
const transporter = require('../config/mailer');
const mailfriend  = require('../config/mailFriend');
const mailparent  = require('../config/mailParent');
const mailinvite  = require('../config/mailInvite');
const mailconferme  = require('../config/mailConferme');
const mailvalidatemail  = require('../config/mailValidateMail');
const moment        = require("moment-timezone"); 

const User  = require('../app/models/user');

module.exports = {

  // route middleware to make sure a user is logged in ===========================
  isLoggedIn: function isLoggedIn(req, res, next) {

                  // if user is authenticated in the session, carry on
                  if (req.isAuthenticated())  {                    

                      return next();
                  }
                  // if they aren't redirect them to the Login page
                  res.redirect('/login');
              },
  isAdmin: function isLoggedIn(req, res, next) {

                  // if user is authenticated in the session, carry on
                  if (req.isAuthenticated() && req.user.local.status == 'admin')  {                    

                      return next();
                  }
                  // if they aren't redirect them to the home page
                  res.redirect('/');
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
  generatePassword: function generatePassword(n) {
                      var length = n,
                          charset = "abcdefghijklnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
                          retVal = "";
                      for (var i = 0, n = charset.length; i < length; ++i) {
                        retVal += charset.charAt(Math.floor(Math.random() * n));
                      }
                      return retVal;
                    },
  capitalizeFirstLetter: function capitalizeFirstLetter(string) {
                          if (typeof(string) != "undefined") {
                            return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
                          }
                         },
  sendmailToPerson: async function sendmailToPerson(Name, Email, Password, Token, userName, userSurname, userEmail, typeOfMail, server, html) {

                      console.log('MAIL TYPE: ', typeOfMail);
                      console.log("SERVER:", server);

                      if (typeOfMail == 'friend') {
                        var mailOptions = {
                          from: '"Birrificio Viana by Sharingbeer" birrificioviana@gmail.com', // sender address
                          to: Email,    //'cviana66@gmail.com', // list of receivers
                          subject: userName + ' ' + userSurname + ' ti invita a bere birra Viana', // Subject line
                          html: mailfriend(Name, Email, Token, userName, userSurname, server)
                        }
                      } else if  (typeOfMail == 'parent') {
                        var mailOptions = {
                            from: '"Birrificio Viana by Sharingbeer" birrificioviana@gmail.com', // sender address
                            to: Email, //'cviana66@gmail.com', // list of receivers
                            subject: 'Grazie dal Birrificio Viana', // Subject line
                            html: mailparent(Name, Email, userName, userEmail, server)
                        }
                      } else if  (typeOfMail == 'invite') {
                        var mailOptions = {
                            from: '"Birrificio Viana by Sharingbeer" birrificioviana@gmail.com', // sender address
                            to: Email, //'cviana66@gmail.com', // list of receivers
                            subject: 'Grazie dal Birrificio Viana', // Subject line
                            html: mailinvite(Name, Email, Token, userName, server)
                        }
                      } else if  (typeOfMail == 'conferme') {
                        var mailOptions = {
                            from: '"Birrificio Viana by Sharingbeer" birrificioviana@gmail.com', // sender address
                            to: Email, //'cviana66@gmail.com', // list of receivers
                            subject: 'Conferma email - Birrificio Viana', // Subject line
                            html: mailconferme(Name, Email, Token, userName, server)
                        }
                      } else if  (typeOfMail == 'reset') {
                        var mailOptions = {
                            from: '"Birrificio Viana by Sharingbeer" birrificioviana@gmail.com', // sender address
                            to: Email, //'cviana66@gmail.com', // list of receivers
                            subject: 'Imposta nuova password - Birrificio Viana', // Subject line
                            html: mailvalidatemail(Token, server)
                        } 
                      } else if  (typeOfMail == 'order') {
                        var mailOptions = {
                            from: '"Birrificio Viana by Sharingbeer" birrificioviana@gmail.com', // sender address
                            to: Email, //'cviana66@gmail.com', // list of receivers
                            subject: 'Conferma ordine - Birrificio Viana', // Subject line
                            html: html
                        }   
                      }
                      // effettua l'invio della mail
                      try {
                        let info = await transporter.sendMail(mailOptions);
                        console.log("MAIL INFO: ", info);
                      } catch (e) {
                        console.log("MAIL ERROR: ", e);
                        throw new Error(e);
                      }
                  },
  retriveCart:  function retriveCart (req) {
                  //Retrieve the shopping cart from memory
                  var cart = req.session.cart,
                      cartItems = {items: [], totalPrice: 0, totalQty: 0},
                      totalPrice = 0,
                      totalQty = 0
                  req.session.numProducts = 0;

                  if (!cart) {
                    req.session.numProducts = 0;
                  } else {
                    for (var item in cart) {
                      if (cart[item].qty > 0) {
                        cartItems.items.push(cart[item]);
                        totalPrice += (cart[item].qty * cart[item].price);
                        totalQty += cart[item].qty;
                        req.session.numProducts += cart[item].qty;
                      }
                    }
                    req.session.cartItems = cartItems;
                    req.session.totalPrc = cartItems.totalPrice = totalPrice.toFixed(2);
                    req.session.totalQty = cartItems.totalQty = totalQty;
                  }
                },
  emailValidation:  function emailValidation (email) {
                      var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                      if(email =="" || !re.test(String(email))) {
                        return false;
                      } else {
                        return true;
                      }
                    },
  deliveryDate: function deliveryDate() {
                    moment().tz("Europe/Rome").format();
                    moment.locale('it');
                    var giornoLavorativo
                    console.debug('OGGI: ', moment().add(3,'d').format('dddd'))
                    if (moment().add(3,'d').format('ddddd') == "sabato") {
                      giornoLavorativo = moment().add(5,'d').format('dddd DD MMMM')
                    } else if (moment().add(3,'d').format('dddd') == "domenica") {
                      giornoLavorativo = moment().add(4,'d').format('dddd DD MMMM')
                    } else {
                      giornoLavorativo = moment().add(3,'d').format('dddd DD MMMM')
                    }
                    return giornoLavorativo  
                }
}


