module.exports = function(app, paypal) {

app.locals.baseurl = 'http://localhost:3001';



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
        req.paymentId = payment.id;
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
  res.send("Payment transfered successfully.");
});
 
// Page will display when you canceled the transaction 
app.get('/cancel', function(req, res) {
  res.send("Payment canceled successfully.");
});

}