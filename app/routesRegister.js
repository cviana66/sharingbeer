// =============================================================================
// FRIENDS MANAGEMENT ==========================================================
// =============================================================================
//var transporter     = require('./mailerXOAuth2');
var transporter = require('../config/mailerMailgun');

var mailfriend = require('../config/mailFriend');
var mailparent = require('../config/mailParent');

// load up the user model
var User	 = require('../app/models/user');
var Friend = require('../app/models/friend');


module.exports = function(app) {

// TESTING
app.get('/test', function(req, res) {
        res.send(mailfriend('Roberta', 'rbtvna@gmail.com', '123XyZ', 'Carlo', 'Viana'));
    });


// POST VALIDATION
  app.post('/validation', function(req,res){
    req.body.email
    req.body.password
  });

// GET REGISTER ======================================================================  
  app.get('/register', isLoggedIn, function(req, res) {

    if (req.user.status == 'confirmed') {  
      res.render ('registration.dust', {
        firstName : req.user.name.first
      });
    
    } else if (req.user.status == 'customer' && req.session.numProducts > 0) {
      res.redirect('/paynow'); 
    
    } else {
      console.log('User: ', req.user);
      res.redirect('/shop');
    } 
  });

// POST REGISTER ======================================================================  
  app.post('/register', isLoggedIn, function(req, res) {
    User.findByIdAndUpdate(req.user._id, 
      { $set: { 
                name: {
                        first: capitalizeFirstLetter(req.body.firstName),
                        last: capitalizeFirstLetter(req.body.lastName),
                      },
                status: 'customer'
              }
      }, 
      function (err, req) {
        if (err) {
          console.log('error', err);
          res.redirect('/');
          return;
        }
    });

    req.user.status = "customer";
    res.redirect('/register');

  });

// GET FRIEND ======================================================================
	app.get('/recomm',isLoggedIn, function(req,res) {

    Friend.count({ emailParent:req.user.email }, function (err, friends) {
      if (err) return console.log('error',err);
      console.log('Friends: ', friends);
      
      User.findOne({ email: req.user.email }, function (err, user) {
        if (err) return console.log('error',err);
        friendsInvited = parseInt(friends,10);        
        
        req.session.invitationAvailable = parseInt(user.possibleFriends,10);
        req.session.friendsInvited = friendsInvited;
        var error = "";
        var controlSates = "";
        var flag = "false";


        if (req.session.friendsInvited - req.session.invitationAvailable == 0) {
          req.flash('error', "You have no more invitations! Please buy more beer");
          controlSates = "disabled";
          flag = "true";
        }

        res.render('friend.dust', {
          controlSates: controlSates, 
          flag : flag,
          message: req.flash('error'),
          user: req.user,
          invitationAvailable: req.session.invitationAvailable,
          friendsInvited:  req.session.friendsInvited,
          percentage: Math.round( req.session.friendsInvited * 100 / req.session.invitationAvailable ),
          numProducts : req.session.numProducts
        });
      }); 
    });
	});

// POST FRIEND =====================================================================
	app.post('/recomm',isLoggedIn, function(req, res) {

    console.log('/recomm FRIEND INVITED: ',req.session.friendsInvited )

    if (req.session.friendsInvited - req.session.invitationAvailable == 0) {
          req.flash('error',"You have no more invitations! Please buy more beer");
          res.render('friend.dust', { message: req.flash('error'),
                                        invitationAvailable: req.session.invitationAvailable,
                                        friendsInvited:  req.session.friendsInvited,
                                        percentage: Math.round( req.session.friendsInvited * 100 / req.session.invitationAvailable )
                                      });
    } else {   

  		var password = generatePassword(6);
      var newUser = new User();
      // set the user's local credentials
  		newUser.email       = req.body.email;
      newUser.password    = newUser.generateHash(password);
      newUser.name.first  = capitalizeFirstLetter(req.body.firstName);
      newUser.idParent    = req.user._id; //id parent
      newUser.status      = 'new'; // status

      //console.log('USER: ',newUser);
      //console.log('GLOBAL: ', global.cost)

      newUser.save(function(err) {
  			if (err) {
  				req.flash('error','Something bad happened! Please try again');
          console.log("ERROR: ",err);

  				if (err.code === 11000) { //duplicate key: email
  					req.flash('error','That email is already taken, please try another');
  				}

  				res.render('friend.dust', { message: req.flash('error'),
                                      invitationAvailable: req.session.invitationAvailable,
                                      friendsInvited:  req.session.friendsInvited,
                                      percentage: Math.round( req.session.friendsInvited * 100 / req.session.invitationAvailable )
                                    });
  			} else { 

          // Record new friends in mongodb
          var newFriend = new Friend();
          newFriend.id = req.user._id; // id parent
          newFriend.emailParent = req.user.email; // mail user
          newFriend.emailFriend = newUser.email; // mail friend
          newFriend.firstNameFriend  = newUser.name.first;

          newFriend.save(function(err) {
            if (err) {
              console.log("ERROR: ",err);
              req.flash('error','Something bad happened! Please try again');
  						
              //remove Friend from User
  						User.findOneAndRemove({ 'email' :  newUser.email }, function(err){
                if (err) { res.send(err); }
              });
              //render for message display
              res.render('friend.dust', { message: req.flash('error'),
                                          invitationAvailable: req.session.invitationAvailable,
                                          friendsInvited:  req.session.friendsInvited,
                                          percentage: Math.round( req.session.friendsInvited * 100 / req.session.invitationAvailable )
                                        });
            } else {
              // send email to Friend
              sendmailToPerson( newUser.name.first, 
                                newUser.email, 
                                password, 
                                req.user.name.first, 
                                req.user.name.last, 
                                req.user.email,
                                'friend');
              // send email to Parent
              sendmailToPerson( req.user.name.first, 
                                req.user.email,
                                '',
                                newUser.name.first,
                                '',
                                newUser.email,
                                'parent');
              // TODO
              // send mail to Parent
              // decrement number of freinds 
              // increment NeXO (New eXchange Open)

              req.session.friendsInvited += 1;
              req.flash('message','You have added a new Friend');
              res.render('friend.dust', { message: req.flash('message'),
                                          invitationAvailable: req.session.invitationAvailable,
                                          friendsInvited:  req.session.friendsInvited,
                                          percentage: Math.round( req.session.friendsInvited * 100 / req.session.invitationAvailable )
                                        });
            }
          })
  			}
  		})
    }  
	})
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

// send password to Friend via email
function sendmailToPerson(Name, Email, Password, userName, userSurname, userEmail, typeOfMail) {
  console.log('MAIL TYPE: ', typeOfMail)
  if (typeOfMail == 'friend') {
    var mailOptions = {
      from: 'info@sharingbeer.com', // sender address
      to: 'cviana66@gmail.com', // list of receivers
      subject: 'Hello ✔', // Subject line
      html: mailfriend(Name, Email, Password, userName, userSurname) 
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

function capitalizeFirstLetter(string) {
  if (typeof(string) != "undefined") {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  }
}
