/* inputControl.js */

function fieldLoginControl(){
  var email = document.getElementById("inputUsernameEmail").value;
  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  var submit = true;
  if (email == "" || !re.test(String(email))) {
    text = "Please provide a valid email.";
    document.getElementById("wrongMail").innerHTML = text;
    submit = false;
  }
  if (submit) {
    return true;
  } else {
    return false;
  }
}; 

function fieldsValidationControl() {
  document.getElementById("wrongMail").innerHTML = "";
  document.getElementById("wrongPwd").innerHTML = "";
  document.getElementById("wrongPrivacy").innerHTML = "";
  document.getElementById("wrongAge").innerHTML = "";

  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  var email = document.getElementById("inputUsernameEmail").value;
  if(email =="" || !re.test(String(email))) {
    document.getElementById("wrongMail").innerHTML = "Please provide a valid email.";
    document.getElementById("inputUsernameEmail").focus();
    return false;
  };

  var pwd1 = document.getElementById("inputPassword").value;
  
  if(pwd1 != "") {
    if(pwd1.length < 6) {
      document.getElementById("wrongPwd").innerHTML = "Password must contain at least six characters";
      document.getElementById("inputPassword").focus();
      return false;
    }
    if(pwd1 == email) {
      document.getElementById("wrongPwd").innerHTML = "Password must be different from Username";
      document.getElementById("inputPassword").focus();
      return false;
    }
    var re1 = /[0-9]/;
    if(!re1.test(pwd1)) {
      document.getElementById("wrongPwd").innerHTML = "Password must contain at least one number";
      document.getElementById("inputPassword").focus();
      return false;
    }
    var re2 = /[a-z]/;
    if(!re2.test(pwd1)) {
      document.getElementById("wrongPwd").innerHTML = "Password must contain at least one lowercase letter";
      document.getElementById("inputPassword").focus();
      return false;
    }
    var re3 = /[A-Z]/;
    if(!re3.test(pwd1)) {
      document.getElementById("wrongPwd").innerHTML = "Password must contain at least one uppercase letter";
      document.getElementById("inputPassword").focus();
      return false;
    } 
    var re4 = /\W|_/g;
    if(!re4.test(pwd1)) {
      document.getElementById("wrongPwd").innerHTML = "Password must contain at least one special character";
      document.getElementById("inputPassword").focus();
      return false;
    } 
  } else {
    document.getElementById("wrongPwd").innerHTML = "create a Password";
    document.getElementById("inputPassword").focus();
    return false;
  }
  if(!document.getElementById('checkAge').checked) {
    document.getElementById("wrongAge").innerHTML = "spunta la casella di controllo solo se hai più di 18 anni";
    return false;
  }
  if(!document.getElementById('checkPrivacy').checked) {
    document.getElementById("wrongPrivacy").innerHTML = "spunta la casella di controllo per accettare le condizioni";
    return false;
  }

  return true;
}

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
