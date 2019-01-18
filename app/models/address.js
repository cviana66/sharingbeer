var mongoose = require('mongoose');

// define the schema for our user model
var userSchema = mongoose.Schema({

    id: { type: String, required: '{PATH} is required.'},
    address: {
        address    : { type: String },
        number      : { type: String },
        town        : { type: String },
        province    : { type: String },
        conutry     : { type: String },
        cap         : { type: String }
});

// create the model for users and expose it to our app
module.exports = mongoose.model('Address', userSchema);
