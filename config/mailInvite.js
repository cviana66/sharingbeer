module.exports = function(parentName, parentEmail, token, friendName, server, scadenza) {

var mailrecom = '<!DOCTYPE html PUBLIC "-W3CDTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"> \
<html xmlns="https://www.w3.org/1999/xhtml"> \
	<head> \
		<meta http-equiv="Content-Type" content="text/html; charset=utf-8" /> \
		<title>Recommendation</title> \
	</head> \
<style type="text/css"> \
  @font-face { \
    font-family: myFont; \
    src: url("'+server+'/font/bauserif.ttf"); \
  } \
  .sb-font { \
    font-family: myFont, sans-serif; \
  } \
</style> \
<body yahoo> \
<table bgcolor="#F0F0F0" border="0" cellpadding="0" cellspacing="0" height="100%" width="100%"> \
  <tbody> \
  	<tr> \
  		<td style="background-color:#f0f0f0" align="center" bgcolor="#F0F0F0" valign="top"><br> \
  			<table style="text-align:center;width:90%;max-width:500px;background-color:#fff;border-radius:12px" cellpadding="0" cellspacing="0" width="100%"> \
  				<tbody> \
					<tr> \
              <td style="border-top-left-radius:12px;border-top-right-radius:12px;padding-left:0px;padding-right:0px;padding-top:10px;padding-bottom:5px;background-color:#2A0009" align="center"> \
                <div> \
                  <p> <span class="text-center sb-font" style="font-size:2rem;color:#FF9139;">Birrificio Viana</span> <p> \
                </div> \
              </td> \
            </tr> \
					<tr> \
						<td style="border-radius:12px;padding-left:30px;padding-right:30px;padding-top:30px;padding-bottom:12px;background-color:#ffffff" align="right"> \
							<div style="font-family:Arial,Verdana;font-weight:300;font-size:16px;text-align:left;color:#222541;margin-top:10px;"> \
								<p> Ciao <span style="font-weight:bold">' + parentName + '</span>. </p> \
								<p> Ti riportiamo il messaggio di invito che hai richiesto per <span style="font-weight:bold">' +friendName+ '.</span> </p> \
								<p> Se non lo hai ancora condiviso copialo e invialo.</p> \
							</div> \
							<div style="font-family:Arial,Verdana;font-weight:300;font-size:14px;text-align:left;color:#222541;margin-top:10px;background-color:#F5F5F5;border-radius:6px; padding:10px 5px 15px 20px"> \
								<p>Ciao ' +friendName+ ', </p> \
								<p> ho appena assaggiato una nuova birra artigianale del Birrificio Viana e che ti consiglio di provare. <br>\
								Ti mando il link con il codice invito per accedere in Sharingbeer.</p> \
								<p> ' +server+ '/validation?token=' +token+ ' </p> \
								<p> Registra il tuo account entro il ' +scadenza+ ' per riservarti una birra OMAGGIO. Non perdere l\'occasione! </p> \
								<p> ' +parentName+ ' </p> \
							</div> \
							<div style="font-family:Arial,Verdana;font-weight:300;font-size:16px;text-align:left;color:#222541;margin-top:40px"> \
								<p>Grazie per bere Birra Viana e far conoscere Sharingbeer </br>Mi raccomando, bevi in modo responsabile :)</p> \
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
				  L\'invito ti è stato inviato tramite una persona che è a conoscenza del tuo indirizzo email o perchè ti sei registrato su SharingBeer. Segnalaci eventuali abusi rispondendo a questa email. \
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
  return mailrecom;
};
