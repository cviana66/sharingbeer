const WsCryptDecrypt = require('../wscryptdecrypt/wscryptdecrypt');
//const properties = require('../properties');

/**
 * This module takes the data coming from the pages and will call WsCryptEncrypt. 
 */
class GestpayService {
  constructor() {
    let isTest = true;
    if (process.env.NODE_ENV == 'production') {
      isTest = false;
    }
    this.wsCryptDecrypt = new WsCryptDecrypt(isTest);
  }

  /**
 * Item to pay only needs to have an amount.
 * @param {object} itemToPay
 * @param {string} itemToPay.amount
 * @returns {Promise<string>} the cryptDecryptString. 
 */
  encrypt(itemToPay) {
    // build shopTransactionId
    //let now = new Date();
    //let shopTransactionId = `MYSHOP_${now.getFullYear()}_${now.getMonth()}_${now.getDate()}-${now.getHours()}_${now.getMinutes()}_${now.getSeconds()}-${now.getMilliseconds()}`;

    return new Promise((resolve, reject) => {
      this.wsCryptDecrypt
        .encrypt({
          shopLogin: process.env.SHOPLOGIN,
          apikey: process.env.APIKEY,
          uicCode: '242',
          amount: itemToPay.amount,
          shopTransactionId:itemToPay.orderId
        })
        .then(encryptResponse => {
          console.debug(JSON.stringify(encryptResponse, null, 2));
          if (encryptResponse.TransactionResult === 'KO') {
            reject(encryptResponse);
          }
          resolve(encryptResponse.CryptDecryptString);
        })
        .catch(err => {
          console.err(`Error in Encrypt: ${err}`);
          reject(err);
        });
    });
  }

  /**
 * 
 * @param {object} decryptRequest
 * @param {string} decryptRequest.cryptedString
 * @returns {Promise.<object>} a Promise with an object rapresentation of the transaction result.
 */
  decrypt(decryptRequest) {
    return new Promise((resolve, reject) => {
      this.wsCryptDecrypt
        .decrypt({
          shopLogin: process.env.SHOPLOGIN,
          apikey: process.env.APIKEY,
          CryptedString: decryptRequest.cryptedString
        })
        .then(resolve)
        .catch(reject);
    });
  }
}

module.exports = GestpayService;
