//libfunction.js

//email settings
var transporter = require('../config/mailerMailgun');
var mailfriend  = require('../config/mailFriend');
var mailparent  = require('../config/mailParent');

module.exports = {

  // route middleware to make sure a user is logged in ===========================
  isLoggedIn: function isLoggedIn(req, res, next) {

                  // if user is authenticated in the session, carry on
                  if (req.isAuthenticated())
                      return next();

                  // if they aren't redirect them to the home page
                  res.redirect('/login');
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
  sendmailToPerson: function sendmailToPerson(Name, Email, Password, Token, userName, userSurname, userEmail, typeOfMail) {

                      console.log('MAIL TYPE: ', typeOfMail);
                      console.log("SERVER:", global.server);
        
                      if (typeOfMail == 'friend') {
                        var mailOptions = {
                          from: 'birrificio.viana@sharingbeer.com', // sender address
                          to: 'cviana66@gmail.com', // list of receivers
                          subject: userName + ' ' + userSurname + ' ti invita a bere birra Viana', // Subject line
                          html: mailfriend(Name, Email, Token, userName, userSurname, global.server) 
                        }   
                      } else {

                        var mailOptions = {
                            from: 'birrificio.viana@sharingbeer.com', // sender address
                            to: 'cviana66@gmail.com', // list of receivers
                            subject: 'Grazie dal Birrificio Viana', // Subject line
                            html: mailparent(Name, Email, userName, userEmail, global.server)
                        }
                      }
                      
                      //console.log(mailparent(Name, Email, userName, userEmail));
                      //console.log('friendMail: ' + friendEmail);
                      //console.log('friendPassword: ' + friendPassword);
                      //console.log('userEmail: ' + userEmail);

                      transporter.sendMail(mailOptions, function(err, info){
                          if(err){
                            return console.log('ERROR: ', err);
                          }else{
                            console.log('MESSAGE SENT: ', info);
                          };
                      });
                  },
  retriveCart:  function retriveCart (req) {
                  //Retrieve the shopping cart from memory
                  var cart = req.session.cart,
                  displayCart = {items: [], totalPrice: 0},
                  totalPrice = 0,
                  totalQty = 0

                  if (!cart) {
                    req.session.numProducts = 0;
                  } else {
                    //Read the products for display
                    for (var item in cart) {
                      if (cart[item].qty > 0) {
                        displayCart.items.push(cart[item]);
                        totalPrice += (cart[item].qty * cart[item].price);
                        totalQty += cart[item].qty;
                      }
                    }
                    req.session.displayCart = displayCart;
                    req.session.totalPrc = displayCart.totalPrice = totalPrice.toFixed(2);
                    req.session.totalQty = totalQty;
                    req.session.numProducts = Object.keys(cart).length; 
                  }
                }
}