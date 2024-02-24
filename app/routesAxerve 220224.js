const lib           = require('./libfunction');
const https         = require("https");  
const fetch         = require("node-fetch");

const {transMsg}    = require("./msgHandler");

module.exports = function(app) {

var counter;
var users;


//POST
  app.post('/axerve_create', function(req, res) {

    const currency='EUR';
    const shopLogin="GESPAY63388";
  try {
    fetch('https://sandbox.gestpay.net/api/v1/payment/create/',
      {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",  
          "Authorization": process.env.APIKEY
        },
        body: JSON.stringify({  
          "shopLogin": shopLogin,
          "amount": (Number(req.session.totalPrc)+Number(req.session.shipping)-Number(req.session.pointDiscount)-Number(req.session.shippingDiscount)).toFixed(2),
          "currency": currency,
          'shopTransactionID' : '1111111'
        })
      }
    ).then(function(result) {
      console.log("result: ",result);
      return result.json();

    }).then(async function(data) {
      console.log("data: ",data);
      res.status(200).json(data);
    })
  } catch (e) {
      //console.log("Errore in fetch post/axerve_create: ", e);
      res.status(500).send()
  }

  });

//POST
  app.post('/axerve_response', function(req, res) {
    console.log ("ERRORE: ",req.body.error)
    console.log("RISULTATO: ",req.body.result) 
    console.log("RESPONSE: ",req.body.response)
  });

//---------------- TESTING ---------------------

//GET
  app.get('/axerve_new', function(req, res) {
    res.render('axerveDE.njk');

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

