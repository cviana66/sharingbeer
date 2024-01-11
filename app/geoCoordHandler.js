const axios = require('axios');
const geolib = require('geolib'); // calcolare la distanza tra le coordinate iniziali e finali

<!-------------------------------------------------------------->
async function getDistance(addressFrom, addressTo, req, res) {

  if (!addressFrom) {
    throw({ errCode: 404, errMsg: 'Indirizzo di partenza non fornito'});
  }
  if (!addressTo) {
    throw({ errCode: 404, errMsg: 'Indirizzo di arrivo non fornito'});
  }

  try {
    // Effettua una richiesta al servizio di geocodifica di Nominatim per ottenere le coordinate di partenza
    const geocodeResponseFrom = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: addressFrom,
        format: 'json',
      },
    });

    var coordinatesFrom = null;
    if (geocodeResponseFrom.data.length > 0) {
      coordinatesFrom = {'latitude': geocodeResponseFrom.data[0].lat, 'longitude': geocodeResponseFrom.data[0].lon};
      //res.json({ addressFrom, coordinatesFrom });
      // Effettua una richiesta al servizio di geocodifica di Nominatim per ottenere le coordinate di arrivo
      const geocodeResponseTo = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: addressTo,
          format: 'json',
        },
      });

      var coordinatesTo = null;
      if (geocodeResponseTo.data.length > 0) {
        coordinatesTo = {'latitude': geocodeResponseTo.data[0].lat, 'longitude': geocodeResponseTo.data[0].lon};

        // Calcola la distanza lineare tra le coordinate utilizzando geolib
        const distanceInMeters = geolib.getDistance(coordinatesFrom, coordinatesTo);

        return JSON.stringify({ addressFrom, coordinatesFrom, addressTo, coordinatesTo, distanceInMeters, distanceInMeters});
      } else {
        throw({ errCode: 404, errMsg: 'Indirizzo di arrivo non trovato' });
      }
    } else {
      throw({ errCode: 404, errMsg: 'Indirizzo di partenza non trovato' });
    }
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
module.exports = { getDistance, getDistancePost };