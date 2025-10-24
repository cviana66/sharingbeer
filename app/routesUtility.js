const User = require('./models/user');
const lib = require('./libfunction');

module.exports = function(app, moment, mongoose) {
  // Pagina Utilità: segnaposto iniziale
  app.get('/utilita', lib.isAdmin, (req, res) => {
    try {
      const numProducts = (req.session && req.session.numProducts) ? req.session.numProducts : 0;
      res.render('utilita.njk', {
        user: req.user,
        numProducts,
        message: req.flash ? req.flash('info') : null
      });
    } catch (err) {
      console.error('Errore /utilita:', err);
      res.status(500).send('Errore interno');
    }
  });

  // Dashboard vendite per prodotto (S2S OK)
  app.get('/utilita/dashboard', lib.isAdmin, async (req, res) => {
    try {
      const stats = await User.aggregate([
        { $unwind: "$orders" },
        { $match: { "orders.payment.s2sStatus": "OK" } },
        { $unwind: "$orders.items" },
        { $group: {
            _id: "$orders.items.name",
            quantitaVenduta: { $sum: { $ifNull: [ "$orders.items.qty", 0 ] } }
        }},
        { $project: { _id: 0, name: "$_id", quantitaVenduta: 1 } },
        { $sort: { quantitaVenduta: -1 } }
      ]);

      // Calcolo bottiglie lato server per usare la costante globale
      const numPerBeerBox = global.numBottigliePerBeerBox || 6;
      const enriched = stats.map(s => ({
        name: s.name,
        quantitaVenduta: s.quantitaVenduta,
        bottiglie: (s.quantitaVenduta || 0) * numPerBeerBox
      }));

      const totalBeerbox = enriched.reduce((acc, s) => acc + (s.quantitaVenduta || 0), 0);
      const totalBottiglie = enriched.reduce((acc, s) => acc + (s.bottiglie || 0), 0);

      const numProducts = (req.session && req.session.numProducts) ? req.session.numProducts : 0;
      res.render('utilita_dashboard.njk', {
        user: req.user,
        numProducts,
        stats: enriched,
        totalBeerbox,
        totalBottiglie
      });
    } catch (err) {
      console.error('Errore /utilita/dashboard:', err);
      res.status(500).send('Errore interno');
    }
  });
};
