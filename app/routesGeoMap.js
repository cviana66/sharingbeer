const fetch            = require("node-fetch");
const {getCoordinates} = require('./geoCoordHandler');
const polyline         = require('@mapbox/polyline');


function geoMap(app, moment) {

  <!-------------------------------------------------------------------->
  //GET
  app.get('/geoMapSample', async function(req, res) {
    const addressFrom = req.query.indirizzo;

    try {
      const coordinate = await getCoordinates(addressFrom);
      console.log('COORDINATE', coordinate);

      res.render('map.njk', {coordinate});

    } catch (error) {
      console.error('ERRORE', 'Indirizzo: ', addressFrom, error);

      res.status(500).json(error);
    }
  });

  <!-------------------------------------------------------------------->
  app.get('/consegneMap', async function(req, res) {
    let departureTime = new Date();
    departureTime.setDate(departureTime.getDate() + 1);
    departureTime.setHours(10, 0, 0);

    const departure = moment(departureTime).format('YYYY-MM-DDThh:mm');

    //const consegneAddress = req.query.consegneAddress;
    let consegneAddress = [{'puntoMappa': {'tipoPunto': 'Birrificio', 'indirizzo':'via molignati 10 candelo biella'}}];
    consegneAddress.push({'puntoMappa': {'tipoPunto': 'Consegna', 'indirizzo':'via lamarmora 1 sandigliano biella'}});
    consegneAddress.push({'puntoMappa': {'tipoPunto': 'Deposito', 'indirizzo':'via eriberto ramella germanin 4 biella biella'}});
    consegneAddress.push({'puntoMappa': {'tipoPunto': 'Consegna', 'indirizzo':'strada del masarone 1 biella biella'}});
    consegneAddress.push({'puntoMappa': {'tipoPunto': 'Consegna', 'indirizzo':'piazza rivetti 2 valdengo biella'}});
    consegneAddress.push({'puntoMappa': {'tipoPunto': 'Consegna', 'indirizzo':'via roma 5 benna biella'}});
    consegneAddress.push({'puntoMappa': {'tipoPunto': 'Consegna', 'indirizzo':'piazza molise 2 biella biella'}});
    consegneAddress.push({'puntoMappa': {'tipoPunto': 'Consegna', 'indirizzo':'via remmert 14 camburzano biella'}});
    consegneAddress.push({'puntoMappa': {'tipoPunto': 'Consegna', 'indirizzo':'via milano 1 chiavazza biella'}});
    consegneAddress.push(consegneAddress[0]);

    //console.log('PRIMA consegneAddress', consegneAddress);

    let locationsList = [];

    try {
      for (var i = 0; i < consegneAddress.length; i++) {
        const coordinate = await getCoordinates(consegneAddress[i].puntoMappa.indirizzo);


        consegneAddress[i].puntoMappa['coordinateGPS'] = {}
        consegneAddress[i].puntoMappa.coordinateGPS['latitude'] = coordinate.puntoMappa.latitude;
        consegneAddress[i].puntoMappa.coordinateGPS['longitude'] = coordinate.puntoMappa.longitude;

        var _type = "break";
        var waitingSec = 0;

        if (i>0) {
          _type = "break_through";
          waitingSec = 600;
        }

        locationsList[i] = {lat: coordinate.puntoMappa.latitude, 
                            lon: coordinate.puntoMappa.longitude, 
                            type: _type, 
                            name: consegneAddress[i].puntoMappa.tipoPunto + " - " + consegneAddress[i].puntoMappa.indirizzo,
                            waiting: waitingSec
                             };

      }

      //console.log('locationsList', locationsList);


      // Costruisci l'URL del server Valhalla all'interno del container Docker
      const valhallaUrl = 'http://localhost:8002/optimized_route'; // Sostituisci con l'URL effettivo del server Valhalla

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
      
        //console.log("VALHALLA result: ",result);
        return result.json();

      }).then(async function(data) {
        console.log("VALHALLA data: ", data);

        var locations = data.trip.locations;
        var shapes = data.trip.legs;
        
        var geoJSONpoint = [];
        var geoJSONshape = [];
        var geoJSONmanev = [];

        var avgLat = 0;
        var avgLon = 0;

        for (var i=0; i<locations.length; i++) {
          avgLat += locations[i].lat;
          avgLon += locations[i].lon;

          const point = {type: 'Point',
                            coordinates: [locations[i].lon, locations[i].lat]
                          }

          geoJSONpoint.push(point);
        }

        avgLat = avgLat / (locations.length);
        avgLon = avgLon / (locations.length);

        //console.log('geoJSONpoint point', geoJSONpoint)

        
        for (var i=0; i<shapes.length; i++) {
          var decodeCoord = polyline.decode(shapes[i].shape, 6);

          var revDecodeCoord = []
          for (var j=0; j<decodeCoord.length; j++) {
            revDecodeCoord[j] = [decodeCoord[j][1], decodeCoord[j][0]];
            //console.log('revDecodeCoord', decodeCoord[j], revDecodeCoord[j])
          }

          const decodedShape = {type: 'LineString',
                            coordinates: revDecodeCoord
                          }

          geoJSONshape.push(decodedShape);


          var maneuvers = shapes[i].maneuvers;
          geoJSONmanev.push(maneuvers);
        }
        //console.log('geoJSONshape shape', geoJSONshape);
        //console.log('geoJSONshape manev', geoJSONmanev);

        
        return res.render('consegneMap.njk', { geoJSONPointString: JSON.stringify(geoJSONpoint), 
                                               geoJSONShapeString: JSON.stringify(geoJSONshape), 
                                               geoJSONManevString: JSON.stringify(geoJSONmanev), 
                                               avgCoord: JSON.stringify([avgLat, avgLon]) });

      }).catch(function(error) {
        console.log(error);

        var err = error + "(" + error.CODE + ")";

        req.flash('error', error);
        
        return res.render('info.njk', {message: req.flash('error'), type: "danger"});
      });
    } catch (error) {
      console.error('ERRORE', error);

      res.status(500).json(error);
    }

    //console.log('consegneAddress', consegneAddress);
    //return res.render('consegneMapStatico.njk', {consegneAddress});
  });

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
      
        console.log("VALHALLA result: ",result);
        return result.json();

      }).then(async function(data) {
        console.log("VALHALLA data: ",data);
        console.log("VALHALLA trip: ",data.trip.legs);
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

module.exports = {geoMap};