// Require mongoose and mongoose schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Define item schema
var ItemSchema = new Schema({
    idOrder    	: { type: String, required: true },
    idPrdoduct 	: { type: String, required: true },
    nameProduct	: { type: String},
    quantity	: { type: Number},
    price	    : { type: Number}
});

// create the model for orsers and expose it to our app
module.exports = mongoose.model('Item', ItemSchema);