const fetch = require("node-fetch");
const User  = require('../app/models/user');
const Product = require('./models/product.js');

const moment = require("moment-timezone");            // Formattazione delle date. https://www.npmjs.com/package/moment

async function getUserByPaymentIdAndShopLogin(paymentID,shopLogin) {
	// https://sb.sharingbeer.it/response_positiva?a=GESPAY96332&Status=OK&paymentID=2188249507207&paymentToken=625a9b4b-5684-45e4-8473-6e5b70573f0e
	//db.users.aggregate([{$unwind:"$orders"},{$match:{$and:[{'orders.paypal.transactionId':'1545619506746'},{'orders.paypal.shopLogin':'GESPAY96332'}]}},{$project:{_id:0,addresses:0,friends:0,'orders.items':0}}])
	
	var user = await User.aggregate([ {$unwind:"$orders"},
															{$match:{$and:[{'orders.paypal.transactionId':paymentID},
														  {'orders.paypal.shopLogin':shopLogin}]}},
														  {$project:{addresses:0,friends:0,'orders.items':0}}]);
	
	return user[0];
};

function updateStatusPayment(userId, orderId, status, session, mongoose) {
	let filter = {_id: userId};
  let update = 
      {
        'orders.$[el].status'            : status,
        'orders.$[el].paypal.updateTime' : moment().utc("Europe/Rome").format('DD/MM/yyyy HH:mm:ss')          
      }
  User.findOneAndUpdate(
                filter,
                {'$set':update},
                {arrayFilters: [{"el._id": orderId}]}).session(session);
};

function addInviteAndPoint(userId, parentId, booze, totalPrc, session, mongoose) {
	User.findOneAndUpdate(
	                      {_id: userId},
	                      {'$inc': {'local.eligibleFriends': invitiPerOgniAcquisto},'local.booze': booze}
	                      ).session(session);

  booze = Number(totalPrc)/numBottigliePerBeerBox/puntiPintaPerUnaBottiglia
  console.log('BOOZE: ', booze, totalPrc, numBottigliePerBeerBox, puntiPintaPerUnaBottiglia)
        
  User.findOneAndUpdate(
                        {'_id': mongoose.Types.ObjectId(parentId)},
                        {'$inc': {'local.booze':booze}}
                        ).session(session);
}

async function addItemsInProducts(paymentID,shopLogin) {
	//db.users.aggregate([{$unwind:"$orders"},{$match:{$and:[{'orders.paypal.transactionId':'1804229507453'},{'orders.paypal.shopLogin':'GESPAY96332'}]}},{$project:{_id:0,local:0,addresses:0,friends:0,delivery:0,paypal:0}}])

	var orderUser = await User.aggregate([{$unwind:"$orders"},
																	{$match:{$and:[{'orders.paypal.transactionId':paymentID},
																	{'orders.paypal.shopLogin':shopLogin}]}},
																	{$project:{_id:0,local:0,addresses:0,friends:0,delivery:0,paypal:0}}]);
	
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

module.exports = { getUserByPaymentIdAndShopLogin, updateStatusPayment, addInviteAndPoint, addItemsInProducts };