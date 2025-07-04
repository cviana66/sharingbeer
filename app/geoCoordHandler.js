const axios = require('axios');
const geolib = require('geolib'); // calcolare la distanza tra le coordinate iniziali e finali

async function getAddressFromCoordinates(latitude, longitude) {
  console.debug('Recupero indirizzo da coordinate:', 'latitude', latitude, 'longitude', longitude);
  if (!latitude || !longitude) {
    throw({ errCode: 404, errMsg: 'Coordinate non corrette'});
  }

  try {
    // Effettua una richiesta al servizio di geocodifica di Nominatim per ottenere l'indirizzo di partenza
    const geocodeResponse = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: {
        email: 'birrificioviana@gmail.com',
        lat: latitude,
        lon: longitude,
        format: 'jsonv2',
      },
    });

    var coordinates = null;
    if (geocodeResponse.data) {
      coordinates = {'puntoMappa': {'indirizzo': geocodeResponse.data.display_name, 
                                    'latitude': latitude,
                                    'longitude': longitude}};
      
      return coordinates;
    } else {
      throw({ errCode: 500, errMsg: "Indirizzo di riferimento non trovato per le coordinate. Latitudine: " + latitude + ", Longitudine: " + longitude});
    }

  } catch (error) {
    console.error('ERRORE', error);
    throw({ errCode: 500, errMsg: "Errore durante la geocodifica delle coordinate. Latitudine: " + latitude + ", Longitudine: " + longitude});
  }
}

<!-------------------------------------------------------------->
async function getCoordinatesFromAddress(address) {
  console.debug('Recupero coordinate da indirizzo:', address);
  if (!address) {
    throw({ errCode: 404, errMsg: 'Indirizzo di riferimento non fornito'});
  }

  try {
    // Effettua una richiesta al servizio di geocodifica di Nominatim per ottenere le coordinate di partenza
    const geocodeResponse = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        email: 'birrificioviana@gmail.com',
        q: address,
        format: 'json',
        polygon_kml: 1
      },
      headers: {
        'User-Agent': 'sharingbeer.it/1.0 (birrificioviana@gmail.com)'
    }
    });
    //console.log('geocodeResponse', geocodeResponse.data);

    var isPreciseAddress = 'N';
    if (geocodeResponse.data[0] && geocodeResponse.data[0].geokml.indexOf('<Point>') >= 0)  {
      isPreciseAddress = 'Y';
    }

    var coordinates = null;
    if (geocodeResponse.data.length > 0) {
      coordinates = {'puntoMappa': {'indirizzo': address, 
                                    'isPreciseAddress': isPreciseAddress,
                                    'latitude': geocodeResponse.data[0].lat,
                                    'longitude': geocodeResponse.data[0].lon}};
      console.debug('Indirizzo', address, 'isPreciseAddress', isPreciseAddress, ' - coordinate', coordinates);

      return coordinates;
    } else {
      throw({ errCode: 500, errMsg: 'Indirizzo di riferimento non trovato per "' + address + '"'});
    }

  } catch (error) {
    throw({ errCode: 500, errMsg: "Errore durante la geocodifica dell'indirizzo: " + address, error });
  }
}

<!-------------------------------------------------------------->
async function getDistance(addressFrom, addressTo, inCoordinateFrom, inCoordinateTo, req, res) {

  if (!addressFrom && !inCoordinateFrom) {
    throw({ errCode: 404, errMsg: 'Indirizzo e coordinate di partenza non fornite'});
  }
  if (!addressTo && !inCoordinateTo) {
    throw({ errCode: 404, errMsg: 'Indirizzo e coordinate di arrivo non fornite'});
  }

  try {
    var coordinatesFrom = inCoordinateFrom;
    if (!coordinatesFrom) { 
      var coordFrom = await getCoordinatesFromAddress(addressFrom); 

      coordinatesFrom = coordFrom.puntoMappa;
    }

    await sleep(1200);

    var coordinatesTo = inCoordinateTo;
    if (!coordinatesTo) { 
      var coordTo = await getCoordinatesFromAddress(addressTo); 

      coordinatesTo = coordTo.puntoMappa;
    }

    // Calcola la distanza lineare tra le coordinate utilizzando geolib
    const distanceInMeters = await geolib.getDistance(coordinatesFrom, coordinatesTo);
    
    return JSON.stringify({ addressFrom, coordinatesFrom, addressTo, coordinatesTo, distanceInMeters});

  } catch (error) {
    console.error('ERRORE', error);
    throw({ errCode: 500, errMsg: 'Errore durante la geocodifica' });
  } 
}

<!-------------------------------------------------------------->
function getDistancePost(app) {
  // Endpoint per ottenere le coordinate di un indirizzo
  app.get('/coordinate', async (req, res) => {
    const addressFrom = req.query.partenza; // Assicurati di passare l'indirizzo come parametro nella richiesta GET
    const addressTo = req.query.arrivo; // Assicurati di passare l'indirizzo come parametro nella richiesta GET

    try {
      const detailsJSON = JSON.parse(await getDistance(addressFrom, addressTo, null, null));

      res.json(detailsJSON);
    } catch (error) {
      console.error(error);
      
      res.status(error.errCode).json(error);
    }
  });
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

//{"address":"via abruzzi 7 biella","coordinates":["8.0520154","45.5513972"]}

// Esporta la funzione getDistance, nel caso in cui vuoi utilizzarla altrove
module.exports = { getCoordinatesFromAddress, getAddressFromCoordinates, getDistance, getDistancePost };