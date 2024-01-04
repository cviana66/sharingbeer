
const axios = require('axios');
const geolib = require('geolib'); // calcolare la distanza tra le coordinate iniziali e finali

module.exports = function(app) {
  // Endpoint per ottenere le coordinate di un indirizzo
  app.get('/coordinate', async (req, res) => {
    const addressFrom = req.query.partenza; // Assicurati di passare l'indirizzo come parametro nella richiesta GET
    const addressTo = req.query.arrivo; // Assicurati di passare l'indirizzo come parametro nella richiesta GET

    if (!addressFrom) {
      return res.status(400).json({ error: 'Indirizzo di partenza non fornito' });
    }
    if (!addressTo) {
      return res.status(400).json({ error: 'Indirizzo di arrivo non fornito' });
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

          res.json({ addressFrom, coordinatesFrom, addressTo, coordinatesTo, distanceInMeters, distanceInMeters});
        } else {
          res.status(404).json({ error: 'Indirizzo di arrivo non trovato' });
        }
      } else {
        res.status(404).json({ error: 'Indirizzo di partenza non trovato' });
      }
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ error: 'Errore durante la geocodifica' });
    }
  });
}

//{"address":"via abruzzi 7 biella","coordinates":["8.0520154","45.5513972"]}