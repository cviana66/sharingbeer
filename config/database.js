const mongoose = require('mongoose');
const moment   = require("moment-timezone"); 

<<<<<<< HEAD
moment().utc("Europe/Rome").tz("Europe/Rome").format();
=======
moment().tz("Europe/Rome").format();
>>>>>>> 94e856d48674cf175d63810012f7c6afa78489f1

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
<<<<<<< HEAD
    console.error(moment().utc("Europe/Rome").format()+' [ERROR] MONGODB CONNECTION: '+error);
=======
    console.error(moment().format()+' [ERROR] MONGODB CONNECTION: '+error);
>>>>>>> 94e856d48674cf175d63810012f7c6afa78489f1
    process.exit();
  })

module.exports = mongoose;
