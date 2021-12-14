// Require mongoose and mongoose schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Define order schema
var PayInfoSchema = new Schema({
    idPay	   	: { type: String, required: true },
    idOrder	   	: { type: String, required: true },
    state		: { type: String, required: true },
    responseMsg : { type: String, required: false }
});
// create the model for pyment and expose it to our app
module.exports = mongoose.model('PayInfo', PayInfoSchema);