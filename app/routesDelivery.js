const User          = require('./models/user');
const lib           = require('./libfunction');

async function loadDeliveryData(moment) {
	var consegneAddress = [];
	var ritiroOrders = [];
	var spedizioneOrders=[];

	const aggregationResultRitiro = await User.aggregate([
		{ $unwind: { path: '$orders' } },
	    //{ $match: { 'orders.status': 'OK', 'orders.typeShipping': 'consegna' } }
		{ $match: {$and: [{'orders.status': 'OK'},
			{'orders.payment.s2sStatus': 'OK'},
			{$or: [{'orders.deliveryType': {$exists: false}}, {'orders.deliveryType': {$ne: 'Consegna'} } ] }] } },
			{ $sort: { 'orders.address.name.last': 1, 'orders.address.name.first': 1 } }
		]
		);

	const aggregationResultConsegna = await User.aggregate([
		{ $unwind: { path: '$orders' } },
	    //{ $match: { 'orders.status': 'OK', 'orders.typeShipping': 'consegna' } }
		{ $match: { $and: [	{'orders.status': 'OK'},
			{'orders.payment.s2sStatus': 'OK'},
			{'orders.deliveryType': 'Consegna'},
			{'orders.address.distance':  {$lte: 15000}}] } },
			{$project:{_id:0,friends:0, addresses:0,privacy:0,local:0}}
		]
		);

	const aggregationResultSpedizione = await User.aggregate([
		{ $unwind: { path: '$orders' } },
	    //{ $match: { 'orders.status': 'OK', 'orders.typeShipping': 'consegna' } }
		{ $match: { $and: [	{'orders.status': 'OK'},
			{'orders.payment.s2sStatus': 'OK'},
			{'orders.deliveryType': 'Consegna'},
			{'orders.address.distance':  {$gt: 15000}}] } },
			{$project:{_id:0,friends:0, addresses:0,privacy:0}}
		]
		);

	/* --------------------------
	 * RITIRO
	 * -------------------------*/
	for (i=0; i<aggregationResultRitiro.length; i++) {
		var orders = aggregationResultRitiro[i].orders;

		var deliveryType = orders.deliveryType;

		if (!deliveryType) {
			deliveryType = 'Ritiro';
		}

		var orderID = orders._id.toString();

		var customerAnag = orders.address.name.last + ' ' + orders.address.name.first;
		var customerMobile = orders.address.mobileNumber;
		var customerAddress = orders.address.address + ' ' +
		orders.address.houseNumber + ' ' +
		orders.address.city +  ' ' +
		orders.address.province;

		var orderItems = orders.items;

		var insertDate = moment(orders.dateInsert);
		var todayDate  = moment(new Date()); //new Date();

		var dayDiff = todayDate.startOf('day').diff(insertDate.startOf('day'), 'days');

		var isHighPriority = 'N';
		if (dayDiff >= 3) {isHighPriority = 'Y';}

		//Imposto indirizzo di ritiro
		if (deliveryType == 'Ritiro') {
			ritiroOrders.push(orders);
		}
	}
	/* --------------------------
	 * CONSEGNA
	 * -------------------------*/
	for (i=0; i<aggregationResultConsegna.length; i++) {
		var orders = aggregationResultConsegna[i].orders;
		//console.debug('ORDINI IN CONSEGNA',orders)
		var deliveryType = orders.deliveryType;

		if (!deliveryType) {
			deliveryType = 'Ritiro';
		}

		var orderID = orders._id.toString();

		var customerAnag = orders.address.name.last + ' ' + orders.address.name.first;
		var customerMobile = orders.address.mobileNumber;
		var customerAddress = orders.address.address + ' ' +
		orders.address.houseNumber + ' ' +
		orders.address.city +  ' ' +
		orders.address.province;
		var customerAddressCoordinate = orders.address.coordinateGPS;
		var customerAddressAffidability = orders.address.affidability;

		var orderItems = orders.items;

		var insertDate = moment(orders.dateInsert);
		var todayDate  = moment(new Date()); //new Date();

		var dayDiff = todayDate.startOf('day').diff(insertDate.startOf('day'), 'days');

		var isHighPriority = 'N';
		if (dayDiff >= 3) {isHighPriority = 'Y';}
		
		consegneAddress.push(orders);
		
	}
	

	/* --------------------------
	 * SPEDIZIONE
	 * -------------------------*/
	for (i=0; i<aggregationResultSpedizione.length; i++) {
		var sOrders = aggregationResultSpedizione[i].orders;
		//console.debug("ORDERS -> ", sOrders)
		var deliveryType = sOrders.deliveryType;

		if (!deliveryType) {
			deliveryType = 'Ritiro';
		}

		var orderID = sOrders._id.toString();

		var customerAnag = sOrders.address.name.last + ' ' + sOrders.address.name.first;
		var customerMobile = sOrders.address.mobileNumber;
		var customerAddress = sOrders.address.address + ' ' +
		sOrders.address.houseNumber + ' ' +
		sOrders.address.city +  ' ' +
		sOrders.address.province;
		var customerAddressCoordinate = sOrders.address.coordinateGPS;
		var customerAddressAffidability = sOrders.address.affidability;

		var orderItems = sOrders.items;

		var insertDate = moment(sOrders.dateInsert);
		var todayDate  = moment(new Date()); //new Date();

		var dayDiff = todayDate.startOf('day').diff(insertDate.startOf('day'), 'days');

		var isHighPriority = 'N';
		if (dayDiff >= 3) {isHighPriority = 'Y';}

		spedizioneOrders.push(sOrders);
	}

	//var result = [ritiroOrders, mapResult, spedizioneOrders];
	var result = [ritiroOrders, consegneAddress, spedizioneOrders];	
	return result;
}

async function updateDeliveryData(mongoose, orderIDPar, actionCode) {
	var actionStatus = {};
	actionStatus['DEL00'] = {status: 'OK - CONSEGNATO', statusDesc: 'Ritiro in house effettuato'};
	actionStatus['DEL01'] = {status: 'OK - CONSEGNATO', statusDesc: 'Consegna effettuata'};
	actionStatus['NOK01'] = {status: 'NON CONSEGNATO', statusDesc: 'Cliente non trovato'};
	actionStatus['NOK02'] = {status: 'NON CONSEGNATO', statusDesc: 'Ordine respinto/rifiutato'};
	actionStatus['NOK03'] = {status: 'NON CONSEGNATO', statusDesc: 'Ordine non conforme'};

	console.debug('actionCode', actionCode);

	var orderID = new mongoose.Types.ObjectId(orderIDPar);

	var result = null;

	const session = await mongoose.startSession();
	session.startTransaction();
	const opts = { session };

	try {
		const aggregationResult = await User.aggregate([
			{ $unwind: { path: '$orders' } },
			{ $match: { 'orders._id': orderID } }
		]);

		console.debug('aggregationResult', aggregationResult);

		for (i=0; i < aggregationResult.length; i++) {
			var order = aggregationResult[i].orders;
			//console.debug('order', order);

			var deliveryStatus = actionStatus[actionCode].status;
			var deliveryStatusDesc = actionStatus[actionCode].statusDesc;

			if (actionCode.toString().substring(0, 3) == 'DEL') {
				await User.updateOne(
					{ "orders._id": order._id },
					{ $set: { "orders.$.status": actionStatus[actionCode].status } }
					);
			}

			if (actionCode.toString() == 'NOK01') {
				await User.updateOne(
					{ "orders._id": order._id },
					{ $set: { "orders.$.deliveryType": 'Ritiro' } }
					);
			}

			var deliveryDocUpd = {_id: new mongoose.Types.ObjectId(),
				status 		: deliveryStatus,
				note  		: deliveryStatusDesc,
				date_ref 	: lib.nowDate("Europe/Rome")
			};

			//order['delivery'] = deliveryDocUpd;

			await User.updateOne(
				{ "orders._id": order._id },
				{ $push: { "orders.$.delivery": deliveryDocUpd } }
				);
		}

		const aggregationResultDone = await User.aggregate([
			{ $unwind: { path: '$orders' } },
			{ $match: { 'orders._id': orderID } }
		]);

		//console.debug('aggregationResultDone', aggregationResultDone);

		//await session.commitTransaction();
		await session.abortTransaction();
		result = 'Aggiornamento eseguito';

	} catch (e) {
		console.log("errore: ",e)
		await session.abortTransaction();
		result = 'Aggiornamento in errore. ' + e;

	} finally {
		await session.endSession();

	}

	if (result != 'Aggiornamento eseguito') {
		throw (result);
	}

}

module.exports = function(app, mongoose, moment) {

	// ALL
	app.all('/delivery', lib.isAdmin, async function(req, res) {

		var actionCode = req.body.actionCode;
		var orderID = req.body.orderID;

		try {
			// Come prima cosa aggiorno il database se occorre. Se va in errore salta il resto
			if (actionCode) {
				await updateDeliveryData(mongoose, orderID, actionCode);
			}

		} catch (error) {
			console.debug(error);
			req.flash('error', "Errore durante l'aggiornamento della consegna.");
			const model = {
        message: req.flash('error'), 
        type: "danger",
        user: req.user,
        numProducts: req.session.numProducts,
        amiciDaInvitare: req.session.haiAmiciDaInvitare
      }
			return res.render('info.njk', model);
		}


		try {
			// Carico la lista degli ordini da ritirare

			const result = await loadDeliveryData(moment);
			const ordersInHouse = result[1];
			console.debug('ORDINI IN-ADDRESS',result[1])

			if (!ordersInHouse) {
				req.flash('info', 'Non ci sono consegne previste al momento');
				const model = {
	        message: req.flash('info'), 
	        type: "info",
	        user: req.user,
	        numProducts: req.session.numProducts,
	        amiciDaInvitare: req.session.haiAmiciDaInvitare
	      }
				return res.render('info.njk', model);
			} else {
				return res.render('consegneToDelivery.njk', {ordersInHouseString: JSON.stringify(ordersInHouse)});
			}
		} catch (error) {
			console.debug(error);

			req.flash('error', error);

			return res.render('info.njk', {message: req.flash('error'), type: "danger"});
		}
	});
	
	// ALL
	app.all('/deliveryInHouse', lib.isAdmin, async function(req, res) {

		var actionCode = req.body.actionCode;
		var orderID = req.body.orderID;

		try {
			// Come prima cosa aggiorno il database se occorre. Se va in errore salta il resto
			if (actionCode) {
				await updateDeliveryData(mongoose, orderID, actionCode);
			}

		} catch (error) {
			console.debug(error);
			req.flash('error', "Errore durante l'aggiornamento della consegna.");
			const model = {
	        message: req.flash('error'), 
	        type: "danger",
	        user: req.user,
	        numProducts: req.session.numProducts,
	        amiciDaInvitare: req.session.haiAmiciDaInvitare
	      }
			return res.render('info.njk', model);
		}


		try {
			// Carico la lista degli ordini da ritirare

			const result = await loadDeliveryData(moment);
			const ordersInHouse = result[0];

			console.debug('ordersInHouse', ordersInHouse);

			if (!ordersInHouse) {
				req.flash('info', 'Non ci sono consegne previste al momento');
				const model = {
	        message: req.flash('info'), 
	        type: "info",
	        user: req.user,
	        numProducts: req.session.numProducts,
	        amiciDaInvitare: req.session.haiAmiciDaInvitare
	      }
				return res.render('info.njk', model);
			} else {
				const model = {
	        ordersInHouseString: JSON.stringify(ordersInHouse),
	        user: req.user,
	        numProducts: req.session.numProducts,
	        amiciDaInvitare: req.session.haiAmiciDaInvitare
	      }				
				return res.render('consegneInHouse.njk', model);
			}
		} catch (error) {
			console.debug(error);
			req.flash('error', error);
			const model = {        
				message: req.flash('error'), 
				type: "danger",
        user: req.user,
        numProducts: req.session.numProducts,
        amiciDaInvitare: req.session.haiAmiciDaInvitare
      }				
			return res.render('info.njk', model);
		}
	});

	app.all('/deliveryToShip', lib.isAdmin, async function(req, res) {

		var actionCode = req.body.actionCode;
		var orderID = req.body.orderID;

		try {
			// Come prima cosa aggiorno il database se occorre. Se va in errore salta il resto
			if (actionCode) {
				await updateDeliveryData(mongoose, orderID, actionCode);
			}

		} catch (error) {
			console.debug(error);
			req.flash('error', "Errore durante l'aggiornamento della consegna.");
			const model = {        
				message: req.flash('error'), 
				type: "danger",
        user: req.user,
        numProducts: req.session.numProducts,
        amiciDaInvitare: req.session.haiAmiciDaInvitare
      }	
			return res.render('info.njk', model);
		}

		try {
			// Carico la lista degli ordini da spedire

			const result = await loadDeliveryData(moment);
			const ordersToShip = result[2];

			console.debug('ordersToShip', ordersToShip);

			if (!ordersToShip) {
				req.flash('info', 'Non ci sono consegne previste al momento');
				const model = {        
					message: req.flash('info'), 
					type: "info",
	        user: req.user,
	        numProducts: req.session.numProducts,
	        amiciDaInvitare: req.session.haiAmiciDaInvitare
	      }	
				return res.render('info.njk', model);
			} else {
				//console.debug('SHIPPING -> ', JSON.stringify(ordersToShip))
				return res.render('consegneToShip.njk', {ordersInHouseString: JSON.stringify(ordersToShip)});
			}
		} catch (error) {
			console.debug(error);
			req.flash('error', error);
			const model = {        
				message: req.flash('error'), 
				type: "danger",
        user: req.user,
        numProducts: req.session.numProducts,
        amiciDaInvitare: req.session.haiAmiciDaInvitare
      }	
			return res.render('info.njk', model);
		}
	});

	app.all('/dashboard', lib.isAdmin, (req, res) => {
		const model = {
			user: req.user,
			numProducts: req.session.numProducts,
			amiciDaInvitare: req.session.haiAmiciDaInvitare
		}
		res.render('dashboard.njk',model)
	});
}
