// MODULO preparazione mail HTML
module.exports = function(name, orderId, date, deliveryType, server) {

if (deliveryType=="Consegna") {

var mailorder = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"> \
<html xmlns="https://www.w3.org/1999/xhtml"> \
    <head> \
        <meta https-equiv="Content-Type" content="text/html; charset=utf-8" /> \
        <title>Recommendation</title> \
    </head> \
<style type="text/css"> \
  @font-face { \
    font-family: myFont; \
    src: url("'+server+'/font/bauserif.ttf"); \
  } \
  .sb-font { \
    font-family: myFont; \
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
                  <p> <span class="text-center sb-font" style="font-size:2.5em;color:#FF9139;">Birrificio Viana</span> <p> \
                </div> \
              </td> \
            </tr> \
  					<tr> \
  						<td style="border-radius:12px;padding-left:30px;padding-right:30px;padding-top:30px;padding-bottom:12px;background-color:#ffffff" align="right"> \
  							<div style="font-family:Arial,Verdana;font-weight:300;font-size:16px;text-align:left;color:#222541;margin-top:10px"> \
  								<p> Ciao '+name+'.</p> \
  								<p> Grazie per aver acquistato Birra Viana su Sharingbeer. </p> \
  								<p> Il tuo ordine è in preparazione e quando pronto per la consegna sarai avvisato via e-mail e/o whatsapp </p> \
                  <p> Dovresti ricevere il tuo ordine entro '+date+' \
                  <p> Accedi ai tuoi ordini cliccando su </p> \
                  <div align="center"> \
    								<a href="'+server+'/shopping?type='+deliveryType+'&orderId='+orderId+'"> \
  										<button style="background:#428BCA;color:#fff;font-size:16px;border-radius:4px;line-height:50px;margin:25px25px;text-align:center;border: 0;"> \
                      I miei Ordini</button> \
                    </a> \
									</div> \
                  <div align="center">   <p> oppure </p>  </div> \
                  <div><p> copia il seguente link nella barra degli indirizzi del browser </p></div> \
                  <div align="center">   <p> '+server+'/shopping?type='+deliveryType+'&orderId='+orderId+' </p>  </div> \
                  <div><p> e premi invio. </p></div> \
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
                <div align="left"> \
                  <img style="padding-right:12px;vertical-align:middle" src="'+server+'/img/gavel_24dp.png" height="24" width="24"> \
                  <span> \
                    <a href="'+server+'/infoCondizioniVendita0424.html" style="font-family:Arial,Verdana;font-weight:300;font-size:14px;text-decoration:none;color:#868686" target="_blank"> Condizioni di Vendita </a> \
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
			<a style="text-decoration:none;color:#88a1af" href="https://sharingbeer.herokuapp.com" target="_blank"> sharingbeer.com </a> - \
			<a style="text-decoration:none;color:#88a1af" href="https://sharingbeer.herokuapp.eu" target="_blank">sharingbeer.eu</a> \
		</td> \
	</tr> \
 </tbody> \
</table> \
</body> \
</html>';

}else{

var mailorder = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"> \
<html xmlns="https://www.w3.org/1999/xhtml"> \
    <head> \
        <meta https-equiv="Content-Type" content="text/html; charset=utf-8" /> \
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
              <td style="border-top-left-radius:12px;border-top-right-radius:12px;padding-left:0px;padding-right:0px;padding-top:10px;padding-bottom:5px;background-color:#2A0009" align="center"> \
                <div> \
                  <p> <span class="text-center sb-font" style="font-size:2.5em;color:#FF9139;">Birrificio Viana</span> <p> \
                </div> \
              </td> \
            </tr> \
            <tr> \
              <td style="border-radius:12px;padding-left:30px;padding-right:30px;padding-top:30px;padding-bottom:12px;background-color:#ffffff" align="right"> \
                <div style="font-family:Arial,Verdana;font-weight:300;font-size:16px;text-align:left;color:#222541;margin-top:10px"> \
                  <p> Ciao '+name+'.</p> \
                  <p> Grazie per aver acquistato Birra Viana su Sharingbeer. </p> \
                  <p> Il tuo ordine è già pronto! Ti chiedo la cortesia di ritirarlo entro '+date+'. </p> \
                  <p><b>Verifica gli <a href="'+server+'/infoOrari.html" target="_blank">orari di apertura </a> del Birrificio Viana</b>. </p> \
                  <p> Accedi ai tuoi ordini cliccando su </p> \
                  <div align="center"> \
                    <a href="'+server+'/shopping?type='+deliveryType+'&orderId='+orderId+'"> \
                      <button style="background:#428BCA;color:#fff;font-size:16px;border-radius:4px;line-height:50px;margin:25px25px;text-align:center;border: 0;"> \
                      I miei Ordini</button> \
                    </a> \
                  </div> \
                  <div align="center">   <p> oppure </p>  </div> \
                  <div><p> copia il seguente link nella barra degli indirizzi del browser </p></div> \
                  <div align="center">   <p> '+server+'/shopping?type='+deliveryType+'&orderId='+orderId+' </p>  </div> \
                  <div><p> e premi invio. </p></div> \
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
                <div align="left"> \
                  <img style="padding-right:12px;vertical-align:middle" src="'+server+'/img/gavel_24dp.png" height="24" width="24"> \
                  <span> \
                    <a href="'+server+'/infoCondizioniVendita0424.html" style="font-family:Arial,Verdana;font-weight:300;font-size:14px;text-decoration:none;color:#868686" target="_blank"> Condizioni di Vendita </a> \
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
}
  return mailorder;
};