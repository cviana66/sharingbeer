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
  //legge il file che si trova nelle directory express.static
  const myRequest = new Request(htmlFile, init);

  fetch(htmlFile, init)
    .then((response) => {
      if (!response.ok) {
        throw new Error("HTTP error! Status: "+response.status);
      }
      return response.text();
    })
    .then((data) => {
      var bX =  '<div style="margin: 10px;"> \
                      <span style="float:right;"> \
                        <a href="#" onclick="return closeDocument()"> \
                          <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#FFFFFF"><path d="M0 0h24v24H0z" fill="none"/><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg> \
                        </a> \
                      </span> \
                    </div>'
      document.getElementById("popup").innerHTML = bX+data;
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
