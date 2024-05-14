///////////////////////////////////////////////////////////////
// ATTENZIONE!!!! Modulo utilizzato solo per la parte QrCode //
///////////////////////////////////////////////////////////////

module.exports = function(app, qr, moment) {

  var lib     = require('./libfunction');

// ======================================================================================
// QRCODE ===============================================================================
// ======================================================================================
//GET
  //Create QRCode
  app.get('/qr', function(req, res) {
    var code = qr.image('sharingbeer.eu', { type: 'svg' });
    res.type('svg');
    code.pipe(res);
  });

//GET
  // read  Qrcode
  app.get('/webcam', function(req, res, next) {
  console.log("webcam-easy")
   res.render('webcam.njk', {user : req.user});
  });

//POST
  app.post('/webcam', function(req, res, next) {
    qrcodeInfo = req.body.qrinfo;
    req.session.qrcodeInfo = qrcodeInfo;
    res.json({msg:'success', user : req.user});
  });

//GET
  // show Qrcode information
  app.get('/qrcodeOrder', function(req, res, next) {
    console.log('qrcodeOrder-> ',req.session.qrcodeInfo);
    res.render('qrcodeOrder.njk', {QrcodeData : req.session.qrcodeInfo});
  });

} //FINE APP
