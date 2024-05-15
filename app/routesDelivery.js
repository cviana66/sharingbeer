const User          = require('./models/user');
const {geoMapCore}	= require('./routesGeoMap');
const {getAddressFromCoordinates} = require('./geoCoordHandler'); 

async function loadDeliveryData(moment) {
	var consegneAddress = [];
	var ritiroOrders = [];

	var birrificioAddress = {'puntoMappa': {'tipoPunto': 'Birrificio', 'orderSeq':0, 'indirizzo':'via molignati 10 candelo biella', 'planningSelection':'M'}};

	//Imposto indirizzo di partenza delle consegne: Birrificio
	consegneAddress.push(birrificioAddress);

	const aggregationResultRitiro = await User.aggregate([
	    { $unwind: { path: '$orders' } },
	    //{ $match: { 'orders.status': 'OK', 'orders.typeShipping': 'consegna' } }
	    { $match: { $and: [{'orders.status': 'OK'}, 
	    				   {'orders.paypal.s2sStatus': 'OK'}, 
	    				   {$or: [{'orders.deliveryType': {$exists: false}}, {'orders.deliveryType': {$ne: 'Consegna'} } ] }] } },
	    { $sort: { 'orders.address.name.last': 1, 'orders.address.name.first': 1 } }
	  ]
	);

	const aggregationResultConsegna = await User.aggregate([
	    { $unwind: { path: '$orders' } },
	    //{ $match: { 'orders.status': 'OK', 'orders.typeShipping': 'consegna' } }
	    { $match: { $and: [{'orders.status': 'OK'}, 
	    				   {'orders.paypal.s2sStatus': 'OK'}, 
	    				   {'orders.deliveryType': 'Consegna'}] } }
	  ]
	);

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
		
		//Imposto indirizzo di consegna 
		if (deliveryType == 'Ritiro') {
			ritiroOrders.push(orders);
		}
	}

	for (i=0; i<aggregationResultConsegna.length; i++) {
		var orders = aggregationResultConsegna[i].orders;
		
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
		
		//Imposto indirizzo di consegna 
		if (deliveryType == 'Consegna') {
			var puntoMappa = {'puntoMappa': {'tipoPunto': deliveryType, 'orderID': orderID, 'orderSeq': i+1, 'cliente': customerAnag, 'mobile': customerMobile, 'indirizzo': customerAddress, 'planningSelection': 'Y', 'isHighPriority': isHighPriority, orderItems}};
			if (consegneAddress == null) {
				consegneAddress = [puntoMappa];
			} else {
				consegneAddress.push(puntoMappa);
			}
		}
	}
	consegneAddress.push(birrificioAddress);

	var mapResult;
	if (consegneAddress.length > 2) {
		//console.log('consegneAddress', consegneAddress);

		mapResult = await geoMapCore(consegneAddress, null /*departure date_time*/);
	}

	var result = [ritiroOrders, mapResult];

	return result;
}

async function updateDeliveryData(mongoose, orderIDPar, actionCode) {
	var actionStatus = {};
	actionStatus['DEL00'] = {status: 'OK - CONSEGNATO', statusDesc: 'Ritiro in house effettuato'};
	actionStatus['DEL01'] = {status: 'OK - CONSEGNATO', statusDesc: 'Consegna effettuata'};
	actionStatus['NOK01'] = {status: 'NON CONSEGNATO', statusDesc: 'Cliente non trovato'};
	actionStatus['NOK02'] = {status: 'NON CONSEGNATO', statusDesc: 'Ordine respinto/rifiutato'};
	actionStatus['NOK03'] = {status: 'NON CONSEGNATO', statusDesc: 'Ordine non conforme'};

	//console.log('actionCode', actionCode);

	var orderID = mongoose.Types.ObjectId(orderIDPar);

	var result = null;

	const session = await mongoose.startSession();
	session.startTransaction();
    const opts = { session };

	try {
		const aggregationResult = await User.aggregate([
										{ $unwind: { path: '$orders' } },
										{ $match: { 'orders._id': orderID } }
										]);

		//console.debug('aggregationResult', aggregationResult);

		for (i=0; i < aggregationResult.length; i++) {
			var order = aggregationResult[i].orders;
			//console.log('order', order);

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
												status: deliveryStatus,
												note: deliveryStatusDesc
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
		//console.log("errore: ",e)
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

	// GET
	app.get('/delivery', async function(req, res) {

		try {
			const result = await loadDeliveryData(moment);
			const mapResult = result[1];

			if (!mapResult) {
				req.flash('info', 'Non ci sono consegne da effettuare al momento');
	        
	        	return res.render('info.njk', {message: req.flash('info'), type: "info"});
			} else {
				return res.render('consegneMap.njk', mapResult);
			}
    	} catch (error) {
			console.debug(error);

	        req.flash('error', error);
	        
	        return res.render('info.njk', {message: req.flash('error'), type: "danger"});
		}
	});


	// POST
	app.post('/delivery', async function(req, res) {
		let departureTime = new Date();
		departureTime.setDate(departureTime.getDate() + 1);
		departureTime.setHours(10, 0, 0);

		const departure = moment(departureTime).format('YYYY-MM-DDThh:mm');

		var actionCode = req.body.actionCode;
		var orderID = req.body.orderID;

		var startFromGPS = req.body.startFromGPS;
		var gpsLatitude  = req.body.gpsLatitude;
		var gpsLongitude = req.body.gpsLongitude;
		var gpsAddress	 = null;

		var updConsegneAddress = JSON.parse(req.body.updateData);

		//console.debug('ANTE updConsegneAddress', updConsegneAddress);

		if (startFromGPS == 'Y') {
			gpsAddress = await getAddressFromCoordinates(gpsLatitude, gpsLongitude);

			updConsegneAddress[0] = {puntoMappa: {
										tipoPunto: 'Posizione attuale',
										orderSeq: 0,
										indirizzo: gpsAddress.puntoMappa.indirizzo,
										planningSelection: 'M',
										coordinateGPS: {latiture: gpsLatitude, longitude: gpsLongitude}}
    								}

		} else {
			updConsegneAddress[0] = updConsegneAddress[updConsegneAddress.length -1];
		}
		
		//console.debug('POST updConsegneAddress', updConsegneAddress);

		try {
			// Come prima cosa aggiorno il database se occorre. Se va in errore salta il resto
			if (actionCode) {
				await updateDeliveryData(mongoose, orderID, actionCode);
			}
		} catch (error) {
			console.debug(error);

			req.flash('error', "Errore durante l'aggiornamento della consegna.");
        
        	return res.render('info.njk', {message: req.flash('error'), type: "danger"});
		}


		try {
			const mapResult = await geoMapCore(updConsegneAddress, departure);

			return res.render('consegneMap.njk', mapResult);
		} catch (error) {
			console.debug(error);

			req.flash('error', "Errore nella gestione interna dell'ottimizzazione di percorso");
        
        	return res.render('info.njk', {message: req.flash('error'), type: "danger"});
		}
	});


	// ALL
	app.all('/deliveryInHouse', async function(req, res) {

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
        
        	return res.render('info.njk', {message: req.flash('error'), type: "danger"});
		}


		try {
			// Carico la lista degli ordini da ritirare

			const result = await loadDeliveryData(moment);
			const ordersInHouse = result[0];

			//console.debug('ordersInHouse', ordersInHouse);

			if (!ordersInHouse) {
				req.flash('info', 'Non ci sono consegne previste al momento');
	        
	        	return res.render('info.njk', {message: req.flash('info'), type: "info"});
			} else {
				return res.render('consegneInHouse.njk', {ordersInHouseString: JSON.stringify(ordersInHouse)});
			}
    	} catch (error) {
			console.debug(error);

	        req.flash('error', error);
	        
	        return res.render('info.njk', {message: req.flash('error'), type: "danger"});
		}
	});
}