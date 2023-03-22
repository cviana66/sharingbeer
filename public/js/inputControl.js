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
    document.getElementById("wrongMail").innerHTML = "Inserisci una Email valida";
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
      document.getElementById("wrongPwd").innerHTML = "La Password deve essere di almeno 6 caratteri";
      document.getElementById("inputPassword").focus();
      return false;
    }
    if(pwd1 == email) {
      document.getElementById("wrongPwd").innerHTML = "La Password deve essere dfferente dall'Email";
      document.getElementById("inputPassword").focus();
      return false;
    }
    var re1 = /[0-9]/;
    if(!re1.test(pwd1)) {
      document.getElementById("wrongPwd").innerHTML = "La Password deve contenere almeno un numero";
      document.getElementById("inputPassword").focus();
      return false;
    }
    var re2 = /[a-z]/;
    if(!re2.test(pwd1)) {
      document.getElementById("wrongPwd").innerHTML = "La Password deve contenere almeno una lettera minuscola";
      document.getElementById("inputPassword").focus();
      return false;
    }
    var re3 = /[A-Z]/;
    if(!re3.test(pwd1)) {
      document.getElementById("wrongPwd").innerHTML = "La Password deve contenere almeno una lettera maiuscola";
      document.getElementById("inputPassword").focus();
      return false;
    }
    var re4 = /\W|_/g;
    if(!re4.test(pwd1)) {
      document.getElementById("wrongPwd").innerHTML = "La Password deve contenere almeno un carattere speciale";
      document.getElementById("inputPassword").focus();
      return false;
    }
  } else {
    document.getElementById("wrongPwd").innerHTML = "Crea una nuova Password";
    document.getElementById("inputPassword").focus();
    return false;
  }
  if(!document.getElementById('checkAge').checked) {
    document.getElementById("wrongAge").innerHTML = "Spunta la casella di controllo solo se hai più di 18 anni";
    return false;
  }
  if(!document.getElementById('checkPrivacy').checked) {
    document.getElementById("wrongPrivacy").innerHTML = "Spunta la casella di controllo per accettare le Condizioni";
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
      document.getElementById("wrongPwd").innerHTML = "La Password deve essere di almeno 6 caratteri";
      document.getElementById("inputPassword").focus();
      return false;
    }
    if(pwd1 == email) {
      document.getElementById("wrongPwd").innerHTML = "La Password deve essere dfferente dall'Email";
      document.getElementById("inputPassword").focus();
      return false;
    }
    var re1 = /[0-9]/;
    if(!re1.test(pwd1)) {
      document.getElementById("wrongPwd").innerHTML = "La Password deve contenere almeno un numero";
      document.getElementById("inputPassword").focus();
      return false;
    }
    var re2 = /[a-z]/;
    if(!re2.test(pwd1)) {
      document.getElementById("wrongPwd").innerHTML = "La Password deve contenere almeno una lettera minuscola";
      document.getElementById("inputPassword").focus();
      return false;
    }
    var re3 = /[A-Z]/;
    if(!re3.test(pwd1)) {
      document.getElementById("wrongPwd").innerHTML = "La Password deve contenere almeno una lettera maiuscola";
      document.getElementById("inputPassword").focus();
      return false;
    }
    var re4 = /\W|_/g;
    if(!re4.test(pwd1)) {
      document.getElementById("wrongPwd").innerHTML = "La Password deve contenere almeno un carattere speciale";
      document.getElementById("inputPassword").focus();
      return false;
    }
    if(pwd1!=pwd2) {
      document.getElementById("wrongPwd2").innerHTML = "Le Password inserite sono differenti ";
      document.getElementById("confirmPassword").focus();
      return false;
    }
  } else {
    document.getElementById("wrongPwd").innerHTML = "Crea una nuova Password";
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
  var nome = document.getElementById("inputFirstName").value;
  var phoneno = /^\d{10}$/;
  var capno = /^\d{5}$/;
  var submit = true;
  // init messaggi di warning
  if (document.getElementById("wrongLastName") != null) document.getElementById("wrongLastName").innerHTML = "";
  if (document.getElementById("wrongPhone") != null) document.getElementById("wrongPhone").innerHTML = "";
  if (document.getElementById("wrongCity") != null) document.getElementById("wrongCity").innerHTML = "";
  if (document.getElementById("wrongProvincia") != null) document.getElementById("wrongProvincia").innerHTML = "";
  if (document.getElementById("wrongStreet") != null) document.getElementById("wrongStreet").innerHTML = "";
  if (document.getElementById("wrongNumciv") != null) document.getElementById("wrongNumciv").innerHTML = "";

  if (nome == "") {
    text = "Inserire il Nome";
    document.getElementById("wrongFirstName").innerHTML = text;
    document.getElementById("inputFirstName").focus();
    return false;
  } else {    
    document.getElementById("inputFirstName").value = nome.charAt(0).toUpperCase() + nome.slice(1);
  } 
  if (cognome == "") {
    text = "Inserire il Cognome";
    document.getElementById("wrongLastName").innerHTML = text;
    document.getElementById("inputLastName").focus();
    return false;
  } else {    
    document.getElementById("inputLastName").value = cognome.charAt(0).toUpperCase() + cognome.slice(1);
  } 
  if (phone == "" || !phone.match(phoneno)) {
    text = "Inserire un numero di telefono cellulare valido";
    document.getElementById("wrongPhone").innerHTML = text;
    document.getElementById("inputMobile").focus();
    return false;
  }
  // se la lista di città risultante dalla selezione fatta nella pagina registration.njk
  // javascript async function selectCity(v) è diversa da NULL e la città è blank allora
  // no si è digitato correttamente il noem della città o selezionata la città dalla lista
  // proposta 
  if (city == "" || document.getElementById('myselectcity') != null) {
    text = "Inserire o selezionare la Città";
    document.getElementById("wrongCity").innerHTML = text;
    document.getElementById("inputCity").focus();
    return false;
  }
  // se il campo HIDDEN hiddenListOfCities è presente perchè creato nel javascript della
  // pagina registration.njk a seguito di corretto funzionamento di ricerca allora
  // se non si ha valorizzata la provincia è perchè il nome della città è inesistente
  if (province == "" &&  document.getElementById("hiddenListOfCities").value == "OK") {
    text = "Inserire o selezionare una Città esistente";
    document.getElementById("wrongCity").innerHTML = text;
    document.getElementById("inputCity").focus();
    return false;
  }
  if (province == "") {
    text = "Inserire la Provincia";
    document.getElementById("wrongProvincia").innerHTML = text;
    document.getElementById("inputProvincia").focus();
    return false;
  }
  if (address == "" || document.getElementById("myselectstreet") !=null) {
    text = "Inserire o selezionare l'indirizzo ";
    document.getElementById("wrongStreet").innerHTML = text;
    document.getElementById("inputStreet").focus();
    return false;
  }
  if (numciv == "") {
    text = "Inserire il Numero Civico";
    document.getElementById("wrongNumciv").innerHTML = text;
    document.getElementById("inputNumciv").focus();
    return false;
  }
  
  return true;
   
};
