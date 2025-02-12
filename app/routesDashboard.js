var Users = require('../app/models/user');
var lib = require('./libfunction');

module.exports = (app, moment, mongoose) => {

	// =============================================================================
	// DASBOARD ====================================================================
	// =============================================================================
	//GET
	app.get('/listOfCustomer', lib.isAdmin, async (req, res) => {
		console.debug('LISTA DEI CLIENTI');
		try {
			const users = await Users.find( {$or: [ { 'local.status': 'customer'}, {'local.status':'validated' }]}).sort({"local.initDate": 1});
			res.render('elencoClienti.njk', {
				users: users,
				user: req.user
			})
		} catch (err) {
			console.error(err);
		}
	})

	//GET
	app.get('/listOfFriends', lib.isLoggedIn, async (req, res) => {
		console.debug('LISTA DI AMICI');
		try {

			const userId = req.user._id;
			const friendsTokens = await findFriendsTokens(userId);
			var usersWithTokens = await findNewUsersFromTokens(friendsTokens);		

			console.debug(friendsTokens);
			console.debug(usersWithTokens);

			for (const documento of usersWithTokens) {
 				 console.debug(`ID: ${documento.id}, initDate: ${documento.local.resetPasswordExpires}`);
 				 const giorni = giorniTraDueDate(documento.local.resetPasswordExpires, Date.now());
				 console.debug(`Ci sono ${giorni} giorni tra le due date.`);
				 documento.local.residualTime = giorni; 

				 if (giorni <= 0) {
				 	ret = await Users.findOneAndUpdate({'friends.token':documento.local.token},{'friend.status': 'expired'})
				 }

			}

			const usersAccepted = await findUsersPerStatus(req.user._id,'accepted')
			console.debug(usersAccepted)

			res.render('elencoAmici.njk', {
				friendsNonValidated: usersWithTokens,
				friendsValidated: usersAccepted,
				user: req.user,
				amiciDaInvitare: req.session.amiciDaInvitare
			})
		} catch (err) {
			console.error(err);
		}
	})
}

// Funzione per trovare i token dei friends di un utente
async function findFriendsTokens(userId) {
  const user = await Users.findById(userId).select('friends.token');
  if (!user) {
    throw new Error('Utente non trovato');
  }
  const friendsTokens = user.friends.map(friend => friend.token);
  return friendsTokens;
}

// Funzione per trovare gli utenti con token specifici
async function findNewUsersFromTokens(tokens) {
  const users = await Users.find({ $and: [{ 'local.token': { $in: tokens } },{'local.status':'new'},{'local.name.first':{$ne : ""}}]},'local').sort({'local.name.first': 1});
  return users;
}

/* Funzione per trovare gli utenti validati
async function findUsersValidated(id) {
  const users = await Users.find({ $and: [{ 'local.idParent': id },{'local.status':'validated'}]},'local');
  return users;
}*/

// Funzione per trovare gli utenti accepted (documento frinds dell'utente)
async function findUsersPerStatus(_id, status) {
  	const users = await Users.aggregate([{$match:{ '_id': _id }}, 
  						{$unwind:"$friends"},
  						{$match:{'friends.status': status}}/*, 
  						{$project:{"_id":0,"privacy":0, "local":0, "addresses":0, "orders":0}} */
  						]);
  return users;
}

// delta giorni tra 2 date
function giorniTraDueDate(data1, data2) {
  const dataIniziale = new Date(data1);
  const dataFinale = new Date(data2);
  const differenzaInMillisecondi = Math.abs(dataFinale - dataIniziale);
  var giorni = Math.floor(differenzaInMillisecondi / (1000 * 60 * 60 * 24));
  if (dataIniziale < dataFinale) giorni = giorni *-1
  return giorni;
}