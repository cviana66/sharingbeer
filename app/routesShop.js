// =============================================================================
// ECOMMERCE SHOPPING CHAR https://github.com/EastpointSoftware/traider.io =====
// =============================================================================
var Product = require('./models/product.js');


module.exports = function(app) {

	app.get('/dualSlidingPanels', function(req, res) {
        res.render('dualSlidingPanels.dust');
    });

	app.get('/shopx', function(req, res) {
        res.render('shop (copia).dust');
    });

    app.get('/slide', function(req, res) {
        res.render('slide.dust');
    });

// GET SHOP ===========================================================================
    app.get('/shop', isLoggedIn, function (req,res) {
    	
    	Product.find(function (err, prods) {
    		if (err) {
    			console.log(err);
    		}
    		prods.forEach(function(prod) {
    			prod.prettyPrice = prod.prettyPrice();
    		});
    		
    		retriveCart(req,res);

    		console.log('products-->', prods);

			var model = { 	products: prods,
    						user: req.user,
    						numProducts: req.session.numProducts,
    						cart: req.session.displayCart
    					};

    		res.render('shop.dust', model);
    	});
    });

// POST SHOP ===========================================================================
	app.post('/shop', function (req, res) {

		//Load (or initialize) the cart 
		req.session.cart = req.session.cart || {};
		var cart = req.session.cart; //cart è l'oggetto sessione

		//Read the incoming product data
		var id = req.param('item_id');

		//Locate the product to be added
		Product.findById(id, function (err, prod) {
			if (err) {
				console.log('Error adding product to cart: ', err);
				res.redirect('/shop');
				return;
			}

			//Add or increase the product quantity in the shopping cart.
			if (cart[id]) {
				cart[id].qty++;
			}
			else {
				cart[id] = {
					id : prod._id,
					name: prod.name,
					price: prod.price,
					prettyPrice: prod.prettyPrice(),
					qty: 1
				};
			}

			req.session.numProducts = Object.keys(cart).length;

			res.redirect('/shop');

		});
	});

// GET CART ============================================================================
	app.get('/cart', isLoggedIn, function (req, res) {

		//Retrieve the shopping cart from memory
		retriveCart(req,res);

			var model = { 	user: req.user,
    						numProducts: req.session.numProducts,
    						cart: req.session.displayCart
    					};

    	res.render('cart.dust', model);
	});



// POST CART MINUS ====================================================================
	app.post('/cart/minus', function (req, res) {
		//Load (or initialize) the cart 
		req.session.cart = req.session.cart || {};
		var cart = req.session.cart; //cart è l'oggetto sessione

		//Read the incoming product data
		var id = req.param('item_id');
		
		//Locate the product to be added
		Product.findById(id, function (err, prod) {
			if (err) {
				console.log('Error deleting product to cart: ', err);
				res.redirect('/shop');
				return;
			}

			//Add or increase the product quantity in the shopping cart.
			if (cart[id].qty > 1) {
				cart[id].qty--;
			}

			//req.session.numProducts = Object.keys(cart).length;

			res.redirect('/cart');

		});
	});

// POST CART PLUS ====================================================================
	app.post('/cart/plus', function (req, res) {
		//Load (or initialize) the cart 
		req.session.cart = req.session.cart || {};
		var cart = req.session.cart; //cart è l'oggetto sessione

		//Read the incoming product data
		var id = req.param('item_id');
		console.log('object cart ->',cart );

		//Locate the product to be added
		Product.findById(id, function (err, prod) {
			if (err) {
				console.log('Error deleting product to cart: ', err);
				res.redirect('/shop');
				return;
			}

			//Add or increase the product quantity in the shopping cart.
			if (cart[id]) {
				cart[id].qty++;
			}

			res.redirect('/cart');

		});
	});

// POST CART MINUS ====================================================================
	app.post('/cart/delete', function (req, res) {
		//Load (or initialize) the cart 
		req.session.cart = req.session.cart || {};
		var cart = req.session.cart; //cart è l'oggetto sessione

		//Read the incoming product data
		var id = req.param('item_id');

		//Locate the product to be added
		Product.findById(id, function (err, prod) {
			if (err) {
				console.log('Error deleting product to cart: ', err);
				res.redirect('/shop');
				return;
			}

			//Add or increase the product quantity in the shopping cart.
			if (cart[id]) {
				delete req.session.cart[id];
			}

			req.session.numProducts = Object.keys(cart).length;

			res.redirect('/cart');

		});
	});

// =============================================================================
// Add a new product to the database.
// =============================================================================

    app.get('/admin/product', isLoggedIn, function (req,res) {

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
		var price = parseFloat(req.body.price, 10);

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

// route middleware to make sure a user is logged in ===========================
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/login');
}

function retriveCart (req, res) {
	//Retrieve the shopping cart from memory
	var cart = req.session.cart,
	displayCart = {items: [], total: 0},
	total = 0;

	if (!cart) {
		req.session.numProducts = 0;
	} else {

		//Ready the products for display
		for (var item in cart) {
			if (cart[item].qty > 0) {
				displayCart.items.push(cart[item]);
				total += (cart[item].qty * cart[item].price);
			}
		}
		req.session.displayCart = displayCart;
		req.session.total = displayCart.total = total.toFixed(2);
		req.session.numProducts = Object.keys(cart).length; 
	}
}