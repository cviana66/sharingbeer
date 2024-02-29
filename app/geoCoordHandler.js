const axios = require('axios');
const geolib = require('geolib'); // calcolare la distanza tra le coordinate iniziali e finali

async function getCoordinates(address) {
  if (!address) {
    throw({ errCode: 404, errMsg: 'Indirizzo di riferimento non fornito'});
  }

  try {
    // Effettua una richiesta al servizio di geocodifica di Nominatim per ottenere le coordinate di partenza
    const geocodeResponse = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: address,
        format: 'json',
      },
    });

    var coordinates = null;
    if (geocodeResponse.data.length > 0) {
      coordinates = {'puntoMappa': {'indirizzo': address, 
                                    'latitude': geocodeResponse.data[0].lat,
                                    'longitude': geocodeResponse.data[0].lon}};
      //console.log('Indirizzo', address, ' - coordinate', coordinates);

      return coordinates;
    } else {
      throw({ errCode: 404, errMsg: 'Indirizzo di riferimento non trovato' });
    }

  } catch (error) {
    console.error('ERRORE', error);
    throw({ errCode: 500, errMsg: 'Errore durante la geocodifica' });
  }
}

<!-------------------------------------------------------------->
async function getDistance(addressFrom, addressTo, req, res) {

  if (!addressFrom) {
    throw({ errCode: 404, errMsg: 'Indirizzo di partenza non fornito'});
  }
  if (!addressTo) {
    throw({ errCode: 404, errMsg: 'Indirizzo di arrivo non fornito'});
  }

  try {
    var coordinatesFrom = await getCoordinates(addressFrom);

    var coordinatesTo = await getCoordinates(addressTo);

    // Calcola la distanza lineare tra le coordinate utilizzando geolib
    const distanceInMeters = await geolib.getDistance(coordinatesFrom.puntoMappa, coordinatesTo.puntoMappa);
    
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
      const detailsJSON = JSON.parse(await getDistance(addressFrom, addressTo));

      res.json(detailsJSON);
    } catch (error) {
      console.error(error);
      
      res.status(error.errCode).json(error);
    }
  });
}

//{"address":"via abruzzi 7 biella","coordinates":["8.0520154","45.5513972"]}

// Esporta la funzione getDistance, nel caso in cui vuoi utilizzarla altrove
module.exports = { getCoordinates, getDistance, getDistancePost };