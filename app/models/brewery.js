const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');
const Schema = mongoose.Schema;
// define the schema for our user model
const brewerySchema = new Schema({
  local		: { name: { first: {type: String},
                      last : {type: String},
                    },
              email           : {type: String, required: true, unique: true},
              token           : {type: String, required: true, unique: true},
              password        : {type: String, required: true},
              status          : {type: String, required: true},
              fiscalCode      : {type: String}, 
              piva            : {type: String},
              initDate              : {type: Date, default: Date.now},
              endDate               : {type: Date},
              resetPasswordToken    : {type: String},
              resetPasswordExpires  : {type: Date}
            },
  addresses : [{  name: { first: {type: String},
                          last : {type: String},
                        },
                  mobilePrefix: {type: String},
                  mobileNumber: {type: String},
                  city        : {type: String},
                  province    : {type: String},
                  address     : {type: String},
                  houseNumber : {type: String},
                  main        : {type: String}, // inserito all'atto della registrazine
                  preferred   : {type: String}  // preferito nelle spedizioni
              }]

});

// methods =====================================================================
// generating a hash
brewerySchema.methods.generateHash = function(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
brewerySchema.methods.validPassword = function(password) {
  return bcrypt.compareSync(password, this.local.password);
};

// create the model for users and expose it to our app
module.exports = mongoose.model('Brewery', userSchema);
