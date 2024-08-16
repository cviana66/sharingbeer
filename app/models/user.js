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
              mobilePrefix : {type: String},
              mobileNumber : {type: String, unique: true},
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
  privacy : {
              needs     : {type: Boolean, default: true},
              optional  : {type: Boolean},
              transfer  : {type: Boolean},
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
                  preferred   : {type: String}, // preferito nelle spedizioni
                  postcode    : {type: String},
                  affidability: {type: String}, 
                  desAffidability : {type: String},
                  coordinateGPS : {
                    latitude      : {type: Number},
                    longitude     : {type: Number},  
                  }
              }],
  friends : [{  id    : {type: String, unique: true },
                name  : { first: {type: String, required: true, unique: false},
                          last: {type: String},
                        },
                status      : {type: String},
                token       : {type: String, required: true, unique: true},
                email       : {type: String, unique: true},
                insertDate  : {type: Date, default: Date.now}
            }],
  orders: [{
              email       : { type: String, required: true },
              dateInsert  : { type: Date, required: true },
              status      : { type: String, required: true},
              fatturaPEC          : { type: String},
              fatturaSDI          : { type: String},
              pointsDiscount      : { type: Number},
              shippingCost        : { type: Number},
              deliveryType        : { type: String},
              deliveryDate        : { type: Date},
              totalPriceBeer      : { type: Number}, // 
              totalPriceTotal     : { type: Number}, //
              totalQty            : { type: Number},
              items : [{ 
                  id        : {type: String},
                  name      : {type: String},
                  price     : {type: Number},
                  qty       : {type: Number},
                  linkImage : {type: String},
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
                  postcode    : {type: String},
                  affidability: {type: String}, 
                  desAffidability : {type: String},
                  coordinateGPS : {
                    latitude  : {type: Number},
                    longitude : {type: Number},
                  }  
              },
              payment : {
                  paymentType       : { type: String}, 
                  shopLogin         : { type: String}, 
                  orderId           : { type: String}, 
                  bankTransactionId : { type: String}, 
                  authorizationCode : { type: String},
                  errorCode         : { type: String},
                  errorDescription  : { type: String},
                  createTime        : { type: Date}, 
                  updateTime        : { type: Date},
                  totalAmount       : { type: Number}, 
                  country           : { type: String},
                  currencyAmount    : { type: String},                   
                  s2sStatus         : { type: String},
              },
              delivery : [{ 
                  id        : {type: String},
                  status    : {type: String},
                  note      : {type: String},
                  date_ref  : {type: Date}
              }]
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



