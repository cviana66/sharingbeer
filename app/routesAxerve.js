const lib           = require('./libfunction');
const fetch         = require("node-fetch");
const bcrypt        = require('bcrypt-nodejs');
const User          = require('../app/models/user');
const mailorder     = require('../config/mailOrder');
const {transMsg}    = require("./msgHandler");
const Product       = require('./models/product.js');
const Recovery      = require('./models/recovery');
const GestpayService = require('./gestpay_service/GestpayService');
const axerveResMgm  = require('../app/axerveResposeManagement');

module.exports = function(app,mongoose,moment) {

var counter;
var users;
const gestpayService = new GestpayService();

//-------------------------------------------
//POST
//-------------------------------------------
  app.post('/axerve_create', lib.isLoggedIn, async function(req, res) {
    
    var cart = req.session.cart;
    const currency='EUR';
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

      const _orderId = new mongoose.Types.ObjectId()   // genero _id usato poi nell'ordine e in Axerve 
      const orderId  = _orderId.toString();
      const amount   = req.session.order.totalaAmount = (Number(req.session.totalPrc)+Number(req.session.shippingCost)-Number(req.session.pointDiscount)).toFixed(2)
      
      //================================================
      // Chiamo Axerve per ottenere la stringa ENCRYPT
      //================================================
      console.debug('IMPORTO CALCOLATO', (Number(req.session.totalPrc)+Number(req.session.shippingCost)-Number(req.session.pointDiscount)).toFixed(2));
      console.debug('IMPORTO in SESSIONE', req.session.order.totalaAmount)

      const url = 'https://sandbox.gestpay.net/pagam/pagam.aspx'; 
      if (process.env.MODE_ENV == 'Production') {
            const url = 'https://ecomm.sella.it/pagam/pagam.aspx';
      } 

      const cryptedString = await gestpayService.encrypt({
          amount,
          orderId
        })
        .then(cryptedString => {          
          return cryptedString;        
        })
        .catch(err => {
          console.log('ERRORE in encrypt', err)
          throw new Error("Encrypt fallita")
        });  
      
      //==========================================
      // Inserimento dati in MongoDB
      //==========================================
      const user = await User.findById(req.user._id);
      user.orders.push({
        _id         : _orderId,
        email       : req.user.local.email,
        dateInsert  : new Date(moment().utc("Europe/Rome").format()),
        status      : "CREATED",
        fatturaPEC  : req.session.fatturaPEC,
        fatturaSDI  : req.session.fatturaSDI,
        pointsDiscount  : Number(req.session.pointDiscount).toFixed(2),
        shippingCost    : Number(req.session.shippingCost).toFixed(2),
        deliveryType    : req.session.deliveryType,
        deliveryDate    : lib.deliveryDate('formato_data'),
        totalPriceBeer  : Number(req.session.totalPrc).toFixed(2),
        totalPriceTotal : Number(req.session.order.totalaAmount).toFixed(2),
        items     : req.session.cartItems.items,
        totalQty  : req.session.totalQty,        
        address   : req.session.shippingAddress,
        'payment.shopLogin'        : shopLogin,
        'payment.createTime'       : moment().utc("Europe/Rome").format('DD/MM/yyyy HH:mm:ss'),
        'payment.orderId'          : orderId,
        'payment.currencyAmount'   : currency,
        'payment.totalAmount'      : req.session.order.totalaAmount,
        'payment.paymentType'      : 'Banca Sella'        
      });          
      let saveOrder = await user.save(opts);
      await session.commitTransaction();

      let data = {}
      data.shopLogin = shopLogin;
      data.cryptedString = cryptedString,
      data.url = url;
      console.debug('DATA', JSON.stringify(data,null,2))
      res.status(200).send(data);  

    } catch (e) {
        console.error(moment().utc("Europe/Rome").format() + ' [ERROR][RECOVERY:NO] "POST /axerve_create" USER: {_id:bjectId("' + req.user._id + '"} FUNCTION: User.save: ' + e);
        await session.abortTransaction();
        res.status(400).send(e)
    } finally {
        await session.endSession();
    };
  });

//=============================================================
// Chiamata usata da Axerve per allineamento Server TO Server
//=============================================================
  app.get('/response', async function(req, res) {
    
    //================================================
    // Chiamo Axerve per ottenere la stringa DENCRYPT
    //================================================
    let shopLogin     = req.query.a;
    let cryptedString = req.query.b;
    
    const decryptedString = await gestpayService
      .decrypt({
        shopLogin,
        cryptedString
      })
      .then(result => {
        console.debug('Decrypt =>',result);
        return result
      })
      .catch(err => {
        console.log('ERRORE in encrypt', err)
        throw new Error("Dencrypt fallita")
      });

    //==========================================
    // Inizializzo la Transazione
    //==========================================
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {  
    
      const status  = decryptedString.TransactionResult;
      const orderId = decryptedString.ShopTransactionID;
      const user = await axerveResMgm.getUserByShopLoginAndOrderId(shopLogin, orderId);

      if (user.orders.status === 'CREATED') {

        const _userId   = user._id;
        const userId    = user._id.toString();
        var   booze     = user.local.booze; //X
        const totalPrc  = user.orders.totalPriceBeer; //X
        const parentId  = user.local.idParent;
        const name      = user.local.name.first;
        const userEmail = user.local.email;

        //==========================================
        // UPDATE Esito del pagamento 
        //==========================================
        let doc = await axerveResMgm.updateResponsePayment(_userId, decryptedString, session, mongoose);               
        
        if ( status == 'OK') {            
      
          //=====================================
          // aggiungo possibilità di invito
          // aggiungo punto Pinta al cliente Padre
          // decurto punti pinta al Cliente
          //=====================================        
          await axerveResMgm.updateInviteAndPoint(user, session, mongoose)
          
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
          //==============================================
          axerveResMgm.addItemsInProductsByOrderId(orderId,shopLogin);
        }
        await session.commitTransaction();
      }
    
    } catch(e) {
      console.error('ERRORE IN RESPONSE:',e);
      await session.abortTransaction();
      
      //==============================================
      //RECOVERY in documento per recupero transazione    
      //==============================================
      console.debug('URL = ',lib.getServer(req)+'/response?a='+req.query.a+'&b='+req.query.b);
      
      const recoveryUrl = lib.getServer(req)+'/response?a='+req.query.a+'&b='+req.query.b;
      const recoveryOrder = new Recovery({dateInsert: moment().utc("Europe/Rome").format(),
                                          orderId:decryptedString.ShopTransactionID, 
                                          url:recoveryUrl});
      
      recoveryOrder.save()
      .then(function (doc) {
        console.debug("RECOVERY ID",doc._id.toString());
      }).catch(function (error) {
        console.error(error);
      });
    
    } finally {
      await session.endSession();
      setTimeout(() => res.send('Fatto!'), 500);
    }
  });

//====================================================
// RESPONSE POSITIVA
//====================================================
  app.get('/response_positiva',lib.isLoggedIn, async function(req,res) {  
    
    //================================================
    // Chiamo Axerve per ottenere la stringa DENCRYPT
    //================================================
    let shopLogin = req.query.a;
    let cryptedString = req.query.b;
    const decryptedString = await gestpayService
      .decrypt({
        shopLogin,
        cryptedString
      })
      .then(result => {
        console.log(result);
        return result
        //resultJson = JSON.stringify(result, null, 2);
      })
      .catch(err => {
        console.log('ERRORE in encrypt', err)
        throw new Error("Dencrypt fallita")
      });

    try {
            
      req.user = await axerveResMgm.getUserByShopLoginAndOrderId(shopLogin,decryptedString.ShopTransactionID);
          
      //=====================================
      // Svuoto il carrello
      //=====================================
      req.session.cart = {}
      req.session.order = {}
      req.session.numProducts = 0

      res.render('orderOutcome.njk', {
            status  : decryptedString.TransactionResult,
            deliveryDate : moment(req.user.orders.deliveryDate).format('dddd DD MMMM'),
            user : req.user,
            numProducts : 0
      });

    }catch (e){
      console.error(moment().utc("Europe/Rome").format() + ' [ERROR][RECOVERY:NO] "GET /response_positiva"  PARAMETRI RISPOSTA POSITIVA: '+req.query.toString()+' ERRORE:'+e);
      let msg = 'Ci dispiace, si è verificato un errore inatteso. L\'esito del pagamento sarà verificato e ti manterremo informato. Se lo ritieni opportuno puoi contattarci all\'indirizzo birrificioviana@gmail.com'
      req.flash('error', msg);
      return res.render('info.njk', {
                                      message: req.flash('error'),
                                      type: "danger"
                                    });
    }    
  });

  app.get('/response_negativa', lib.isLoggedIn, function(req,res) {

    console.debug('PARAMETRI RISPOSTA NEGATIVA: ',req.query);
    res.render('orderOutcome.njk', {
            status  : 'KO'
    });
  });
};