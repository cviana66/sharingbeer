/* inputControl.js */

function fieldLoginControl(){
  var email = document.getElementById("inputUsernameEmail").value;
  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  var submit = true;
  if (email == "" || !re.test(String(email))) {
    text = "Please provide a valid email. ";
    document.getElementById("wrongMail").innerHTML = text;
    submit = false;
  }
  if (submit) {
    return true;
  } else {
    return false;
  }
}; 

function fieldsRegisterControl() {
  var phone = document.getElementById("inputMobile").value.replace(/\W+/g, '');
  var city = document.getElementById("inputCity").value;
  var cap = document.getElementById("inputCap").value;
  var address = document.getElementById("inputAddress").value;
  var numciv = document.getElementById("inputNumciv").value;
  var phoneno = /^\d{10}$/;
  var capno = /^\d{5}$/;
  var submit = true;
  
  if (phone == "" || !phone.match(phoneno)) {
    text = "Please provide a valid mobile phone. ";
    document.getElementById("wrongPhone").innerHTML = text;
    submit = false;
  } else {
    document.getElementById("wrongPhone").innerHTML = "";
  } 
  if (city == "") {
    text = "Please provide a valid City";
    document.getElementById("wrongCity").innerHTML = text;
    submit = false;
  } else {
    document.getElementById("wrongCity").innerHTML = "";
  } 
  if (cap == "" || !cap.match(capno)) {
    text = "Please provide a valid CAP ";
    document.getElementById("wrongCap").innerHTML = text;
    submit = false;
  } else {
    document.getElementById("wrongCap").innerHTML = "";
  }
  if (address == "") {
    text = "Please provide a valid address";
    document.getElementById("wrongAddress").innerHTML = text;
    submit = false;
  } else {
    document.getElementById("wrongAddress").innerHTML = "";
  }
  if (numciv == "") {
    text = "Please provide a valid Civic Number";
    document.getElementById("wrongNumciv").innerHTML = text;
    submit = false;
  } else {
    document.getElementById("wrongNumciv").innerHTML = "";
  }
  if (submit) {
    return true;
  } else {
    return false;
  }
};

/*! Normalized address bar hiding for iOS & Android (c) @scottjehl MIT License */
(function( win ){
  var doc = win.document;
  
  // If there's a hash, or addEventListener is undefined, stop here
  if(!win.navigator.standalone && !location.hash && win.addEventListener ){
    
    //scroll to 1
    win.scrollTo( 0, 1 );
    var scrollTop = 1,
      getScrollTop = function(){
        return win.pageYOffset || doc.compatMode === "CSS1Compat" && doc.documentElement.scrollTop || doc.body.scrollTop || 0;
      },
    
      //reset to 0 on bodyready, if needed
      bodycheck = setInterval(function(){
        if( doc.body ){
          clearInterval( bodycheck );
          scrollTop = getScrollTop();
          win.scrollTo( 0, scrollTop === 1 ? 0 : 1 );
        } 
      }, 15 );
    
    win.addEventListener( "load", function(){
      setTimeout(function(){
        //at load, if user hasn't scrolled more than 20 or so...
        if( getScrollTop() < 20 ){
          //reset to hide addr bar at onload
          win.scrollTo( 0, scrollTop === 1 ? 0 : 1 );
        }
      }, 0);
    }, false );
  }
})( this );