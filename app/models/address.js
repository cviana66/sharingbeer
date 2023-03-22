var mongoose = require('mongoose');

// define the schema for our user model
var addressSchema = mongoose.Schema({
  first       : {type: String},
  last        : {type: String},
  mobilePrefix: {type: String},
  mobileNumber: {type: String},
  city        : {type: String},
  province    : {type: String},
  address     : {type: String},
  numciv      : {type: String},
  main        : {type: String}, // usato per definire quale il principale yes/no
  preference  : {type: String}  // flag di quale è l'ultimo scelto yes/no
});

// create the model for users and expose it to our app
module.exports = mongoose.model('Address', addressSchema);
