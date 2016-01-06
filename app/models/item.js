// Require mongoose and mongoose schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Define item schema
var ItemSchema = new Schema({
    idOrder    	: { type: String, required: true },
    idPrdoduct 	: { type: String, required: true },
    quantity	: { type: String},
    price	    : { type: Number}
});