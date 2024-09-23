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
                  orderId           : req.query.orderId
               })
	})

// =================================================================================================
// ORDER SUMMARY  
// !!!ATTENZIONE!!! in routesRegiter c'è una parte di gestione del della consegna in /register (POST)
// ==============================================================================================
//-------------------------------------------
//POST
//-------------------------------------------
  app.get('/orderSummary', lib.isLoggedIn, async function(req,res){

  	var address = [];

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
      if (req.query.typeOfDelivery == 'ritiro' ) {
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
        const c1b = req.session.totalPrc/req.session.numProducts/numBottigliePerBeerBox
        console.debug('COSTO DI 1 BOTTIGLIA: ', c1b)
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
      // Caso di CONSEGNA presso all'indirizzo indirizzo 
      //-------------------------------------------------------
        req.session.deliveryType =  "Consegna"
        
        address = await User.aggregate([
            {$match:{"_id":req.user._id}}, 
            {$unwind: "$addresses"}, 
            {$match :{ "addresses._id":mongoose.Types.ObjectId(req.query.addressID)}},
            {$project:{_id:0,friends:0,orders:0,local:0}}
            ])
        req.session.shippingAddress = address[0].addresses;         

        let customerAddress = address[0].addresses.address + ' ' + 
                          address[0].addresses.houseNumber + ' ' +
                          address[0].addresses.city +  ' ' +
                          address[0].addresses.province;
        let customerCoordinate = null;
        let birrificioAddress ='via molignati 10 candelo biella';
        let birrificioCoordinate = {'latitude': 45.5447643, 'longitude': 8.1130519} ;
        let dist = JSON.parse( await getDistance(customerAddress, birrificioAddress, customerCoordinate, birrificioCoordinate));

        console.log('DISTANZA = ', dist.distanceInMeters)

        if ( Number(dist.distanceInMeters) > 15000) {
          req.session.shippingCost = priceCurier[req.session.numProducts-1];
        } else {
          if (req.session.numProducts > 5) {
            req.session.shippingCost = '0.00';
          } else {
            console.debug('PRICE: ',req.session.numProducts,  priceLocal[req.session.numProducts-1])
            req.session.shippingCost = priceLocal[req.session.numProducts-1] // array Global definita in server.js con i prezzi di trasporto
          }
        }
        //==============================================================================
        // Vantaggio dai tuoi amici 
        // Il prezzo totale di acquisto/numero di bottigli => costo di una bottiglia
        // se i booze >= costo di una bottiglia allora faccio lo sconto
        // lo sconto massimo è del 50% su totale di acquisto  
        //==============================================================================
        const c1b = req.session.totalPrc/req.session.numProducts/numBottigliePerBeerBox
        console.debug('COSTO DI 1 BOTTIGLIA: ', c1b)
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
        discount    : req.session.pointDiscount,
        user        : req.user,
        payType     : "axerve", //"paypal"  "axerve"
        fatturaPEC  : refFatturaPEC,
        fatturaSDI  : refFatturaSDI
      })
    }
    catch (e) {
      console.log ('ERROR ',e)
      req.flash('error', 'Si è verificato un errore inatteso. Siamo al lavoro per risolverlo. Se lo ritieni opportuno puoi contattarci all\'indirizzo birrificioviana@gmail.com') 
      res.render('info.njk', {
          message: req.flash('error'),
          type: "danger"
      });
    }

  });

// =============================================================================
// ORDER OUTCOME ===============================================================
// =============================================================================
/*GET
	app.get('/orderOutcome', lib.isLoggedIn, function(req, res) {
	
	//TODO da finire l'implemetazione ... solo abbozzata 

    res.render('orderOutcome.njk', {
      status  : 'OK',
      user    : req.user,
      deliveryDate: lib.deliveryDate(),
      numProducts : req.session.numProducts
    })

  });
*/
  //POST
	app.post('/orderOutcome', lib.isLoggedIn, function(req, res) {
   	const status = req.body.status;    
    
    res.render('orderOutcome.njk', {
      status  : status,
      user    : req.user,
      deliveryDate: lib.deliveryDate('Europe/Rome','TXT','dddd DD MMMM',req.user.orders.deliveryType),
      numProducts : req.session.numProducts
    })
  });


// =============================================================================
// SHOP ========================================================================
// =============================================================================
//GET
  app.get('/shop', lib.isLoggedIn, function (req,res) {

  	Product.find(function (err, prods) {
  		if (err) {
  			let msg = 'Opps... qualche cosa non ha funzionato... riprova per favore';
  			console.error(lib.logDate("Europe/Rome")+' [WARNING][RECOVERY:NO] "POST /shop" USERS_ID: {"_id":ObjectId("' + req.user._id + '")} ERROR: '+err+' FLASH: '+msg);
        req.flash('message', msg);
        return res.render('info.njk', {
            message: req.flash('message'),
            type: "warning"
        })
  		} else {
  			req.flash('info', req.query.msg);

        //mette in sessione i prodotti dal carrello e le quantità dei prodotti nel carrello
        lib.retriveCart(req);
        var cart = req.session.cart
        console.debug('SHOP CART', cart)
        var numProds = req.session.numProducts

	  		prods.forEach(function(prod) {
	  			prod.prettyPrice = prod.prettyPrice();
	  			prod.price = prod.price.toFixed(2)
          prodId = prod._id.toString()
          if (cart != undefined) {

            //tolgo dallo shop quanto ho in carrello            
            if (cart[prodId] != undefined) {
              prod.quantity = prod.quantity - cart[prodId].qty              
              // controlo che nel frattempo non abbiano acquistato beerbox
              // e nel caso aggiusto i quantitativi 
              if (prod.quantity < 0 ) {                
                cart[prodId].qty = cart[prodId].qty + prod.quantity
                numProds = numProds + prod.quantity
                prod.quantity = 0
                req.flash('info','Mi dispiace, ma la quantità disponibile dei beerbox per la birra '+prod.name+' è inferiore alla richieste rivevute a causa di acquisti simultanei. Attualmente abbiamo disponibili solo '+cart[prodId].qty+' beerBox. Ci impegniamo a riassortirne lo stock nel più breve tempo possibile.')
              } 
            }

          }
	  		});
        req.session.cart = cart
        //mette in sessione i prodotti dal carrello e le quantità dei prodotti nel carrello
        lib.retriveCart(req);
	  		console.debug('CATALOGO PRODOTTI: ',prods)

			  var model =  { products   : prods,                     //prodotti dello shop
	  						       user       : req.user,                  //utente loggato
	  						       numProducts: req.session.numProducts,   //numero di proodotti nel carrello	  						       
	                     message    : req.flash('info'),
	                     type       : "info"
	  					       };
	      
	  		res.render('shop.njk', model);
  		}
  	});
  });

//POST
	app.post('/shop', lib.isLoggedIn ,async function (req, res) {
		//Load (or initialize) the cart and session.cart
		var cart = req.session.cart = req.session.cart || {};
		//Read the incoming product data from shop.njk
		var id = req.body.item_id;
    console.debug('SHOP ITEM ID',id )

		//Locate the product to be added
		Product.findById(id, function (err, prod) {
			if (err) {
				//console.log('SHOP POST Error adding product to cart: ', err);
				//res.redirect('/shop');
				//return;
        let msg = 'Opps... qualche cosa non ha funzionato... riprova per favore';
        req.flash('message', msg);
        return res.render('info.njk', {
            message: req.flash('message'),
            type: "warning"
        })
			} else {
				/*------------------------------------------------------------------------------
				/ Verifico se il prodotto selezioanto è disponibile.
				/ La verifica è parziale a causa della possibilità di concorrenza nell'acquisto
				/ da più users. 
				/ La verifica finale è fatta in orderSummary.
				/------------------------------------------------------------------------------*/
				var q =  (!cart[id]) ? 0 : cart[id].qty; //se il carrello è vuoto

				console.debug('DISPONIBILITA: ', Number(prod.quantity), Number(q), priceCurier.length)

				if (req.session.numProducts < priceCurier.length) { // verifico il numero massimo di beerbox spedibili
          if ((Number(prod.quantity) - Number(q)) > 0) {
  					
  					//Increase quantity or add the product in the shopping cart.
  					if (cart[id]) {
  						cart[id].qty++;
  						cart[id].subtotal=(cart[id].qty*cart[id].price).toFixed(2);
  						req.session.numProducts++;
  					}	else { //il prodotto è scelto per la prima volta
  						cart[id] = {
  							id : prod._id,
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
            res.status(200).send('{"statusText":"ok", "msg": ""}');
  				} else {
  					const msg = 'Hai aggiunto l\'ultimo beerBox disponibile. La birra '+prod.name+' è ora esaurita. Ci impegniamo a riassortirne lo stock nel più breve tempo possibile.'
            res.status(200).send('{"statusText":"ko", "msg":"'+msg+'"}');
  				}
        } else { 
          const msg = "Hai aggiunto il numero massimo di beerBox spedibili. Se necessiti di un numero maggiore puoi scriverci all'\indirizzo email birrificioviana@gmail.com"
          res.status(200).send('{"statusText":"ko", "msg":"'+msg+'"}');
        }
			}

		});
	});
// =============================================================================
// CART ========================================================================
// =============================================================================
//GET
	app.get('/cart', lib.isLoggedIn, function (req, res) {
    
		Product.find(function (err, prods) {
      if (err) {
        let msg = 'Opps... qualche cosa non ha funzionato... riprova per favore';
        console.error(lib.logDate("Europe/Rome")+' [WARNING][RECOVERY:NO] "POST /shop" USERS_ID: {"_id":ObjectId("' + req.user._id + '")} ERROR: '+err+' FLASH: '+msg);
        req.flash('message', msg);
        return res.render('info.njk', {
            message: req.flash('message'),
            type: "warning"
        })
      } else {
        //mette in sessione i prodotti dal carrello e le quantità dei prodotti nel carrello
        lib.retriveCart(req);
        if (req.session.numProducts <= priceCurier.length) { // verifico il numero massimo di beerbox spedibili
          
          var cart = req.session.cart
          console.debug('CART in CART', cart)
          var numProds = req.session.numProducts

          prods.forEach(function(prod) {
            prodId = prod._id.toString()
            if (cart != undefined) {
              
              if (cart[prodId] != undefined) {
                // controlo che nel frattempo non abbiano acquistato beerbox
                // e nel caso aggiusto i quantitativi 
                prod.quantity = prod.quantity - cart[prodId].qty                            
                if (prod.quantity < 0 ) {                
                  cart[prodId].qty = cart[prodId].qty + prod.quantity
                  numProds = numProds + prod.quantity
                  prod.quantity = 0
                  req.flash('cartMessage','Mi dispiace, ma la quantità disponibile dei beerbox per la birra '+prod.name+' è inferiore alla richieste rivevute a causa di acquisti simultanei. Attualmente abbiamo disponibili solo '+cart[prodId].qty+' beerBox. Ci impegniamo a riassortirne lo stock nel più breve tempo possibile.')
                } 
              }
            }
          });
          req.session.cart = cart
          //mette in sessione i prodotti dal carrello e le quantità dei prodotti nel carrello
          lib.retriveCart(req);
        }else{
          req.flash('cartMessage', "Hai aggiunto il numero massimo di beerBox spedibili. Se necessiti di un numero maggiore puoi scriverci all'\indirizzo email birrificioviana@gmail.com")
        }
    		var model = { user       : req.user.local,
      						    numProducts: req.session.numProducts,
      						    cart       : req.session.cartItems,
                      totalPrice : req.session.totalPrc,
                      message    : req.flash('cartMessage'),
      					    };
      	res.render('cart.njk', model);
      }
    });
	});

//POST MINUS ===================================================================
	app.post('/cart/minus', lib.isLoggedIn, function (req, res) {
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
	});

//POST PLUS ====================================================================
	app.post('/cart/plus', lib.isLoggedIn, function (req, res) {
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

//POST DELETE ==================================================================
	app.post('/cart/delete', lib.isLoggedIn, function (req, res) {
		//Load (or initialize) the cart
		req.session.cart = req.session.cart || {};
		var cart = req.session.cart; //cart è l'oggetto sessione

		//Read the incoming product data
		var id = req.body.item_id;

		//Locate the product to be added
		Product.findById(id, function (err, prod) {
			if (err) {
				console.log('Error deleting product to cart: ', err);
				res.redirect('/shop');
				return;
			} else {
  			if (cart[id]) {
  				delete req.session.cart[id];
  				req.session.numProducts=0;
  			}
      }
			res.redirect('/cart');
		});
	});

/*
  // GET ORDER ===========================================================================
  app.get('/order', lib.isLoggedIn, function(req, res) {
    Order.find({idUser:req.user._id}, function(err, orders) {

      var displayOrder = {items: []};

      if (err) {
        var error = 'Something bad happened! Please try again.';
        console.log("error code: ",err.code);
      } else {

        if (!orders) {
          //TODO manahement if not exist order ????
          console.log("Order not exist");
        } else {
        //Prepare JSON Items for transactions
          for (var item in orders) {

            if (orders[item].status != 'reserved') {
              displayOrder.items.push(orders[item]);
            }
          }

          var model = { order: displayOrder };
          res.render('order.dust', model);
        }
      }

    });
*/
// ========================= SHOP ADMIN ROUTE ==================================
// =============================================================================
// Add a new product to the database.
// =============================================================================

    app.get('/product',lib.isAdmin, (req,res) => {

      Product.find(function (err, prods) {
  			if (err) {
  				console.log(err);
  			}
        prods.forEach(function(prod) {
          prod.prettyPrice = prod.prettyPrice();
        });
        console.log(prods);
        var model = { products: prods	};
        console.log(model);
        res.render('newProduct.njk', model);
      });
    });


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

  app.delete('/admin/product', function (req, res) {
		Product.remove({_id: req.body.item_id}, function (err) {
			if (err) {
				console.log('Remove error: ', err);
			}
			res.redirect('/admin/product');
		});
	});

};
