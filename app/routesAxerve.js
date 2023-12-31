const lib           = require('./libfunction');
const https         = require("https");  
const fetch         = require("node-fetch");

const {transMsg}    = require("./msgHandler");

module.exports = function(app) {

var counter;
var users;

//GET
  app.get('/axerve_new', function(req, res) {
    res.render('axerveDE.njk');

  });

//GET
  app.get('/axerve', function(req, res) {

    // Build the post string from an object
    var post_data = JSON.stringify({
      'shopLogin' : 'GESPAY63388',
      'amount' : '1',
      'currency' : 'EUR',
      'shopTransactionID' : 'TEST-ONE'
    });

    // Setup the post call headers
    var axerveHeaders = {
      "Content-Type": "application/json",  
      "Authorization": "apikey R0VTUEFZNjMzODgjI0VzZXJjZW50ZSBUZXN0IGRpIFZJQU5BIyMyNS8xMC8yMDIzIDExOjI1OjAy"
    };

    // An object of options to indicate where to post to
    var axerveOptions = {
      host: "sandbox.gestpay.net",
      path: '/api/v1/payment/create',
      method: 'POST',
      headers: axerveHeaders
    };
    console.log('Preparo la chiamata: ', axerveOptions);

    // Set up the request
    var post_req =  https.request(axerveOptions, function(resPost) {
        //resPost.setEncoding('utf8');
        //console.log("POST_REQ= ",post_req);
        resPost.on('data', function (d) {
            //console.log('Response... ', d);

            dParsed = JSON.parse(d);
            console.log('dParsed dentro', dParsed.payload);

            res.render('axerveDE.njk', {'paymentID':dParsed.payload.paymentID, 'paymentToken': dParsed.payload.paymentToken});

        });

        res.on('error', function (e) {
            console.log('ERRORE !!! ', e);
        });

    });

    // post the data
    console.log("Fuori")
    post_req.write(post_data);
    post_req.end();

    
  });

//POST
  app.post('/axerve_new', function(req, res) {

    var amount = req.body.amountEur;
    var transactionID = req.body.transactionID;
    var error = req.body.error;
    var result = req.body.result;

    if (error != undefined) {
      var errorParse = JSON.parse(error);
      var errorDesc = errorParse.description;

      console.log('errorDesc: ', errorDesc);

      req.flash('error', errorDesc);
      
      return res.render('axerveDE.njk', {'amount':amount, 'transactionID':transactionID, message: req.flash('error'), type: "warning"});

    }

    const currency='EUR';
    const shopLogin="GESPAY63388";

    fetch('https://sandbox.gestpay.net/api/v1/payment/create/',
      {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",  
          "Authorization": process.env.APIKEY
        },
        body: JSON.stringify({  
          "shopLogin": shopLogin,
          "amount": amount,
          "currency": currency,
          'shopTransactionID' : transactionID
        })
      }
    ).then(function(result) {
      //console.log("result: ",result);
      return result.json();

    }).then(async function(data) {
      console.log("data: ",data);
      
      if(data.error.code !== "0") {
        const translatedMsg = data.error.description;
        //const translatedMsg = await transMsg(data.error.description, 'fr'); //PROVA traduzione su server
                
        req.flash('error', translatedMsg);

        return res.render('axerveDE.njk', {'amount':amount, 'transactionID':transactionID, message: req.flash('error'), type: "danger"});

      } else {
        dParsed = data;
        res.render('axerveDE.njk', {'shopLogin':shopLogin, 'paymentID':dParsed.payload.paymentID, 'paymentToken': dParsed.payload.paymentToken});
      }
    })

    .catch(console.error);
  });

};