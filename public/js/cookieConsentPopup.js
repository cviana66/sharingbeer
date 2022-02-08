/* Cookie Consent Popup 

// set cookie according to you
var cookieName= "CodingStatus";
var cookieValue="Coding Tutorials";
var cookieExpireDays= 30;

// when users click accept button
let acceptCookie= document.getElementById("acceptCookie");
console.log("acceptCookie",acceptCookie);
acceptCookie.onclick= function(){
    createCookie(cookieName, cookieValue, cookieExpireDays);
}

// function to set cookie in web browser
 let createCookie= function(cookieName, cookieValue, cookieExpireDays){
  let currentDate = new Date();
  currentDate.setTime(currentDate.getTime() + (cookieExpireDays*24*60*60*1000));
  let expires = "expires=" + currentDate.toGMTString();
  document.cookie = cookieName + "=" + cookieValue + ";" + expires + ";path=/";
  if(document.cookie){
    document.getElementById("cookiePopup").style.display = "none";
  }else{
    alert("Unable to set cookie. Please allow all cookies site from cookie setting of your browser");
  }

 }

// get cookie from the web browser
let getCookie= function(cookieName){
  let name = cookieName + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for(let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}
// check cookie is set or not
let checkCookie= function(){
    let check=getCookie(cookieName);
    if(check==""){
        document.getElementById("cookiePopup").style.display = "block";
    }else{
        
        document.getElementById("cookiePopup").style.display = "none";
    }
}
checkCookie(); */

/* Privacy Document display */

function openDocument (tipo) {
  if (tipo == "condizioniVendita") {
    document.getElementById("DocumentPopupCondizioniVendita").style.display = "block";
    document.getElementById("myBtn").style.display = "block";
    document.getElementById("DocumentPopupCondizioniVendita").focus();
  }
}


function closeDocument (tipo) {
  if (tipo == "condizioniVendita") {
    document.getElementById("DocumentPopupCondizioniVendita").style.display = "none";
    document.getElementById("myBtn").style.display = "none";

  }
}
