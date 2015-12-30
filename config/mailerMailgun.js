// =============================================================================
// MIDDLEWARE
// =============================================================================
var nodemailer        = require('nodemailer');
var mailgun           = require('nodemailer-mailgun-transport');

console.log('Mailer: mailergun');

// login
var transporter = nodemailer.createTransport(mailgun({
    service: 'Mailgun',
    auth: {
      api_key: 'key-48f740a9ab6527c7ffd5f6b923fe65ff',
      domain: 'sandboxae84de9ecb5141ce8ab958aee88eef7b.mailgun.org'
    }
  }));

module.exports = transporter;
