// =============================================================================
// MIDDLEWARE
// =============================================================================
var nodemailer        = require('nodemailer');
var xoauth2           = require('xoauth2');

console.log('Mailer: Gmail xoauth2');

var generator = xoauth2.createXOAuth2Generator({
    user: "cviana66@gmail.com",
    clientId: "815375652972-bg30trnfdfckjnpp7p2q8q09js10uo59.apps.googleusercontent.com",
    clientSecret: "mbggGLECJmsGtK1CQROo-QKL",
    refreshToken: "1/qFtIMahgGQZAle-cpKbAH5QlqjbV8ikUrJJX451tZ9RIgOrJDtdun6zK6XiATCKT",
    accessToken: 'ya29.QgKdPqoyFTNG8XfQBNhjEP54i-gAsJJG12Uw1WRmecdkg9lCE-8SqN5bpui3mymlbRaI' // optional
});

generator.on('token', function(token){
    console.log('New token for %s: %s', token.user, token.accessToken);
});

// login
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      xoauth2: generator
    }
  });



var mailOptions = {
    from: 'cviana66@gmail.com', // sender address
    to: 'cviana66@gmail.com', // list of receivers
    subject: 'Hello ✔', // Subject line
    text: 'Hello world ✔', // plaintext body
    html: '<b>Hello world ✔</b>' // html body
};

module.exports = transporter;
