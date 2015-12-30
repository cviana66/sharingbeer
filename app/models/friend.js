// app/models/user.js
// load the things we need
var mongoose = require('mongoose');

// define the schema for our user model
var friendSchema = mongoose.Schema({
  id: {
    type: String,
    required: '{PATH} is required.'
  },
  emailParent: {
    type: String,
    required: '{PATH} is required.',
    unique: false
  },
  emailFriend: {
    type: String,
    required: '{PATH} is required.',
    unique: true
  }
});

// create the model for users and expose it to our app
module.exports = mongoose.model('Friend', friendSchema);
