// app/models/user.js
// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

// define the schema for our user model
var userSchema = mongoose.Schema({

    email           : { type: String, required: '{PATH} is required.', unique: true },
    password        : { type: String, required: '{PATH} is required.' },
    status          : { type: String },
    name : {
        first       : { type: String },
        last        : { type: String },
    },
    fiscalCode      : { type: String },
    address: {
        address1    : { type: String },
        address2    : { type: String },
        town        : { type: String },
        province    : { type: String },
        conutry     : { type: String },
        pcd         : { type: String }
    },
    mobilePrefix    : { type: String },
    mobileNumber    : { type: String },
    initDate        : { type: Date, default: Date.now },
    endDate         : { type: Date},
    possibleFriends : { type: Number, default: 0},
    facebook  : {
        id           : String,
        token        : String,
        email        : String,
        name         : String
    },
    twitter   : {
        id           : String,
        token        : String,
        displayName  : String,
        username     : String
    },
    google    : {
        id           : String,
        token        : String,
        email        : String,
        name         : String
    },
    idParent   : { type: String },
    booze      : { type: Number, default: 0},
    resetPasswordToken: String,
    resetPasswordExpires : Date
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
