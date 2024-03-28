const User          = require('./models/user');
const {geoMapCore}	= require('./routesGeoMap');
const {getAddressFromCoordinates} = require('./geoCoordHandler');

async function loadDeliveryData() {
	var consegneAddress = [];

	var birrificioAddress = {'puntoMappa': {'tipoPunto': 'Birrificio', 'orderSeq':0, 'indirizzo':'via molignati 10 candelo biella', 'planningSelection':'M'}};

	//Imposto indirizzo di partenza delle consegne: Birrificio
	consegneAddress.push(birrificioAddress);

	const aggregationResult = await User.aggregate([
	    { $unwind: { path: '$orders' } },
	    //{ $match: { 'orders.status': 'OK', 'orders.typeShipping': 'consegna' } }
	    { $match: { 'orders.status': 'OK'} }
	  ]
	);

	for (i=0; i<aggregationResult.length; i++) {
		var orders = aggregationResult[i].orders;

		var orderID = orders._id.toString();
		var customerAnag = orders.address.name.last + ' ' + orders.address.name.first;
		var customerMobile = orders.address.mobileNumber;
		var customerAddress = orders.address.address + ' ' + 
							  orders.address.houseNumber + ' ' +
							  orders.address.city +  ' ' +
							  orders.address.province;

		var orderItems = orders.items;
		
		var insertDate = orders.dateInsert;
		var todayDate  = new Date();

		var dayDiff = Math.round((todayDate.getTime() - insertDate.getTime()) / (1000 * 3600 * 24));

		var isHighPriority = 'N';
		if (dayDiff >= 3) {isHighPriority = 'Y';}
		
		//Imposto indirizzo di consegna 
		var puntoMappa = {'puntoMappa': {'tipoPunto': 'Consegna', 'orderID': orderID, 'orderSeq': i+1, 'cliente': customerAnag, 'mobile': customerMobile, 'indirizzo': customerAddress, 'planningSelection': 'Y', 'isHighPriority': isHighPriority, orderItems}};
		if (consegneAddress == null) {
			consegneAddress = [puntoMappa];
		} else {
			consegneAddress.push(puntoMappa);
		}
	}
	consegneAddress.push(birrificioAddress);

	//console.log('consegneAddress', consegneAddress);

	const mapResult = await geoMapCore(consegneAddress, null /*departure date_time*/);

	return mapResult;
}

async function updateDeliveryData(mongoose, orderIDPar) {
	var orderID = mongoose.Types.ObjectId(orderIDPar);

	var result = null;

	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		const aggregationResult = await User.aggregate([
										{ $unwind: { path: '$orders' } },
										{ $match: { 'orders._id': orderID } }
										]);

		//console.debug('aggregationResult', aggregationResult);

		for (i=0; i < aggregationResult.length; i++) {
			const order = aggregationResult[i].orders;
			console.log('order', order);
			await User.updateOne(
				{ "orders._id": order._id }, 
				{ $set: { "orders.$.status": "OK - CONSEGNATO" } }
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

	<!-------------------------------------------------------------------->
	// GET
	app.get('/delivery', async function(req, res) {

		try {
			const mapResult = await loadDeliveryData();

			return res.render('consegneMap.njk', mapResult);
    	} catch (error) {
			console.debug(error);

	        req.flash('error', error);
	        
	        return res.render('info.njk', {message: req.flash('error'), type: "danger"});
		}
	});


	<!-------------------------------------------------------------------->
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
			if (actionCode && actionCode ==	'DEL01') {
				await updateDeliveryData(mongoose, orderID);
			}

			const mapResult = await geoMapCore(updConsegneAddress, departure);

			return res.render('consegneMap.njk', mapResult);
		} catch (error) {
			console.debug(error);

			req.flash('error', "Errore nella gestione interna dell'ottimizzazione di percorso");
        
        	return res.render('info.njk', {message: req.flash('error'), type: "danger"});
		}
	});
}