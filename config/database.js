const mongoose = require('mongoose');
const moment   = require("moment-timezone"); 
var lib = require('../app/libfunction');

mongoose.set('strictQuery', false);

mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
  //useFindAndModify: false,
  //useCreateIndex: true
});

mongoose.connection
	  .on("open",  () => console.info(lib.logDate("Europe/Rome")+' [INFO] MONGODB OPEN'))
  	.on("close", () => console.info(lib.logDate("Europe/Rome")+' [INFO] MONGODB CLOSED'))
  	.on("error", (error) => {
    console.error(lib.logDate("Europe/Rome")+' [ERROR] MONGODB CONNECTION: '+error);
    process.exit();
  })

module.exports = mongoose;
