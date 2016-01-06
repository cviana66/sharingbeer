// =============================================================================
// FRIENDS MANAGEMENT ==========================================================
// =============================================================================
//var transporter     = require('./mailerXOAuth2');
var transporter     = require('../config/mailerMailgun');

var mailrecom       = require('../config/mailRecom');

// load up the user model
var User						= require('../app/models/user');
var Friend					= require('../app/models/friend');

module.exports = function(app) {

// GET RECOMMENDED ======================================================================  
  app.post('/activate', function(req, res) {
    req.body.email;
    req.body.password;

  });

// GET RECOMMENDED ======================================================================  
  app.get('/register', isLoggedIn, function(req, res) {
    if (req.user.status == 'confirmed') {
      res.render ('registration.dust');
    } else if (req.user.status == 'customer') {
      res.redirect('/paynow');
    } else {
      console.log('User: ', req.user);
      res.redirect('/');
    } 
  });

// GET RECOMMENDED ======================================================================  
  app.post('/register', isLoggedIn, function(req, res) {
    User.findByIdAndUpdate(req.user._id, 
      { $set: { 
                name: {
                        first: capitalizeFirstLetter(req.body.firstName),
                        last: capitalizeFirstLetter(req.body.lastName)
                      }
              }
      }, 
      function (err, user) {
        if (err) return handleError(err);
        res.send(user);
    });
  });

// GET RECOMMENDED ======================================================================
	app.get('/recomm',isLoggedIn, function(req,res) {
		res.render('recommended.dust', {
      user: req.user,
      numProducts : req.session.numProducts
    });
	});

// POST RECOMMENDED =====================================================================
	app.post('/recomm',isLoggedIn, function(req, res) {

		var password = generatePassword(6);
    var newUser = new User();
    // set the user's local credentials
		newUser.email    = 	req.body.email;
    newUser.password = newUser.generateHash(password);
    newUser.name.first = capitalizeFirstLetter(req.body.firstName);
    newUser.status = 'new'; // status

    console.log(newUser);

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
        newFriend.emailParent = req.user.email; // mail user
        newFriend.emailFriend = newUser.email; // mail friend

        newFriend.save(function(err) {
          if (err) {
            var error = 'Something bad happened! Please try again.';
						//remove Friend from User
						User.findOne({ 'email' :  newUser.email }).remove(callback);
            //render for message display
						res.render('recommended.dust', {message: error});
          }
        });
        // send email to Friend
        sendmailToFriend(capitalizeFirstLetter(req.body.firstName), newUser.email, password, req.user.name.first, req.user.name.last, req.user.email);
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
function sendmailToFriend(friendName, friendEmail, friendPassword, userName, userSurname, userEmail) {
  var mailOptions = {
      from: 'info@sharingbeer.com', // sender address
      to: 'cviana66@gmail.com', // list of receivers
      subject: 'Hello ✔', // Subject line
      html: mailrecom(friendName, friendEmail, friendPassword, userName, userSurname)
  };

  console.log('friendMail: ' + friendEmail);
  console.log('friendPassword: ' + friendPassword);
  console.log('userEmail: ' + userEmail);

  transporter.sendMail(mailOptions, function(error, info){
      if(error){
        return console.log('ERROR: ', error);
      }else{
          console.log('Message sent!', info);
      };
  });
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}
