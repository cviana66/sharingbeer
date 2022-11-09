// app/models/user.js
// load the things we need
const mongoose = require('mongoose');

// define the schema for our user model
const friendSchema = mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  firstNameFriend: {
    type: String,
    required: true,
    unique: false
  },
  lastNameFriend: {
    type: String,
    unique: false
  },
  emailParent: {
    type: String,
    required: true,
    unique: false
  },
  emailFriend: {
    type: String,
    required:true,
    unique: true
  }
});
// create the model for users and expose it to our app
module.exports = mongoose.model('Friends', friendSchema);
