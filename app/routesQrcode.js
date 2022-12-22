///////////////////////////////////////////////////////////////
// ATTENZIONE!!!! Modulo utilizzato solo per la parte QrCode //
///////////////////////////////////////////////////////////////

module.exports = function(app, qr) {

  var lib     = require('./libfunction');
/*
  var port = process.env.port;
  if (port === 8080) {
      address = "htpp://127.0.0.1:8080";
  } else {
      address = "https://sharingbeer.herokuapp.com";
  }

  app.locals.baseurl = address;
*/
// ======================================================================================
// QRCODE ===============================================================================
// ======================================================================================
//GET
  //Create QRCode
  app.get('/qr', function(req, res) {
    var code = qr.image('sb-sharingbeer', { type: 'svg' });
    res.type('svg');
    code.pipe(res);
  });

//GET
  // read  Qrcode
  app.get('/webcam', function(req, res, next) {
  console.log("webcam-easy")
   res.render('webcam.njk');
  });

//POST
  app.post('/webcam', function(req, res, next) {
    qrcodeInfo = req.body.qrinfo;
    req.session.qrcodeInfo = qrcodeInfo;
    res.json({msg:'success'});
  });

//GET
  // show Qrcode information
  app.get('/qrcodeOrder', function(req, res, next) {
    console.log('qrcodeOrder-> ',req.session.qrcodeInfo);
    res.render('qrcodeOrder.njk', {QrcodeData : req.session.qrcodeInfo});
  });

} //FINE APP
