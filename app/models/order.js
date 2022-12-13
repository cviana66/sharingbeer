const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define order schema
const OrderSchema = new Schema({
    userId      : { type: String, required: true },
    email       : { type: String, required: true },
    dateInsert  : { type: Date, required: true },
    status      : { type: String, required: true},
    idPayment   : { type: String},
    discount    : { type: Number},
    totalPrice  : { type: Number},
    totalQty    : { type: Number},
    items : [
      { productId : {type: String},
        productName : {type: String},
        price : {type: Number},
        qty   : {type: Number},
      }
    ],
    paypal : {
        orderId        : { type: String},
        transactionId  : { type: String},
        createTime     : { type: String},
        updateTime     : { type: String},
        totalAmount    : { type: String},
        currencyAmount : { type: String}
    }
});
// create the model for orsers and expose it to our app
module.exports = mongoose.model('Order', OrderSchema);
