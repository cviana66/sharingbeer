module.exports = function(app, paypal) {

  var Order         = require('../app/models/order');
  var Item          = require('../app/models/item');
  var PayInfo       = require('../app/models/payinfo');
  var User         = require('../app/models/user');


  var ipaddress = process.env.OPENSHIFT_NODEJS_IP;
  if (typeof ipaddress === "undefined") {
      address = "127.0.0.1:8080";
  } else {
      address = "sb-sharingbeer.rhcloud.com";
  }
  
  app.locals.baseurl = 'http://' + address;

// GET PAYNOW ============================================================================

app.get('/paynow', isLoggedIn, function(req, res) {
  
  var jsonsItems = new Array();
  var cart = req.session.cart; 
  req.session.order = {}; 
  
  // ORDER MANAGEMENT ---------------------------------------------------------------
  // idUser      : { type: String, required: true },
  // email       : { type: String, required: true },
  // dateInsert  : { type: Date, required: true },
  // status      : { type: String, required: true},
  // idPayment   : { type: String},
  // discount    : { type: Number},
  // totalPrice  : { type: Number}

  var newOrder = new Order();

  newOrder.idUser = req.user._id;
  newOrder.email  = req.user.email;
  newOrder.dateInsert = Date.now();
  newOrder.status = 'reserved';
  newOrder.discount = 0;
  newOrder.totalPrice = req.session.total;

  newOrder.save(function(err, order) {
    if (err) {
      var error = 'Something bad happened! Please try again.';
      console.log("error code: ",err.code);
    } else {
      //save in session Order ID used after for return success payment
      req.session.order.id = order.id;
      console.log('ORDER ID : ', req.session.order.id );

      // ITEM MANAGEMENT ------------------------------
      //ItemSchema = new Schema({
      //idOrder     : { type: String, required: true },
      //idPrdoduct  : { type: String, required: true },
      //nameProduct  : { type: String},
      //quantity  : { type: String},
      //price     : { type: Number}
    
      if (!cart) {
          //TODO manahement if not exisat cart ????
          console.log("Cart not exist");
      } else {
        //Insert Product in cart into Item
        for (var item in cart) {
          if (cart[item].qty > 0) {
            
            var newItem = new Item();
            var subtotal = parseInt(cart[item].price);
            
            newItem.idOrder = order.id
            newItem.idPrdoduct = cart[item].id;
            newItem.nameProduct = cart[item].name;
            newItem.quantity = cart[item].qty;
            newItem.price = subtotal.toFixed(2);

            newItem.save(function(err, items) {
              if (err) {
                var error = 'Something bad happened! Please try again.';
                console.log("error code: ",err.code);
                res.redirect("/error");
              }
            });
          }
        } 
      }
    }
  });
  
  if (!cart) {
    //TODO manahement if not exisat cart ????
    console.log("Cart not exist");
  } else {
    //Prepare JSON Items for transactions
    for (var item in cart) {

      if (cart[item].qty > 0) {
        var subtotal = parseInt(cart[item].price); 
        jsonsItems.push({
          name: cart[item].name,
          price: subtotal.toFixed(2),
          currency: "EUR",
          quantity: cart[item].qty
        });
      }
    }
  };
    
  // paypal payment configuration.
  var payment = {
    "intent": "sale",
    "payer": {
      "payment_method": "paypal"
    },
    "redirect_urls": {
      "return_url": app.locals.baseurl+"/success",
      "cancel_url": app.locals.baseurl+"/cancel"
    },

    "transactions": [{
        "item_list": {
            "items": jsonsItems
        },
        "amount": {
            "currency": "EUR",
            "total": req.session.total
        },
        "description": "This is the payment description."
    }]
  };

  paypal.payment.create(payment, function (error, payment) {
    if (error) {
      console.log(error);
    } else {
      if(payment.payer.payment_method === 'paypal') {
        req.session.paymentId = payment.id;
        var redirectUrl;
        console.log(payment);
        for(var i=0; i < payment.links.length; i++) {
          var link = payment.links[i];
          if (link.method === 'REDIRECT') {
            redirectUrl = link.href;
          }
        }
        res.redirect(redirectUrl);
      }
    }
  });
});

// GET SUCCESS ===========================================================================
app.get('/success',  function(req, res) {

  var paymentId = req.session.paymentId;
  var payerId = req.param('PayerID');
  var details = { "payer_id": payerId };

  req.session.cart  = {};
  //req.session.order = {};
  req.session.total = 0;
  req.session.numProducts = 0;

  
  paypal.payment.execute(paymentId, details, function (error, payment) {
    if (error) {
      console.log(error);
      // TODO MANAEMET
    } else {

      var payInfo = new PayInfo();

      payInfo.idPay   = paymentId;
      payInfo.idOrder = req.session.order.id;
      payInfo.state   = payment.state;
      payInfo.esponseMsg = JSON.stringify(payment);

      payInfo.save(function(err, payinfo) {
        if (err) {
          var error = 'Something bad happened! Please try again.';
          console.log("error code: ",err.code);
          res.redirect('/???')
        }
      }); 

      var status="";

      if (payment.state === 'approved')  { 
        status = 'payed';
      }else{
        status = 'tobeVerify';
      }
      
      console.log('PAYMET STATUS : ', payment.state);
      Order.findByIdAndUpdate(req.session.order.id, 
        { $set: { 
                  paypal: {
                          paymentId: paymentId,
                          payerId: payerId,                        
                        },
                  status: 'payed'
                }
        }, 
        function (err, req) {
          if (err) {
            console.log('error', err);
            res.redirect('/');
            return;
          }
      });

      User.findByIdAndUpdate(req.user._id, 
        { $set: { 
                  possibleFriends : req.user.possibleFriends + 3
                }
        }, 
        function (err, req) {
          if (err) {
            console.log('error', err);
            res.redirect('/???');
            return;
          }
      });

      if (status === 'payed')
         res.redirect('/recomm')
        //console.log("Get Payment Response");
        //console.log(JSON.stringify(payment));      

    };
  });
});

// GET CANCEL ===========================================================================
// Page will display when you canceled the transaction 
app.get('/cancel', function(req, res) {
  res.send("Payment canceled successfully.");
});

}

// MIDDLEWARE ==========================================================================
// route middleware to make sure a user is logged in 
function isLoggedIn(req, res, next) {

  // if user is authenticated in the session, carry on
  if (req.isAuthenticated())
    return next();

  // if they aren't redirect them to the home page
  res.redirect('/login');
};