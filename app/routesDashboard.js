var Users = require('../app/models/user');
var lib = require('./libfunction');
const mailToCustomerWithOrder  = require('../config/mailToCustomerWithOrder');
const mailToCustomerWithoutOrder  = require('../config/mailToCustomerWithoutOrder');

module.exports = (app, moment, mongoose) => {

	// =============================================================================
	// DASHBOARD ====================================================================
	// =============================================================================
	//GET
	app.get('/listOfCustomer', lib.isAdmin, async (req, res) => {
		try {
			const usersWithOrders = await getCustomerWithOrderDone()
			const usersWithoutOrders = await getCustomerWithoutOrder()
			res.render('elencoClienti.njk', {
				usersWithOrders: usersWithOrders,
				usersWithoutOrders: usersWithoutOrders,
				user: req.user,
        numProducts: req.session.numProducts,
        amiciDaInvitare: req.session.haiAmiciDaInvitare
			})
		} catch (err) {
			console.error(err);
		}
	})

	app.post('/sendNotifyMail', lib.isAdmin, async (req,res) => {

		var selectedCustomers = req.body.customers; // Array di ID dei clienti selezionati

		console.debug('CUSTOMERS ID',selectedCustomers)
		if (typeof selectedCustomers === "string") selectedCustomers = [selectedCustomers]
		var html = ""
		try {		
			for (const customerId of selectedCustomers) {
				//console.debug(customerId)
	    	const customer = await Users.findById(customerId);
	    	const server = lib.getServer(req);
	    	console.debug('CUSTOMER', customer.local.email)
	    	if (req.body.tipoCliente == 'conOrdini') {
		    	html = mailToCustomerWithOrder(customer.local.name.first, customer.local.email, server)
		    	//await lib.sendmailToPerson('', customer.local.email, '', '', '', '', '', 'notificaClienteConOrdiniFatti', server, html);
	    	} else if (req.body.tipoCliente == 'senzaOrdini') {
	    		//res.send(mailToCustomerWithoutOrder(customer.local.name.first, customer.local.email, server))    	
	    		 html = mailToCustomerWithoutOrder(customer.local.name.first, customer.local.email, server)
		    	//await lib.sendmailToPerson('', customer.local.email, '', '', '', '', '', 'notificaClienteSenzaOrdiniFatti', server, html);
	    	}
	    	// TODO: aggiornare nel cliente il numero di comunicazioni inviate, tipo  e data ultimo invio	    	
	    }
	    model = {
				user: req.user,
        numProducts: req.session.numProducts,
        amiciDaInvitare: req.session.haiAmiciDaInvitare,
        html: html	
			}
	    res.render('info.njk',model)
	  } catch (e) {
	  	console.error(e);
	  	model = {
				user: req.user,
        numProducts: req.session.numProducts,
        amiciDaInvitare: req.session.haiAmiciDaInvitare,
        messaggio: e	
			}
	  	res.render('info.njk', model)
	  }
	});

	//ALL
	app.all('/listOfFriends', lib.isLoggedIn, async (req, res) => {		
		
		let msg = req.body.msg;
    let msgType = req.body.type;
    req.flash('message', msg);
		try {
			var isScaduti = false
			const userId = req.user._id;
			const friendsTokens = await findFriendsTokens(userId); //ricavo i token perchè non ho ancora l'id
			const friendsId = await findFriendsId(userId); //ricavo l'id perchè il token è cambiato
			const filteredFriendsId = friendsId.filter(item => item !== undefined);

			console.debug("FRIENDS TOKEN",friendsTokens);
			console.debug("FRIENDS ID",filteredFriendsId);
			// La ricerca viene fatta leggendo il documento dell'utente a partire dall'elenco friends
			// filtrando per il token e così ottenendo l'elenco di utente-friend, poi viene clusterizzato in funzione dello stato dell'utente-friend.
			// NOTA: in usersFriendsNew ci sono anche quelli expired che vengono poi catturati analizzando la data: resetPasswordExpires
			var usersFriendsNew = await findUsersFromTokensAndStatus(friendsTokens,['new','waiting']); 		
			var usersFriendsValidated = await findUsersFromIdAndStatus(filteredFriendsId,['validated']);
			var usersFriendsCustomer = await findUsersFromIdAndStatus(filteredFriendsId,['customer']);

			//console.debug("FRIENDS NEW & WAITING ->",usersFriendsNew); 
			//console.debug("FRIENDS VALIDATED ->",usersFriendsValidated);
			//console.debug("FRIENDS CUSTOMER ->",usersFriendsCustomer);

			for (const documento of usersFriendsNew) {
 				 //console.debug(`ID PARENT:${documento.local.idParent} TOKEN:${documento.local.token} STATUS:${documento.local.status}, Name: ${documento.local.name.first}`);
 				 const giorni = giorniTraDueDate(documento.local.resetPasswordExpires, Date.now());
				 console.debug(`Ci sono ${giorni} giorni tra le due date.`);
				 documento.local.residualTime = giorni; 

				 if (giorni <= 0) {
				 		isScaduti = true
				 		console.debug(req.user._id, documento.local.token)
				 		await updateFriendStatusByToken(req.user._id, documento.local.token, 'expired')
				 }
			}			

			const inviti = await lib.getInviteAvailable(req) 
			
			res.render('elencoAmici.njk', {
				friendsNew: usersFriendsNew,
				friendsValidated: usersFriendsValidated,
				friendsCustomer: usersFriendsCustomer,
				user: req.user,
				numProducts : req.session.numProducts,
				isScaduti: isScaduti,
				amiciDaInvitare: req.session.haiAmiciDaInvitare,
				invitiDisponibili: inviti.numInviteAvialable,
				server: lib.getServer(req),
				message: req.flash('message'),
				type: msgType
			})
		} catch (err) {
			console.error(err);
			let msg = 'Ci dispiace, si è verificato un errore inatteso. Riprova'
      req.flash('error', msg);
      return res.render('info.njk', {
                                      message: req.flash('error'),
                                      type: "warning",
                                      user: req.user,
															        numProducts: req.session.numProducts,
															        amiciDaInvitare: req.session.haiAmiciDaInvitare
                                    });
		}
	})

	app.post('/updateNotify', lib.isLoggedIn, async (req, res) => {
		const token = req.body.token
		console.debug('updateNotify-TOKEN->',token)
		try {
			await updateCountNotifyByToken(req.user._id, token)			
			return res.status(200).send({ok: true})
		} catch (e) {      
      console.error(lib.logDate("Europe/Rome") + ' [ERROR][RECOVERY:NO] "POST /updateNotify" USERS_ID: {"_id":ObjectId("' + req.user._id + '")} ERR: ' + e);
      return res.status(500).send({ err: e, ok: false })
    }
	})

	app.get('/updateAllExpireStartFromInitDate/:gg', lib.isAdmin, async (req, res) => {		
		var giorni = req.params.gg || 0;
		const daysToAdd = giorni * 24 * 60 * 60 * 1000 // gg * ore * min * seco * millles
		try {
			if (giorni > 0) {
		    const result = await Users.updateMany(
		      { 'local.status': 'new' }, // Condizione per selezionare i documenti
		      [
		        {
		          $set: {
		            'local.resetPasswordExpires': {
		              $add: ['$local.initDate', daysToAdd]
		            },
		          },
		        },
		      ]
		    );

		    console.log(`${result.modifiedCount} documenti aggiornati.`);
		    let msg = 'La data di expire è stata aggiornata ed è uguale alla data initDate +' + giorni
	      req.flash('error', msg);
	      const model = {
					user: req.user,
			    numProducts: req.session.numProducts,
			    amiciDaInvitare: req.session.haiAmiciDaInvitare,
			    message: req.flash('error'),
	        type: "warning"
				}
	      return res.render('info.njk', model);
      } else {
      	let msg = 'La data di expire non è stata modificata'
	      req.flash('error', msg);
	      return res.render('info.njk', {
	                                      message: req.flash('error'),
	                                      type: "warning",
	                                      user: req.user,
																        numProducts: req.session.numProducts,
																        amiciDaInvitare: req.session.haiAmiciDaInvitare
	                                    });
      }
	  } catch (error) {
	    console.error('Errore durante l\'aggiornamento:', error);
	    let msg = 'Si è verificato un errore nell\'update della data di Expire. La data di Expire è calcolata a partire dalla di initDate'
      req.flash('error', msg);
      return res.render('info.njk', {
                                      message: req.flash('error'),
                                      type: "danger",
                                      user: req.user,
															        numProducts: req.session.numProducts,
															        amiciDaInvitare: req.session.haiAmiciDaInvitare
                                    });
	  }
	});

	app.get('/updateAllExpireStartFromTodayDate/:gg', lib.isAdmin, async (req, res) => {		
		var giorni = req.params.gg || 0;
		const daysToAdd = giorni * 24 * 60 * 60 * 1000 // gg * ore * min * seco * millles
		//const newExpirationDate = new Date(+new Date() + daysToAdd)
		const newExpirationDate = new Date(+lib.nowDate("Europe/Rome") + daysToAdd)
		try {
			if (giorni > 0) {
		    const result = await Users.updateMany(
		      { 'local.status': 'new' }, // Condizione per selezionare i documenti
		      [
		        {
		          $set: {
		            'local.resetPasswordExpires': newExpirationDate
		          },
		        },
		      ]
		    );

		    console.debug(`${result.modifiedCount} documenti aggiornati con la data ${newExpirationDate}.`);
		    let msg = 'La data di expire è stata aggiornata ed è uguale '+ newExpirationDate;
	      req.flash('error', msg);
	      return res.render('info.njk', {
	                                      message: req.flash('error'),
	                                      type: "warning",
	                                      user: req.user,
																        numProducts: req.session.numProducts,
																        amiciDaInvitare: req.session.haiAmiciDaInvitare
	                                    });
      } else {
      	let msg = 'La data di expire non è stata modificata'
	      req.flash('error', msg);
	      return res.render('info.njk', {
	                                      message: req.flash('error'),
	                                      type: "warning",
	                                      user: req.user,
																        numProducts: req.session.numProducts,
																        amiciDaInvitare: req.session.haiAmiciDaInvitare
	                                    });
      }
	  } catch (error) {
	    console.error('Errore durante l\'aggiornamento:', error);
	    let msg = 'Si è verificato un errore nell\'update della data di Expire.'
      req.flash('error', msg);
      return res.render('info.njk', {
                                      message: req.flash('error'),
                                      type: "danger",
                                      user: req.user,
																      numProducts: req.session.numProducts,
																      amiciDaInvitare: req.session.haiAmiciDaInvitare
                                    });
	  }
	});

	app.get('/addIviteToAll/:num', lib.isAdmin, async (req, res) => {		
		var inviti = req.params.num;
		console.debug('INVITI DA AGGIUNGERE', inviti)
		try {
			if (inviti > 0) {
		    const result = await Users.updateMany(
		      { 'local.status': { $in: ['validated','customer'] } }, // Condizione per selezionare i documenti
		        {
		         $inc: { 'local.eligibleFriends': inviti }
		        },
		    );
		    console.debug(`${result.modifiedCount} documenti aggiornati. Incrementato eligibleFriends di ${inviti}`);
		    let msg = 'Incrementato in numero di inviti possibili di '+ inviti;
	      req.flash('error', msg);
	      return res.render('info.njk', {
	                                      message: req.flash('error'),
	                                      type: "warning",
	                                      user: req.user,
																        numProducts: req.session.numProducts,
																        amiciDaInvitare: req.session.haiAmiciDaInvitare
	                                    });
      } else {
      	let msg = 'Non sono stati aggiunti Inviti'
	      req.flash('error', msg);
	      return res.render('info.njk', {
	                                      message: req.flash('error'),
	                                      type: "warning",
	                                      user: req.user,
																        numProducts: req.session.numProducts,
																        amiciDaInvitare: req.session.haiAmiciDaInvitare
	                                    });
      }
	  } catch (error) {
	    console.error('Errore durante l\'aggiornamento:', error);
	    let msg = 'Si è verificato un errore nell\'aggiunta di Inviti.'
      req.flash('error', msg);
      return res.render('info.njk', {
                                      message: req.flash('error'),
                                      type: "danger",
                                      user: req.user,
																		  numProducts: req.session.numProducts,
																		  amiciDaInvitare: req.session.haiAmiciDaInvitare
                                    });
	  }
	})
} // end module

//========================================================================
// FUNCTION
//========================================================================
async function getCustomerWithOrderDone()  {
	try {
		const users = await Users.find({	$and: [
									    { $or: [
									      { 'local.status': 'customer' },
									      { 'local.status': 'validated' }
									    ]},
									    { orders: { $exists: true, $not: { $size: 0 } } }
									  ]
									}).sort({ "local.initDate": 1 });
		return users
	} catch (e) {
		console.error('Error getCustomerWithOrderDone:', e);
	}
	
} 

async function getCustomerWithoutOrder()  {
	try {
		const users = await Users.find({	$and: [
									    { $or: [
									      { 'local.status': 'customer' },
									      { 'local.status': 'validated' }
									    ]},
									    { $or: [
									      { orders: { $exists: false } },
									      { orders: { $size: 0 } }
									    ]}
									  ]
									}).sort({ "local.initDate": 1 });
		return users
	} catch (e) {
		console.error('Error getCustomerWithoutOrder:', e);
	}
	
} 

async function updateFriendStatusByToken(userId, friendToken, status) {
    try {
        const result = await Users.updateOne(
            { _id: userId, 'friends.token': friendToken }, // Trova l'utente e il friend con il token specificato
            { $set: { 'friends.$.status': status } } // Aggiorna lo stato del friend al valore del parametro status
        );
    } catch (error) {
        console.error('Error updateFriendStatusByToken:', error);
    }
}

async function updateCountNotifyByToken(userId, friendToken) {
    try {
      const result = await Users.updateOne(
          { _id: userId, 'friends.token': friendToken }, // Trova l'utente e il friend con il token specificato
          { 
          	$inc: { 'friends.$.numOfNotify': 1 }, // incrementa di 1, vuol dire che ha cliccato su "Avvisa"
           	$set: { 'friends.$.lastNotifyDate': lib.nowDate("Europe/Rome") } // Aggiorna lastNotifyDate con la data corrente
          }
      );
    } catch (error) {
        console.error('Error updateCountNotifyByToken:', error);
    }
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
// Funzione per trovare gli id dei friends di un utente
async function findFriendsId(userId) {
  const user = await Users.findById(userId).select('friends.id');
  if (!user) {
    throw new Error('Utente non trovato');
  }
  const friendsId = user.friends.map(friend => friend.id);
  return friendsId;
}

// Funzione per trovare gli utenti per token e status (new, waiting, validated, customer)
async function findUsersFromTokensAndStatus(tokens,status) {
  const users = await Users.find({ $and: [{ 'local.token': { $in: tokens }},{'local.status':{ $in: status }},{'local.name.first':{$ne : ""}}]},'local').sort({'local.name.first': 1});
  if (!users) {
    throw new Error('Utente non trovato');
  }
  return users;
}
// Funzione per trovare gli utenti per id e status (new, waiting, validated, customer)
async function findUsersFromIdAndStatus(ids,status) {
  const users = await Users.find({ $and: [{ '_id': { $in: ids }},{'local.status':{ $in: status }},{'local.name.first':{$ne : ""}}]},'local').sort({'local.name.first': 1});
  if (!users) {
    throw new Error('Utenti non trovati');
  }
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