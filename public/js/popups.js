/* Privacy Document display */

function openDocument (tipo) {
  var blur = document.getElementsByClassName('blur');
  for (var i = 0; i < blur.length; i++) {
      blur[i].classList.toggle('active');
  }
  if (tipo == "condizioniVendita") {
    document.getElementById("popupCondizioniVendita").style.display = "block";
    document.getElementById("myBtn").style.display = "block";
    document.getElementById("popupCondizioniVendita").focus();
  } else if (tipo == "privacy") {
    document.getElementById("popupPrivacy").style.display = "block";
    document.getElementById("myBtn").style.display = "block";
    document.getElementById("popupPrivacy").focus();
  } else if (tipo == "infoValidation") {    
    document.getElementById("popupValidation").style.display = "block";
    document.getElementById("popupValidation").focus();

  }
}


function closeDocument () {
  document.getElementById("popupCondizioniVendita").style.display = "none";
  document.getElementById("popupPrivacy").style.display = "none";
  document.getElementById("popupValidation").style.display = "none";
  document.getElementById("myBtn").style.display = "none";
  document.getElementById("popupPrivacy").blur();
  document.getElementById("popupCondizioniVendita").blur();
  document.getElementById("checkPrivacy").focus();
  var blur = document.getElementsByClassName('blur');
  for (var i = 0; i < blur.length; i++) {
      blur[i].classList.toggle('active');
  }
}
