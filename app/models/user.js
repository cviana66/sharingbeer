const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');
const Schema = mongoose.Schema;
// define the schema for our user model
const userSchema = new Schema({
  account: {  name: { first: {type: String},
                      last: {type: String},
                    },
              email           : { type: String, required: true, unique: true},
              invitetionEmail : { type: String, required: true, unique: true},
              password        : { type: String, required: true},
              status          : { type: String, required: true},
              fiscalCode      : {type: String},  
              eligibleFriends : {type: Number, default: 0},
              idParent        : {type: String, required: true, unique: true}, //id della persona che ha fatto l'invito
              booze           : {type: Number, default: 0},
              boozeXfriend    : {type: Number, default: 0},

            },
  addresses : [{  name: { first: {type: String},
                          last: {type: String},
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
  friends : [{  name: { first: {type: String},
                          last: {type: String},
                      },
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
