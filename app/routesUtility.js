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
      // Vista trimestrale (default) con filtro anno opzionale
      if (req.query.view === 'quarter' || !req.query.view) {
        const numPerBeerBox = global.numBottigliePerBeerBox || 6;
        const selectedYear = req.query.year ? parseInt(req.query.year, 10) : null;

        // Pipeline trimestrale con filtro anno opzionale
        const pipeline = [
          { $unwind: "$orders" },
          { $match: { "orders.payment.s2sStatus": "OK" } },
          { $unwind: "$orders.items" },
          { $addFields: { orderDate: { $ifNull: [ "$orders.dateInsert", null ] } } },
          { $addFields: { year: { $cond: [ { $ne: ["$orderDate", null] }, { $year: "$orderDate" }, null ] }, month: { $cond: [ { $ne: ["$orderDate", null] }, { $month: "$orderDate" }, null ] } } },
          { $addFields: { quarter: { $cond: [ { $ne: ["$month", null] }, { $ceil: { $divide: ["$month", 3] } }, null ] } } }
        ];
        if (selectedYear && !Number.isNaN(selectedYear)) {
          pipeline.push({ $match: { year: selectedYear } });
        }
        pipeline.push(
          { $group: { _id: { year: "$year", quarter: "$quarter", name: "$orders.items.name" }, quantitaVenduta: { $sum: { $ifNull: [ "$orders.items.qty", 0 ] } } } },
          { $project: { _id: 0, year: "$_id.year", quarter: "$_id.quarter", name: "$_id.name", quantitaVenduta: 1, bottiglie: { $multiply: ["$quantitaVenduta", numPerBeerBox] } } },
          { $sort: { year: 1, quarter: 1, quantitaVenduta: -1 } }
        );

        const quarterly = await User.aggregate(pipeline);

        // Calcolo lista anni disponibili (indipendente dal filtro per popolare select)
        const yearsAgg = await User.aggregate([
          { $unwind: "$orders" },
          { $match: { "orders.payment.s2sStatus": "OK" } },
          { $project: { year: { $year: "$orders.dateInsert" } } },
          { $match: { year: { $ne: null } } },
          { $group: { _id: "$year" } },
          { $sort: { _id: 1 } }
        ]);
        const years = yearsAgg.map(y => y._id);

        // Organizza per (year, quarter)
        const groupMap = new Map();
        quarterly.forEach(r => {
          // Salta eventuali record senza year/quarter (se esistono)
          if (r.year == null || r.quarter == null) return;
          const key = r.year + '-Q' + r.quarter;
          if (!groupMap.has(key)) {
            groupMap.set(key, { year: r.year, quarter: r.quarter, rows: [], subtotalBeerbox: 0, subtotalBottiglie: 0 });
          }
          const entry = groupMap.get(key);
          entry.rows.push({ name: r.name, quantitaVenduta: r.quantitaVenduta, bottiglie: r.bottiglie });
          entry.subtotalBeerbox += r.quantitaVenduta;
          entry.subtotalBottiglie += r.bottiglie;
        });
        const quarters = Array.from(groupMap.values()).sort((a,b)=> (a.year - b.year) || (a.quarter - b.quarter));
        const totalBeerbox = quarters.reduce((acc,q)=> acc + q.subtotalBeerbox, 0);
        const totalBottiglie = quarters.reduce((acc,q)=> acc + q.subtotalBottiglie, 0);
        const numProducts = (req.session && req.session.numProducts) ? req.session.numProducts : 0;
        return res.render('utilita_dashboard_quarter.njk', {
          user: req.user,
          numProducts,
          quarters,
          totalBeerbox,
          totalBottiglie,
          years,
          selectedYear: selectedYear || ''
        });
      }
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
