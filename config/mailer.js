// =============================================================================
// MIDDLEWARE
// =============================================================================
var nodemailer   = require('nodemailer');
//const { google } = require('googleapis');
//var mailgun      = require('nodemailer-mailgun-transport');

// Access to mailgun free plan
/*
console.log('Mailer: mailergun');
var transporter = nodemailer.createTransport(mailgun({
    service: 'Mailgun',
    auth: {
      api_key: '',
      domain: ''
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
            user: "birrificioviana@gmail.com",
            pass: process.env.MAIL_PWD,
      },
      tls: {
            rejectUnauthorized: false
      }
    });

module.exports = transporter;
