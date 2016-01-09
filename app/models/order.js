// Require mongoose and mongoose schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Define order schema
var OrderSchema = new Schema({
    idUser      : { type: String, required: true },
    email       : { type: String, required: true },
    dateInsert  : { type: Date, required: true },
    status      : { type: String, required: true},
    idPayment   : { type: String},
    discount    : { type: Number},
    totalPrice  : { type: Number}
});
// create the model for orsers and expose it to our app
module.exports = mongoose.model('Order', OrderSchema);