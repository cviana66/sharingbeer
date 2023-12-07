module.exports = function(app) {

  const paypal    = require('../config/paypal/common/paypal-api.js');
  const lib       = require('./libfunction');

  const Order   = require('../app/models/order');
  const Item    = require('../app/models/item');
  const User    = require('../app/models/user');
  const PayInfo = require('../app/models/payinfo');

// =====================================
// PAYPAL ==============================
// https://www.nodejsera.com/paypal-payment-integration-using-nodejs-part1.html --> valido per la versione v1
// =====================================

// =====================================
// Set up Transaction
// =====================================

app.post('/api/orders', lib.isLoggedIn, async function(req, res) {

  var cart = req.session.cart;
  console.log(cart);
  req.session.order = {};

  try {
    ////////////////////////////////////////////////////////
    // Call PayPal to set up an authorization transaction //
    // and create paypal Order  - Versione V2             //
    ////////////////////////////////////////////////////////

    const order = await paypal.createOrder(req);

    //Return a successful response to the client with the order ID
    console.log('Paypal Order :', JSON.stringify(order, null, 2));

    var newOrder = new Order();

    newOrder.userId = req.user._id;
    newOrder.email  = req.user.email;
    newOrder.dateInsert = Date.now();
    newOrder.status = order.status;
    //newOrder.discount = 0;
    newOrder.totalPrice = req.session.totalPrc;
    newOrder.items = req.session.cartItems.items;
    newOrder.totalQty = req.session.totalQty;
    newOrder.paypal.orderId = order.id;

    let saveOrder = await newOrder.save();

    //save in session the Order ID used after for return success payment
    req.session.order.id = saveOrder.id;
    console.log('Sharingbeer ORDER ID :', req.session.order.id );

    res.status(200).json(order);

    } catch (err) {
      //console.log('Order save err', err);
      console.log("ERR: ",err.message);
      res.status(500).send(err.message);
      //return res.sendStatus(500);
    };
  });

  /////////////////////////
  // Capture Transaction //
  /////////////////////////
app.post('/api/orders/:orderID/capture', lib.isLoggedIn, async function(req, res) {
  const { orderID } = req.params;
  try {
    const captureData = await paypal.capturePayment(orderID);
    console.log('CAPTURE DATA', JSON.stringify(captureData, null, 2));
    let transaction = captureData.purchase_units[0].payments.captures[0];
    const filter = { _id: req.session.order.id };
    const update = {  status: captureData.status,
                      paypal: {
                                orderId       : captureData.id,
                                transactionId : transaction.id,
                                createTime    : String(transaction.create_time),
                                updateTime    : String(transaction.update_time),
                                totalAmount   : transaction.amount.value,
                                currencyAmount: transaction.amount.currency_code
                              }
                    };

    let updateOrder = await Order.findOneAndUpdate(filter,update);

    let infoPayment = new PayInfo();
    infoPayment.userId = req.user.id,
    infoPayment.orderId = req.session.order.id;
    infoPayment.transactionId = transaction.id;
    infoPayment.infoPayment = JSON.stringify(captureData, null, 2);
    let saveInfoPayment = await infoPayment.save();

    res.json(captureData);

  } catch (err) {
    console.log('ERR: ',err);
    res.status(500).send(err.message);
  }

/*


    if (captureData.status === 'COMPLETED') {
        // add Friends after buy

        Order.countDocuments({ email:req.user.email, status:"COMPLETED" }, function (err, numberPurchases) {

          // iniviti possibili = N° acquisiti / Booze destinatia al marketing per ogni PKGx4 aquistato

          invitiPossibili = parseInt( numberPurchases/global.numAcquistiXunaBottigliaXunAmico);

          console.log("INVITI POSSIBILI:",invitiPossibili);

          User.findByIdAndUpdate(req.user._id,
            { $set: {
                      eligibleFriends : invitiPossibili
                    }
            },
            function (err, req) {
              if (err) {
                console.error(moment().format() + ' [ERROR][RECOVERY:YES] "POST /authorize-paypal-transaction" USERS_ID: {"_id":ObjectId("' + req.user._id + '")} FUNCTION: findByIdAndUpdate: ' + err + ' TODO: Aggionare in users il campo eligibleFriends di {"_id":ObjectId("' + newUser.email + '")} con il valore ' + invitiPossibili);
              }
          });

          //add Booze to friend parent
          User.findOne({'_id': req.user.idParent }, function(err, parent) {
            let booze = req.session.totalQty * global.mktBoozeXParent;
            if (err) {
              console.error(moment().format() + ' [ERROR][RECOVERY:YES] "POST /authorize-paypal-transaction" USERS_ID: {"_id":ObjectId("' + req.user._id + '")} FUNCTION: findOne: ' + err + ' TODO: Sommare in users > campo booze di {"_id":ObjectId("' + newUser.email + '")} con il valore ' + booze);
            } else {
                parent.booze += booze;

                console.log('BOOZE', parent.booze);

                User.update({'_id':parent._id}, {$set: {booze: parent.booze}}, function (err, req) {
                    if (err) {
                      console.log('error User.update', err);
                      console.error(moment().format() + ' [ERROR][RECOVERY:YES] "POST /authorize-paypal-transaction" USERS_ID: {"_id":ObjectId("' + req.user._id + '")} FUNCTION: findOne: ' + err + ' TODO: Sommare in users > campo booze di {"_id":ObjectId("' + newUser.email + '")} con il valore ' + booze);
                      //return;
                    }
                });
            };
          });
        });
     }
*/
});

} //FINE APP
