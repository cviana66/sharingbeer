// Require mongoose and mongoose schema
//=======================================
// 
// mongoexport -h ds045464.mlab.com:45464 -d dbm1 -c multiplecaps -u sb -p sharing11beer -o /home/carlo/Documenti/Birra/listacomuni_export_V1.csv --type=csv --fields "Istat","Comune","Provincia","Regione","CAP"
// 
// mongoimport -h ds045464.mlab.com:45464 -d dbm1 -c multiplecaps -u sb -p sharing11beer --file /home/carlo/Documenti/Birra/capmultipli.csv --type csv --columnsHaveTypes --fields "Istat.string(),Comune.string(),Provincia.string(),Regione.string(),CAP.string()"
//=======================================
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Define item schema
var MultipleCapSchema = new Schema({
    Istat     : { type: String, required: true },
    Comune 	  : { type: String, required: true },
    Provincia	: { type: String},
    Regione	  : { type: String},
    CAP       : { type: String}
});

// create the model for orsers and expose it to our app
module.exports = mongoose.model('MultipleCap', MultipleCapSchema);