// =============================================================================
// MIDDLEWARE
// =============================================================================
var nodemailer        = require('nodemailer');
var mailgun           = require('nodemailer-mailgun-transport');

// Access to mailgun free plan
/*
console.log('Mailer: mailergun');
var transporter = nodemailer.createTransport(mailgun({
    service: 'Mailgun',
    auth: {
      api_key: 'key-48f740a9ab6527c7ffd5f6b923fe65ff',
      domain: 'sandboxae84de9ecb5141ce8ab958aee88eef7b.mailgun.org'
    }
  }));
*/

//Access to gmail
//console.log('Mailer: gmail');
var transporter = nodemailer.createTransport({
      service: 'Gmail',
      host: "smtp.gmail.com",
      port: 587,
      auth: {
            user: "cviana66@gmail.com",
            pass: process.env.MAIL_PWD,
      },
      tls: {
            rejectUnauthorized: false
      }
    });

module.exports = transporter;
