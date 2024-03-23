const fetch                       = require("node-fetch");
const {getCoordinatesFromAddress} = require('./geoCoordHandler');
const {getAddressFromCoordinates} = require('./geoCoordHandler');
const polyline                    = require('@mapbox/polyline');
const moment                      = require("moment");            // Formattazione delle date. https://www.npmjs.com/package/moment

async function geoMapCore(consegneAddressPar, departurePar) {
  var consegneAddressOk = [];
  var consegneAddressErr = [];
  var coreResult = null;

  var departureTime = new Date();
  departureTime.setDate(departureTime.getDate() + 1);
  departureTime.setHours(10, 0, 0);

  var departure = moment(departureTime).format('YYYY-MM-DDThh:mm');

  if (departurePar != null) {
    departure = departurePar;
  }

  var locationsList = [];

  try {
    var destinationIdx = 0;
    var locationIdx = 0;
    var errNr = 0;

    //console.debug('consegneAddressPar', consegneAddressPar);

    for (var i=0; i<consegneAddressPar.length; i++) {
      var coordinate = null;

      var _type = "break";
      var waitingSec = 0;

      try {
        coordinate = await getCoordinatesFromAddress(consegneAddressPar[i].puntoMappa.indirizzo);

        consegneAddressPar[i].puntoMappa['coordinateGPS'] = {}
        consegneAddressPar[i].puntoMappa.coordinateGPS['latitude'] = coordinate.puntoMappa.latitude;
        consegneAddressPar[i].puntoMappa.coordinateGPS['longitude'] = coordinate.puntoMappa.longitude;

        consegneAddressPar[i].puntoMappa['isPreciseAddress'] = coordinate.puntoMappa.isPreciseAddress;

        isHighPriority = consegneAddressPar[i].puntoMappa.isHighPriority;
        if (!isHighPriority) {
          isHighPriority = 'Y';
        }
        
        if (i>0) {
          _type = "break_through";
          waitingSec = 600;
        }

        if (consegneAddressPar[i].puntoMappa.tipoPunto !== null && consegneAddressPar[i].puntoMappa.tipoPunto == 'Deposito') {
          waitingSec = 1800;
        }

        if (consegneAddressPar[i].puntoMappa.planningSelection == 'Y' ||
            consegneAddressPar[i].puntoMappa.planningSelection == 'M') {

            locationsList[locationIdx] = {lat: coordinate.puntoMappa.latitude, 
                                lon: coordinate.puntoMappa.longitude, 
                                type: _type, 
                                name: consegneAddressPar[i].puntoMappa.tipoPunto + " - " + consegneAddressPar[i].puntoMappa.indirizzo,
                                waiting: waitingSec
                                 };

            locationIdx++;

            consegneAddressPar[i].puntoMappa['stato'] = 'OK'

        } else if (consegneAddressPar[i].puntoMappa.planningSelection == 'N') {
          consegneAddressPar[i].puntoMappa['stato'] = 'ESCLUSO'

        }
        
        consegneAddressOk.push(consegneAddressPar[i]);

      } catch (error) {

        consegneAddressErr.push(consegneAddressPar[i]);
        consegneAddressPar[i].puntoMappa['stato'] = 'ERRORE'
        //devare consegneAddressPar[i];
        
      }
    }

    //console.log('consegneAddress', consegneAddress);

    //console.debug('locationsList', locationsList);


    // Costruisci l'URL del server Valhalla all'interno del container Docker
    //var valhallaUrl = 'http://localhost:8002/optimized_route'; // Sostituisci con l'URL effettivo del server Valhalla
    var valhallaUrl = 'https://valh.sharingbeer.it/optimized_route';

    // Esegui la richiesta HTTP POST al server Valhalla per calcolare il percorso
    await fetch(valhallaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        locations: locationsList,
        costing: 'auto', // Modalità di trasporto, es. 'auto', 'bicycle', 'pedestrian', ecc.
        directions_options: {
          units: 'kilometers', // Unità di misura, es. 'miles', 'kilometers', ecc.
          language: 'it' // Lingua per le istruzioni di navigazione, es. 'en' per inglese, 'it' per italiano, ecc.
        },
        date_time:{type: '1', value: departure}
      })
    }).then(function(result) {
    
      //console.debug("VALHALLA result: ",result);
      return result.json();


      // Costruisci l'URL del server Valhalla all'interno del container Docker
      const valhallaUrl = 'https://valh.sharingbeer.it/optimized_route'; // Sostituisci con l'URL effettivo del server Valhalla


      if (data.error) {
        throw(data.error);
      }

      var locations = data.trip.locations;
      for (l=0; l<locations.length; l++) {
        var original_index = locations[l].original_index;
        var planningSelectionValue = consegneAddressOk[original_index].puntoMappa.planningSelection;
        var isPreciseAddressValue = consegneAddressOk[original_index].puntoMappa.isPreciseAddress;

        locations[l]['planningSelection'] = planningSelectionValue;
        locations[l]['isPreciseAddress'] = isPreciseAddressValue;

        if (planningSelectionValue == 'Y') {
          locations[l]['orderSeq'] = consegneAddressOk[original_index].puntoMappa.orderSeq;
        }
        
      }
      //console.debug('locations', locations);

      var shapes = data.trip.legs;
      
      var geoJSONpoint = [];
      var geoJSONshape = [];
      var geoJSONmanev = [];

      var avgLat = 0;
      var avgLon = 0;

      for (var i=0; i<consegneAddressOk.length; i++) {
        var pointLatitude = consegneAddressOk[i].puntoMappa.coordinateGPS.latitude;
        var pointLongitude = consegneAddressOk[i].puntoMappa.coordinateGPS.longitude;

        avgLat += Number(pointLatitude)
        avgLon += Number(pointLongitude);

        const point = {type: 'Point',
          coordinates: [pointLongitude, pointLatitude]
        }

        geoJSONpoint.push(point);

      }
      //console.log('geoJSONpoint', geoJSONpoint);

      avgLat = avgLat / (consegneAddressOk.length);
      avgLon = avgLon / (consegneAddressOk.length);

      //console.log('avgLat', avgLat, 'avgLon', avgLon);

      var time = new Date(data.trip.summary.time * 1000).toISOString().slice(11, 19);
      var cost = new Date(data.trip.summary.cost * 1000).toISOString().slice(11, 19);
      var length = data.trip.summary.length.toLocaleString();

      var geoJSONsummary = {lunghezza: length, durata: time, durataTotale: cost};

      
      for (var i=0; i<consegneAddressOk.length; i++) {
        var lat = parseFloat(consegneAddressOk[i].puntoMappa.coordinateGPS.latitude);
        var lon = parseFloat(consegneAddressOk[i].puntoMappa.coordinateGPS.longitude);
        
        const point = {type: 'Point',
                          coordinates: [lon, lat]
                        }

        geoJSONpoint.push(point);
      }

      //console.debug('geoJSONpoint point', geoJSONpoint)

      
      for (var i=0; i<shapes.length; i++) {
        var decodeCoord = polyline.decode(shapes[i].shape, 6);

        var revDecodeCoord = []
        for (var j=0; j<decodeCoord.length; j++) {
          revDecodeCoord[j] = [decodeCoord[j][1], decodeCoord[j][0]];
          //console.debug('revDecodeCoord', decodeCoord[j], revDecodeCoord[j])
        }

        const decodedShape = {type: 'LineString',
                          coordinates: revDecodeCoord
                        }

        geoJSONshape.push(decodedShape);


        var maneuvers = shapes[i].maneuvers;
        geoJSONmanev.push(maneuvers);
      }
      //console.debug('geoJSONshape shape', geoJSONshape);
      //console.debug('geoJSONshape manev', geoJSONmanev);

      coreResult = { consegneAddressString: JSON.stringify(consegneAddressPar),
                      geoJSONsummaryString : JSON.stringify(geoJSONsummary),
                      locationsString: JSON.stringify(locations),
                      geoJSONPointString: JSON.stringify(geoJSONpoint), 
                      geoJSONShapeString: JSON.stringify(geoJSONshape), 
                      geoJSONManevString: JSON.stringify(geoJSONmanev), 
                      avgCoord: JSON.stringify([avgLat, avgLon]) };

    }).catch(function(error) {
      //console.debug(error);

      throw('Errore nel core Mappa', error);
    });
  } catch (error) {
    console.debug('error', error);

    throw(error);
  }

  return coreResult;

}

function geoMap(app, moment) {

  <!-------------------------------------------------------------------->
  app.get('/consegneMap', async function(req, res) {
    var departureTime = new Date();
    departureTime.setDate(departureTime.getDate() + 1);
    departureTime.setHours(10, 0, 0);

    const departure = moment(departureTime).format('YYYY-MM-DDThh:mm');

    /* planningSelection:
        - Y => punto Mappa selezionato per essere valutato nel percorso
        - N => punto Mappa NON selezionato (escluso) per essere valutato nel percorso
        - M => MANDATORIO. punto Mappa obbligatorio, non de-selezionabile
    */

    consegneAddress = [{'puntoMappa': {'tipoPunto': 'Birrificio', 'indirizzo':'via molignati 10 candelo biella', 'planningSelection':'M'}}];
    consegneAddress.push({'puntoMappa': {'tipoPunto': 'Consegna', 'indirizzo':'via lamarmora 1 sandigliano biella', 'planningSelection':'Y'}});
    consegneAddress.push({'puntoMappa': {'tipoPunto': 'Deposito', 'indirizzo':'via eriberto ramella germanin 4 biella biella', 'planningSelection':'Y'}});
    consegneAddress.push({'puntoMappa': {'tipoPunto': 'Consegna', 'indirizzo':'strada del masarone 1 biella biella', 'planningSelection':'Y'}});
    consegneAddress.push({'puntoMappa': {'tipoPunto': 'Consegna', 'indirizzo':'piazza rivetti 2 valdengo biella', 'planningSelection':'Y'}});
    consegneAddress.push({'puntoMappa': {'tipoPunto': 'Consegna', 'indirizzo':'via roma 5 benna biella', 'planningSelection':'Y'}});
    consegneAddress.push({'puntoMappa': {'tipoPunto': 'Consegna', 'indirizzo':'piazza molise 2 biella biella', 'planningSelection':'Y'}});
    consegneAddress.push({'puntoMappa': {'tipoPunto': 'Consegna', 'indirizzo':'via remmert 14 camburzano biella', 'planningSelection':'Y'}});
    consegneAddress.push({'puntoMappa': {'tipoPunto': 'Consegna', 'indirizzo':'via milano 1 chiavazza biella', 'planningSelection':'Y'}});
    consegneAddress.push(consegneAddress[0]);

    for (i=0; i<consegneAddress.length; i++) {
      consegneAddress[i].puntoMappa['orderSeq'] = i;
    }

    //console.debug('PRIMA consegneAddress', consegneAddress);

    const mapResult = await geoMapCore(consegneAddress, departure);
        
    return res.render('consegneMap.njk', mapResult);
    
  });

  <!-------------------------------------------------------------------->
  //GET
  app.get('/geoMapSample', async function(req, res) {
    const addressFrom = req.query.indirizzo;

    try {
      const coordinate = await getCoordinatesFromAddress(addressFrom);
      console.debug('COORDINATE', coordinate);

      var checkAddress = await getAddressFromCoordinates(coordinate.puntoMappa.latitude, coordinate.puntoMappa.longitude);
      console.debug('INDIRIZZO', checkAddress);

      const coordinate2 = await getCoordinatesFromAddress(checkAddress.puntoMappa.indirizzo);
      console.debug('COORDINATE 2', coordinate2);

      res.render('map.njk', {coordinate});

    } catch (error) {
      console.error('ERRORE', 'Indirizzo: ', addressFrom, error);

      res.status(500).json(error);
    }
  });

  <!-------------------------------------------------------------------->
  //GET
  app.get('/calcola-percorso', async (req, res) => {
    try {
      // Esempio di dati dei punti di partenza e di destinazione (latitudine e longitudine)
      const startPoint = { lat: 45.4939497, lon: 8.8563859 };
      const endPoint = { lat: 45.1883784, lon: 7.0160303 };

      // Costruisci l'URL del server Valhalla all'interno del container Docker
      const valhallaUrl = 'http://localhost:8002/optimized_route'; // Sostituisci con l'URL effettivo del server Valhalla

      // Esegui la richiesta HTTP POST al server Valhalla per calcolare il percorso
      await fetch(valhallaUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          locations: [
            { lat: startPoint.lat, lon: startPoint.lon },
            { lat: endPoint.lat, lon: endPoint.lon }
          ],
          costing: 'auto', // Modalità di trasporto, es. 'auto', 'bicycle', 'pedestrian', ecc.
          directions_options: {
            units: 'kilometers', // Unità di misura, es. 'miles', 'kilometers', ecc.
            language: 'it' // Lingua per le istruzioni di navigazione, es. 'en' per inglese, 'it' per italiano, ecc.
          }
        })
      }).then(function(result) {
      
        //console.debug("VALHALLA result: ",result);
        return result.json();

      }).then(async function(data) {
        //console.debug("VALHALLA data: ",data);
        //console.debug("VALHALLA trip: ",data.trip.legs);
        res.json(data);

      }).catch(function(error) {
        console.error;

        var err = error + "(" + error.CODE + ")";

        req.flash('error', error);
        
        return res.render('info.njk', {message: req.flash('error'), type: "danger"});
      });
    
    } catch (error) {
      console.error('Errore durante la gestione della richiesta:', error);
      res.status(500).json({ error: 'Si è verificato un errore durante la gestione della richiesta' });
    }
  });
}

module.exports = {geoMapCore, geoMap};