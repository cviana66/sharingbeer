const lib           = require('./libfunction');
const fetch         = require("node-fetch");
const bcrypt        = require('bcrypt-nodejs');
const User          = require('../app/models/user');
const mailorder     = require('../config/mailOrder');
const {transMsg}    = require("./msgHandler");
const Product = require('./models/product.js');

var {getUserByPaymentIdAndShopLoginAndToken}  = require('../app/axerveResposeManagement');
var {getUserByPaymentIdAndShopLogin}  = require('../app/axerveResposeManagement');
var {updateStatusPayment}             = require('../app/axerveResposeManagement');
var {addInviteAndPoint}               = require('../app/axerveResposeManagement');
var {addItemsInProducts}              = require('../app/axerveResposeManagement');

module.exports = function(app,mongoose,moment) {

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
        
        const filter = {_id:req.session.numProductsPerId[index].id};
        console.debug("FILTER: ",filter)
        
        let doc = await Product.findOne(filter)
        console.debug('QUANTITY UPDATE PRIMA DELLA DECURTAZIONE: ',doc.quantity)
        
        const update = { quantity: (Number(doc.quantity) - Number(req.session.numProductsPerId[index].qty))};
        let doc1 = await Product.findOneAndUpdate(filter,update, {new:true}).session(session);
        console.debug('QUANTITY UPDATE DOPO LA DECURTAZIONE: ',doc1.quantity)
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
            "shopLogin"         : shopLogin,
            "amount"            : req.session.order.totalaAmount,
            "currency"          : currency,
            "shopTransactionID" : req.session.order._id.toString()
          })
        }
      ).then(function(result) {
        console.debug("RESULT -> : ",JSON.stringify(result));
        return result.json();
      }).then (async function(data){
        console.debug("DATA -> ", JSON.stringify(data));

        if (data.error.code !== "0") {
          data.ok = false;
          console.error(moment().utc("Europe/Rome").format() + ' [ERROR][RECOVERY:NO] "POST /axerve_create" USER: {_id:bjectId("' + req.user._id + '"} ' + JSON.stringify(data));
          await session.abortTransaction();
          res.status(500).json(data);  

        } else {
          req.session.paymentId = data.payload.paymentID;
          //==========================================
          // Inserimento dati in MongoDB
          //==========================================
          user.orders.push({
            _id         : orderId,
            email       : req.user.local.email,
            dateInsert  : new Date(moment().utc("Europe/Rome").format()),
            status      : "CREATED",
            fatturaPEC  : req.session.fatturaPEC,
            fatturaSDI  : req.session.fatturaSDI,
            pointsDiscount    : Number(req.session.pointDiscount).toFixed(2),
            shipping          : Number(req.session.shippingCost).toFixed(2),
            deliveryType : req.session.deliveryType,
            deliveryDate : lib.deliveryDate('formato_data'),
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
    const error_description = req.body.error_description;    
    
    const response_URL = req.body.response_URL;
    const transaction_error_code = req.body.transaction_error_code;
    const transaction_error_description = req.body.transaction_error_description;

    const paymentId = req.session.paymentId;
    const shopLogin = process.env.SHOPLOGIN
    var status      = req.body.status; if (status == "") status = "KO";

    console.debug('ERROR_CODE -> ', error_code)
    console.debug('ERROR_DESCRIPTION -> ',error_description)
    console.debug('STATUS -> ', status)
    console.debug('PAYMENT_ID -> ',paymentId)
    console.debug('RESPONSE_URL -> ',response_URL)
    console.debug('TRANSACTION_ERROR_CODE -> ', transaction_error_code)
    console.debug('TRANSACTION_ERROR_DESCRIPTION -> ',transaction_error_description)

    
    const userId    = req.user.id.toString();
    const orderId   = req.session.order._id.toString();
    var booze       = req.session.booze;
    const totalPrc  = req.session.totalPrc;
    const parentId  = req.user.local.idParent;
    const name      = req.user.local.name.first;
    const userEmail = req.user.local.email;

    /*==========================================
    // Inizializzo la Transazione
    //==========================================
    const session = await mongoose.startSession();
    session.startTransaction(); */
  
    try {  
      /*==========================================
      // UPDATE Esito del pagamento 
      //==========================================
      console.debug('updateStatusPayment PARAMETER:',userId, orderId, status )
      await updateStatusPayment(userId, orderId, status, session, mongoose); */

      if (status == 'OK') {      

        /*=====================================
        // aggiungo possibilità di invito
        // aggiungo punto Pinta al cliente Padre
        //=====================================        
        await addInviteAndPoint(userId, parentId, booze, totalPrc, session, mongoose) */

        //=====================================
        // Svuoto il carrello
        //=====================================
        req.session.cart = {}
        req.session.order = {}
        req.session.numProducts = 0

        /*========================================
        // INVIO EMAIL al CLIENTE
        //========================================
        const server = lib.getServer(req);
        console.debug('SERVER',server);
        
        const html = mailorder(name, orderId, lib.deliveryDate(), server)
        await lib.sendmailToPerson(name, userEmail, '', '', '', '', '', 'order',server, html) */
        
        res.render('orderOutcome.njk', {
          status  : status,
          orderId : orderId,
          user    : req.user,
          deliveryDate: lib.deliveryDate(),
          numProducts : req.session.numProducts
        })

      } else {

        console.error(moment().utc("Europe/Rome").format()+' [WARNING][RECOVERY:NO] "GET /axerve_response" USERS_ID: {"_id":ObjectId("' + userId + '")} ORDER_ID: {"_id":ObjectId("' +orderId+ '")} Status pagamento KO - '+error_code+' '+error_description);
        /*==============================================
        // Ri-aggiungo i prodotti dalla disponibilità 
        // per prodotto per acquisto non effettuato
        //=============================================
         addItemsInProducts(paymentId,shopLogin);*/

        res.render('orderOutcome.njk', {
          status  : status,
          orderId : orderId,
          user    : req.user,
          numProducts : req.session.numProducts
        })
      }
      
      //await session.commitTransaction();

    } catch (e) {
      console.error(moment().utc("Europe/Rome").format() + ' [ERROR][RECOVERY:NO] "POST /axerve_response" USER: {_id:ObjectId("' + userId + '"} ORDER_ID: {"_id":ObjectId("' + orderId + '")} CATCH: '+e+' '+transaction_error_code+' '+transaction_error_description+' '+error_code+' '+error_description);
      //await session.abortTransaction();

      /*==============================================
      // Ri-aggiungo i prodotti nella disponibilità 
      // per prodotto per acquisto non effettuato
      //=============================================
      addItemsInProducts(paymentId,shopLogin); */
      
      res.render('orderOutcome.njk', {
          status  : 'KO',
          user    : req.user,
          numProducts : req.session.numProducts
        })
    } finally {
        // session.endSession();
    };
  });

//=============================================================
// Chiamata usata da Axerve per  allineamento Server TO Server
//=============================================================
app.get('/response', async function(req, res) {
  //db.users.aggregate([{$unwind:"$orders"},{$match:{$and:[{'orders.paypal.transactionId':'1519209477078'},{'orders.paypal.shopLogin':'GESPAY96332'}]}},{$project:{_id:0,addresses:0,friends:0,local:0,'orders.paypal':0,'orders.items':0}}])
  //db.users.aggregate([{$unwind:"$orders"},{$match:{$and:[{'orders.paypal.transactionId':'1519209477078'},{'orders.paypal.shopLogin':'GESPAY96332'}]}},{$set :{'orders.paypal.shopLogin':'CIAO'}}])
  console.debug('PARAMETRI RESPONSE: ',req.query);
  //==========================================
  // Inizializzo la Transazione
  //==========================================
  const session = await mongoose.startSession();
  session.startTransaction();
  try {  
    //========================================================================
    // Update Status S2S e Token in modo da invalidare una successiva chiamata
    //========================================================================
    const newToken = bcrypt.hashSync(req.query.paymentToken, bcrypt.genSaltSync(8), null);
    console.debug('NEW TOKEN',newToken);

    const status    = req.query.Status;
    const paymentId = req.query.paymentID;
    const shopLogin = req.query.a;
    const paymentToken = req.query.paymentToken;

    var updateStatusS2sAndToken = await User.findOneAndUpdate(
                                {'orders.paypal.transactionId':paymentId, 'orders.paypal.shopLogin':shopLogin, 'orders.paypal.token':paymentToken},
                                {$set :{'orders.$[elem].paypal.s2sStatus':status,
                                        'orders.$[elem].paypal.token':newToken}},
                                {arrayFilters:[{'elem.paypal.transactionId':{$eq:paymentId}}]}).session(session);    

    //console.debug('RESPONSE updateStatusS2S', updateStatusS2S)     


    const user = await getUserByPaymentIdAndShopLoginAndToken(req.query.paymentID,req.query.a, req.query.paymentToken);

    const userId    = user._id.toString();
    const orderId   = user.orders._id.toString();
    var booze       = user.local.booze;
    const totalPrc  = user.orders.totalPriceBeer;
    const parentId  = user.local.idParent;
    const name      = user.local.name.first;
    const userEmail = user.local.email;

    //==========================================
    // UPDATE Esito del pagamento 
    //==========================================
    console.debug('updateStatusPayment PARAMETER:',userId, orderId, status )
    await updateStatusPayment(userId, orderId, status, session, mongoose);               

    if ( status == 'OK') {            
  
      //=====================================
      // aggiungo possibilità di invito
      // aggiungo punto Pinta al cliente Padre
      //=====================================        
      await addInviteAndPoint(userId, parentId, booze, totalPrc, session, mongoose)

      /*=====================================
      // Svuoto il carrello
      //=====================================
      req.session.cart = {}
      req.session.order = {}
      req.session.numProducts = 0 */
      
      //========================================
      // INVIO EMAIL al CLIENTE
      //========================================
      const server = lib.getServer(req);
      console.debug('MAIL',name, userEmail, orderId, lib.deliveryDate(), server);
      
      const html = mailorder(name, orderId, lib.deliveryDate(), server)
      await lib.sendmailToPerson(name, userEmail, '', '', '', '', '', 'order',server, html); 
    } else {
      //==============================================
      // Ri-aggiungo i prodotti nella disponibilità 
      // per prodotto per acquisto non effettuato
      //=============================================
      addItemsInProducts(paymentId,shopLogin);
    }
    await session.commitTransaction();
  } catch(e) {
    console.error('ERRORE IN RESPONSE:',e);
    await session.abortTransaction();
  } finally {
    await session.endSession();
    setTimeout(() => res.send('Fatto!'), 500);
  }
  
/*
  PARAMETRI:  {
  a: 'GESPAY96332',
  Status: 'KO',
  paymentID: '1614179477016',
  paymentToken: '09955144-f17c-4e42-8468-d7818ae00480'
}
*/
});


app.get('/response_positiva', async function(req,res) {  
  //response_positiva?a=GESPAY96332&Status=OK&paymentID=1244109507430&paymentToken=2fbc938d-547a-4431-8da8-31539f967ccf
  //const user = await getUserByPaymentIdAndShopLogin('1244109507430','GESPAY96332'); // TEST

  console.debug('PARAMETRI RISPOSTA POSITIVA: ',req.query);
  try {
    const user = await getUserByPaymentIdAndShopLogin(req.query.paymentID,req.query.a); 
    //console.debug("USER:",user);

    //console.debug('REQ SESSION',req.session);
    //=====================================
    // Svuoto il carrello
    //=====================================
    req.session.cart = {}
    req.session.order = {}
    req.session.numProducts = 0 

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


/*
app.get('/testAx', async function(req,res){
  try {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    var ret =  await updateStatusPayment('664e2e0d6823b9f6750a2b42','6659d8bd19cb077db92f13ac','OK',session,mongoose);
    //console.debug('RET: ',ret)  userId, orderId, status, session, mongoose)
    
    await session.commitTransaction();
  }catch(e){
    console.error(e)
  }
})
*/

};