/* POPUPs Display */

function openDocument (htmlFile) {
  var blur = document.getElementsByClassName('blur');
  for (var i = 0; i < blur.length; i++) {
      blur[i].classList.toggle('active');
  }
  const init = {
    method: "GET",
    headers: {Accept: "text/html"},
    mode: "cors",
    cache: "reload",
  };
  const myRequest = new Request("info/"+htmlFile, init);

  fetch("info/"+htmlFile, init)
    .then((response) => {
      if (!response.ok) {
        throw new Error("HTTP error! Status: "+response.status);
      }
      return response.text();
    })
    .then((data) => {
      document.getElementById("popup").innerHTML = data;
    });
  document.getElementById("popup").style.display = "block";
  document.getElementById("popup").focus();
}

function closeDocument () {
  document.getElementById("popup").style.display = "none";
  
  var blur = document.getElementsByClassName('blur');
  for (var i = 0; i < blur.length; i++) {
      blur[i].classList.toggle('active');
  }
}
