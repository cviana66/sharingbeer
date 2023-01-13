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

  let pwd1 = "";
  let pwd2 = "";
  if (document.getElementById("inputPassword") != null) {
    pwd1 = document.getElementById("inputPassword").value;
  }
  if (document.getElementById("confirmPassword") != null) {
    pwd2 = document.getElementById("confirmPassword").value;
  } else { // per gestire il caso in cui non ci sia la PWD di conferma
    pwd2 = pwd1
  }

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

function fieldsResetControl() {
  document.getElementById("wrongPwd").innerHTML = "";
  document.getElementById("wrongPwd2").innerHTML = "";

  var pwd1 = document.getElementById("inputPassword").value;
  var pwd2 = document.getElementById("confirmPassword").value;

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
    if(pwd1!=pwd2) {
      document.getElementById("wrongPwd2").innerHTML = "Password are different ";
      document.getElementById("confirmPassword").focus();
      return false;
    }
  } else {
    document.getElementById("wrongPwd").innerHTML = "create a Password";
    document.getElementById("inputPassword").focus();
    return false;
  }
  return true;
}

function fieldsRegisterControl() {
  var phone = document.getElementById("inputMobile").value.replace(/\W+/g, '');
  var city = document.getElementById("inputCity").value;
  var province = document.getElementById("inputProvincia").value;
  var address = document.getElementById("inputStreet").value;
  var numciv = document.getElementById("inputNumciv").value;
  var cognome = document.getElementById("inputLastName").value;
  var phoneno = /^\d{10}$/;
  var capno = /^\d{5}$/;
  var submit = true;

  if (cognome == "") {
    text = "Inserire il Cognome. ";
    document.getElementById("wrongLastName").innerHTML = text;
    document.getElementById("inputLastName").focus();
    return false;
  } else {
    document.getElementById("wrongLastName").innerHTML = "";
    document.getElementById("inputLastName").value = cognome.charAt(0).toUpperCase() + cognome.slice(1);
  } 
  if (phone == "" || !phone.match(phoneno)) {
    text = "Inserire un numero di telefono cellulare valido";
    document.getElementById("wrongPhone").innerHTML = text;
    document.getElementById("inputMobile").focus();
    return false;
  } else {
    document.getElementById("wrongPhone").innerHTML = "";
  }
  if (city == "" || document.getElementById('myselectcity') != null) {
    text = "Inserire o selezionare la Città";
    document.getElementById("wrongCity").innerHTML = text;
    document.getElementById("inputCity").focus();
    return false;
  } else {
    document.getElementById("wrongCity").innerHTML = "";
  }
  if (province == "") {
    text = "Inserire la Provincia";
    document.getElementById("wrongProvincia").innerHTML = text;
    document.getElementById("inputProvincia").focus();
    return false;
  } else {
    document.getElementById("wrongProvincia").innerHTML = "";
  }
  if (address == "" || document.getElementById("myselectstreet") !=null) {
    text = "Inserire o selezionare l'indirizzo ";
    document.getElementById("wrongStreet").innerHTML = text;
    document.getElementById("inputStreet").focus();
    return false;
  } else {
    document.getElementById("wrongStreet").innerHTML = "";
  }
  if (numciv == "") {
    text = "Inserire il Numero Civico";
    document.getElementById("wrongNumciv").innerHTML = text;
    document.getElementById("inputNumciv").focus();
    return false;
  } else {
    document.getElementById("wrongNumciv").innerHTML = "";
  }
  
  return true;
   
};
