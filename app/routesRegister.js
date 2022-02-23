// =============================================================================
// FRIENDS MANAGEMENT ==========================================================
// =============================================================================

// load up the user model
var User	      = require('../app/models/user');
var Friend      = require('../app/models/friend');
var CityCap     = require('../app/models/cityCap');
var MultipleCap = require('../app/models/multipleCap');
var Address     = require('../app/models/address')
var bcrypt      = require('bcrypt-nodejs'); //TODO da spostare in libfunction
var lib         = require('./libfunction');

var mailfriend  = require('../config/mailFriend');
var mailparent  = require('../config/mailParent');

const moment        = require("moment");


module.exports = function(app) {

// TESTING
app.get('/test', function(req, res) {
  res.render ('test.dust')
});
//===================================================

// =====================================
// API =================================
// =====================================

app.post('/cities', function(req, res) {
  //res.send(mailfriend('Roberta', 'rbtvna@gmail.com', '123XyZ', 'Carlo', 'Viana'));
  //res.render('validation.dust', { message: req.flash('validation') }); 
  console.log("city : ", req.body.city);
  CityCap.find({'Comune': new RegExp('^'+req.body.city, "i")}, function(err, city) { 
  
    console.log("Got city : ", city);
  
    res.send(city)
  })
});

app.post('/caps', function(req, res) {
  //res.send(mailfriend('Roberta', 'rbtvna@gmail.com', '123XyZ', 'Carlo', 'Viana'));
  //res.render('validation.dust', { message: req.flash('validation') }); 
  console.log("city : ", req.body.city);
  MultipleCap.find({'Comune': req.body.city}).sort('CAP').exec(function(err, caps) { 
    if (caps.length == 0) {
      CityCap.find({'Comune': req.body.city}, function(err,cap) {
        console.log('CAP: ', cap);
        res.send(cap)
      })
    } else {
      console.log('CAPS: ', caps);
      res.send(caps)
    }
  });
});

// =====================================
// TOKEN VALIDATION ========= 05-01-2022
// =====================================
//GET
  app.get('/validation', function(req,res){

    console.info(moment().format()+' [INFO][RECOVERY:NO] "GET /validation" TOKEN: {"resetPasswordToken":"'+req.query.token+'"}');
  
    User.findOne({ resetPasswordToken: req.query.token, resetPasswordExpires: { $gt: Date.now() }}, function(err, user) {

      if (err) {
        req.flash('error','Token is invalid or has expired');
        console.error(moment().format()+' [ERROR][RECOVERY:NO] "GET /validation" TOKEN: {"resetPasswordToken":"'+req.query.token+'"} FUNCTION: User.findOne: '+err+' FLASH: '+req.flash('error'));
        return res.render('info.njk', {message: req.flash('error'), type: "danger"}); 
        
      }
      
      if (!user) {   
        let msg = 'Invitation is invalid or has expired';
        req.flash('info', msg);
        console.info(moment().format()+' [INFO][RECOVERY:NO] "GET /validation" TOKEN: {"resetPasswordToken":"'+req.query.token+'"} FUNCTION: User.findOne: '+err+' FLASH: '+msg);
        res.render('info.njk', {message: req.flash('error'), type: "danger"});
      } else {
        res.render('validation.njk', { prospect: user,  message: req.flash('validateMessage'), type: "info" });
      };
    });
  });
//POST
  app.post('/validation', function(req,res){ 

    User.findOne({resetPasswordToken:req.body.token, resetPasswordExpires: { $gt: Date.now() }}, function (err, user) {
      
      if (err) {
        req.flash('error','Token is invalid or has expired');
        console.error(moment().format()+' [ERROR][RECOVERY:NO] "GET /validation" TOKEN: {"resetPasswordToken":"'+req.body.token+'"} FUNCTION: User.findOne: '+err+' FLASH: '+req.flash('error'));
        console.log('POST VALIDATION ERROR: ', err );
        return res.render('info.njk', {message: req.flash('error'), type: "danger"});
      
      } else {

        // TODO Validare i dati inseriti lato SERVER perchè potrebbero essere stati disabilitati i Javascript lato CLIENT 
        
        //email validation
        if (!lib.emailValidation(req.body.email)) {
          req.flash('validateMessage','Please provide a valid email')
          console.info(moment().format()+' [WARNING][RECOVERY:NO] "POST /validation" EMAIL: {"resetPasswordToken":"'+req.body.email+'"} FLASH: '+req.flash('error'));
          return res.redirect("/validation?token="+req.body.token);
        } //end validation

        var common = new User();
        user.password = common.generateHash(req.body.password);
        user.name.first = lib.capitalizeFirstLetter(req.body.firstName);
        
        if (user.email !=  req.body.email) {
          user.email = req.body.email;
        }
        user.status = 'validated';
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        user.booze += global.oneBottleBoozeEquivalent;

        user.save(function(err) {

          if(err) { 
            req.flash('error', 'Something bad happened! Validation faild');
            console.error(moment().format()+' [ERROR][RECOVERY:YES] "POST /validation" EMAIL: {"email":"'+req.body.email+'"} FUNCTION: User.save: '+err+' FLASH: '+req.flash('error'));
            return res.render('info.njk', {message: req.flash('error'), type: "danger"});
          } else {
            req.logIn(user, function(err) {
              if(err) {
                req.flash('error','Something bad happened! Login faild');
                console.info(moment().format()+' [WARNING][RECOVERY:NO] "POST /validation" EMAIL: {"resetPasswordToken":"'+req.body.email+'"} FLASH: '+req.flash('error'));
                res.render('info.njk', {message: req.flash('error'), type: "danger"})
              } else {
                console.log('POST VALIDATION SET: ', user )
                req.flash('success', 'Validated and Logged'); 
                console.info(moment().format()+' [INFO][RECOVERY:NO] "POST /validation" EMAIL: {"resetPasswordToken":"'+req.body.email+'"} FLASH: '+req.flash('success'));
                res.render('profile.njk',{message: req.flash('success'),user: user, type: "success"})   
               } 
            });
          }
        });
      } 
    })
  });

// =====================================
// PAYMENT =============================
// =====================================
//GET  
  app.get('/register', lib.isLoggedIn, function(req, res) {

    if (req.user.status == 'validated') { 

      res.render ('registration.njk', {
        firstName : req.user.name.first,
        lastName  : req.user.name.last,
        user : req.user, // get the user out of session and pass to template
      });

    } else if (req.user.status == 'customer' && req.session.numProducts > 0) {
      res.redirect('/paynow'); 
    
    } else {
      console.log('User: ', req.user);
      res.redirect('/shop');
    } 
  });
//POST   
  app.post('/register', lib.isLoggedIn, function(req, res, next) {

    User.findByIdAndUpdate(req.user._id, 
      { $set: { 
                mobilePrefix  : '+39',
                mobileNumber  : lib.capitalizeFirstLetter(req.body.mobile),
                status        : 'customer' // to change in 'customer' after session  of testing
              }
      }, 
      function (err, req) {
        if (err) {
          console.log('error', err);
          req.flash('error', 'The application has encountered an unknown error.It doesn\'t appear to have affected your data, but our technical staff have been automatically notified and will be looking into this with the utmost urgency.');
          res.render('info.njk', {message: req.flash('error'), type: "danger"});
          return;
        }
      }
    );

    var adrs = new Address();
    adrs.id = req.user._id
    adrs.address.address = req.body.address;
    adrs.address.number = req.body.number;
    adrs.address.town = req.body.city;
    adrs.cap = req.body.cap;

    adrs.save(function(err) {
      if (err) {
        console.log("ERROR: ",err);
        req.flash('error','Something bad happened! Please try again');
      } else {
        req.user.status = 'customer' 
        if (req.user.status == 'customer' && req.session.numProducts > 0)
          res.redirect('/paynow');
      }
    });
  });

// =====================================
// FRIEND =================== 24-12-2021 
//                            05-02-2022
//                            12-02-2022 introddotto il logger
// =====================================
//GET
	app.get('/recomm', lib.isLoggedIn, function(req,res) {

    console.info(moment().format()+' [INFO][RECOVERY:NO] "GET /recomm" USERS_ID: {"_id":ObjectId("'+req.user._id+'")}');
          
    // conto quanti amici ha già lo User
    Friend.countDocuments({ emailParent:req.user.email }, function (err, friends) {
      if (err) {
        console.error(moment().format()+' [ERROR][RECOVERY:NO] "GET /recomm" USERS_ID: {"_id":ObjectId("'+req.user._id+'")} FUNCTION: Friend.countDocuments: '+err);
        req.flash('error', 'Something bad happened!');
        return res.render('info.njk', {message: req.flash('error'), type: "danger"});
      } 
      
      //console.log('GET RECOMM FRIENDS: ', friends);
      
      User.findOne({ email: req.user.email }, function (err, user) {
        
        if (err) {
          console.error(moment().format()+' [ERROR][RECOVERY:NO] "GET /recomm" USERS_ID: {"_id":ObjectId("'+req.user._id+'")} FUNCTION: User.findOne: '+err);
          req.flash('error', 'Something bad happened!');
          return res.render('info.njk', {message: req.flash('error'), type: "danger"});
        } 
        
        req.session.invitationAvailable = parseInt(user.possibleFriends,10);  //numero di inviti disponibili
        req.session.friendsInvited = parseInt(friends,10);                    //numero di amici già invitati 
        
        let error = "";
        let controlSates = "";
        let flag = "false";
        
        // Controllo che ci siano ancora inviti diposnibili
        if (req.session.friendsInvited >= req.session.invitationAvailable) {
          req.flash('info', "You have no more invitations! Please buy more beer");
          controlSates = "disabled";
          flag = "true";
        }

        res.render('friend.njk', {
                        controlSates: controlSates, 
                        flag : flag,
                        message: req.flash('info'),
                        type: "warning",
                        user: req.user,
                        invitationAvailable: req.session.invitationAvailable-req.session.friendsInvited,
                        friendsInvited:  req.session.friendsInvited,
                        percentage: Math.round( req.session.friendsInvited * 100 / req.session.invitationAvailable )
                        //numProducts : req.session.numProducts
        });
      });
    });
	});
//POST
	app.post('/recomm', lib.isLoggedIn, function(req, res) {

    if (req.session.friendsInvited >= req.session.invitationAvailable) {
          req.flash('error',"You have no more invitations! Please buy more beer");
          res.render('friend.njk', {  message: req.flash('error'),
                                      type: "warning",
                                      invitationAvailable: req.session.invitationAvailable-req.session.friendsInvited,
                                      friendsInvited:  req.session.friendsInvited,
                                      percentage: Math.round( req.session.friendsInvited * 100 / req.session.invitationAvailable )
                                      });
    } else {   
      // creo nuovo user con i dati segnalati dal PARENT
  		var password = lib.generatePassword(6);
      var newUser = new User();
      // set the user's local credentials
  		newUser.email       = req.body.email;
      newUser.inviteEmail = req.body.email;
      newUser.password    = newUser.generateHash(password);
      newUser.name.first  = lib.capitalizeFirstLetter(req.body.firstName);
      newUser.idParent    = req.user._id; //id parent
      newUser.status      = 'new'; // status
      newUser.resetPasswordToken = lib.generateToken(20); // token
      newUser.resetPasswordExpires = Date.now() + (3600000*24*365); // 1 hour * 24 * 365 = 1 anno

      newUser.save(function(err) {
  			if (err) {
  				req.flash('error','Something bad happened! Please try again');
          console.error(moment().format()+' [ERROR][RECOVERY:NO] "POST /recomm" USERS_ID: {"_id":ObjectId("'+req.user._id+'")} FUNCTION: newUser.save: '+err);

  				if (err.code === 11000) { //duplicate key: email
  					req.flash('error','That email is already taken, please try another');
  				}

  				res.render('friend.njk', {  message: req.flash('error'),
                                      type: "warning",
                                      invitationAvailable: req.session.invitationAvailable-req.session.friendsInvited,
                                      friendsInvited:  req.session.friendsInvited,
                                      percentage: Math.round( req.session.friendsInvited * 100 / req.session.invitationAvailable )
                                    });
  			} else { 

          // Save a new friends in mongodb
          var newFriend = new Friend();
          newFriend.id = req.user._id; // id parent
          newFriend.emailParent = req.user.email; // mail user
          newFriend.emailFriend = newUser.email; // mail friend
          newFriend.firstNameFriend  = newUser.name.first;

          newFriend.save(function(err) {
            if (err) {
              console.error(moment().format()+' [ERROR][RECOVERY:YES] "POST /recomm" USERS_ID: {"_id":ObjectId("'+req.user._id+'")} FUNCTION: newFriend.save: '+err+' TODO: Cancellare in users {"_id":ObjectId("'+newUser.email+'")} se non fatto automaticamente');
              req.flash('error','Something bad happened! Please try later');
              //remove Friend from User
  						User.findOneAndRemove({ 'email' :  newUser.email }, function(err){
                if (err) { 
                  console.error(moment().format()+' [ERROR][RECOVERY:YES] "POST /recomm" USERS_ID: {"_id":ObjectId("'+req.user._id+'")} FUNCTION: newFriend.save: '+err+' TODO: Cancellare in users {"_id":ObjectId("'+newUser.email+'")}')
                  req.flash('error', 'Something bad happened! Please try later');
                }
              });
              //render for message display
              res.render('friend.njk', {  message: req.flash('error'),
                                          type: "error",
                                          invitationAvailable: req.session.invitationAvailable-req.session.friendsInvited,
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
              res.render('friend.njk', {  message: req.flash('message'),
                                          type: "info",
                                          invitationAvailable: req.session.invitationAvailable-req.session.friendsInvited,
                                          friendsInvited:  req.session.friendsInvited,
                                          percentage: Math.round( req.session.friendsInvited * 100 / req.session.invitationAvailable )
                                        });
            }
          })
  			}
  		});
    }  
	})

// =====================================
// Utility =============================
// =====================================
  // visualizza in formato HTML la mail Friend
  app.get('/mailfriend', function(req, res) {

    console.log("SERVER:", global.server);
    res.send(mailfriend('Name', 'Email', 'Token', 'userName', 'userSurname', global.server))

  })
  // visualizza in formato HTML la mail User
  app.get('/mailuser', function(req, res) {

    res.send(mailparent('Name', 'Email', 'userName', 'userEmail', global.server))

  })
}