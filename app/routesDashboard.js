var User = require('../app/models/user');
var lib = require('./libfunction');

module.exports = (app, moment, mongoose) => {

    // =============================================================================
    // SHOPPING ====================================================================
    // =============================================================================
    //GET
    app.get('/listOfCustomer', lib.isAdmin, async (req, res) => {
        console.debug('LISTA DEI CLIENTI');
        try {
            const users = await User.find({ 'local.status': 'customer' });
            console.debug(users);
            res.render('elencoClienti.njk', {
                users: users,
                user: req.user
            })
        } catch (err) {
            console.error(err);
        }
    })


}