const lib           = require('./libfunction');
const https         = require("https");  
const fetch         = require("node-fetch");

module.exports = function(app) {

var counter;
var users;

//GET
  app.get('/axerve_new', function(req, res) {

    const amount=1;
    const currency='EUR';

    fetch('https://sandbox.gestpay.net/api/v1/payment/create/',
      {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",  
          "Authorization": process.env.APIKEY
        },
        body: JSON.stringify({  
          "shopLogin": "GESPAY63388",
          "amount": amount,
          "currency": currency,
          'shopTransactionID' : 'TEST-ONE'
        })
      }
    ).then(function(result) {
      console.log("result: ",result);
      return result.json();
    }).then(function(data) {
      console.log("data: ",data);
      if(data.error.code !== "0") {
        alert(data.error.description)
      } else {
        dParsed = data;
        res.render('axerveDE.njk', {'paymentID':dParsed.payload.paymentID, 'paymentToken': dParsed.payload.paymentToken});
      }
    })
    .catch(console.error);
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
  app.post('/axerve', function(req, res) {
    res.post('https://sandbox.gestpay.net/api/v1/payment/create/');

    res.render('axerve.njk');
    });

// =====================================
// PASSPORT ERROR HANDLE ==== 18/12/2021
// =====================================
  app.use( function(error, req, res, next) {
  // Error gets here

    let msgFlash = req.flash('error');
    let msgError = error;
    console.log(msgFlash);
    console.log(msgError)
    res.render('info.njk', {message: msgFlash, type: "danger"});
  });

};