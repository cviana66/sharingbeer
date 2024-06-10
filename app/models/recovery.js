const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define order schema
const RecoverySchema = new Schema({
    url      : { type: String, required: true },    
});
// create the model for orsers and expose it to our app
module.exports = mongoose.model('Recovery', RecoverySchema);
