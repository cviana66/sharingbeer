// Require mongoose and mongoose schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Define category schema
var CategorySchema = new Schema({

    name: { type: String, required: true },
    seo: { type: String, required: true },
    topnav: { type: Boolean, required: false, default: true }

    });

// methods =====================================================================

CategorySchema.methods.getTopCategories =  function(callback){
        var query = CategorySchema.find({topnav : true});
        query.exec(function(err, categories) {

            // Execute callback
            callback(null, categories);
        });
    };

// Export category model
module.exports = mongoose.model('Category', CategorySchema);
