// =============================================================================
// FRIENDS MANAGEMENT ==========================================================
// =============================================================================
//var transporter     = require('./mailerXOAuth2');
var transporter     = require('../config/mailerMailgun');

// load up the user model
var User						= require('../app/models/user');
var Friend					= require('../app/models/friend');

module.exports = function(app) {

// GET RECOMMENDED ======================================================================
	app.get('/recomm',isLoggedIn, function(req,res) {
		res.render('recommended.dust', {
      user: req.user,
      numProducts : req.session.numProducts
    });
	});

// POST RECOMMENDED =====================================================================
	app.post('/recomm', function(req, res) {

		var password = generatePassword(6);
    var newUser = new User();
    // set the user's local credentials
		newUser.local.email    = 	req.body.email;
    newUser.local.password = newUser.generateHash(password);

    newUser.save(function(err) {
			if (err) {
				var error = 'Something bad happened! Please try again.';
        console.log("error code: ",err.code);

				if (err.code === 11000) { //duplicate key: email
					error = 'That email is already taken, please try another.';
				}
				res.render('recommended.dust', {message: error});
			} else {
        // Record new friends in mongodb
        var newFriend = new Friend();
        newFriend.id = req.user._id; // id parent
        newFriend.emailParent = req.user.local.email; // mail parent
        newFriend.emailFriend = newUser.local.email; // mail friend
        newFriend.save(function(err) {
          if (err) {
            var error = 'Something bad happened! Please try again.';
						//remove Friend from User
						User.findOne({ 'local.email' :  newUser.local.email }).remove(callback);
            //render for message display
						res.render('recommended.dust', {message: error});
          }
        });
        // send email to Friend
        sendmailToFriend(password, req.user.local.email, newUser.local.email);
        // send mail to Parent
        // decrement number of freinds 
        // increment NeXO (New eXchange Open)
				res.redirect('/shop');
			}
		});
	});
};

// route middleware to make sure a user is logged in ===========================
function isLoggedIn(req, res, next) {

  // if user is authenticated in the session, carry on
  if (req.isAuthenticated())
    return next();

  // if they aren't redirect them to the home page
  res.redirect('/login');
};

// UTILITY =====================================================================

function generatePassword(n) {
  var length = n,
    charset = "abcdefghijklnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
    retVal = "";
  for (var i = 0, n = charset.length; i < length; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * n));
  }
  return retVal;
}

// send password to Frined via email
function sendmailToFriend(password, parentMail, friendMail) {
  var mailOptions = {
      from: 'info@sharingbeer.com', // sender address
      to: 'cviana66@gmail.com', // list of receivers
      subject: 'Hello ✔', // Subject line
      text: 'password: ' + password, // plaintext body
      html: '<b>password: ' + password + '</b>' // html body
  };

  console.log('password: ' + password);
  console.log('parentMail: ' + parentMail);
  console.log('friendMail: ' + friendMail);

  transporter.sendMail(mailOptions, function(error, info){
      if(error){
        return console.log('ERROR: ', error);
      }else{
          console.log('Message sent!', info);
      };
  });
}
