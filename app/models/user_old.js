const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');
const Schema = mongoose.Schema;
// define the schema for our user model
const userSchema = new Schema({

  email:        { type: String, required: true, unique: true},
  inviteEmail:  { type: String, required: true, unique: true},
  password:     { type: String, required: true},
  status:       { type: String},
  name:   { first: {type: String},
            last: {type: String},
          },
  addresses : [{  first       : {type: String},
                  last        : {type: String},
                  mobilePrefix: {type: String},
                  mobileNumber: {type: String},
                  city        : {type: String},
                  province    : {type: String},
                  address     : {type: String},
                  numciv      : {type: String},
                  main        : {type: String}, // usato per definire quale il principale yes/no
                  preference  : {type: String}  // flag di quale è l'ultimo scelto yes/no
              }],
  fiscalCode: {type: String},  
  initDate: {
    type: Date,
    default: Date.now
  },
  endDate: { type: Date},
  eligibleFriends: {type: Number, default: 0},
  facebook: {
    id: String,
    token: String,
    email: String,
    name: String
  },
  twitter: {
    id: String,
    token: String,
    displayName: String,
    username: String
  },
  google: {
    id: String,
    token: String,
    email: String,
    name: String
  },
  idParent      : {type: String},
  booze         : {type: Number, default: 0},
  boozeXfriend  : {type: Number, default: 0},
  resetPasswordToken: String,
  resetPasswordExpires: Date
});

//var User = mongoose.model('Users', userSchema);

// methods =====================================================================
// generating a hash
userSchema.methods.generateHash = function(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
  return bcrypt.compareSync(password, this.password);
};

// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);
