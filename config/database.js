const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URL);
const conn = mongoose.connection;

module.exports = conn;
