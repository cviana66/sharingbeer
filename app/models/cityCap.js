// Require mongoose and mongoose schema
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