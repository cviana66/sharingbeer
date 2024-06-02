/* inputControl.js */
const iwar = '<svg style="vertical-align:bottom" xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="30px" fill="#ffc107"> \
             <g><rect fill="none" height="24" width="24"/></g><g><g><g><path d="M12,5.99L19.53,19H4.47L12,5.99 M12,2L1,21h22L12,2L12,2z"/> \
             <polygon points="13,16 11,16 11,18 13,18"/><polygon points="13,10 11,10 11,15 13,15"/></g></g></g></svg>';

function fieldLoginControl(){
  var email = document.getElementById("inputUsernameEmail").value;
  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  var submit = true;
  if (email == "" || !re.test(String(email))) {
    text = iwar+"Indirizzo mail non valido.";
    document.getElementById("wrongMail").innerHTML = text;
    return false;
  } else {
    return true;
  }
};

function fieldsFatturaControl() {
  document.getElementById("wrongPEC").innerHTML = "";
  document.getElementById("wrongSDI").innerHTML = "";

  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  var fatturaPEC = document.getElementById("inFatturaPEC").value;
  var fatturaSDI = document.getElementById("inFatturaSDI").value;
  
  if (document.getElementById("isFatturaRequired").checked == true) {
    if(fatturaPEC =="" || !re.test(String(fatturaPEC))) {    
      document.getElementById("wrongPEC").innerHTML = iwar+"Inserisci una PEC valida";
      document.getElementById("inFatturaPEC").focus();
      return false;
    };

    re = /^[a-zA-Z0-9]+$/i;
    if(fatturaSDI.length > 0) {
      if (fatturaSDI.length != 7 || !re.test(String(fatturaSDI))) {    
        document.getElementById("wrongSDI").innerHTML = iwar+"Inserisci un codice SDI valido";
        document.getElementById("inFatturaSDI").focus();
        return false;
      }
    };

    return true;
  }
}

function fieldsValidationControl() {
  document.getElementById("wrongMail").innerHTML = "";
  document.getElementById("wrongPwd").innerHTML = "";
  document.getElementById("wrongPrivacy").innerHTML = "";
  document.getElementById("wrongAge").innerHTML = "";
  document.getElementById("wrongControlMail").innerHTML = "";
  document.getElementById("wrongConfirmPwd").innerHTML = "";

  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  var email = document.getElementById("inputUsernameEmail").value;
  var controlEmail = document.getElementById("inputControlUsernameEmail").value;
  
  if(email =="" || !re.test(String(email))) {    
    document.getElementById("wrongMail").innerHTML = iwar+"Inserisci una Email valida";
    document.getElementById("inputUsernameEmail").focus();
    return false;
  };
  if(email.toLowerCase() != controlEmail.toLowerCase()) {
    document.getElementById("wrongControlMail").innerHTML = iwar+"Indirizzo email di conferma differente";
    document.getElementById("inputControlUsernameEmail").focus();
    return false;
  }


  let pwd1 = "";
  let pwd2 = "";
  if (document.getElementById("inputPassword") != null) {
    pwd1 = document.getElementById("inputPassword").value;
  }
  if (document.getElementById("confirmPassword") != null) {
    pwd2 = document.getElementById("confirmPassword").value;
  }

  if(pwd1 != "") {
    if(pwd1.length < 6) {
      document.getElementById("wrongPwd").innerHTML = iwar+"La Password deve essere di almeno 6 caratteri";
      document.getElementById("inputPassword").focus();
      return false;
    }
    if(pwd1 == email) {
      document.getElementById("wrongPwd").innerHTML = iwar+"La Password deve essere dfferente dall'Email";
      document.getElementById("inputPassword").focus();
      return false;
    }
    var re1 = /[0-9]/;
    if(!re1.test(pwd1)) {
      document.getElementById("wrongPwd").innerHTML = iwar+"La Password deve contenere almeno un numero";
      document.getElementById("inputPassword").focus();
      return false;
    }
    var re2 = /[a-z]/;
    if(!re2.test(pwd1)) {
      document.getElementById("wrongPwd").innerHTML = iwar+"La Password deve contenere almeno una lettera minuscola";
      document.getElementById("inputPassword").focus();
      return false;
    }
    var re3 = /[A-Z]/;
    if(!re3.test(pwd1)) {
      document.getElementById("wrongPwd").innerHTML = iwar+"La Password deve contenere almeno una lettera maiuscola";
      document.getElementById("inputPassword").focus();
      return false;
    }
    var re4 = /\W|_/g;
    if(!re4.test(pwd1)) {
      document.getElementById("wrongPwd").innerHTML = iwar+"La Password deve contenere almeno un carattere speciale";
      document.getElementById("inputPassword").focus();
      return false;
    }
  } else {
    document.getElementById("wrongPwd").innerHTML = iwar+"Crea una nuova Password";
    document.getElementById("inputPassword").focus();
    return false;
  }

  if(pwd2 != "") {
    if(pwd2.length < 6) {
      document.getElementById("wrongPwd").innerHTML = iwar+"La Password di conferma deve essere di almeno 6 caratteri";
      document.getElementById("confirmPassword").focus();
      return false;
    }
  }

  if(pwd1 != pwd2) {
      document.getElementById("wrongConfirmPwd").innerHTML = iwar+"La password di conferma è differente";
      document.getElementById("confirmPassword").focus();
      return false;
  }

  if(!document.getElementById('checkAge').checked) {
    document.getElementById("wrongAge").innerHTML = iwar+"Spunta la casella di controllo solo se hai più di 18 anni";
    return false;
  }
  if(!document.getElementById('checkPrivacy').checked) {
    document.getElementById("wrongPrivacy").innerHTML = iwar+"Spunta la casella di controllo per accettare le Condizioni";
    return false;
  }
  console.debug('FIELDS VALIDATION CONTROL')
  return true;
}

function fieldsResetControl() {
  document.getElementById("wrongPwd").innerHTML = "";
  document.getElementById("wrongPwd2").innerHTML = "";

  var pwd1 = document.getElementById("inputPassword").value;
  var pwd2 = document.getElementById("confirmPassword").value;

  if(pwd1 != "") {
    if(pwd1.length < 6) {
      document.getElementById("wrongPwd").innerHTML = iwar+"La Password deve essere di almeno 6 caratteri";
      document.getElementById("inputPassword").focus();
      return false;
    }
    if(pwd1 == email) {
      document.getElementById("wrongPwd").innerHTML = iwar+"La Password deve essere dfferente dall'Email";
      document.getElementById("inputPassword").focus();
      return false;
    }
    var re1 = /[0-9]/;
    if(!re1.test(pwd1)) {
      document.getElementById("wrongPwd").innerHTML = iwar+"La Password deve contenere almeno un numero";
      document.getElementById("inputPassword").focus();
      return false;
    }
    var re2 = /[a-z]/;
    if(!re2.test(pwd1)) {
      document.getElementById("wrongPwd").innerHTML = iwar+"La Password deve contenere almeno una lettera minuscola";
      document.getElementById("inputPassword").focus();
      return false;
    }
    var re3 = /[A-Z]/;
    if(!re3.test(pwd1)) {
      document.getElementById("wrongPwd").innerHTML = iwar+"La Password deve contenere almeno una lettera maiuscola";
      document.getElementById("inputPassword").focus();
      return false;
    }
    var re4 = /\W|_/g;
    if(!re4.test(pwd1)) {
      document.getElementById("wrongPwd").innerHTML = iwar+"La Password deve contenere almeno un carattere speciale";
      document.getElementById("inputPassword").focus();
      return false;
    }
    if(pwd1!=pwd2) {
      document.getElementById("wrongPwd2").innerHTML = iwar+"Le Password inserite sono differenti ";
      document.getElementById("confirmPassword").focus();
      return false;
    }
  } else {
    document.getElementById("wrongPwd").innerHTML = iwar+"Crea una nuova Password";
    document.getElementById("inputPassword").focus();
    return false;
  }
  return true;
}

async function fieldsRegisterControl() {
  var phone = document.getElementById("inputMobile").value.replace(/\W+/g, '');
  var city = document.getElementById("inputCity").value;
  var province = document.getElementById("inputProvincia").value;
  var cap = document.getElementById("inputCap").value;
  var address = document.getElementById("inputStreet").value;
  var numciv = document.getElementById("inputNumciv").value;
  var cognome = document.getElementById("inputLastName").value;
  var nome = document.getElementById("inputFirstName").value;
  var phoneno = /^\d{10}$/;
  var capno = /^\d{5}$/;
  var submit = true;


  // init messaggi di warning
  if (document.getElementById("wrongFirstName") != null) document.getElementById("wrongFirstName").innerHTML = "";
  if (document.getElementById("wrongLastName") != null) document.getElementById("wrongLastName").innerHTML = "";
  if (document.getElementById("wrongPhone") != null) document.getElementById("wrongPhone").innerHTML = "";
  if (document.getElementById("wrongCity") != null) document.getElementById("wrongCity").innerHTML = "";
  if (document.getElementById("wrongProvincia") != null) document.getElementById("wrongProvincia").innerHTML = "";
  if (document.getElementById("wrongStreet") != null) document.getElementById("wrongStreet").innerHTML = "";
  if (document.getElementById("wrongNumciv") != null) document.getElementById("wrongNumciv").innerHTML = "";

  if (nome == "") {
    text = iwar+"Inserire il Nome";
    document.getElementById("wrongFirstName").innerHTML = text;
    document.getElementById("inputFirstName").focus();
    document.getElementById("wrongFirstName").scrollIntoView({ behavior: "smooth", block: "center" });
    return false;
  } else {    
    document.getElementById("inputFirstName").value = nome.charAt(0).toUpperCase() + nome.slice(1);
  } 
  if (cognome == "") {
    text = iwar+"Inserire il Cognome";
    document.getElementById("wrongLastName").innerHTML = text;
    document.getElementById("inputLastName").focus();
    document.getElementById("wrongLastName").scrollIntoView({ behavior: "smooth", block: "center" });
    return false;
  } else {    
    document.getElementById("inputLastName").value = cognome.charAt(0).toUpperCase() + cognome.slice(1);
  } 
  if (phone == "" || !phone.match(phoneno)) {
    text = iwar+"Inserire un numero di telefono cellulare valido";
    document.getElementById("wrongPhone").innerHTML = text;
    document.getElementById("inputMobile").focus();
    document.getElementById("wrongPhone").scrollIntoView({ behavior: "smooth", block: "center" });
    return false;
  }
  // se la lista di città risultante dalla selezione fatta nella pagina registration.njk o addresses.njk
  // javascript async function selectCity(v) è diversa da NULL e la città è blank allora
  // non si è digitato correttamente il nome della città o selezionata la città dalla lista
  // proposta 
  if (city == "" || document.getElementById('myselectcity') != null || document.getElementById("hiddenListOfCities") === null || document.getElementById("hiddenListOfCities") === undefined) {
    text = iwar+"Inserire o selezionare la Città";
    document.getElementById("wrongCity").innerHTML = text;
    document.getElementById("inputCity").focus();
    document.getElementById("wrongCity").scrollIntoView({ behavior: "smooth", block: "center" });
    return false;
  }
  // se il campo HIDDEN hiddenListOfCities è presente perchè creato nel javascript della
  // pagina registration.njk a seguito di corretto funzionamento di ricerca allora
  // se non si ha valorizzata la provincia è perchè il nome della città è inesistente
  if (province == "" &&  document.getElementById("hiddenListOfCities").value == "OK") {
    text = iwar+"Inserire o selezionare una Città esistente";
    document.getElementById("wrongCity").innerHTML = text;
    document.getElementById("inputCity").focus();
    document.getElementById("wrongCity").scrollIntoView({ behavior: "smooth", block: "center" });
    return false;
  }
  if (province == "") {
    text = iwar+"Inserire la Provincia";
    document.getElementById("wrongProvincia").innerHTML = text;
    document.getElementById("inputProvincia").focus();
    document.getElementById("wrongProvincia").scrollIntoView({ behavior: "smooth", block: "center" });
    return false;
  }
  if (cap == "") {
    text = iwar+"Inserire il CAP";
    document.getElementById("wrongCap").innerHTML = text;
    document.getElementById("inputCap").focus();
    document.getElementById("wrongCap").scrollIntoView({ behavior: "smooth", block: "center" });
    return false;
  }  
  if (address == "" || document.getElementById("myselectstreet") !=null || document.getElementById("hiddenStreet").value != 'OK') {
    text = iwar+"Inserire o selezionare un indirizzo esistente";
    document.getElementById("wrongStreet").innerHTML = text;
    document.getElementById("inputStreet").focus();
    document.getElementById("wrongStreet").scrollIntoView({ behavior: "smooth", block: "center" });
    return false;
  }
  
  if (numciv == "") {
    text = iwar+"Inserire il Numero Civico";  
    document.getElementById("wrongNumciv").innerHTML = text;
    document.getElementById("inputNumciv").focus();
    document.getElementById("wrongNumciv").scrollIntoView({ behavior: "smooth", block: "center" });
    return false
  }
  
  return true;
   
};