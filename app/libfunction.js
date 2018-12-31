//libfunction,js

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
// =====================================
// MAIL UTILITY ========================
// =====================================
  sendmailToPerson: function sendmailToPerson(Name, Email, Password, Token, userName, userSurname, userEmail, typeOfMail) {
                      console.log('MAIL TYPE: ', typeOfMail)
                      if (typeOfMail == 'friend') {
                        var mailOptions = {
                          from: 'info@sharingbeer.com', // sender address
                          to: 'cviana66@gmail.com', // list of receivers
                          subject: 'Hello ✔', // Subject line
                          html: mailfriend(Name, Email, Password, Token, userName, userSurname) 
                        }   
                      } else {

                        var mailOptions = {
                            from: 'info@sharingbeer.com', // sender address
                            to: 'cviana66@gmail.com', // list of receivers
                            subject: 'Thanks ✔', // Subject line
                            html: mailparent(Name, Email, userName, userEmail)
                        }
                      }
                      
                      //console.log(mailparent(Name, Email, userName, userEmail));
                      //console.log('friendMail: ' + friendEmail);
                      //console.log('friendPassword: ' + friendPassword);
                      //console.log('userEmail: ' + userEmail);

                      transporter.sendMail(mailOptions, function(error, info){
                          if(error){
                            return console.log('ERROR: ', error);
                          }else{
                              console.log('MESSAGE SENT: ', info);
                          };
                      });
                  }
}