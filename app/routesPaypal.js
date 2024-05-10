module.exports = function(app, mongoose, moment) {

  const paypal    = require('../config/paypal/common/paypal-api.js');
  const lib       = require('./libfunction');

  //const Order   = require('../app/models/order');
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
  //console.log(cart);
  req.session.order = {};
  const session = await mongoose.startSession();

  try {
    ////////////////////////////////////////////////////////
    // Call PayPal to set up an authorization transaction //
    // and create paypal Order  - Versione V2             //
    ////////////////////////////////////////////////////////
    
    session.startTransaction();
    const opts = { session };
    const order = await paypal.createOrder(req);

    //Return a successful response to the client with the order ID
    console.log('Paypal Order :', JSON.stringify(order, null, 2));

    const user = await User.findById(req.user._id);

    user.orders.push({
        email       : req.user.local.email,
        dateInsert  : moment().format(), //Date.now(),
        status      : order.status,
        shipping          : Number(req.session.shippingCost).toFixed(2),
        pointsDiscount    : Number(req.session.pointDiscount).toFixed(2),
        totalPriceBeer    : Number(req.session.totalPrc).toFixed(2),
        totalPriceTotal   : (Number(req.session.totalPrc)+Number(req.session.shippingCost)-Number(req.session.pointDiscount)).toFixed(2),
        items : req.session.cartItems.items,
        totalQty : req.session.totalQty,        
        'paypal.orderId' : order.id,
        address : req.session.address,
        'address.addressID' : req.session.address._id.toString()        
    });

    let saveOrder = await user.save(opts);

    //save in session the Order ID used after for return success payment
    req.session.order.id = saveOrder.id;
    console.log('Sharingbeer ORDER ID :', req.session.order.id );

    await session.commitTransaction();
    res.status(200).json(order);

    } catch (err) {
      await session.abortTransaction();
      //console.log('Order save err', err);
      console.log("ERR: ",JSON.stringify(err.message));
      res.status(500).send(err.message);
      //return res.sendStatus(500);
    } finally {
        await session.endSession();
    };
  });

  /////////////////////////
  // Capture Transaction //
  /////////////////////////
app.post('/api/orders/:orderID/capture', lib.isLoggedIn, async function(req, res) {
  const { orderID } = req.params;
  
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const captureData = await paypal.capturePayment(orderID);
    console.log('CAPTURE DATA', JSON.stringify(captureData, null, 2));
    let transaction = captureData.purchase_units[0].payments.captures[0];

    const filter = {_id: req.user._id};

    const update = 
        {
          'orders.$[el].status'                : captureData.status,
          'orders.$[el].paypal.transactionId'  : transaction.id,
          'orders.$[el].paypal.createTime'     : String(transaction.create_time),
          'orders.$[el].paypal.updateTime'     : String(transaction.update_time),
          'orders.$[el].paypal.totalAmount'    : transaction.amount.value,
          'orders.$[el].paypal.currencyAmount' : transaction.amount.currency_code,
          'orders.$[el].paypal.infoPayment'    : captureData
        }

    let updateOrder = await User.findOneAndUpdate(
                              {_id: req.user._id},
                              {'$set':update},
                              {arrayFilters: [{"el.paypal.orderId": captureData.id}]}
                              ).session(session);

    await session.commitTransaction();
    res.json(captureData);

  } catch (err) {
    await session.abortTransaction();
    console.log('ERR: ',err);
    res.status(500).send(err.message);
  } finally {
        await session.endSession();
    };

/*


    if (captureData.status === 'COMPLETED') {
        // add Friends after buy

        Order.countDocuments({ email:req.user.local.email, status:"COMPLETED" }, function (err, numberPurchases) {

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
                console.error(moment().format() + ' [ERROR][RECOVERY:YES] "POST /authorize-paypal-transaction" USERS_ID: {"_id":ObjectId("' + req.user._id + '")} FUNCTION: findByIdAndUpdate: ' + err + ' TODO: Aggionare in users il campo eligibleFriends di {"_id":ObjectId("' + newUser.local.email + '")} con il valore ' + invitiPossibili);
              }
          });

          //add Booze to friend parent
          User.findOne({'_id': req.user.idParent }, function(err, parent) {
            let booze = req.session.totalQty * global.mktBoozeXParent;
            if (err) {
              console.error(moment().format() + ' [ERROR][RECOVERY:YES] "POST /authorize-paypal-transaction" USERS_ID: {"_id":ObjectId("' + req.user._id + '")} FUNCTION: findOne: ' + err + ' TODO: Sommare in users > campo booze di {"_id":ObjectId("' + newUser.local.email + '")} con il valore ' + booze);
            } else {
                parent.booze += booze;

                console.log('BOOZE', parent.booze);

                User.update({'_id':parent._id}, {$set: {booze: parent.booze}}, function (err, req) {
                    if (err) {
                      console.log('error User.update', err);
                      console.error(moment().format() + ' [ERROR][RECOVERY:YES] "POST /authorize-paypal-transaction" USERS_ID: {"_id":ObjectId("' + req.user._id + '")} FUNCTION: findOne: ' + err + ' TODO: Sommare in users > campo booze di {"_id":ObjectId("' + newUser.local.email + '")} con il valore ' + booze);
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
