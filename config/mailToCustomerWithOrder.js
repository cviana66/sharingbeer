module.exports = (Name, Email, server) => {

var mailToCustomerWithOrder = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"> \
<html xmlns="https://www.w3.org/1999/xhtml"> \
    <head> \
        <meta https-equiv="Content-Type" content="text/html; charset=utf-8" /> \
        <title>Recommendation</title> \
    </head> \
<body yahoo> \
<style type="text/css"> \
  @font-face { \
    font-family: myFont; \
    src: url("/font/bauserif.ttf"); \
  } \
  .sb-font { \
    font-family: myFont; \
  } \
</style> \
<table bgcolor="#F0F0F0" border="0" cellpadding="0" cellspacing="0" height="100%" width="100%"> \
  <tbody> \
  	<tr> \
  		<td style="background-color:#f0f0f0" align="center" bgcolor="#F0F0F0" valign="top"><br> \
  			<table style="text-align:center;width:90%;max-width:500px;background-color:#fff;border-radius:12px" cellpadding="0" cellspacing="0" width="100%"> \
  				<tbody> \
            <tr> \
              <td style="border-top-left-radius:12px;border-top-right-radius:12px;padding-left:0px;padding-right:0px;padding-top:10px;padding-bottom:5px;background-color:#2A0009" align="center"> \
                <div> \
                  <p> <span class="text-center sb-font" style="font-size:2.5em;color:#FF9139;">Birrificio Viana</span> <p> \
                </div> \
              </td> \
            </tr> \
  					<tr> \
  						<td style="border-radius:12px;padding-left:30px;padding-right:30px;padding-top:30px;padding-bottom:12px;background-color:#ffffff" align="right"> \
  							<div style="font-family:Arial,Verdana;font-weight:300;font-size:16px;text-align:left;color:#222541;margin-top:10px"> \
  								<p> Ciao <span style="font-style:oblique;font-weight:bold">' + Name + '</span>  <img style="padding-right:12px;vertical-align:middle" src="'+server+'/img/clinking-beer-mugs.png" height="30" width="30"> </p> \
  								<p> Sei curioso di sapere chi ha già accettato il tuo invito? <br>O se hai ancora inviti disponibili? <p> \
                  <p> Entra nella sezione <span style="font-weight:bold"> Amici  </span> per scoprirlo. <p>\
                  <p> E ricorda, ogni tuo nuovo amico che si unisce e ogni suo acquisto aumenta i tuoi punti <span style="font-weight:bold">Pinta</span>! \
                  <p> Non esitare a invitarli di nuovo... o di nuovi... e condividi la tua passione per <a href="'+server+'/listOfFriends" target="_blank"> SharingBeer. </a> \
  								<div align="center"> \
  								<a href="'+server+'/listOfFriends"> \
										<button style="background:#428BCA;color:#fff;font-size:16px;border-radius:4px;line-height:50px;margin:25px25px;text-align:center;border: 0;"> \
                     Amici </button> \
                  </a> \
									</div> \
                  <div align="center">   <p> oppure </p>  </div> \
                  <div><p> se non riesci ad accedere copia il seguente link nella barra degli indirizzi del browser: </p></div> \
                  <div align="center">   <p> '+server+'/listOfFriends </p>  </div> \
                </div> \
                <div style="font-family:Arial,Verdana;font-weight:300;font-size:16px;text-align:left;color:#222541;margin-top:40px"> \
                	<p>A presto dal birrificio Viana. </br>Mi raccomando, bevi in modo responsabile :)</p> \
  							</div>  \
                <div align="left"> \
                  <img style="padding-right:12px;vertical-align:middle" src="'+server+'/img/cellphone-android.png" height="24" width="24"> \
                  <a style="font-family:Arial,Verdana;font-weight:300;font-size:14px;text-decoration:none;color:#868686"> +39 393 033 2728 </a> \
                </div> \
                <div align="left"> \
                  <img style="padding-right:12px;vertical-align:middle" src="'+server+'/img/mail-ru.png" height="24" width="24"> \
                  <span> \
                    <a href="mailto:friend@sharingbeer.com" style="font-family:Arial,Verdana;font-weight:300;font-size:14px;text-decoration:none;color:#868686" target="_blank">  friend@sharingbeer.com </a> \
                  </span> \
                </div> \
  						</td> \
  					</tr> \
  				</tbody> \
  			</table> \
  		</td> \
  	</tr> \
    <tr> \
      <td style="background-color:#f0f0f0" align="center" bgcolor="#F0F0F0" valign="top"><br> \
        <table style="text-align:center;width:90%;max-width:500px;background-color:#fff;border-radius:12px" cellpadding="0" cellspacing="0" width="100%"> \
          <tbody> \
            <tr> \
              <td style="border-radius:12px;padding-left:30px;padding-right:30px;padding-top:12px;padding-bottom:12px;background-color:#ffffff" align="right"> \
                <div style="font-family:Arial,Verdana;font-weight:300;font-size:10px;text-align:left;color:#88a1af;margin-top:10px"> \
                  Le informazioni contenute in questo messaggio di posta elettronica sono riservate, rivolte esclusivamente al destinatario e non comportano alcun vincolo ne\' alcun obbligo. \
                  Il messaggio ti è stato inviato perchè ti sei registrato su SharingBeer. Segnalaci eventuali abusi rispondendo a questa email. \
                </div> \
              </td> \
            </tr> \
          </tbody> \
        </table> \
      </td> \
    </tr> \
  	<tr> \
		<td style="font-weight:300;font-size:10px;color:#88a1af;padding-left:24px;padding-right:24px" align="center"><br><br>  \
      <a style="text-decoration:none;color:#88a1af" href="https://sharingbeer.it" target="_blank">sharingbeer.it </a> - \
      <a style="text-decoration:none;color:#88a1af" href="https://sharingbeer.it" target="_blank"> sharingbeer.com </a> - \
      <a style="text-decoration:none;color:#88a1af" href="https://sharingbeer.it" target="_blank"> sharingbeer.eu </a> \
    </td> \
	</tr> \
 </tbody> \
</table> \
</body> \
</html>';
  return mailToCustomerWithOrder;
};