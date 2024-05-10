const lib           = require('./libfunction');
const fetch         = require("node-fetch");
const User          = require('../app/models/user');
const mailorder     = require('../config/mailOrder');
const {transMsg}    = require("./msgHandler");
const Product = require('./models/product.js');

module.exports = function(app,mongoose, moment) {

var counter;
var users;

//-------------------------------------------
//POST
//-------------------------------------------
  app.post('/axerve_create', lib.isLoggedIn, async function(req, res) {
    var cart = req.session.cart;
    const currency='EUR';

    //const shopLogin='GESPAY63388' 
    const shopLogin=process.env.SHOPLOGIN;

    req.session.order = {};
 
    //==========================================
    // Inizializzo la Transazione
    //==========================================
    const session = await mongoose.startSession();
    session.startTransaction();
    const opts = { session };
    
    try {

      //=============================================
      // Decurto i prodotti dalla disponibilità 
      // per ciacun prodotto in acquisto
      //=============================================
      for (var index = 0; index < req.session.numProductsPerId.length; index++) {
        console.debug('ID PRODOTTO: ',req.session.numProductsPerId[index].id)
        const filter = {_id:req.session.numProductsPerId[index].id};
        console.debug("FILTER: ",filter)
        let doc = await Product.findOne(filter)
        const update = { quantity: (Number(doc.quantity) - Number(req.session.numProductsPerId[index].qty))};
        let doc1 = await Product.findOneAndUpdate(filter,update, {new:true});
        console.debug('QUANTITY UPDATE MINUS: ',doc1.quantity)
      }
      //=============================================

      const user = await User.findById(req.user._id);
      const orderId = new mongoose.Types.ObjectId()   // genero _id usato poi nell'ordine e in Axerve 
      req.session.order._id = orderId;                // _id in sessione usato per update ordine in axerve_response
      req.session.order.totalaAmount = (Number(req.session.totalPrc)+Number(req.session.shippingCost)-Number(req.session.pointDiscount)).toFixed(2)
      
      console.debug('Sharingbeer ORDER ID :', req.session.order._id.toString());

      //==========================================
      // Chiamo Axerve per ottenere ID e Token
      //==========================================
      
      const data = await fetch('https://sandbox.gestpay.net/api/v1/payment/create/', //TODO: modificare quando PRODUZIONE
        {
          method: 'POST',
          headers: {
            "Content-Type": "application/json",  
            "Authorization": process.env.APIKEY
          },
          body: JSON.stringify({  
            "shopLogin": shopLogin,
            "amount": (Number(req.session.totalPrc)+Number(req.session.shippingCost)-Number(req.session.pointDiscount)).toFixed(2),
            "currency": currency,
            "shopTransactionID" : req.session.order._id.toString()
          })
        }
      ).then(function(result) {
        console.debug("RESULT -> : ",JSON.stringify(result));
        return result.json();
      });

      const resData = await data
      console.debug("DATA -> : ", JSON.stringify(resData));

      if (resData.error.code != 0) {
        resData.ok = false;
        console.error(moment().format() + ' [ERROR][RECOVERY:NO] "POST /axerve_create" USER: {_id:bjectId("' + req.user._id + '"} ' + JSON.stringify(resData));
        await session.abortTransaction();
        res.status(500).json(resData);  
      } else {

        //==========================================
        // Inserimento dati in MongoDB
        //==========================================
        user.orders.push({
          _id         : orderId,
          email       : req.user.local.email,
          dateInsert  : moment().format(), //Date.now(),
          status      : "CREATED",
          deliveryType : req.session.deliveryType,
          shipping          : Number(req.session.shippingCost).toFixed(2),
          pointsDiscount    : Number(req.session.pointDiscount).toFixed(2),
          totalPriceBeer    : Number(req.session.totalPrc).toFixed(2),
          totalPriceTotal   : Number(req.session.order.totalaAmount).toFixed(2),
          items : req.session.cartItems.items,
          totalQty : req.session.totalQty,        
          address : req.session.shippingAddress,
          'paypal.shopLogin'        : shopLogin,
          'paypal.createTime'       : moment().format('DD/MM/yyyy hh:mm:ss'),
          'paypal.orderId'          : req.session.order._id.toString(),
          'paypal.currencyAmount'   : currency,
          'paypal.totalAmount'      : req.session.order.totalaAmount,
          'paypal.transactionId'    : resData.payload.paymentID,
          'paypal.token'            : resData.payload.paymentToken,
          'paypal.errorCode'        : resData.error.code,
          'paypal.errorDescription' : resData.error.description     
        });
        let saveOrder = await user.save(opts);
        await session.commitTransaction();
        res.status(200).json(resData);  
      }

    } catch (e) {
        console.error(moment().format() + ' [ERROR][RECOVERY:NO] "POST /axerve_create" USER: {_id:bjectId("' + req.user._id + '"} FUNCTION: User.save: ' + e);
        await session.abortTransaction();
        res.status(500).send()
    } finally {
        await session.endSession();
    };
  });

//-------------------------------------------
//POST
//-------------------------------------------
  app.post('/axerve_response', lib.isLoggedIn, async function(req, res) {

    const error_code = req.body.error_code; 
    const error_description = req.body.error_description;
    var status = req.body.status;
    const payment_id = req.body.payment_id;
    const response_URL = req.body.response_URL;
    const transaction_error_code = req.body.transaction_error_code;
    const transaction_error_description = req.body.transaction_error_description;
    const orderId = req.session.order._id
  
    console.debug('ERROR_CODE -> ', error_code)
    console.debug('ERROR_DESCRIPTION -> ',error_description)
    console.debug('STATUS -> ', status)
    console.debug('PAYMENT_ID -> ',payment_id)
    console.debug('RESPONSE_URL -> ',response_URL)
    console.debug('TRANSACTION_ERROR_CODE -> ', transaction_error_code)
    console.debug('TRANSACTION_ERROR_DESCRIPTION -> ',transaction_error_description)
  
    //==========================================
    // Inizializzo la Transazione
    //==========================================
    const session = await mongoose.startSession();
    session.startTransaction();
  
    try {      
      //==========================================
      // UPDATE Esito del pagamento 
      //==========================================
      if (status == "") status = "KO";

      const filter = {_id: req.user._id};
      const update = 
          {
            'orders.$[el].status'               : status,
            //'orders.$[el].paypal.transactionId' : payment_id,    
            'orders.$[el].paypal.updateTime'    : moment().format('DD/MM/yyyy hh:mm:ss'),
            'orders.$[el].paypal.errorCode'        : error_code,
            'orders.$[el].paypal.errorDescription' : error_description     
          }

      let updateOrder = await User.findOneAndUpdate(
                                {_id: req.user._id},
                                {'$set':update},
                                {arrayFilters: [{"el._id": req.session.order._id}]}
                                ).session(session);

      if (status == 'OK') {
        //========================================
        // INVIO EMAIL al CLIENTE
        //========================================
        let server;
        if (process.env.NODE_ENV== "development") {
          server = req.protocol+'://'+req.hostname+':'+process.env.PORT
        } else {
          server = req.protocol+'://'+req.hostname;
        }
        if (orderId != undefined ) {
          const html = mailorder(req.user.local.name.first, req.session.order._id, lib.deliveryDate(), server)
          lib.sendmailToPerson(req.user.local.name.first, req.user.local.email, '', '', '', '', '', 'order',server, html)
        }
        
        //=====================================
        // Svuoto il carrello
        //=====================================
        req.session.cart = {}
        req.session.order = {}
        req.session.numProducts = 0

        console.error(moment().format()+' [INFO][RECOVERY:NO] "GET /axerve_response" USERS_ID: {"_id":ObjectId("' + req.user._id + '")} ORDER_ID: {"_id":ObjectId("' +orderId+ '")}');
        res.render('orderOutcome.njk', {
          status  : status,
          orderId : orderId,
          user    : req.user,
          deliveryDate: lib.deliveryDate(),
          numProducts : req.session.numProducts
        })

      } else {
        console.error(moment().format()+' [WARNING][RECOVERY:NO] "GET /axerve_response" USERS_ID: {"_id":ObjectId("' + req.user._id + '")} ORDER_ID: {"_id":ObjectId("' +orderId+ '")} ERROR: '+e+' '+error_code+' '+error_description);
        //==============================================
        // Ri-aggiungo i prodotti dalla disponibilità 
        // per prodotto per acquisto non effettuato
        //=============================================
        for (var index = 0; index < req.session.numProductsPerId.length; index++) {
          console.debug('ID PRODOTTO: ',req.session.numProductsPerId[index].id)
          const filter = {_id:req.session.numProductsPerId[index].id};
          console.debug("FILTER: ",filter)
          let doc = await Product.findOne(filter)
          const update = { quantity: (Number(doc.quantity) + Number(req.session.numProductsPerId[index].qty))};
          let doc1 = await Product.findOneAndUpdate(filter,update, {new:true});
          console.debug('QUANTITY UPDATE: ',doc1.quantity)
        }
        //=============================================
        res.render('orderOutcome.njk', {
          status  : status,
          orderId : orderId,
          user    : req.user,
          numProducts : req.session.numProducts
        })
      }
      
      await session.commitTransaction();

    } catch (e) {
      console.error(moment().format() + ' [ERROR][RECOVERY:NO] "POST /axerve_response" USER: {_id:bjectId("' + req.user._id + '"} ORDER_ID: {"_id":ObjectId("' + req.session.order._id + '")} FUNCTION: User.findOneAndUpdate: ERROR: '+e+' '+error_code+' '+error_description);
      //await session.abortTransaction();

      //==============================================
      // Ri-aggiungo i prodotti nella disponibilità 
      // per prodotto per acquisto non effettuato
      //=============================================
      for (var index = 0; index < req.session.numProductsPerId.length; index++) {
        console.debug('ID PRODOTTO: ',req.session.numProductsPerId[index].id)
        const filter = {_id:req.session.numProductsPerId[index].id};
        console.debug("FILTER: ",filter)
        let doc = await Product.findOne(filter)
        const update = { quantity: (Number(doc.quantity) + Number(req.session.numProductsPerId[index].qty))};
        let doc1 = await Product.findOneAndUpdate(filter,update, {new:true});
        console.debug('QUANTITY UPDATE ADD: ',doc1.quantity)
      }
      //=============================================
     
      await session.commitTransaction();
      res.render('orderOutcome.njk', {
          status  : 'KO',
          user    : req.user,
          numProducts : req.session.numProducts
        })
    } finally {
        await session.endSession();
    };
  });

app.get('/response', async function(req, res) {
  //db.users.aggregate([{$unwind:"$orders"},{$match:{$and:[{'orders.paypal.transactionId':'1519209477078'},{'orders.paypal.shopLogin':'GESPAY96332'}]}},{$project:{_id:0,addresses:0,friends:0,local:0,'orders.paypal':0,'orders.items':0}}])
  //db.users.aggregate([{$unwind:"$orders"},{$match:{$and:[{'orders.paypal.transactionId':'1519209477078'},{'orders.paypal.shopLogin':'GESPAY96332'}]}},{$set :{'orders.paypal.shopLogin':'CIAO'}}])

  var updateStatus = await User.findOneAndUpdate(
                                {'orders.paypal.transactionId':req.query.paymentID, 'orders.paypal.shopLogin':req.query.a, 'orders.paypal.token':req.query.paymentToken},
                                {$set :{'orders.$[elem].paypal.s2sStatus':req.query.Status}},
                                {arrayFilters:[{'elem.paypal.transactionId':{$eq:req.query.paymentID}}]});                        
                              /*  
                                {'orders.paypal.transactionId':'1519209477078', 'orders.paypal.shopLogin':'GESPAY96332', 'orders.paypal.token':'09955144-f17c-4e42-8468-d7818ae00480'},
                                {$set :{'orders.$[elem].paypal.s2sStatus':'OK'}},
                                {arrayFilters:[{'elem.paypal.transactionId':{$eq:'1519209477078'}}]}
                                )
                              */
    
  console.debug('PARAMETRI: ',req.query);
/*
  PARAMETRI:  {
  a: 'GESPAY96332',
  Status: 'KO',
  paymentID: '1614179477016',
  paymentToken: '09955144-f17c-4e42-8468-d7818ae00480'
}
*/
  res.redirect('/');
});

};