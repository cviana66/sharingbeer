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

		var ordiniInConsegna = await User.aggregate([
								{$match:{"_id":req.user._id}},
								{$unwind:"$orders"},
								{$match:{ $and: [{'orders.status':'OK'},{'orders.deliveryType':'Consegna'},{'orders.paypal.s2sStatus':'OK'}]}},
								{$project:{_id:0,addresses:0,friends:0,local:0}},
								{$sort:{'orders.dateInsert': -1} }]);
	
		for ( var i in  ordiniInConsegna) {			
			ordiniInConsegna[i].orders.dateInsert = moment(ordiniInConsegna[i].orders.dateInsert).format('DD.MM.YYYY - HH:mm');
			ordiniInConsegna[i].orders.deliveryDate = moment(ordiniInConsegna[i].orders.deliveryDate).format('dddd DD MMMM');

		}

		var ordiniInRitiro = await User.aggregate([
								{$match:{"_id":req.user._id}},
								{$unwind:"$orders"},
								{$match:{ $and: [{'orders.status':'OK'},{'orders.deliveryType':'Ritiro'},{'orders.paypal.s2sStatus':'OK'}]}},
								{$project:{_id:0,addresses:0,friends:0,local:0,'orders.paypal':0}}])
		for ( var i in  ordiniInRitiro) {			
			ordiniInRitiro[i].orders.dateInsert = moment(ordiniInRitiro[i].orders.dateInsert).format('DD.MM.YYYY - HH:mm')
		}

		var ordiniConsegnati = await User.aggregate([
								{$match:{"_id":req.user._id}},
								{$unwind:"$orders"},
								{$match:{'orders.status':'OK - CONSEGNATO'}},
								{$project:{_id:0,addresses:0,friends:0,local:0,'orders.paypal':0}}]);
		for ( var i in  ordiniConsegnati) {			
			ordiniConsegnati[i].orders.dateInsert = moment(ordiniConsegnati[i].orders.dateInsert).format('DD.MM.YYYY - HH:mm')
		}

		//console.debug('ORDINI IN CONSEGNA: ',JSON.stringify(ordiniInConsegna, null, 2))
		res.render('shopping.njk', {
                  ordiniInConsegna : ordiniInConsegna,
                  ordiniInRitiro : ordiniInRitiro,
                  ordiniConsegnati : ordiniConsegnati,
                  numProducts : req.session.numProducts,
                  user : req.user
               })
	})

// =================================================================================================
// ORDER SUMMARY  
// !!!ATTENZIONE!!! in routesRegiter c'è una parte di gestione del della consegna in /register (POST)
// =================================================================================================
//-------------------------------------------
//POST
//-------------------------------------------
  app.post('/orderSummary', lib.isLoggedIn, async function(req,res){

<<<<<<< HEAD
  	var address = [];

=======
>>>>>>> 94e856d48674cf175d63810012f7c6afa78489f1
    try{

      //--------------------------------------
      // Caso di ritiro presso Sede Birrificio
      //--------------------------------------
<<<<<<< HEAD
      if (req.body.typeOfDelivery == 'ritiro' ) {
        req.session.deliveryType =  "Ritiro";
        // Booze attualmente disponibili
        console.debug('POINT DISCOUNT BOOZE: ', req.user.local.booze);
        req.session.booze = req.user.local.booze;
=======
      if (req.body.addressID == '0' ) {
        
        // Booze attualmente disponibili
        console.debug('POINT DISCOUNT BOOZE: ', req.user.local.booze)
        req.session.booze = req.user.local.booze
>>>>>>> 94e856d48674cf175d63810012f7c6afa78489f1
        
        // Costo spedizione
        req.session.shippingCost = 0.00.toFixed(2);

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
        	req.session.booze = 0
        } else if (req.user.local.booze > req.session.totalPrc/2) {
        	req.session.pointDiscount = (req.session.totalPrc/2).toFixed(2)
        	req.session.booze = req.session.booze - (req.session.totalPrc/2)        	
        } else {
        	 req.session.pointDiscount = 0.00.toFixed(2); 
        }

        console.debug('NEW BOOZE: ',req.session.booze)
<<<<<<< HEAD
        console.debug('ADDRESS ID:',req.body.addressID)
        /*
=======
        
>>>>>>> 94e856d48674cf175d63810012f7c6afa78489f1
        var address = await User.aggregate([
            {$match:{"local.email": "birrificioviana@gmail.com"}}, 
            {$unwind: "$addresses"}, 
            //{$match :{ "addresses._id":mongoose.Types.ObjectId(req.body.addressID)}},
            {$project:{_id:0,friends:0,orders:0,local:0}}
<<<<<<< HEAD
            ])*/
        address = await User.aggregate([
            {$match:{"_id":req.user._id}}, 
            {$unwind: "$addresses"}, 
            {$match :{ "addresses.main":"yes"}},
            {$project:{_id:0,friends:0,orders:0,local:0}}
            ])

        req.session.shippingAddress = address[0].addresses;  
        console.debug('ADDRESS[0]: ',address[0].addresses)       
        
=======
            ])
        req.session.shippingAddress = address[0].addresses;  
        //console.debug('ADDRESS[0]: ',address[0].addresses)       
        req.session.deliveryType =  "Ritiro"
>>>>>>> 94e856d48674cf175d63810012f7c6afa78489f1
      } else {
      //-------------------------------------------------------
      // Caso di spedizione presso all'indirizzo indirizzo 
      //-------------------------------------------------------
        //TODO : rendere parametrico l'importo shipping e i discount
        
        req.session.deliveryType =  "Consegna"
        
        address = await User.aggregate([
            {$match:{"_id":req.user._id}}, 
            {$unwind: "$addresses"}, 
            {$match :{ "addresses._id":mongoose.Types.ObjectId(req.body.addressID)}},
            {$project:{_id:0,friends:0,orders:0,local:0}}
            ])
        req.session.shippingAddress = address[0].addresses;         
        //console.debug('ADDRESS[0]: ',address[0].addresses)

        let customerAddress = address[0].addresses.address + ' ' + 
                          address[0].addresses.houseNumber + ' ' +
                          address[0].addresses.city +  ' ' +
                          address[0].addresses.province;
<<<<<<< HEAD
        let customerCoordinate = null;
        let birrificioAddress ='via molignati 10 candelo biella';
        let birrificioCoordinate = {'latitude': 45.5447643, 'longitude': 8.1130519} ;
        let dist = JSON.parse( await getDistance(customerAddress, birrificioAddress, customerCoordinate, birrificioCoordinate));
=======
        let birrificioAddress ='via molignati 10 candelo biella';
        let dist = JSON.parse( await getDistance(customerAddress, birrificioAddress));
>>>>>>> 94e856d48674cf175d63810012f7c6afa78489f1

        console.log('DISTANZA = ', dist.distanceInMeters)

        if ( Number(dist.distanceInMeters) > 15000) {
          req.session.shippingCost = priceCurier[req.session.numProducts-1];
        } else {
          if (req.session.numProducts > 5) {
            req.session.shippingCost = '0.00';
          } else {
            console.debug('PRICE: ',req.session.numProducts,  priceLocal[req.session.numProducts-1])
            req.session.shippingCost = priceLocal[req.session.numProducts-1]
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
        	req.session.booze = 0
        } else if (req.user.local.booze > req.session.totalPrc/2) {
        	req.session.pointDiscount = (req.session.totalPrc/2).toFixed(2)
        	req.session.booze = req.session.booze - (req.session.totalPrc/2)        	
        } else {
        	req.session.pointDiscount = 0.00.toFixed(2); 
        }
      }
      console.debug('FORAMATO DATA DATA: ', lib.deliveryDate('formato_data') )
      console.debug('FORAMATO DATA TEXT: ', lib.deliveryDate() )
      
      res.render('orderSummary.njk', {
        cartItems   : req.session.cartItems,
        address     : address[0].addresses,
        numProducts : req.session.numProducts,
        userStatus  : req.user.local.status,
        shipping    : req.session.shippingCost,
        deliveryType      : req.session.deliveryType,
        deliveryDate      : lib.deliveryDate(),
        discount    : req.session.pointDiscount,
        user        : req.user,
        payType     : "axerve" //"paypal"  "axerve"
      })
    }
    catch (e) {
      console.log ('ERROR ',e)
      req.flash('error', 'Mi dspiace, si è verificato un errore inatteso. Siamo al lavoro per risolverlo. Se lo ritieni opportuno puoi contattarci all\'indirizzo birrificioviana@gmail.com') 
      res.render('info.njk', {
          message: req.flash('error'),
          type: "danger"
      });
    }

  });

// =============================================================================
// ORDER OUTCOME ===============================================================
// =============================================================================
//GET
	app.get('/orderOutcome', lib.isLoggedIn, function(req, res) {
	
	//TODO da finire l'implemetazione ... solo abbozzata 

    res.render('orderOutcome.njk', {
      status  : 'KO',
      user    : req.user,
      deliveryDate: lib.deliveryDate(),
      numProducts : req.session.numProducts
    })

  });

  //POST
	app.post('/orderOutcome', lib.isLoggedIn, function(req, res) {
	
   	const status = req.body.status;
    const err = req.body.err;
    console.debug('ERR: ', err)
      
    res.render('orderOutcome.njk', {
      status  : status,
      user    : req.user,
      deliveryDate: lib.deliveryDate(),
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
<<<<<<< HEAD
  			console.error(moment().utc("Europe/Rome").format()+' [WARNING][RECOVERY:NO] "POST /shop" USERS_ID: {"_id":ObjectId("' + req.user._id + '")} ERROR: '+err+' FLASH: '+msg);
=======
  			console.error(moment().format()+' [WARNING][RECOVERY:NO] "POST /shop" USERS_ID: {"_id":ObjectId("' + req.user._id + '")} ERROR: '+err+' FLASH: '+msg);
>>>>>>> 94e856d48674cf175d63810012f7c6afa78489f1
        req.flash('message', msg);
        return res.render('info.njk', {
            message: req.flash('message'),
            type: "warning"
        })
  		} else {
  			req.flash('info', req.query.msg);
	  		prods.forEach(function(prod) {
	  			prod.prettyPrice = prod.prettyPrice();
	  		});
	  		console.debug('CATALOGO PRODOTTI: ',prods)
	  		//mette in memoria i prodotti dal carrello
	      lib.retriveCart(req);

			  var model =  { products   : prods,                   //prodotti dello shop
	  						       user       : req.user,                //utente loggato
	  						       numProducts: req.session.numProducts, //numero di proodotti nel carrello	  						       
	                     message    : req.flash('info'),
	                     type       : "info"
	  					       };
	      
	  		res.render('shop.njk', model);
  		}
  	});
  });

//POST
	app.post('/shop', lib.isLoggedIn ,function (req, res) {
		//Load (or initialize) the cart and session.cart
		var cart = req.session.cart = req.session.cart || {};
		//Read the incoming product data from shop.njk
		var id = req.body.item_id;

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
				
				if ((Number(prod.quantity) - Number(q)) > 0) {
					console.debug('DISPONIBILITA: ', Number(prod.quantity), Number(q))
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
					res.redirect('/shop');
				} else {
					const msg = 'La birra '+prod.name+' è esaurita e sarà a breve in riassortimento'
					res.redirect('/shop?msg='+ msg);
				}
			}

		});
	});
// =============================================================================
// CART ========================================================================
// =============================================================================
//GET
	app.get('/cart', lib.isLoggedIn, function (req, res) {
<<<<<<< HEAD
=======

    req.session.nextStep = 'address'; 
>>>>>>> 94e856d48674cf175d63810012f7c6afa78489f1
    
		//Retrieve the shopping cart from session
		lib.retriveCart(req);

		var model = { user       : req.user.local,
  						    numProducts: req.session.numProducts,
  						    cart       : req.session.cartItems,
                  totalPrice : req.session.totalPrc
<<<<<<< HEAD
=======
                  //userStatus : req.user.local.status,
                  //nextStep   : req.session.nextStep
>>>>>>> 94e856d48674cf175d63810012f7c6afa78489f1
  					    };

  	res.render('cart.njk', model);
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
  			if (cart[id]) {
  				cart[id].qty++;
  				cart[id].subtotal = (cart[id].qty * cart[id].price).toFixed(2)
  				req.session.numProducts++;
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

    app.get('/admin/product',lib.isLoggedIn, function (req,res) {

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
        res.render('newProduct.dust', model);
      });
    });


	app.post('/admin/product', function (req, res) {
		var name = req.body.name && req.body.name.trim();

		//***** PLEASE READ THIS COMMENT ******\\\
		/*
		 Using floating point numbers to represent currency is a *BAD* idea \\

		 You should be using arbitrary precision libraries like:
		 https://github.com/justmoon/node-bignum instead.

		 So why am I not using it here? At the time of this writing, bignum is tricky to install
		 on Windows-based systems. I opted to make this example accessible to more people, instead
		 of making it mathematically correct.

		 I would strongly advise against using this code in production.
		 You've been warned!
		 */
		var price = parseFloat(req.body.price, 10).toFixed(2);

		//Some very lightweight input checking
		if (name === '' || isNaN(price)) {
			res.redirect('/admin/product#BadInput');
			return;
		}

		var newProduct = new Product({name: name, price: price});

		//Show it in console for educational purposes...
		newProduct.whatAmI();

		/* The call back recieves to more arguments ->product/s that is/are added to the database
		 and number of rows that are affected because of save, which right now are ignored
		 only errors object is consumed*/
		newProduct.save(function(err) {
			if(err) {
				console.log('save error', err);
			}

			res.redirect('/admin/product');
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
