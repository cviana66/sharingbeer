const mongoose = require('mongoose');
const moment   = require("moment-timezone"); 

mongoose.set('strictQuery', false);

mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
  //useFindAndModify: false,
  //useCreateIndex: true
});

mongoose.connection
	.on("open", () => console.info(moment().utc("Europe/Rome").format()+' [INFO] MONGODB OPEN'))
  	.on("close", () => console.info(moment().utc("Europe/Rome").format()+' [INFO] MONGODB CLOSED'))
  	.on("error", (error) => {
    console.error(moment().utc("Europe/Rome").format()+' [ERROR] MONGODB CONNECTION: '+error);
    process.exit();
  })

module.exports = mongoose;
