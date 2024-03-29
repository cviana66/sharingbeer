const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');
const Schema = mongoose.Schema;
// define the schema for our user model
const userSchema = new Schema({
  local		: { name: { first: {type: String},
                      last : {type: String},
                    },
              email           : {type: String, required: true, unique: true},
              token           : {type: String, required: true, unique: true},
              password        : {type: String, required: true},
              status          : {type: String, required: true},
              fiscalCode      : {type: String},  
              eligibleFriends : {type: Number, default: 0},
              idParent        : {type: String, required: true, unique: true}, //id della persona che ha fatto l'invito
              booze           : {type: Number, default: 0},
              boozeXfriend    : {type: Number, default: 0},
              initDate              : {type: Date, default: Date.now},
              endDate               : {type: Date},
              resetPasswordToken    : {type: String},
              resetPasswordExpires  : {type: Date},
              role                  : {type: String}
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
              }],
  friends : [{  id    : {type: String, unique: true },
                name  : { first: {type: String, required: true, unique: false},
                          last: {type: String},
                        },
                status: {type: String},
                token : {type: String, required: true, unique: true},
                email : {type: String, unique: true},
            }],
  orders: [{
              email       : { type: String, required: true },
              dateInsert  : { type: Date, required: true },
              status      : { type: String, required: true},
              idPayment   : { type: String},
              shippingDiscount    : { type: Number},
              pointsDiscount      : { type: Number},
              shipping            : { type: Number},
              totalPriceBeer      : { type: Number},
              totalPriceTotal     : { type: Number},
              totalQty            : { type: Number},
              items : [{ 
                  id : {type: String},
                  name : {type: String},
                  price : {type: Number},
                  qty   : {type: Number},                
              }],
              address :{  
                  addressId: {type: String},
                  name: { first: {type: String},
                          last : {type: String},
                        },
                  mobilePrefix: {type: String},
                  mobileNumber: {type: String},
                  city        : {type: String},
                  province    : {type: String},
                  address     : {type: String},
                  houseNumber : {type: String},
              },
              paypal : {
                  orderId        : { type: String},
                  transactionId  : { type: String},
                  createTime     : { type: String},
                  updateTime     : { type: String},
                  totalAmount    : { type: String},
                  currencyAmount : { type: String},
                  infoPayment    : { type: Object}
              }
          }]

});

// methods =====================================================================
// generating a hash
userSchema.methods.generateHash = function(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
  return bcrypt.compareSync(password, this.local.password);
};

// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);
