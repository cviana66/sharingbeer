// Require mongoose and mongoose schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Define product schema
var ProductSchema = new Schema({
  codProd			: {type: String}, //TODO: mettere  "required: true" e aggiornare dati  su MDB altrimenti da errore essendo campo required
  name        		: {type: String, required: true},
  price       		: {type: Number, required: true}, // per beerbox = 6 bottiglie
  linkImage   	: {type: String, required: true},
  description 	: {type: String},
  quantity    		: {type: Number}, //stock di beerbox disponibili
  colorEBC     	: {type: String},
  volAlcol    		: {type: String},
  gradoPlato  	: {type: String},
  tempServ    	: {type: Number}, //temperatura di servizio consigliata
  amaroIBU   	: {type: String},
  formatoCl   	: {type: String}, //formato della bottiglia es: 50 cl
  quantitaXtipo : {type: String}, //TODO: mettere  "required: true" e aggiornare dati  su MDB altrimenti da errore essendo campo required  es:   [{"codProd_A": quantità},{"codProd_B": quantità},...]
  prezzoXtipo 	: {type: String}, //TODO: mettere  "required: true" e aggiornare dati  su MDB altrimenti da errore essendo campo required  es:  [{"codProd_A": prezzo},{"codProd_B": prezzo},...]
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
