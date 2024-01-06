// Handler for flash messages. Allow translation and default values

const translate = require('@iamtraction/google-translate');

// Funzione per la traduzione del messaggio
async function transMsg(inputMessage, langCode) {
    console.log('TRADUCO:', inputMessage);

    try {
        const { text } = await translate(inputMessage, { to: langCode });
        console.log('RISULTATO TRADUZIONE', text);
        return text;
    } catch (err) {
        console.error(err);
        throw err;
    }
}

function transMsgPost(app) {
	// Route Express.js per gestire la richiesta POST
	app.post('/translateMsg', async (req, res) => {
	  const { inputMessage, langCode } = req.body;

	  try {
	    const translatedMsg = await transMsg(inputMessage, langCode);
	    res.json({ result: translatedMsg });
	  } catch (error) {
	    console.error(error);
	    res.status(500).json({ error: 'Errore durante la traduzione' });
	  }
	});
}

// Esporta la funzione transMsg, nel caso in cui vuoi utilizzarla altrove
module.exports = { transMsg, transMsgPost };