const mongoose = require('mongoose');
const moment   = require("moment"); 

mongoose.set('strictQuery', false);

mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
  //useFindAndModify: false,
  //useCreateIndex: true
});

mongoose.connection
	.on("open", () => console.info(moment().format()+' [INFO] MONGODB OPEN'))
  	.on("close", () => console.info(moment().format()+' [INFO] MONGODB CLOSED'))
  	.on("error", (error) => {
    console.error(moment().format()+' [ERROR] MONGODB CONNECTION: '+err);
    process.exit();
  })

module.exports = mongoose;
