module.exports = function(app, paypal) {

var ipaddress = process.env.OPENSHIFT_NODEJS_IP;
var port      = process.env.OPENSHIFT_NODEJS_PORT || 8080;

if (typeof ipaddress === "undefined") {
    ipaddress = "127.0.0.1";
}

console.log('http://' + ipaddress + ':' + port);

app.locals.baseurl = 'http://' + ipaddress + ':' + port;



app.post('/paynow', function(req, res) {
   // paypal payment configuration.
  console.log("total-->:",req.session.total);
  var payment = {
    "intent": "sale",
    "payer": {
      "payment_method": "paypal"
    },
    "redirect_urls": {
      "return_url": app.locals.baseurl+"/success",
      "cancel_url": app.locals.baseurl+"/cancel"
    },
    "transactions": [{
      "amount": {
      "total": req.session.total,
      "currency": "USD"
      },
      "description": 'My test payment'
    }]
  };

  paypal.payment.create(payment, function (error, payment) {
    if (error) {
      console.log(error);
    } else {
      if(payment.payer.payment_method === 'paypal') {
        req.session.paymentId = payment.id;
        var redirectUrl;
        console.log(payment);
        for(var i=0; i < payment.links.length; i++) {
          var link = payment.links[i];
          if (link.method === 'REDIRECT') {
            redirectUrl = link.href;
          }
        }
        res.redirect(redirectUrl);
      }
    }
  });
});

app.get('/success', function(req, res) {

  var paymentId = req.session.paymentId;
  var payerId = req.param('PayerID');
  var details = { "payer_id": payerId };
  
  paypal.payment.execute(paymentId, details, function (error, payment) {
    if (error) {
      console.log(error);
    } else {
      console.log("Get Payment Response");
      console.log(JSON.stringify(payment));
      res.send("Payment transfered successfully.");
    }
  });
});
 
// Page will display when you canceled the transaction 
app.get('/cancel', function(req, res) {
  res.send("Payment canceled successfully.");
});

}