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
  friends : [{
                //id: {type: String, required: true},
                firstNameFriend: {type: String, required: true, unique: false},
                lastNameFriend: {type: String, unique: false},
                //emailParent: {type: String, required: true, unique: false},
                emailFriend: {type: String, required:true, unique: true}
            }],
  orders: [{
              userId      : { type: String, required: true },
              //email       : { type: String, required: true },
              dateInsert  : { type: Date, required: true },
              status      : { type: String, required: true},
              idPayment   : { type: String},
              discount    : { type: Number},
              totalPrice  : { type: Number},
              totalQty    : { type: Number},
              items : [{ 
                  id : {type: String},
                  name : {type: String},
                  price : {type: Number},
                  qty   : {type: Number},                
              }],
              paypal : {
                  orderId        : { type: String},
                  transactionId  : { type: String},
                  createTime     : { type: String},
                  updateTime     : { type: String},
                  totalAmount    : { type: String},
                  currencyAmount : { type: String},
                  infoPayment    : { type: String}
              }
          }],
  fiscalCode: {type: String},  
  initDate: {
    type: Date,
    default: Date.now
  },
  endDate: { type: Date},
  eligibleFriends: {type: Number, default: 0},
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
