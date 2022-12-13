// Require mongoose and mongoose schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Define order schema
var PayInfoSchema = new Schema({
    userId          : { type: String, required: true },
    orderId   	    : { type: String, required: true },
    transactionId 	: { type: String, required: true },
    infoPayment     : { type: String }
});
// create the model for pyment and expose it to our app
module.exports = mongoose.model('PayInfo', PayInfoSchema);
