// =============================================================================
// FRIENDS MANAGEMENT ==========================================================
// =============================================================================

// load up the user model
var User	 = require('../app/models/user');
var Friend = require('../app/models/friend');

var lib = require('./libfunction');


module.exports = function(app) {

// TESTING
app.get('/test', function(req, res) {
        //res.send(mailfriend('Roberta', 'rbtvna@gmail.com', '123XyZ', 'Carlo', 'Viana'));
        res.render('validation.dust', { message: req.flash('validation') });
    });

// =====================================
// VALIDATION ==========================
// =====================================
//GET
  app.get('/validation', function(req,res){
    
    console.log('TOKEN VALIDATION GET: ', req.query.token);
  
    User.findOne({ resetPasswordToken: req.query.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {

      if (err) { return console.error('error',err); next(err) }
      
      console.log('USER VALIATION GET: ', user)
      // TODO i 2 render sotto + scrivere corretamente mail

      if (!user) {   
        req.flash('error', 'Invitation is invalid or has expired.');
        res.render('info.dust', {message: req.flash('error')});
      } else {
        res.render('validation.dust', { user: user});
      };
    });
  });
//POST  
  app.post('/validation', function(req,res){
    req.body.email
    req.body.password
  });

// =====================================
// REGISTER ============================
// =====================================
  app.get('/register', lib.isLoggedIn, function(req, res) {

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

//POST
  app.post('/register', lib.isLoggedIn, function(req, res) {
    User.findByIdAndUpdate(req.user._id, 
      { $set: { 
                name: {
                        first: lib.capitalizeFirstLetter(req.body.firstName),
                        last:  lib.capitalizeFirstLetter(req.body.lastName),
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

// =====================================
// FRIEND ==============================
// =====================================
//GET
	app.get('/recomm', lib.isLoggedIn, function(req,res) {

    Friend.count({ emailParent:req.user.email }, function (err, friends) {
      if (err) return console.log('error',err);
      
      console.log('GET RECOMM FRIENDS: ', friends);
      
      User.findOne({ email: req.user.email }, function (err, user) {
        if (err) return console.log('error',err);
        friendsInvited = parseInt(friends,10);        
        
        req.session.invitationAvailable = parseInt(user.possibleFriends,10);
        req.session.friendsInvited = friendsInvited;
        var error = "";
        var controlSates = "";
        var flag = "false";
        // Controllo che ci siano ancora inviti diposnibili
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
//POST
	app.post('/recomm', lib.isLoggedIn, function(req, res) {

    console.log('POST RECOMM FRIEND INVITED: ',req.session.friendsInvited )

    if (req.session.friendsInvited - req.session.invitationAvailable == 0) {
          req.flash('error',"You have no more invitations! Please buy more beer");
          res.render('friend.dust', { message: req.flash('error'),
                                        invitationAvailable: req.session.invitationAvailable,
                                        friendsInvited:  req.session.friendsInvited,
                                        percentage: Math.round( req.session.friendsInvited * 100 / req.session.invitationAvailable )
                                      });
    } else {   
      // creo nuovo user con i dati segnalati dal PARENT
  		var password = lib.generatePassword(6);
      var newUser = new User();
      // set the user's local credentials
  		newUser.email       = req.body.email;
      newUser.password    = newUser.generateHash(password);
      newUser.name.first  = lib.capitalizeFirstLetter(req.body.firstName);
      newUser.idParent    = req.user._id; //id parent
      newUser.status      = 'new'; // status
      newUser.resetPasswordToken = lib.generateToken(20); // token
      newUser.resetPasswordExpires = Date.now() + (3600000*24*365); // 1 hour * 24 * 365 = 1 anno

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
              lib.sendmailToPerson( newUser.name.first, 
                                newUser.email, 
                                '',
                                newUser.resetPasswordToken, 
                                req.user.name.first, 
                                req.user.name.last, 
                                req.user.email,
                                'friend');
              // send email to Parent
              lib.sendmailToPerson( req.user.name.first, 
                                req.user.email,
                                '',
                                '',
                                newUser.name.first,
                                '',
                                newUser.email,
                                'parent');
              
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
}