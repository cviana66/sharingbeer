const lib           = require('./libfunction');
//const https         = require("https");  
const fetch         = require("node-fetch");
const User          = require('../app/models/user');

const {transMsg}    = require("./msgHandler");

module.exports = function(app,mongoose, moment) {

var counter;
var users;

//-------------------------------------------
//POST
//-------------------------------------------
  app.post('/axerve_create', lib.isLoggedIn, async function(req, res) {
    var cart = req.session.cart;
    const currency='EUR';
    const shopLogin="GESPAY63388"; //TODO: dichiararlo come variabile di sistema
    const paymentType =  [""]

    req.session.order = {};
 
    //==========================================
    // Inizializzo la Transazione
    //==========================================
    const session = await mongoose.startSession();
    session.startTransaction();
    const opts = { session };
    
    try {
      //==========================================
      // Inserimento dati in MongoDB
      //==========================================
      const user = await User.findById(req.user._id);
      const orderId = new mongoose.Types.ObjectId()   // genero _id usato poi nell'ordine e in Axerve 
      req.session.order._id = orderId;                // _id in sessione usato per update ordine in axerve_response
      req.session.order.totalaAmount = (Number(req.session.totalPrc)+Number(req.session.shipping)-Number(req.session.pointDiscount)-Number(req.session.shippingDiscount)).toFixed(2)
      console.debug('Sharingbeer ORDER ID :', req.session.order._id.toString());

      user.orders.push({
          _id         : orderId,
          email       : req.user.local.email,
          dateInsert  : Date.now(),
          status      : "CREATED",
          shipping          : Number(req.session.shipping).toFixed(2),
          shippingDiscount  : Number(req.session.shippingDiscount).toFixed(2),
          pointsDiscount    : Number(req.session.pointDiscount).toFixed(2),
          totalPriceBeer    : Number(req.session.totalPrc).toFixed(2),
          totalPriceTotal   : req.session.order.totalaAmount,
          items : req.session.cartItems.items,
          totalQty : req.session.totalQty,        
          'paypal.createTime'     : moment().format('DD/MM/yyyy hh:mm:ss'),
          'paypal.orderId'        : req.session.order._id.toString(),
          'paypal.currencyAmount' : currency,
          'paypal.totalAmount'    : req.session.order.totalaAmount,
          address : req.session.shippingAddress,
          'address.addressID' : req.session.shippingAddress._id.toString()        
      });
      let saveOrder = await user.save(opts);

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
            "paymentType":paymentType,
            "amount": (Number(req.session.totalPrc)+Number(req.session.shipping)-Number(req.session.pointDiscount)-Number(req.session.shippingDiscount)).toFixed(2),
            "currency": currency,
            "shopTransactionID" : req.session.order._id.toString(),
            "paymentType": paymentType
          })
        }
      ).then(function(result) {
        //console.debug("RESULT -> : ",result);
        return result.json();
      });
      console.debug("DATA -> : ",data);

      if (data.error.code != 0) {
        data.ok = false;
        console.error(moment().format() + ' [ERROR][RECOVERY:NO] "POST /axerve_create" USER: {_id:bjectId("' + req.user._id + '"} ' + JSON.stringify(data));
        await session.abortTransaction();
        res.status(500).json(data);  
      } else {
        await session.commitTransaction();
        res.status(200).json(data);  
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
            'orders.$[el].paypal.transactionId' : payment_id,    
            'orders.$[el].paypal.updateTime'    : moment().format('DD/MM/yyyy hh:mm:ss')     
          }

      let updateOrder = await User.findOneAndUpdate(
                                {_id: req.user._id},
                                {'$set':update},
                                {arrayFilters: [{"el._id": req.session.order._id}]}
                                ).session(session);

      await session.commitTransaction();

      if (status == 'OK' && error_code == 0) {
        
        //=====================================
        // Svuoto il carrello
        //=====================================
        req.session.cart = {}

        //TODO: sostituire con pagina ad HOC
        req.flash('info','AXERVE Pagamento effettuato orderId = ' + req.session.order._id.toString() +' '+ error_code + error_description);
        res.render('info.njk',{
                                message: req.flash('info'),
                                type: "info"
                              });
      }else{
        //TODO: sostituire con pagina ad HOC
        req.flash('warning','AXERVE Pagmento non avvenuto orderId  = ' + req.session.order._id.toString() +' '+ error_code + error_description);
        res.render('info.njk',{
                                message: req.flash('warning'),
                                type: "warning"
                              });
      }
    } catch (e) {
      await session.abortTransaction();
      console.error(moment().format() + ' [ERROR][RECOVERY:NO] "POST /axerve_response" USER: {_id:bjectId("' + req.user._id + '"} FUNCTION: User.save: ' + e);
      res.status(500).send();
    } finally {
          await session.endSession();
    };
  });
};