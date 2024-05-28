const lib           = require('./libfunction');
const fetch         = require("node-fetch");
const User          = require('../app/models/user');
const mailorder     = require('../config/mailOrder');
const {transMsg}    = require("./msgHandler");
const Product = require('./models/product.js');
<<<<<<< HEAD

var {getUserByPaymentIdAndShopLogin}  = require('../app/axerveResposeManagement');
var {updateStatusPayment}             = require('../app/axerveResposeManagement');
var {addInviteAndPoint}               = require('../app/axerveResposeManagement');
var {addItemsInProducts}              = require('../app/axerveResposeManagement');
=======
>>>>>>> 94e856d48674cf175d63810012f7c6afa78489f1

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
<<<<<<< HEAD
        
        const filter = {_id:req.session.numProductsPerId[index].id};
        console.debug("FILTER: ",filter)
        
        let doc = await Product.findOne(filter)
        console.debug('QUANTITY UPDATE PRIMA DELLA DECURTAZIONE: ',doc.quantity)
        
        const update = { quantity: (Number(doc.quantity) - Number(req.session.numProductsPerId[index].qty))};
        let doc1 = await Product.findOneAndUpdate(filter,update, {new:true}).session(session);
        console.debug('QUANTITY UPDATE DOPO LA DECURTAZIONE: ',doc1.quantity)
=======
        console.debug('ID PRODOTTO: ',req.session.numProductsPerId[index].id)
        const filter = {_id:req.session.numProductsPerId[index].id};
        console.debug("FILTER: ",filter)
        let doc = await Product.findOne(filter)
        const update = { quantity: (Number(doc.quantity) - Number(req.session.numProductsPerId[index].qty))};
        let doc1 = await Product.findOneAndUpdate(filter,update, {new:true});
        console.debug('QUANTITY UPDATE MINUS: ',doc1.quantity)
>>>>>>> 94e856d48674cf175d63810012f7c6afa78489f1
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
      console.debug('IMPORTO', (Number(req.session.totalPrc)+Number(req.session.shippingCost)-Number(req.session.pointDiscount)).toFixed(2));
      await fetch('https://sandbox.gestpay.net/api/v1/payment/create/', //TODO: modificare quando PRODUZIONE
        {
          method: 'POST',
          headers: {
            "Content-Type"  : "application/json",  
            "Authorization" : process.env.APIKEY
          },
          body: JSON.stringify({  
<<<<<<< HEAD
            "shopLogin"         : shopLogin,
            "amount"            : req.session.order.totalaAmount,
            "currency"          : currency,
=======
            "shopLogin": shopLogin,
            "amount": (Number(req.session.totalPrc)+Number(req.session.shippingCost)-Number(req.session.pointDiscount)).toFixed(2),
            "currency": currency,
>>>>>>> 94e856d48674cf175d63810012f7c6afa78489f1
            "shopTransactionID" : req.session.order._id.toString()
          })
        }
      ).then(function(result) {
        console.debug("RESULT -> : ",JSON.stringify(result));
        return result.json();
<<<<<<< HEAD
      }).then (async function(data){
        console.debug("DATA -> : ", JSON.stringify(data));

        if (data.error.code !== "0") {
          data.ok = false;
          console.error(moment().utc("Europe/Rome").format() + ' [ERROR][RECOVERY:NO] "POST /axerve_create" USER: {_id:bjectId("' + req.user._id + '"} ' + JSON.stringify(data));
          await session.abortTransaction();
          res.status(500).json(data);  

        } else {
          //==========================================
          // Inserimento dati in MongoDB
          //==========================================
          user.orders.push({
            _id         : orderId,
            email       : req.user.local.email,
            dateInsert  : new Date(moment().utc("Europe/Rome").format()),
            status      : "CREATED",
            deliveryType : req.session.deliveryType,
            deliveryDate : lib.deliveryDate('formato_data'),
            shipping          : Number(req.session.shippingCost).toFixed(2),
            pointsDiscount    : Number(req.session.pointDiscount).toFixed(2),
            totalPriceBeer    : Number(req.session.totalPrc).toFixed(2),
            totalPriceTotal   : Number(req.session.order.totalaAmount).toFixed(2),
            items     : req.session.cartItems.items,
            totalQty  : req.session.totalQty,        
            address   : req.session.shippingAddress,
            'paypal.shopLogin'        : shopLogin,
            'paypal.createTime'       : moment().utc("Europe/Rome").format('DD/MM/yyyy HH:mm:ss'),
            'paypal.orderId'          : req.session.order._id.toString(),
            'paypal.currencyAmount'   : currency,
            'paypal.totalAmount'      : req.session.order.totalaAmount,
            'paypal.transactionId'    : data.payload.paymentID,
            'paypal.token'            : data.payload.paymentToken,
            'paypal.errorCode'        : data.error.code,
            'paypal.errorDescription' : data.error.description     
          });
          let saveOrder = await user.save(opts);
          await session.commitTransaction();
          data.shopLogin = shopLogin;
          res.status(200).json(data);  
        }
      })
=======
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
          dateInsert  : moment().format(),
          status      : "CREATED",
          deliveryType : req.session.deliveryType,
          deliveryDate : lib.deliveryDate('formato_data'),
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
>>>>>>> 94e856d48674cf175d63810012f7c6afa78489f1

    } catch (e) {
        console.error(moment().utc("Europe/Rome").format() + ' [ERROR][RECOVERY:NO] "POST /axerve_create" USER: {_id:bjectId("' + req.user._id + '"} FUNCTION: User.save: ' + e);
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
<<<<<<< HEAD
    const error_description = req.body.error_description;    
    
    const response_URL = req.body.response_URL;
    const transaction_error_code = req.body.transaction_error_code;
    const transaction_error_description = req.body.transaction_error_description;

    const paymentId = req.body.payment_id;
    const shopLogin = process.env.SHOPLOGIN
    var status      = req.body.status; if (status == "") status = "KO";

    console.debug('ERROR_CODE -> ', error_code)
    console.debug('ERROR_DESCRIPTION -> ',error_description)
    console.debug('STATUS -> ', status)
    console.debug('PAYMENT_ID -> ',paymentId)
    console.debug('RESPONSE_URL -> ',response_URL)
    console.debug('TRANSACTION_ERROR_CODE -> ', transaction_error_code)
    console.debug('TRANSACTION_ERROR_DESCRIPTION -> ',transaction_error_description)

    
    const userId  = req.user._id;
    const orderId = req.session.order._id;
    var booze     = req.session.booze;
    const totalPrc= req.session.totalPrc;
    const parentId= req.user.local.idParent;
    const name    = req.user.local.name.first;
    const userEmail = req.user.local.email

    
    
=======
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
  
>>>>>>> 94e856d48674cf175d63810012f7c6afa78489f1
    //==========================================
    // Inizializzo la Transazione
    //==========================================
    const session = await mongoose.startSession();
    session.startTransaction();
  
<<<<<<< HEAD
    try {  
      //==========================================
      // UPDATE Esito del pagamento 
      //==========================================
      await updateStatusPayment(userId, orderId, status, session, mongoose);

      if (status == 'OK') {      

        //=====================================
        // aggiungo possibilità di invito
        // aggiungo punto Pinta al cliente Padre
        //=====================================        
        await addInviteAndPoint(userId, parentId, booze, totalPrc, session, mongoose)

        //=====================================
        // Svuoto il carrello
        //=====================================
        req.session.cart = {}
        req.session.order = {}
        req.session.numProducts = 0

        //========================================
        // INVIO EMAIL al CLIENTE
        //========================================
        const server = lib.getServer();
        if (orderId != undefined ) {
          const html = mailorder(name, orderId, lib.deliveryDate(), server)
          lib.sendmailToPerson(name, userEmail, '', '', '', '', '', 'order',server, html)
        } //gestire se orderId == undefined

        console.error(moment().utc("Europe/Rome").format()+' [INFO][RECOVERY:NO] "GET /axerve_response" USERS_ID: {"_id":ObjectId("' + userId + '")} ORDER_ID: {"_id":ObjectId("' +orderId+ '")}');
        res.render('orderOutcome.njk', {
          status  : status,
          orderId : orderId,
          user    : req.user,
          deliveryDate: lib.deliveryDate(),
          numProducts : req.session.numProducts
        })

      } else {

        console.error(moment().utc("Europe/Rome").format()+' [WARNING][RECOVERY:NO] "GET /axerve_response" USERS_ID: {"_id":ObjectId("' + userId + '")} ORDER_ID: {"_id":ObjectId("' +orderId+ '")} Status pagamento KO - '+error_code+' '+error_description);
        //==============================================
        // Ri-aggiungo i prodotti dalla disponibilità 
        // per prodotto per acquisto non effettuato
        //=============================================
         addItemsInProducts(paymentId,shopLogin);

=======
    try {      
      //==========================================
      // UPDATE Esito del pagamento 
      //==========================================
      if (status == "") status = "KO";

      let filter = {_id: req.user._id};
      let update = 
          {
            'orders.$[el].status'               : status,
            //'orders.$[el].paypal.transactionId' : payment_id,    
            'orders.$[el].paypal.updateTime'    : moment().format('DD/MM/yyyy hh:mm:ss'),
            'orders.$[el].paypal.errorCode'        : error_code,
            'orders.$[el].paypal.errorDescription' : error_description     
          }

      let updateOrder = await User.findOneAndUpdate(
                                filter,
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

        //=====================================
        // aggiungo possibilità di invito
        // aggiungo punto Pinta al cliente Padre
        //=====================================        
        let updateUser = await User.findOneAndUpdate(
                                  {_id: req.user._id},
                                  {'$inc': {'local.eligibleFriends': invitiPerOgniAcquisto},'local.booze': req.session.booze}
                                ).session(session);
        const booze = Number(req.session.totalPrc)/numBottigliePerBeerBox/puntiPintaPerUnaBottiglia
        console.log('BOOZE: ', booze, req.session.totalPrc, numBottigliePerBeerBox, puntiPintaPerUnaBottiglia)
        let updateUserParent = await User.findOneAndUpdate(
                                      {'_id': mongoose.Types.ObjectId(req.user.local.idParent)},
                                      {'$inc': {'local.booze':booze}}
                                    ).session(session);

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
>>>>>>> 94e856d48674cf175d63810012f7c6afa78489f1
        res.render('orderOutcome.njk', {
          status  : status,
          orderId : orderId,
          user    : req.user,
          numProducts : req.session.numProducts
        })
      }
      
      await session.commitTransaction();

    } catch (e) {
<<<<<<< HEAD
      console.error(moment().utc("Europe/Rome").format() + ' [ERROR][RECOVERY:NO] "POST /axerve_response" USER: {_id:ObjectId("' + userId + '"} ORDER_ID: {"_id":ObjectId("' + orderId + '")} CATCH: '+e+' '+transaction_error_code+' '+transaction_error_description+' '+error_code+' '+error_description);
      await session.abortTransaction();
=======
      console.error(moment().format() + ' [ERROR][RECOVERY:NO] "POST /axerve_response" USER: {_id:ObjectId("' + req.user._id + '"} ORDER_ID: {"_id":ObjectId("' + orderId + '")} FUNCTION: User.findOneAndUpdate: ERROR: '+e+' '+error_code+' '+error_description);
      //await session.abortTransaction();
>>>>>>> 94e856d48674cf175d63810012f7c6afa78489f1

      //==============================================
      // Ri-aggiungo i prodotti nella disponibilità 
      // per prodotto per acquisto non effettuato
      //=============================================
<<<<<<< HEAD
      addItemsInProducts(paymentId,shopLogin);
      
     
=======
      for (var index = 0; index < req.session.numProductsPerId.length; index++) {
        console.debug('ID PRODOTTO: ',req.session.numProductsPerId[index].id)
        const filter = {_id:req.session.numProductsPerId[index].id};
        
        console.debug("FILTER: ",filter)
        let doc = await Product.findOne(filter)
        
        const update = { quantity: (Number(doc.quantity) + Number(req.session.numProductsPerId[index].qty))};
        let doc1 = await Product.findOneAndUpdate(filter, update, {new:true});
        console.debug('QUANTITY UPDATE ADD: ',doc1.quantity)
      }
      //=============================================
     
      await session.commitTransaction();
>>>>>>> 94e856d48674cf175d63810012f7c6afa78489f1
      res.render('orderOutcome.njk', {
          status  : 'KO',
          user    : req.user,
          numProducts : req.session.numProducts
        })
    } finally {
        await session.endSession();
    };
  });

<<<<<<< HEAD
//=============================================================
// Chiamata usata da Axerve per  allineamento Server TO Server
//=============================================================
=======
>>>>>>> 94e856d48674cf175d63810012f7c6afa78489f1
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

<<<<<<< HEAD

app.get('/response_positiva', async function(req,res) {  
  //response_positiva?a=GESPAY96332&Status=OK&paymentID=1244109507430&paymentToken=2fbc938d-547a-4431-8da8-31539f967ccf
  //const user = await getUserByPaymentIdAndShopLogin('1244109507430','GESPAY96332'); // TEST

  console.debug('PARAMETRI RISPOSTA POSITIVA: ',req.query);
  try {
    const user = await getUserByPaymentIdAndShopLogin(req.query.paymentID,req.query.a); 
    console.debug("USER:",user) 


    res.render('orderOutcome.njk', {
          status  : req.query.Status,
          deliveryDate : moment(user.orders.deliveryDate).format('dddd DD MMMM'),
          user : user
    });
  }catch (e){
    console.error(moment().utc("Europe/Rome").format() + ' [ERROR][RECOVERY:NO] "GET /response_positiva"  PARAMETRI RISPOSTA POSITIVA: '+req.query+' ERRORE:'+e);
    let msg = 'Ci dspiace, si è verificato un errore inatteso. Se lo ritieni opportuno puoi contattarci all\'indirizzo birrificioviana@gmail.com'
    req.flash('error', msg);
    return res.render('info.njk', {
                                    message: req.flash('error'),
                                    type: "danger"
                                  });
  }    
});

app.get('/response_negativa',  function(req,res) {
  
  console.debug('PARAMETRI RISPOSTA NEGATIVA: ',req.query);
  res.render('orderOutcome.njk', {
          status  : 'KO'
  });
});

=======
>>>>>>> 94e856d48674cf175d63810012f7c6afa78489f1
};