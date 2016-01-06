module.exports = function(friendName, friendEmail, friendPassword, userName, userSurname ) {



//  Set the environment variables we need.
var ipaddress = process.env.OPENSHIFT_NODEJS_IP;
var port      = process.env.OPENSHIFT_NODEJS_PORT || 8080;

console.log('url in mailrecom: ', ipaddress, port)

if (typeof ipaddress === "undefined") {
  ipaddress = "127.0.0.1";
};

var mailrecom = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"> \
<html xmlns="http://www.w3.org/1999/xhtml"> \
    <head> \
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" /> \
        <title>Recommendation</title> \
    </head> \
<body yahoo> \
<table bgcolor="#F0F0F0" border="0" cellpadding="0" cellspacing="0" height="100%" width="100%"> \
  <tbody> \
  	<tr> \
  		<td style="background-color:#f0f0f0" align="center" bgcolor="#F0F0F0" valign="top"><br> \
  			<table style="text-align:center;width:90%;max-width:500px;background-color:#fff;border-radius:12px" cellpadding="0" cellspacing="0" width="100%"> \
  				<tbody> \
  					<tr> \
  						<td style="border-radius:12px;padding-left:50px;padding-right:50px;padding-top:30px;padding-bottom:12px;background-color:#ffffff" align="right"> \
  							<div style="border-radius: 25px; background-image: url(http://sb-sharingbeer.rhcloud.com/img/rol.png); background-position: left top;padding: 0px;width: 200px;height: 278px;"> \
  							</div> \
  							<div style="font-family:Arial,Verdana;font-weight:300;font-size:16px;text-align:left;color:#222541;margin-top:10px"> \
  								<p> Ciao <span style="font-style:oblique;font-weight:bold">' + friendName + '</span>, </p> \
  								<p> questo è l\'invito di <span style="font-style:oblique;font-weight:normal">' + userName + ' ' + userSurname + '</span> che ti permettera\' di bere una birra \
                  <span style="font-style:normal;font-weight:bold"> RoL </span>, la prima birra Artigianale da condividere!</p> \
  								<p>Vuoi saperne di più? Puoi farlo sul sito <a href="http://http://sb-sharingbeer.rhcloud.com" target="_blank"> SharingBeer </a> che è accessibile solo su segnalazione di un tuo amico. \
                  <span style="font-style:oblique;font-weight:bold">'+ userName +'</span> ha scelto te! </span></p> \
  								<p>Le tue credenziali per accedere a <a href="http://sb-sharingbeer.rhcloud.com/login" target="_blank"> SharingBeer </a> sono: </p> \
  								<div align="center"> \
  									<p>email: <a style="text-decoration:none">'+ friendEmail + '</a></p> \
  								</div> \
  								<div align="center"> \
  									<p>password: ' + friendPassword + '</p> \
  								</div> \
  								<div align="center">   <p> oppure </p>  </div> \
  								<div align="center"> \
  								<form action="http://sb-sharingbeer.rhcloud.com/login" method="post" id="form1"> \
									  <input type="hidden" name="email" value="'+ friendEmail + '"> \
									  <input type="hidden" name="password" value="'+ friendPassword +'"> \
										<button style="background:#428BCA;color:#fff;font-size:16px;border-radius:4px;line-height:50px;margin:25px25px;text-align:center;border: 0;" \
                    type="submit" form="form1" value="Submit">Accesso diretto a SharingBeer</button> \
                    </form> \
									</div> \
                </div> \
                <div style="font-family:Arial,Verdana;font-weight:300;font-size:16px;text-align:left;color:#222541;margin-top:40px"> \
                	<p>A presto e buon divertimento dallo staff del birrificio RoL. </br>Mi raccomando, bevi in modo responsabile :D</p> \
  							</div>  \
                <div align="left"> \
                  <img style="padding-right:12px;vertical-align:middle" src="http://sb-sharingbeer.rhcloud.com/img/cellphone-android.png" height="24" width="24"> \
                  <a style="font-family:Arial,Verdana;font-weight:300;font-size:14px;text-decoration:none;color:#868686"> +39 393 033 2728 </a> \
                </div> \
                <div align="left"> \
                  <img style="padding-right:12px;vertical-align:middle" src="http://sb-sharingbeer.rhcloud.com/img/mail-ru.png" height="24" width="24"> \
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
              <td style="border-radius:12px;padding-left:50px;padding-right:50px;padding-top:12px;padding-bottom:12px;background-color:#ffffff" align="right"> \
                <div style="font-family:Arial,Verdana;font-weight:300;font-size:10px;text-align:left;color:#88a1af;margin-top:10px"> \
                  Le informazioni contenute in questo messaggio di posta elettronica sono riservate, rivolte esclusivamente al destinatario e non comportano alcun vincolo ne\' alcun obbligo. \
                  L\'invito ti è stato iviato per tramite una persona che è a conoscenza del tuo indirizzo email e non da un sistema automatico . Segnalaci eventuali abusi rispondendo a questa mail. \
                </div> \
              </td> \
            </tr> \
          </tbody> \
        </table> \
      </td> \
    </tr> \http://sb-sharingbeer.rhcloud.com
  	<tr> \
		<td style="font-weight:300;font-size:10px;color:#88a1af;padding-left:24px;padding-right:24px" align="center"><br><br>  \
			<a style="text-decoration:none;color:#88a1af" href="http://sb-sharingbeer.rhcloud.com" target="_blank">sharingbeer.it </a> - \
			<a style="text-decoration:none;color:#88a1af" href="http://sb-sharingbeer.rhcloud.com" target="_blank"> sharingbeer.com </a> - \
			<a style="text-decoration:none;color:#88a1af" href="http://sb-sharingbeer.rhcloud.com" target="_blank">sharingbeer.eu</a> \
		</td> \
	</tr> \
 </tbody> \
</table> \
</body> \
</html>';
  return mailrecom;
};