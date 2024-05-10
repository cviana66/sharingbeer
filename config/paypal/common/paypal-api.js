const fetch = require("node-fetch");

const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = process.env;
const base = "https://api-m.sandbox.paypal.com";

module.exports = {
  createOrder: async function createOrder(req) {

    totalAmount = (Number(req.session.totalPrc)+Number(req.session.shippingCost)-Number(req.session.pointDiscount)).toFixed(2);

    const accessToken = await generateAccessToken();
    const url = `${base}/v2/checkout/orders`;
    const response = await fetch(url, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              "currency_code": "EUR",
              "value": totalAmount              
            }
          }
        ],
      }),
    });

    return handleResponse(response);
  },

  capturePayment: async function capturePayment(orderId) {
    const accessToken = await generateAccessToken();
    const url = `${base}/v2/checkout/orders/${orderId}/capture`;
    const response = await fetch(url, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return handleResponse(response);
  },
}

//////////////////// END MODULE //////////////////

async function generateAccessToken() {
    const auth = Buffer.from(PAYPAL_CLIENT_ID + ":" + PAYPAL_CLIENT_SECRET).toString("base64");
    //const auth = Buffer.from("39879487938794387439 :" + PAYPAL_CLIENT_SECRET).toString("base64");
    const response = await fetch(`${base}/v1/oauth2/token`, {
      method: "post",
      body: "grant_type=client_credentials",
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    const jsonData = await handleResponse(response);
    return jsonData.access_token;
  }

async function handleResponse(response) {
   console.log('RESPONSE HANDLERESPONSE: ',response.status)
    if (response.status === 200 || response.status === 201) {
      return response.json();
    }
    const errorMessage = await response.text();
    console.log("HandleResponse: ", errorMessage);
    throw new Error(errorMessage);
  }
