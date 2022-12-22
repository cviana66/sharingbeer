// Require mongoose and mongoose schema
//=======================================
// https://www.istat.it/storage/codici-unita-amministrative/Elenco-comuni-italiani.xlsx (da cancellare e rinominare colonne prima di caricare)
// https://www.istat.it/it/files//2011/01/Tutti-i-file-1.zip (scarica tuti i file disponibili tra cui quello sopra anche in formato CSV)
// mongoimport -h ds045464.mlab.com:45464 -d dbm1 -c citycaps -u sb -p sharing11beer --file /home/carlo/Documenti/Birra/listacomuni_V2.csv --type csv --headerline
// mongoexport -h ds045464.mlab.com:45464 -d dbm1 -c citycaps -u sb -p sharing11beer -o /home/carlo/Documenti/Birra/listacomuni_export_V1.csv --type=csv --fields "Istat","Comune","Provincia","Regione","Prefisso","CAP","CodFisco","Abitanti","Link"
// Import con forzatura tipologia del campo (valido solo con mongoimport >= 3.4)
// mongoimport -h ds045464.mlab.com:45464 -d dbm1 -c citycaps -u sb -p sharing11beer --file /home/carlo/Documenti/Birra/listacomuni.csv --type csv --columnsHaveTypes --fields "Istat.string(),Comune.string(),Provincia.string(),Regione.string(),Prefisso.string(),CAP.string(),CodFisco.string(),Abitanti.string(),Link.string()"
//=======================================
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Define item schema
var CityIstatSchema = new Schema({
    Istat       : { type: String, required: true },
    Comune 	    : { type: String, required: true },
    ZonaGeo     : { type: String},
    Regione	    : { type: String},
    Provincia	  : { type: String},
    SiglaAuto	  : { type: String},
    CodCatasto  : { type: String}
});

// create the model for orsers and expose it to our app
module.exports = mongoose.model('CityIstat', CityIstatSchema);
