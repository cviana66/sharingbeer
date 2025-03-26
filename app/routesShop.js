// =============================================================================
// ECOMMERCE SHOPPING CHAR https://github.com/EastpointSoftware/traider.io =====
// =============================================================================
var Product = require('./models/product.js');
var User = require('../app/models/user');
var lib = require('./libfunction');
var {getDistance} = require('../app/geoCoordHandler');

module.exports = function(app, moment, mongoose) {

// =============================================================================
// SHOPPING ====================================================================
// =============================================================================
//GET
	app.get('/shopping', lib.isLoggedIn, async function (req,res) {

    if (req.query.type == "Ritiro") {
      var attivaConsegna = ""
      var attivaRitiro = "active"
    } else {
      var attivaConsegna = "active"
      var attivaRitiro = ""
    }


		//====================================
		// ORDINI IN CONSEGNA
		//====================================
		var ordiniInConsegna = await User.aggregate([
								{$match:{"_id":req.user._id}},
								{$unwind:"$orders"},
								{$match:{ $and: [{'orders.status':'OK'},{'orders.deliveryType':'Consegna'},{'orders.payment.s2sStatus':'OK'}]}},
								{$project:{_id:0,addresses:0,friends:0,local:0}},
								{$sort:{'orders.dateInsert': -1}}
				]);
	 	console.debug('ORDINI IN CONSEGNA', JSON.stringify(ordiniInConsegna,null,2))
		for ( var i in  ordiniInConsegna) {
		  console.debug('DB DELIVERY DATE',ordiniInConsegna[i].orders.deliveryDate);
			ordiniInConsegna[i].orders.dateInsert = lib.formatTextDate(ordiniInConsegna[i].orders.dateInsert, 'DD.MM.YYYY - HH:mm');
			ordiniInConsegna[i].orders.deliveryDate = lib.formatTextDate(ordiniInConsegna[i].orders.deliveryDate, 'dddd DD MMMM');
			ordiniInConsegna[i].orders.shippingCost = ordiniInConsegna[i].orders.shippingCost.toFixed(2)
			ordiniInConsegna[i].orders.totalPriceBeer = ordiniInConsegna[i].orders.totalPriceBeer.toFixed(2)
			ordiniInConsegna[i].orders.totalPriceTotal = ordiniInConsegna[i].orders.totalPriceTotal.toFixed(2)
			ordiniInConsegna[i].orders.items.forEach(function(prod) {
  			prod.price = prod.price.toFixed(2)
  		});
		}
		//====================================
		// ORDINI IN RITIRO
		//====================================
		var ordiniInRitiro = await User.aggregate([
								{$match:{"_id":req.user._id}},
								{$unwind:"$orders"},
								{$match:{ $and: [{'orders.status':'OK'},{'orders.deliveryType':'Ritiro'},{'orders.payment.s2sStatus':'OK'}]}},
								{$project:{_id:0,addresses:0,friends:0,local:0,'orders.payment':0}},
								{$sort:{'orders.dateInsert': -1}}
				])
		for ( var i in  ordiniInRitiro) {
			ordiniInRitiro[i].orders.dateInsert = lib.formatTextDate(ordiniInRitiro[i].orders.dateInsert, 'DD.MM.YYYY - HH:mm')
			ordiniInRitiro[i].orders.deliveryDate = lib.formatTextDate(ordiniInRitiro[i].orders.deliveryDate, 'dddd DD MMMM');
			ordiniInRitiro[i].orders.shippingCost = ordiniInRitiro[i].orders.shippingCost.toFixed(2)
			ordiniInRitiro[i].orders.totalPriceBeer = ordiniInRitiro[i].orders.totalPriceBeer.toFixed(2)
			ordiniInRitiro[i].orders.totalPriceTotal = ordiniInRitiro[i].orders.totalPriceTotal.toFixed(2)
			ordiniInRitiro[i].orders.items.forEach(function(prod) {
  			prod.price = prod.price.toFixed(2)
  		});
		}
		//====================================
		// ORDINI CONSEGNATI
		//====================================
		var ordiniConsegnati = await User.aggregate([
								{$match:{"_id":req.user._id}},
								{$unwind:"$orders"},
								{$match:{'orders.delivery.status':'OK - CONSEGNATO'}},
								{$project:{_id:0,addresses:0,friends:0,local:0,'orders.payment':0}},
								{$sort:{'orders.delivery.date_ref': -1}}
								]);
		console.debug('ORDINI CONSEGNATI', JSON.stringify(ordiniConsegnati,null,2))
		for ( var i in  ordiniConsegnati) {
			ordiniConsegnati[i].orders.dateInsert = lib.formatTextDate(ordiniConsegnati[i].orders.dateInsert, 'DD.MM.YYYY - HH:mm');
			ordiniConsegnati[i].orders.delivery.date_ref = lib.formatTextDate(ordiniConsegnati[i].orders.delivery[0].date_ref, 'DD.MM.YYYY - HH:mm')
			ordiniConsegnati[i].orders.shippingCost = ordiniConsegnati[i].orders.shippingCost.toFixed(2)
			ordiniConsegnati[i].orders.totalPriceBeer = ordiniConsegnati[i].orders.totalPriceBeer.toFixed(2)
			ordiniConsegnati[i].orders.totalPriceTotal = ordiniConsegnati[i].orders.totalPriceTotal.toFixed(2)
			ordiniConsegnati[i].orders.items.forEach(function(prod) {
  			prod.price = prod.price.toFixed(2)
  		});
		}


		//---------------------
		// INDIRIZZO DI RITIRO
		//---------------------
		var addressRitiro = await User.aggregate([
            {$match:{"local.email": "birrificioviana@gmail.com"}},
            {$unwind: "$addresses"},
            //{$match :{ "addresses._id":mongoose.Types.ObjectId(req.body.addressID)}},
            {$project:{_id:0,friends:0,orders:0,local:0}}
            ])
	  //console.debug('INDIRIZZO RITIRO', JSON.stringify(addressRitiro,null,2))

    console.debug('SHOPPIMG req.query.orderId',req.query.orderId)

		res.render('shopping.njk', {
                  ordiniInConsegna 	: ordiniInConsegna,
                  ordiniInRitiro 		: ordiniInRitiro,
                  ordiniConsegnati 	: ordiniConsegnati,
                  numProducts 			: req.session.numProducts,
                  user 							: req.user,
                  addressRitiro 		: addressRitiro[0].addresses,
                  attivaRitiro      : attivaRitiro,
                  attivaConsegna    : attivaConsegna,
                  orderId           : req.query.orderId,
                  amiciDaInvitare : req.session.haiAmiciDaInvitare
               })
	})

// ==============================================================================================
// ORDER SUMMARY
// !!!ATTENZIONE!!! in routesRegiter c'è una parte di gestione del della consegna in /register (POST)
// ==============================================================================================
//GET
	app.get('/orderSummary', lib.isLoggedIn, (req,res) => {
			res.redirect('shop')
		})

//POST
  app.post('/orderSummary', lib.isLoggedIn, async function(req,res){

  	var address = [];
  	var c1b;

  	var refFatturaPEC = req.body.refFatturaPEC;
  	var refFatturaSDI = req.body.refFatturaSDI;

  	if (refFatturaPEC instanceof Array) {
  		refFatturaPEC = req.body.refFatturaPEC[req.body.refFatturaPEC.length - 1];
  	}
  	if (refFatturaSDI instanceof Array) {
  		refFatturaSDI = req.body.refFatturaSDI[req.body.refFatturaSDI.length - 1];
  	}

  	req.session.fatturaPEC = refFatturaPEC;
  	req.session.fatturaSDI = refFatturaSDI;

  	console.debug('refFatturaPEC', refFatturaPEC);
  	console.debug('refFatturaSDI', refFatturaSDI);

    try{

      //--------------------------------------
      // Caso di RITIRO presso Sede Birrificio
      //--------------------------------------
      if (req.body.typeOfDelivery == 'ritiro' ) {
        req.session.deliveryType =  "Ritiro"; //session usata in Axerve
        console.debug('POINT DISCOUNT BOOZE DISPONIBILI: ', req.user.local.booze);

        // Costo spedizione
        req.session.shippingCost = 0.00.toFixed(2); //session usata in Axerve

        //==============================================================================
        // Vantaggio dai tuoi amici
        // Il prezzo totale di acquisto/numero di bottigli => costo di una bottiglia
        // se i booze >= costo di una bottiglia allora faccio lo sconto
        // lo sconto massimo è del 50% su totale di acquisto
        //==============================================================================
        c1b = (req.session.totalPrc/req.session.numProducts/numBottigliePerBeerBox).toFixed(2)
        console.debug('COSTO DI 1 BOTTIGLIA: ', c1b)
        //-------------------------------------------
		// Verifica se è il primo ordine
		//-------------------------------------------
		var nOrders
		const resNorder = await User.aggregate([
			  {$match:{"_id":req.user._id}},
			  {$unwind: "$orders"},
			  {$match :{ "orders.payment.s2sStatus":"OK"}},
			  {$project:{_id:0,friends:0,addresses:0,local:0,privacy:0}},
			  {$group:{_id:null,count:{$count:{ }}}}
			  ])
		if (resNorder.length > 0) {
			nOrders=resNorder[0].count
			req.session.omaggioPrimoAcquisto = 0
		} else {
			nOrders=0
			req.session.omaggioPrimoAcquisto = c1b
		}
		console.debug("N° ORDINI",nOrders)
	   //--------------------------------------------
        if (req.user.local.booze >= c1b && req.user.local.booze <= req.session.totalPrc/2 ) {
        	req.session.pointDiscount = req.user.local.booze.toFixed(2);
        } else if (req.user.local.booze > req.session.totalPrc/2) {
        	req.session.pointDiscount = (req.session.totalPrc/2).toFixed(2)
        } else {
        	 req.session.pointDiscount = 0.00.toFixed(2);
        }

        var addressRitiro = await User.aggregate([
            {$match:{"local.email": "birrificioviana@gmail.com"}},
            {$unwind: "$addresses"},
            {$project:{_id:0,friends:0,orders:0,local:0}}
            ])
        address = addressRitiro

        var addressCliente = await User.aggregate([
            {$match:{"_id":req.user._id}},
            {$unwind: "$addresses"},
            {$match :{ "addresses.main":"yes"}},
            {$project:{_id:0,friends:0,orders:0,local:0}}
            ])

        req.session.shippingAddress = addressCliente[0].addresses;

        console.debug('ADDRESS CLIENTE: ',addressCliente[0].addresses)
        console.debug('ADDRESS RITIRO: ', addressRitiro[0].addresses)

      } else {
      //-------------------------------------------------------
      // Caso di CONSEGNA presso all'indirizzo
      //-------------------------------------------------------
        req.session.deliveryType =  "Consegna"
        console.debug('INDIRIZZO',req.body.addressID)
        address = await User.aggregate([
            {$match:{"_id":req.user._id}},
            {$unwind: "$addresses"},
            {$match :{ "addresses._id": new mongoose.Types.ObjectId(req.body.addressID)}},
            {$project:{_id:0,friends:0,orders:0,local:0}}
            ])
        req.session.shippingAddress = address[0].addresses;

		/*-----------------------------------------------------
		 * Calcolo della distanza
		 * ----------------------------------------------------*/
        let customerAddress = address[0].addresses.address + ' ' +
                          address[0].addresses.houseNumber + ' ' +
                          address[0].addresses.city +  ' ' +
                          address[0].addresses.province;
        let customerCoordinate = null;
        let birrificioAddress ='via molignati 10 candelo biella';
        let birrificioCoordinate = {'latitude': 45.5447643, 'longitude': 8.1130519} ;
        let dist = JSON.parse( await getDistance(customerAddress, birrificioAddress, customerCoordinate, birrificioCoordinate));

        console.debug('DISTANZA = ', dist.distanceInMeters)
        req.session.distance = Number(dist.distanceInMeters)

        if ( Number(dist.distanceInMeters) > 15000) {
          req.session.shippingCost = priceCurier[req.session.numProducts-1];
        } else {
          if (req.session.numProducts > 5) {
            req.session.shippingCost = '0.00';
          } else {
            console.debug('PRICE -> n° prdotti=',req.session.numProducts, 'costo=',priceLocal[req.session.numProducts-1])
            req.session.shippingCost = priceLocal[req.session.numProducts-1] // array Global definita in server.js con i prezzi di trasporto
          }
        }
        //==============================================================================
        // Vantaggio dai tuoi amici
        // Il prezzo totale di acquisto/numero di bottigli => costo di una bottiglia
        // se i booze >= costo di una bottiglia allora faccio lo sconto
        // lo sconto massimo è del 50% su totale di acquisto
        //==============================================================================
        c1b = (req.session.totalPrc/req.session.numProducts/numBottigliePerBeerBox).toFixed(2)
        console.debug('COSTO DI 1 BOTTIGLIA: ', c1b)
        //-------------------------------------------
		// Verifica se è il primo ordine
		//-------------------------------------------
		var nOrders
		const resNorder = await User.aggregate([
			  {$match:{"_id":req.user._id}},
			  {$unwind: "$orders"},
			  {$match :{ "orders.payment.s2sStatus":"OK"}},
			  {$project:{_id:0,friends:0,addresses:0,local:0,privacy:0}},
			  {$group:{_id:null,count:{$count:{ }}}}
			  ])
		if (resNorder.length > 0) {
			nOrders=resNorder[0].count
			req.session.omaggioPrimoAcquisto = 0
		} else {
			nOrders=0
			req.session.omaggioPrimoAcquisto = c1b
		}
		console.debug("N° ORDINI",nOrders)
	   //--------------------------------------------
        if (req.user.local.booze >= c1b && req.user.local.booze <= req.session.totalPrc/2 ) {
        	req.session.pointDiscount = req.user.local.booze.toFixed(2);
        } else if (req.user.local.booze > req.session.totalPrc/2) {
        	req.session.pointDiscount = (req.session.totalPrc/2).toFixed(2)
        } else {
        	req.session.pointDiscount = 0.00.toFixed(2);
        }
      }

      res.render('orderSummary.njk', {
        cartItems   : req.session.cartItems,
        address     : address[0].addresses,
        numProducts : req.session.numProducts,
        userStatus  : req.user.local.status,
        shipping    : req.session.shippingCost,
        deliveryType      : req.session.deliveryType,
        deliveryDate      : lib.deliveryDate('Europe/Rome','TXT','dddd DD MMMM','Consegna'),
        ritiroDate  			: lib.deliveryDate('Europe/Rome','TXT','dddd DD MMMM','Ritiro'),
        friendsDiscount    : req.session.pointDiscount,
        user        : req.user,
        payType     : "axerve", //"paypal"  "axerve"
        fatturaPEC  : refFatturaPEC,
        fatturaSDI  : refFatturaSDI,
        nOrders : nOrders,
        omaggio:  req.session.omaggioPrimoAcquisto,
        amiciDaInvitare: req.session.haiAmiciDaInvitare
      })
    }
    catch (e) {
      console.log ('ERROR ',e)
      req.flash('error', 'Si è verificato un errore inatteso. Siamo al lavoro per risolverlo. Se lo ritieni opportuno puoi contattarci all\'indirizzo birrificioviana@gmail.com')
      res.render('info.njk', {
        message: req.flash('error'),
        type: "danger",
        user: req.user,
        numProducts: req.session.numProducts,
        amiciDaInvitare: req.session.haiAmiciDaInvitare
      });
    }

  });

// ==========================================================================
// ORDER OUTCOME ===============================================================
// ==========================================================================
 //POST
app.post('/orderOutcome', lib.isLoggedIn, function(req, res) {
   	const status = req.body.status;
    res.render('orderOutcome.njk', {
      status  : status,
      user    : req.user,
      deliveryDate: lib.deliveryDate('Europe/Rome','TXT','dddd DD MMMM',req.user.orders.deliveryType),
      numProducts : req.session.numProducts,    
      amiciDaInvitare: req.session.haiAmiciDaInvitare
    })
 });

// ==========================================================================
// SHOP ======================================================================
// ==========================================================================
//GET
app.get('/shop', lib.isLoggedIn, async function (req, res) {
  try {
    const prods = await Product.find();

    req.flash('info', req.query.msg);

    // Mette in sessione i prodotti dal carrello e le quantità dei prodotti nel carrello
    lib.retriveCart(req);
    const cart = req.session.cart;
    //console.debug('SHOP CART', cart);
    let numProds = req.session.numProducts;
    console.debug('SHOP CART', cart);
    // GESTIONE della concorrenza nella fase di acquisto
    prods.forEach(prod => {
      prod.prettyPrice = prod.prettyPrice();
      prod.price = prod.price.toFixed(2);
      const prodId = prod._id.toString();
      //if (cart !== undefined && cart[prodId] !== undefined) {
      //if (cart !== null && cart[prodId] !== null) {
      if (cart !== undefined && cart !== null ) {
        console.debug('SHOP CART PROD ID', cart[prodId]);
        if (cart[prodId]) {
				  prod.quantity -= cart[prodId].qty; // Tolgo dallo shop quanto ho in carrello
				  // Controllo che nel frattempo non abbiano acquistato beerbox
				  // e nel caso aggiusto i quantitativi
				  if (prod.quantity < 0) {
            cart[prodId].qty += prod.quantity;
            numProds += prod.quantity;
            prod.quantity = 0;
            req.flash('info', 'Mi dispiace, ma la quantità disponibile dei beerbox per la birra ' + prod.name + ' è inferiore alla richieste ricevute a causa di acquisti simultanei. Attualmente abbiamo disponibili solo ' + cart[prodId].qty + ' beerBox. Ci impegniamo a riassortirne lo stock nel più breve tempo possibile.');
          }
        }
      }
    });

    req.session.cart = cart;

    // Rimetto in sessione i prodotti dal carrello e le quantità dei prodotti nel carrello
    lib.retriveCart(req);
    //console.debug('CATALOGO PRODOTTI: ', prods);

    //-------------------------------------------
    // Verifica se è il primo ordine
    //-------------------------------------------
    const resNorder = await User.aggregate([
      { $match: { "_id": req.user._id } },
      { $unwind: "$orders" },
      { $match: { "orders.payment.s2sStatus": "OK" } },
      { $project: { _id: 0, friends: 0, addresses: 0, local: 0, privacy: 0 } },
      { $group: { _id: null, count: { $count: {} } } }
    ]);

    const nOrders = resNorder.length > 0 ? resNorder[0].count : 0;
    console.debug("N° ORDINI", nOrders);

    const model = {
      products: prods, // Prodotti dello shop
      user: req.user, // Utente loggato
      numProducts: req.session.numProducts, // Numero di prodotti nel carrello
      message: req.flash('info'),
      type: "info",
      amiciDaInvitare: req.session.haiAmiciDaInvitare,
      nOrders: nOrders
    };

    res.render('shop.njk', model);

  } catch (err) {
    const msg = 'Opps... qualche cosa non ha funzionato... riprova per favore';
    console.error(lib.logDate("Europe/Rome") + ' [WARNING][RECOVERY:NO] "GET /shop" USERS_ID: {"_id":ObjectId("' + req.user._id + '")} ERROR: ' + err + ' FLASH: ' + msg);
    req.flash('message', msg);
    return res.render('info.njk', {
      message: req.flash('message'),
      type: "warning",
      user: req.user,
      numProducts: req.session.numProducts,
      amiciDaInvitare: req.session.haiAmiciDaInvitare
    });
  }
});

app.post('/shop', lib.isLoggedIn, async function (req, res) {
    // Load (or initialize) the cart and session.cart
    var cart = req.session.cart = req.session.cart || {};
    // Read the incoming product data from shop.njk
    var id = req.body.item_id;
    console.debug('SHOP ITEM ID', id);

    try {
        // Locate the product to be added
        const prod = await Product.findById(id);

        // Verifico se il prodotto è stato trovato
        if (!prod) {
            let msg = 'Opps... qualche cosa non ha funzionato... riprova per favore';
            req.flash('message', msg);
            return res.render('info.njk', {
              message: req.flash('message'),
              type: "warning",
              user: req.user,
              numProducts: req.session.numProducts,
              amiciDaInvitare: req.session.haiAmiciDaInvitare
            });
        }

        /*------------------------------------------------------------------------------
        / Verifico se il prodotto selezionato è disponibile.
        / La verifica è parziale a causa della possibilità di concorrenza nell'acquisto
        / da più users.
        / La verifica finale è fatta in orderSummary.
        /------------------------------------------------------------------------------*/
        var q = (!cart[id]) ? 0 : cart[id].qty; // se il carrello è vuoto

        console.debug('DISPONIBILITA: ', Number(prod.quantity), Number(q), priceCurier.length);

        if (req.session.numProducts < priceCurier.length) { // verifico il numero massimo di beerbox spedibili
            if ((Number(prod.quantity) - Number(q)) > 0) {
                // Increase quantity or add the product in the shopping cart.
                if (cart[id]) {
                    cart[id].qty++;
                    cart[id].subtotal = (cart[id].qty * cart[id].price).toFixed(2);
                    req.session.numProducts++;
                } else { // il prodotto è scelto per la prima volta
                    cart[id] = {
                        id: prod._id,
                        name: prod.name,
                        linkImage: prod.linkImage,
                        quantity: prod.quantity,
                        price: prod.price.toFixed(2),
                        prettyPrice: prod.prettyPrice(),
                        qty: 1,
                        subtotal: prod.price.toFixed(2)
                    };
                    req.session.numProducts++;
                }
                return res.status(200).send('{"statusText":"ok", "msg": ""}');
            } else {
                const msg = 'Hai aggiunto l\'ultimo beerBox disponibile. La birra ' + prod.name + ' è ora esaurita. Ci impegniamo a riassortirne lo stock nel più breve tempo possibile.';
                return res.status(200).send('{"statusText":"ko", "msg":"' + msg + '"}');
            }
        } else {
            const msg = "Hai aggiunto il numero massimo di beerBox spedibili. Se necessiti di un numero maggiore puoi scriverci all'indirizzo email birrificioviana@gmail.com";
            return res.status(200).send('{"statusText":"ko", "msg":"' + msg + '"}');
        }
    } catch (err) {
        console.error('Error adding product to cart: ', err);
        let msg = 'Opps... qualche cosa non ha funzionato... riprova per favore';
        req.flash('message', msg);
        return res.render('info.njk', {
            message: req.flash('message'),
            type: "warning",
            user: req.user,
            numProducts: req.session.numProducts,
            amiciDaInvitare: req.session.haiAmiciDaInvitare
        });
    }
});

// =============================================================================
// CART ========================================================================
// =============================================================================
//GET
app.get('/cart', lib.isLoggedIn, async function (req, res) {
  try {
    //-------------------------------------------
    // Verifica se è il primo ordine
    //-------------------------------------------
    const resNorder = await User.aggregate([
      { $match: { "_id": req.user._id } },
      { $unwind: "$orders" },
      { $match: { "orders.payment.s2sStatus": "OK" } },
      { $project: { _id: 0, friends: 0, addresses: 0, local: 0, privacy: 0 } },
      { $group: { _id: null, count: { $count: {} } } }
    ]);

    const nOrders = resNorder.length > 0 ? resNorder[0].count : 0;
    console.debug("N° ORDINI", nOrders);
    //--------------------------------------------

    const prods = await Product.find();

    // Mette in sessione i prodotti dal carrello e le quantità dei prodotti nel carrello
    lib.retriveCart(req);

    if (req.session.numProducts <= priceCurier.length) { // Verifico il numero massimo di beerbox spedibili
      const cart = req.session.cart;
      console.debug('CART in CART', cart);
      let numProds = req.session.numProducts;

      // Prods sono tutti i prodotti in catalogo su DB products
      prods.forEach(prod => {
        const prodId = prod._id.toString();
        if (cart !== undefined && cart !== null) {
				// Controllo che nel frattempo non abbiano acquistato beerbox
				// e nel caso aggiusto i quantitativi
				if (cart[prodId]) {
					prod.quantity -= cart[prodId].qty;
					if (prod.quantity < 0) {
						cart[prodId].qty += prod.quantity;
						numProds += prod.quantity;
						prod.quantity = 0;
						req.flash('cartMessage', 'Mi dispiace, ma la quantità disponibile dei beerbox per la birra ' + prod.name + ' è inferiore alla richieste ricevute a causa di acquisti simultanei. Attualmente abbiamo disponibili solo ' + cart[prodId].qty + ' beerBox. Ci impegniamo a riassortirne lo stock nel più breve tempo possibile.');
					}
				}
			}
      });

      req.session.cart = cart;
      // Mette in sessione i prodotti dal carrello e le quantità dei prodotti nel carrello
      lib.retriveCart(req);
    } else {
      req.flash('cartMessage', "Hai aggiunto il numero massimo di beerBox spedibili. Se necessiti di un numero maggiore puoi scriverci all'indirizzo email birrificioviana@gmail.com");
    }

    const model = {
      user: req.user.local,
      numProducts: req.session.numProducts,
      cart: req.session.cartItems,
      totalPrice: req.session.totalPrc,
      nOrders: nOrders,
      message: req.flash('cartMessage'),
      amiciDaInvitare: req.session.haiAmiciDaInvitare
    };

    res.render('cart.njk', model);

  } catch (err) {
    const msg = 'Opps... qualche cosa non ha funzionato... riprova per favore';
    console.error(lib.logDate("Europe/Rome") + ' [WARNING][RECOVERY:NO] "GET /cart" USERS_ID: {"_id":ObjectId("' + req.user._id + '")} ERROR: ' + err + ' FLASH: ' + msg);
    req.flash('message', msg);
    return res.render('info.njk', {
      message: req.flash('message'),
      type: "warning"
    });
  }
});

//POST MINUS ===================================================================
app.post('/cart/minus', lib.isLoggedIn, async (req, res) => {
    // Load (or initialize) the cart
    req.session.cart = req.session.cart || {};
    var cart = req.session.cart;

    // Read the incoming product data
    var id = req.body.item_id;

    try {
        // Locate the product to be added
        const prod = await Product.findById(id);

        // Verifico se il prodotto è stato trovato
        if (!prod) {
            console.log('Product not found');
            return res.redirect('/shop');
        }

        // Decrement the product quantity in the shopping cart.
        if (cart[id] && cart[id].qty > 1) {
            cart[id].qty--;
            cart[id].subtotal = (cart[id].qty * cart[id].price).toFixed(2);
            req.session.numProducts--;
        }

        // Redirect to the cart
        return res.redirect('/cart');
    } catch (err) {
        console.log('Error deleting product from cart: ', err);
        return res.redirect('/shop');
    }
});

/*	app.post('/cart/minus', lib.isLoggedIn, function (req, res) {
		//Load (or initialize) the cart
		req.session.cart = req.session.cart || {};
		var cart = req.session.cart;

		//Read the incoming product data
		var id = req.body.item_id;

		//Locate the product to be added
		Product.findById(id, function (err, prod) {
			if (err) {
				console.log('Error deleting product to cart: ', err);
				res.redirect('/shop');
				return;
			} else {
  			//decrement the product quantity in the shopping cart.
  			if (cart[id].qty > 1) {
  				cart[id].qty--;
  				cart[id].subtotal = (cart[id].qty * cart[id].price).toFixed(2)
  				req.session.numProducts--;
          //prod.quantity++;
  			}
      }
  			res.redirect('/cart');
		});
	}); */

//POST PLUS ====================================================================
app.post('/cart/minus', lib.isLoggedIn, async function (req, res) {
    // Load (or initialize) the cart
    req.session.cart = req.session.cart || {};
    var cart = req.session.cart;

    // Read the incoming product data
    var id = req.body.item_id;

    try {
        // Locate the product to be added
        const prod = await Product.findById(id);

        // Verifico se il prodotto è stato trovato
        if (!prod) {
            console.log('Product not found');
            return res.redirect('/shop');
        }

        // Decrement the product quantity in the shopping cart.
        if (cart[id] && cart[id].qty > 1) {
            cart[id].qty--;
            cart[id].subtotal = (cart[id].qty * cart[id].price).toFixed(2);
            req.session.numProducts--;
        }

        // Redirect to the cart
        return res.redirect('/cart');
    } catch (err) {
        console.log('Error deleting product from cart: ', err);
        return res.redirect('/shop');
    }
});

app.post('/cart/plus', lib.isLoggedIn, async function (req, res) {
  // Load (or initialize) the cart
  req.session.cart = req.session.cart || {};
  const cart = req.session.cart;

  // Read the incoming product data
  const id = req.body.item_id;

  try {
    // Locate the product to be added
    const prod = await Product.findById(id);

    if (!prod) {
      console.log('Product not found');
      return res.redirect('/shop');
    }

    console.debug('PROD QUANTITY in PLUS', prod.quantity);
    console.debug('PROD QUANTITY in PLUS test', prod.quantity - (cart[id] ? cart[id].qty : 0));
    console.debug('PROD TEST', req.session.numProducts, priceCurier.length);

    if (cart[id] && req.session.numProducts < priceCurier.length) { // Verifico il numero massimo di beerbox spedibili
      if (prod.quantity - cart[id].qty > 0) { // Quantità disponibile > quantità nel carrello
        cart[id].qty++;
        cart[id].subtotal = (cart[id].qty * cart[id].price).toFixed(2);
        req.session.numProducts++;
      } else if (prod.quantity - cart[id].qty < 0) { // Quantità disponibile è inferiore a quella nel carrello
        console.debug('PROD QUANTITY in PLUS < 0');
        cart[id].qty -= prod.quantity;
        cart[id].subtotal = (cart[id].qty * cart[id].price).toFixed(2);
        req.flash('cartMessage', 'Mi spiace ma la disponibilità è inferiore alla richiesta a causa di acquisti simultanei. I beerbox disponibili per la birra ' + prod.name + ' sono ' + cart[id].qty + '. A breve sarà in riassortimento');
      } else {
        req.flash('cartMessage', 'Mi spiace ma la disponibilità di birra ' + prod.name + ' è di solo ' + cart[id].qty + ' beerBox e non puoi più aggiungerne. Ci impegniamo a riassortirne lo stock nel più breve tempo possibile.');
      }
    } else {
      req.flash('cartMessage', "Hai aggiunto il numero massimo di beerBox spedibili. Se necessiti di un numero maggiore puoi scriverci all'indirizzo email birrificioviana@gmail.com");
    }

    res.redirect('/cart');

  } catch (err) {
    console.log('Error adding product to cart: ', err);
    res.redirect('/shop');
  }
});

/*	app.post('/cart/plus', lib.isLoggedIn, function (req, res) {
		//Load (or initialize) the cart
		req.session.cart = req.session.cart || {};
		var cart = req.session.cart;

		//Read the incoming product data
		var id = req.body.item_id;
		//Locate the product to be added
		Product.findById(id, function (err, prod) {
			if (err) {
				console.log('Error adding product to cart: ', err);
				res.redirect('/shop');
				return;
			} else {
        console.debug('PROD QUANTITY in PLUS',prod.quantity)
        console.debug('PROD QUANTITY in PLUS test',prod.quantity-cart[id].qty)
        console.debug('PROD TEST',req.session.numProducts, priceCurier.length)
  			if (cart[id] && req.session.numProducts < priceCurier.length) { // verifico il numero massimo di beerbox spedibili
          if (prod.quantity-cart[id].qty > 0) { // quantità disponibile > quantità nel carrello
    				cart[id].qty++;
    				cart[id].subtotal = (cart[id].qty * cart[id].price).toFixed(2)
    				req.session.numProducts++;
            //prod.quantity--;
          } else if (prod.quantity-cart[id].qty < 0){  // quantità disponibile è inferiore a quella nel carrello. Può succedere se viene fatto acquiaro da altro cliente
            console.debug('PROD QUANTITY in PLUS < 0')
            cart[id].qty = cart[id].qty - prod.quantity;
            cart[id].subtotal = (cart[id].qty * cart[id].price).toFixed(2)
            req.flash('cartMessage', 'Mi spiace ma la disponibilità è inferiore alla richiesta a causa di acquisti simultanei. I beerbox disponibili per la birra '+prod.name+' sono '+cart[id].qty+'. A breve sarà in riassortimento');
          } else {
            req.flash('cartMessage', 'Mi spiace ma la disponibilità di birra '+prod.name+' è di solo '+cart[id].qty+' beerBox e non puoi più aggiungerne. Ci impegniamo a riassortirne lo stock nel più breve tempo possibile.');
          }
        } else {
          req.flash('cartMessage', "Hai aggiunto il numero massimo di beerBox spedibili. Se necessiti di un numero maggiore puoi scriverci all'\indirizzo email birrificioviana@gmail.com")
        }
      }
			res.redirect('/cart');
		});
	});
*/
//POST DELETE ==================================================================
app.post('/cart/delete', lib.isLoggedIn, async function (req, res) {
    // Load (or initialize) the cart
    req.session.cart = req.session.cart || {};
    var cart = req.session.cart; // cart è l'oggetto sessione

    // Read the incoming product data
    var id = req.body.item_id;

    try {
        // Locate the product to be deleted
        const prod = await Product.findById(id);

        // Verifico se il prodotto è stato trovato
        if (!prod) {
            console.log('Product not found');
            return res.redirect('/shop');
        }

        // Se il prodotto è nel carrello, lo rimuovo
        if (cart[id]) {
            delete req.session.cart[id];
            req.session.numProducts = 0; // Resetta il numero di prodotti
        }

        // Redirect to the cart
        return res.redirect('/cart');
    } catch (err) {
        console.log('Error deleting product from cart: ', err);
        return res.redirect('/shop');
    }
});

// ========================= SHOP ADMIN ROUTE ==================================
// =============================================================================
// Add a new product to the database.
// =============================================================================
app.get('/product', lib.isAdmin, async (req, res) => {
    try {
        // Trova tutti i prodotti
        const prods = await Product.find();

        // Aggiungi prettyPrice a ciascun prodotto
        prods.forEach(prod => {
            prod.prettyPrice = prod.prettyPrice();
        });

        console.debug(prods);
        var model = { 
          products: prods,
          user: req.user,
          numProducts: req.session.numProducts,
          amiciDaInvitare: req.session.haiAmiciDaInvitare
        };
        console.debug(model);

        // Renderizza la vista con i prodotti
        res.render('newProduct.njk', model);
    } catch (err) {
        console.log(err);
        // Gestisci l'errore, ad esempio, puoi reindirizzare a una pagina di errore o renderizzare un messaggio
        res.status(500).send('Si è verificato un errore durante il recupero dei prodotti.');
    }
});

/*    app.get('/product',lib.isAdmin, (req,res) => {

      Product.find(function (err, prods) {
  			if (err) {
  				console.log(err);
  			}
        prods.forEach(function(prod) {
          prod.prettyPrice = prod.prettyPrice();
        });
        console.debug(prods);
        var model = { products: prods	};
        console.debug(model);
        res.render('newProduct.njk', model);
      });
    });
*/

	app.post('/product', lib.isAdmin, async (req, res) => {
    const product = new Product(req.body);

    try {
        // Salva il prodotto nel database
        await product.save();
        res.send({ message: 'Prodotto creato con successo' });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Errore durante la creazione del prodotto' });
    }
});
/*
	app.post('/product', (req, res) => {
		const product = new Product(req.body);
    product.save((err, product) => {
      if (err) {
        console.error(err);
        res.status(500).send({ message: 'Errore durante la creazione del prodotto' });
      } else {
        res.send({ message: 'Prodotto creato con successo' });
      }
    });
	});
*/

app.delete('/admin/product',lib.isAdmin,  async (req, res) => {
    try {
        // Rimuovi il prodotto dal database
        await Product.deleteOne({ _id: req.body.item_id });
    } catch (err) {
        console.log('Remove error: ', err);
        // Puoi gestire l'errore come preferisci, ad esempio restituendo un messaggio di errore
        return res.status(500).send({ message: 'Errore durante la rimozione del prodotto' });
    }
    // Redirect alla pagina dei prodotti
    res.redirect('/admin/product');
});

/*
  app.delete('/admin/product', function (req, res) {
		Product.remove({_id: req.body.item_id}, function (err) {
			if (err) {
				console.log('Remove error: ', err);
			}
			res.redirect('/admin/product');
		});
	});
*/
};
