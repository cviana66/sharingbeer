module.exports = function(app) {

  const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');
  const payPalClient      = require('../config/paypal/common/payPalClient');
  const lib               = require('./libfunction');

  const Order   = require('../app/models/order');
  const Item    = require('../app/models/item');
  const User    = require('../app/models/user');
  const PayInfo = require('../app/models/payinfo');

// =====================================
// PAYPAL ==============================
// =====================================
 
// =====================================
// Set up Transaction
// =====================================

app.post('/create-paypal-transaction', lib.isLoggedIn, async function(req, res) {

  var jsonsItems = new Array();
  var cart = req.session.cart; 
  req.session.order = {}; 

  if (!cart) {
      //TODO manage if not exist cart ????
      console.log("Cart not exist");
    } else {
  
      try { // Salva l'ordine 

          var newOrder = new Order();

          newOrder.idUser = req.user._id;
          newOrder.email  = req.user.email;
          newOrder.dateInsert = Date.now();
          newOrder.status = 'reserved';
          newOrder.discount = 0;
          newOrder.totalPrice = req.session.totalPrc;

          let saveOrder = await newOrder.save();
          console.log("Mongoose saveOrder",saveOrder); 

          //save in session Order ID used after for return success payment
          req.session.order.id = saveOrder.id;
          console.log('SHARINGBEER ORDER ID :', req.session.order.id );
   
        } catch (err) {
          console.log('Order save err', err);
          return res.sendStatus(500);
      };

      try {

          for (var item in cart) {
            if (cart[item].qty > 0) {
              
              var subtotal = parseInt(cart[item].price);

              var newItem = new Item();
              
              newItem.idOrder = req.session.order.id;
              newItem.idPrdoduct = cart[item].id;
              newItem.nameProduct = cart[item].name;
              newItem.quantity = cart[item].qty;
              newItem.price = subtotal.toFixed(2);

              let saveItem = await newItem.save();
               
            }
          } 
          console.log('Items saved');
        } catch (err) {
            console.log('Items saved err', err);
            return res.sendStatus(500);
      }

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
        }]
      });

      let order;

      try {
        
        order = await payPalClient.client().execute(request);
        
        const paypalOrderStatus =  order.result.status;
        const paypalOrderId = order.result.id;
        const sharinbeerOrderId = req.session.order.id
        
        console.log('PAYPAL ORDER STATUS:',order.result.status);
        console.log('PAYPAL ORDER ID:', order.result.id);
        console.log('SHARINGBEER ORDER ID', req.session.order.id);

        try {

          var payInfo = new PayInfo();

          payInfo.idPay   = paypalOrderId; 
          payInfo.idOrder = sharinbeerOrderId;
          payInfo.state   = paypalOrderStatus;
          payInfo.responseMsg = JSON.stringify(order);
       
          let infoPayment = await payInfo.save(); 
        } catch (err) {
          console.log('Paypal Info save err', err);
          return res.sendStatus(500);
        };
        console.log('Paypal Info saved');
        
      } catch (err) {
        // 4. Handle any errors from the call
        console.error(err);
        return res.sendStatus(500);
        // Equivalent to res.status(500).send('KO')
      }

      // 5. Return a successful response to the client with the order ID
      console.log('Return a successful response to the client with the Paypal order ID->',order.result.id);
      res.status(200).json({orderID: order.result.id});
    }
  });

//=============================
// Capture a Transaction
//=============================
// 2. Set up your server to receive a call from the client
app.post('/authorize-paypal-transaction', lib.isLoggedIn, async function(req, res) {

  // 2a. Get the order ID from the request body
  const paypalOrderId = req.body.orderID;

  // 3. Call PayPal to capture the order
  const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(paypalOrderId);
  request.requestBody({});

  let capture;

  try {
    capture = await payPalClient.client().execute(request);
    console.log('capture ->',capture);

    // 4. Save the capture ID to your database. Implement logic to save capture to your database for future reference.
    const paypalPaymentId     = capture.result.purchase_units[0].payments.captures[0].id;
    const sharigbeerOrderId   = req.session.order.id;
    const paypalPaymentStatus = capture.result.purchase_units[0].payments.captures[0].status; 
    const paypalPayerId       = capture.result.payer.payer_id;
    const paypalCreateTime    = capture.result.purchase_units[0].payments.captures[0].create_time;
    const paypalUpdateTime    = capture.result.purchase_units[0].payments.captures[0].update_time;
    const paypalAmount        = capture.result.purchase_units[0].payments.captures[0].amount.value;
    const paypalCurrency      = capture.result.purchase_units[0].payments.captures[0].amount.currency_code;
    const captureStringify    = JSON.stringify(capture);

    req.session.cart        = {};
    req.session.displayCart = {}
    req.session.order       = {};
    req.session.totalPrc    = 0;
    req.session.numProducts = 0;

    try { 

      let infoPayment = await PayInfo.findOneAndUpdate({idOrder:sharigbeerOrderId},
          { state:paypalPaymentStatus, 
            responseMsg:captureStringify} 
      );  
     
    } catch {
      // TODO: scrivere su LOG per recuperare successivamente
      console.log('Save log after error -> PAYPAL orderID:',paypalOrderId);
      console.log('Save log after errot -> SHARINGBEER orderID:',req.session.order.id);
      console.log('Save log after error -> PAYPAL status:',paypalPaymentStatus);
    };

    var SharingbeerStatus="";

    if (paypalPaymentStatus === 'COMPLETED')  { 
      SharingbeerStatus = 'payed';
    } else {
      SharingbeerStatus = 'tobeVerify';
    }

    console.log('PAYMENT ...payments.captures: ', capture.result.purchase_units[0].payments.captures);

    try {
      let updateOrder = await Order.findByIdAndUpdate(sharigbeerOrderId, 
        { $set: {
                  paypal: {
                          payOrderId    : paypalOrderId,
                          paymentId     : paypalPaymentId,
                          payerId       : paypalPayerId, 
                          state         : paypalPaymentStatus,
                          createTime    : String(paypalCreateTime),
                          updateTime    : String(paypalUpdateTime),
                          totalAmount   : String(paypalAmount),
                          currencyAmount: paypalCurrency
                        },
                  status: SharingbeerStatus
                }
        })
    } catch (err) {
      // TODO: scrivere su LOG per recuperare successivamente
      console.log('Update error -> SHARINGBEER Order with paypal info\n', err);
      console.log(JSON.stringify(capture));
    }

    if (SharingbeerStatus === 'payed') {
        // add Friends after buy
        User.findByIdAndUpdate(req.user._id, 
          { $set: { 
                    possibleFriends : req.user.possibleFriends + 3
                  }
          }, 
          function (err, req) {
            if (err) {
              console.log('User.findByIdAndUpdate', err);
              //res.redirect('/???');
              //return;
            }
        });

        //add Booze to friend parent
        User.findOne({'_id': req.user.idParent }, function(err, parent) {
            
              parent.booze +=  ( 3 * req.session.totalQty) /4 ;            
              console.log('BOOZE', parent.booze);
              
              User.update({'_id':parent._id}, {$set: {booze: parent.booze}}, function (err, req) {
                  if (err) {
                    console.log('error User.update', err);
                    //res.redirect('/???');
                    //return;
                  }
              });            
            
        });
      
        //res.redirect('/recomm')
        //console.log("Get Payment Response");
        //console.log(JSON.stringify(payment));      

      };
    
  

  } catch (err) {

    // 5. Handle any errors from the call
    console.error('Handle any errors from the call:',err);
    return res.sendStatus(500);
  }

  // 6. Return a successful response to the client 
  console.log('Return a successful response to the client \n',capture);
  res.status(200).json({orderData: capture});
});

} //FINE APP