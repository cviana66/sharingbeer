const User          = require('./models/user');
const {geoMapCore}	= require('./routesGeoMap');
const {getAddressFromCoordinates} = require('./geoCoordHandler');

module.exports = function(app, moment) {

	<!-------------------------------------------------------------------->
	app.get('/delivery', async function(req, res) {

		var consegneAddress = [];

		var birrificioAddress = {'puntoMappa': {'tipoPunto': 'Birrificio', 'orderSeq':0, 'indirizzo':'via molignati 10 candelo biella', 'planningSelection':'M'}};

		//Imposto indirizzo di partenza delle consegne: Birrificio
		consegneAddress.push(birrificioAddress);

		const aggregationResult = await User.aggregate([
		    { $unwind: { path: '$orders' } },
		    { $match: { 'orders.status': 'OK' } }
		  ]
		);

		for (i=0; i<aggregationResult.length; i++){
			var orders = aggregationResult[i].orders;

			var orderID = orders._id.toString();
			var customerAnag = orders.address.name.last + ' ' + orders.address.name.first;
			var customerMobile = orders.address.mobileNumber;
			var customerAddress = orders.address.address + ' ' + 
								  orders.address.houseNumber + ' ' +
								  orders.address.city +  ' ' +
								  orders.address.province;

			var insertDate = orders.dateInsert;
			var todayDate  = new Date();

			var dayDiff = Math.round((todayDate.getTime() - insertDate.getTime()) / (1000 * 3600 * 24));

			var isHighPriority = 'N';
			if (dayDiff >= 3) {isHighPriority = 'Y';}
			
			//Imposto indirizzo di consegna 
			var puntoMappa = {'puntoMappa': {'tipoPunto': 'Consegna', 'orderID': orderID, 'orderSeq': i+1, 'cliente': customerAnag, 'mobile': customerMobile, 'indirizzo': customerAddress, 'planningSelection': 'Y', 'isHighPriority': isHighPriority}};
			if (consegneAddress == null) {
				consegneAddress = [puntoMappa];
			} else {
				consegneAddress.push(puntoMappa);
			}
		}
		consegneAddress.push(birrificioAddress);

		//console.log('consegneAddress', consegneAddress);

		try {
			const mapResult = await geoMapCore(consegneAddress, null /*departure date_time*/);
        
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

		const mapResult = await geoMapCore(updConsegneAddress, departure);

		return res.render('consegneMap.njk', mapResult);
	});
}