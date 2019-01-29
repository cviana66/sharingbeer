// Require mongoose and mongoose schema
//=======================================
// mongoimport -h ds045464.mlab.com:45464 -d dbm1 -c citycaps -u sb -p sharing11beer --file /home/carlo/Documenti/Birra/listacomuni_V2.csv --type csv --headerline
// mongoexport -h ds045464.mlab.com:45464 -d dbm1 -c citycaps -u sb -p sharing11beer -o /home/carlo/Documenti/Birra/listacomuni_export_V1.csv --type=csv --fields "Istat","Comune","Provincia","Regione","Prefisso","CAP","CodFisco","Abitanti","Link"
// Import con forzatura tipologia del campo (valido solo con mongoimport >= 3.4)
// mongoimport -h ds045464.mlab.com:45464 -d dbm1 -c citycaps -u sb -p sharing11beer --file /home/carlo/Documenti/Birra/listacomuni.csv --type csv --columnsHaveTypes --fields "Istat.string(),Comune.string(),Provincia.string(),Regione.string(),Prefisso.string(),CAP.string(),CodFisco.string(),Abitanti.string(),Link.string()"
//=======================================
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Define item schema
var CityCapSchema = new Schema({
    Istat     : { type: String, required: true },
    Comune 	  : { type: String, required: true },
    Provincia	: { type: String},
    Regione	  : { type: String},
    Prefisso	: { type: String},
    CAP       : { type: String},
    CodFisco  : { type: String},
    Abitanti  : { type: String},
    Link      : { type: String}
});

// create the model for orsers and expose it to our app
module.exports = mongoose.model('CityCap', CityCapSchema);