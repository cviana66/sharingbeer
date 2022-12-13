// =============================================================================
// ECOMMERCE SHOPPING CHAR https://github.com/EastpointSoftware/traider.io =====
// =============================================================================
var Product = require('./models/product.js');
var lib = require('./libfunction');

module.exports = function(app) {

// =============================================================================
// GET SHOP ====================================================================
// =============================================================================
//GET
  app.get('/shop', lib.isLoggedIn, function (req,res) {

  	Product.find(function (err, prods) {
  		if (err) {
  			console.log(err);
  		}
  		prods.forEach(function(prod) {
  			prod.prettyPrice = prod.prettyPrice();
  		});

  		//mette in memoria i prodotti dal carrello
      lib.retriveCart(req);

		  var model =  { products   : prods,                   //prodotti dello shop
  						       user       : req.user,                //utente loggato
  						       numProducts: req.session.numProducts, //numero di proodotti nel carrello visualizzato su main.dust
  						       cart       : req.session.cartItems    //prodotti nel carrello
  					       };
      console.log("numero di prodotti in carrello: ",req.session.numProducts)
  		res.render('shop.njk', model);
  	});
  });
//POST
	app.post('/shop', lib.isLoggedIn ,function (req, res) {

		//Load (or initialize) the cart and session.cart
		var cart = req.session.cart = req.session.cart || {};

		//Read the incoming product data from shop.njk
		var id = req.body.item_id;

    console.log("productID: ",id);

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
			}
			//Increase quantity or add the product in the shopping cart.
			if (cart[id]) {
				cart[id].qty++;
			}	else {     //il prodotto è scelto per la prima volta
				cart[id] = {
					id : prod._id,
					name: prod.name,
					price: prod.price.toFixed(2),
					prettyPrice: prod.prettyPrice(),
					qty: 1
				};
			}
			req.session.numProducts = Object.keys(cart).length;

			res.redirect('/shop');

		});
	});
// =============================================================================
// CART ========================================================================
// =============================================================================
//GET
	app.get('/cart', lib.isLoggedIn, function (req, res) {

		//Retrieve the shopping cart from session
		lib.retriveCart(req);

		var model = { user       : req.user,
  						    numProducts: req.session.numProducts,
  						    cart       : req.session.cartItems,
                  totalPrice : req.session.totalPrc,
                  userStatus : req.user.status
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
  			//Add or increase the product quantity in the shopping cart.
  			if (cart[id]) {
  				cart[id].qty++;
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
  			//Add or increase the product quantity in the shopping cart.
  			if (cart[id]) {
  				delete req.session.cart[id];
  			}
      }

			req.session.numProducts = Object.keys(cart).length;

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
