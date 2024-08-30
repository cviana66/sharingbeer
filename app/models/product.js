// Require mongoose and mongoose schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Define product schema
var ProductSchema = new Schema({

  name        : {type: String, required: true},
  price       : {type: Number, required: true}, // per beerbox = 6 bottiglie
  linkImage   : {type: String, required: true},
  description : {type: String},
  quantity    : {type: Number}, //stock di beerbox
  colorEBC       : {type: String},
  volAlcol    : {type: String},
  gradoPlato  : {type: String},
  tempServ    : {type: Number},
  amaroIBU    : {type: String},
  formatoCl   : {type: String} 
});

// methods =====================================================================

//Format the price of the product to show a dollar sign, and two decimal places
  ProductSchema.methods.prettyPrice = function () {
      return (this && this.price) ? '€' + this.price.toFixed(2) : '€';
  };

  ProductSchema.methods.whatAmI = function () {
        var greeting = this.name ?
            'Hello, I\'m a ' + this.name + ' and I\'m worth ' + this.prettyPrice()
            : 'I don\'t have a name :(';
  };

// Export product model
module.exports = mongoose.model('Product', ProductSchema);
