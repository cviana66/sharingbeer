module.exports = function(app) {

  const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');
  const payPalClient      = require('../config/paypal/common/payPalClient');
  const lib               = require('./libfunction');



app.post('/OrdersCreate', lib.isLoggedIn, async function(req, res) {
  // 3. Call PayPal to set up an authorization transaction
  console.log('INI Call PayPal to set up an authorization transaction');
  const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
  request.prefer("return=representation");
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [{
      amount: {
        currency_code: 'EUR',
        value: '1.00'
        }
      }]
    });

  let order;

  try {
    order = await payPalClient.client().execute(request);
  } catch (err) {
    // 4. Handle any errors from the call
    console.error(err);
    return res.send(500);
  }
  // 5. Return a successful response to the client with the order ID
  console.log('Return a successful response to the client with the order ID->',order.result.id);
  res.status(200).json({orderID: order.result.id});
});



// 2. Set up your server to receive a call from the client
app.post('/OrdersCapture', lib.isLoggedIn, async function(req, res) {

  // 2a. Get the order ID from the request body
  const orderID = req.body.orderID;
  console.log('OrdersCapture.orderID->',orderID);

  // 3. Call PayPal to capture the order
  const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderID);
  request.requestBody({});

  let capture;

  try {
    capture = await payPalClient.client().execute(request);
    console.log('OrdersCapture.capture->',capture);

    // 4. Save the capture ID to your database. Implement logic to save capture to your database for future reference.
    const captureID = capture.result.purchase_units[0].payments.captures[0].id;
    console.log('captureID ->',capture.result.purchase_units[0].payments.captures[0].id);
   // await database.saveCaptureID(captureID);

  } catch (err) {

    // 5. Handle any errors from the call
    console.error(err);
    return res.sendStatus(500);
  }

  // 6. Return a successful response to the client
  console.log('Return a successful response to the client',capture);
  res.status(200).json({orderData: capture});
});


} //FINE APP