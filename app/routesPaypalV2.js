module.exports = function(app) {

  const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');
  const payPalClient      = require('../config/paypal/common/payPalClient');

  const lib               = require('./libfunction');

  const Order   = require('../app/models/order');
  const Item    = require('../app/models/item');
  const User    = require('../app/models/user');

  const port = process.env.port;
  if (port === 8080) {
      address = "htpp://127.0.0.1:8080";
  } else {
      address = "https://sharingbeer.herokuapp.com";
  }
  
  app.locals.baseurl = address;

// =====================================
// PAYPAL ==============================
// =====================================
 
// =====================================
// Set up a Transaction
// =====================================

app.post('/create-paypal-transaction', lib.isLoggedIn, async function(req, res) {

  var jsonsItems = new Array();
  var cart = req.session.cart; 
  req.session.order = {}; 

  if (!cart) {
      //TODO manage if not exist cart ????
      console.log("Cart not exist");
    } else {
  
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
      newOrder.totalPrice = req.session.totalPrc;

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
          } //for  
        }
      });
      // 3. Call PayPal to set up an authorization transaction
      console.log('INI Call PayPal to set up an authorization transaction');
      const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
      request.prefer("return=representation");
      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'EUR',
            value: req.session.totalPrc
            }
          //items: jsonsItems
        }]
      });

      let order;

      try {
        order = await payPalClient.client().execute(request);
      } catch (err) {
        // 4. Handle any errors from the call
        console.error(err);
        return res.send(500);
      }
      // 5. Return a successful response to the client with the order ID
      console.log('Return a successful response to the client with the Paypal order ID->',order.result.id);
      res.status(200).json({orderID: order.result.id});
    }
  });

//=============================
// Create an Authorization
//=============================
// 2. Set up your server to receive a call from the client
app.post('/authorize-paypal-transaction', lib.isLoggedIn, async function(req, res) {

  // 2a. Get the order ID from the request body
  const orderID = req.body.orderID;
  console.log('OrdersCapture.orderID->',orderID);

  // 3. Call PayPal to capture the order
  const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderID);
  request.requestBody({});

  let capture;

  try {
    capture = await payPalClient.client().execute(request);

    // 4. Save the capture ID to your database. Implement logic to save capture to your database for future reference.
    const captureID = capture.result.purchase_units[0].payments.captures[0].id;
    console.log('captureID ->',capture.result.purchase_units[0].payments.captures[0].id);

      const paymentId = capture.id;
      const payerId   = capture.payer.payer_id;
      const orderId   = req.session.order.id;
      const payStatus = capture.status; 
      //const details = { "payer_id": payerId };

      req.session.cart  = {};
      req.session.order = {};
      req.session.totalPrc = 0;
      req.session.numProducts = 0;


      var payInfo = new PayInfo();

      payInfo.idPay   = paymentId;
      payInfo.idOrder = orderId
      payInfo.state   = payStatus;
      payInfo.responseMsg = JSON.stringify(payment);

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

      
      console.log('PAYMENT : ',  payment.transactions[0].amount);

      Order.findByIdAndUpdate(orderId, 
        { $set: { 
                  paypal: {
                          paymentId : paymentId,
                          payerId   : payerId, 
                          intent    : payment.intent,
                          method    : payment.payer.payment_method,  
                          state     : payment.state,
                          createTime: String(payment.create_time),
                          updateTime: String(payment.update_time),
                          totalAmount   : String(payment.transactions[0].amount.total),
                          currencyAmount: payment.transactions[0].amount.currency
                        },
                  status: status
                }
        }, 
        function (err, req) {
          if (err) {
            console.log('error', err);
            res.redirect('/???');
            return;
          }
      });

      if (status === 'payed') {
        // add Friends after buy
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

        //add Booze to friend parent
        User.findOne({'_id': req.user.idParent }, function(err, parent) {
            
              parent.booze +=  ( 3 * req.session.totalQty) /4 ;            
              console.log('BOOZE', parent.booze);
              
              User.update({'_id':parent._id}, {$set: {booze: parent.booze}}, function (err, req) {
                  if (err) {
                    console.log('error', err);
                    res.redirect('/???');
                    return;
                  }
              });            
            
        });
      
        res.redirect('/recomm')
        //console.log("Get Payment Response");
        //console.log(JSON.stringify(payment));      

      };
    
   // await database.saveCaptureID(captureID);

  } catch (err) {

    // 5. Handle any errors from the call
    console.error(err);
    return res.sendStatus(500);
  }

  // 6. Return a successful response to the client 
  console.log('Return a successful response to the client \n',capture);
  res.status(200).json({orderData: capture});
});

} //FINE APP