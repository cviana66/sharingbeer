const fetch 	= require("node-fetch");
const User  	= require('../app/models/user');
const Product 	= require('./models/product.js');
const moment 	= require("moment-timezone"); 
const lib		= require('./libfunction');

module.exports = {

	getUserByPaymentIdAndShopLoginAndToken: async function getUserByPaymentIdAndShopLoginAndToken(paymentID,shopLogin,token) {		
		var user = await User.aggregate([ {$unwind:"$orders"},
																{$match:{$and:[	{'orders.payment.transactionId':paymentID},
															  								{'orders.payment.shopLogin':shopLogin},
															  								{'orders.payment.token':token}
															  							]}},
															  {$project:{addresses:0,friends:0,'orders.items':0}}]);
		return user[0];
	},
  
	getUserByShopLoginAndOrderId: async function getUserByShopLoginAndOrderId(shopLogin,orderId) {		
		var user = await User.aggregate([ {$unwind:"$orders"},
																{$match:{$and:[	{'orders.payment.orderId':orderId},
															  								{'orders.payment.shopLogin':shopLogin}
															  							]}},
															  {$project:{addresses:0,friends:0,'orders.items':0}}]);
		console.debug('USER DATA =>',user[0]);
		return user[0];
	},

	getUserByPaymentIdAndShopLogin: async function getUserByPaymentIdAndShopLogin(paymentID,shopLogin) {	
		var user = await User.aggregate([ {$unwind:"$orders"},
																{$match:{$and:[	{'orders.payment.transactionId':paymentID},
															  								{'orders.payment.shopLogin':shopLogin}
															  							]}},
															  {$project:{addresses:0,friends:0,'orders.items':0}}]);
		return user[0];
	},

	updateResponsePayment: async function updateResponsePayment(_userId, data, session, mongoose) {

	/*RISPOSTA DECRIPTATA		
	{ 
	  TransactionType: 'DECRYPT',
	  TransactionResult: 'OK',
	  ShopTransactionID: '668425ca12814800a635bd62',
	  BankTransactionID: '254',
	  AuthorizationCode: '159090',
	  Currency: '242',
	  Amount: '19.11',
	  Country: 'ITALIA',
	  CustomInfo: null,
	  Buyer: { BuyerName: '4012000000003010', BuyerEmail: null },
	  TDLevel: 'FULL',
	  ErrorCode: '0',
	  ErrorDescription: 'Transazione correttamente effettuata',
	  AlertCode: null,
	  AlertDescription: null,
	  VbVRisp: null,
	  VbVBuyer: null,
	  VbVFlag: null,
	  TransactionKey: null,
	  AVSResultCode: null,
	  AVSResultDescription: null,
	  RiskResponseCode: null,
	  RiskResponseDescription: null
	}*/

	let filter = {_id: _userId};
	let update = 
	      {
	        'orders.$[el].status'            		: data.TransactionResult,
	        'orders.$[el].payment.s2sStatus'		: data.TransactionResult,
	        'orders.$[el].payment.updateTime' 		: lib.nowDate("Europe/Rome"),
	        'orders.$[el].payment.bankTransactionId': data.BankTransactionID,
	        'orders.$[el].payment.authorizationCode': data.AuthorizationCode,
 	        'orders.$[el].payment.errorCode' 		: data.ErrorCode,
	        'orders.$[el].payment.errorDescription' : data.ErrorDescription,	       
	        'orders.$[el].payment.country' 			: data.Country
	      }
	  try {    
		  let doc = await User.findOneAndUpdate(
		                filter,
		                {'$set':update},
		                {arrayFilters: [{"el._id": mongoose.Types.ObjectId(data.ShopTransactionID)}]}).session(session);
		}catch (e){ 
			console.error('Errore in function updateResponsePayment ->',e);
			throw new Error("updateStatusPayment fallito")
		}
	},

	updateInviteAndPoint: async function updateInviteAndPoint(user, session, mongoose) {
		try {
			//decrementa i booze utilizzati nell'acquisto'
			if (user.local.booze <= user.orders.pointsDiscount) {
				booze = 0
			} else {
				booze = user.local.booze - user.orders.pointsDiscount
			}
			await User.findOneAndUpdate(
			                      {_id: user._id},
			                      {'$inc': {'local.eligibleFriends': invitiPerOgniAcquisto},'local.booze': booze}
			                      ).session(session);
			// calcolo dei Booze (€):
			// (Prezzo Medio per bottiglia / numero di acquisti necessari per ottenere una bottiglia omaggio (costante =12) * n° beerbox acquistati
			let booze4Parent = (((user.orders.totalPriceBeer / (user.orders.totalQty * numBottigliePerBeerBox)) / numAcquistiPerUnaBottigliaOmaggio) * user.orders.totalQty).toFixed(2); // definisce i booze da riconoscere al parent in €;  user.orders.totalQty=n° Berrbox acquistati   
			console.debug("BOOZE FOR PARENT:",booze4Parent)
			await User.findOneAndUpdate(
		                        {'_id': mongoose.Types.ObjectId(user.local.idParent)},
		                        {'$inc': {'local.booze':booze4Parent}}
		                        ).session(session);
		}catch(e){
			console.error('Erore in funzione addInviteAndPoint',e);
			throw new Error("updateInviteAndPoint fallito")
		}
	},

	addItemsInProducts: async function addItemsInProducts(paymentID,shopLogin) {
		var orderUser = await User.aggregate([{$unwind:"$orders"},
																		{$match:{$and:[{'orders.payment.transactionId':paymentID},
																		{'orders.payment.shopLogin':shopLogin}]}},
																		{$project:{_id:0,local:0,addresses:0,friends:0,delivery:0,payment:0}}]);
		console.debug('ITEMS TO ADD', orderUser[0].orders.items);
		var items = orderUser[0].orders.items
		
		for (var index = 0; index < items.length; index++) {
	    console.debug('ID PRODOTTO: ',items[index].id)
	    
	    const filter = {_id: items[index].id};
	    console.debug("FILTER: ",filter)
	    let doc = await Product.findOne(filter)

	    console.debug('QUANTITY UPDATE PRIMA DELLA AGGIUNTA: ', doc.quantity)
	    const update = { quantity: (Number(doc.quantity) + Number(items[index].qty))};
	    let doc1 = await Product.findOneAndUpdate(filter,update, {new:true});
	    console.debug('QUANTITY UPDATE DOPO AGGIUNTA: ',doc1.quantity)
	  }
	},

	addItemsInProductsByOrderId: async function addItemsInProductsByOrderId(orderId,shopLogin) {
		var orderUser = await User.aggregate([{$unwind:"$orders"},
																		{$match:{$and:[{'orders.payment.orderId':orderId},
																									 {'orders.payment.shopLogin':shopLogin}]}},
																		{$project:{_id:0,local:0,addresses:0,friends:0,delivery:0,payment:0}}]);
		console.debug('ITEMS TO ADD', orderUser[0].orders.items);
		var items = orderUser[0].orders.items
		
		for (var index = 0; index < items.length; index++) {
	    console.debug('ID PRODOTTO: ',items[index].id)
	    
	    const filter = {_id: items[index].id};
	    console.debug("FILTER: ",filter)
	    let doc = await Product.findOne(filter)

	    console.debug('QUANTITY UPDATE PRIMA DELLA AGGIUNTA: ', doc.quantity)
	    const update = { quantity: (Number(doc.quantity) + Number(items[index].qty))};
	    let doc1 = await Product.findOneAndUpdate(filter,update, {new:true});
	    console.debug('QUANTITY UPDATE DOPO AGGIUNTA: ',doc1.quantity)
	  }
	}
};
