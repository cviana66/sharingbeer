//Version OK 211011 21:56
//Version OK 211013 23:56

//https://github.com/bensonruan/webcam-easy

const webcamElement = document.getElementById('webcam');

const canvasElement = document.getElementById('canvas');

const snapSoundElement = document.getElementById('snapSound');

const webcam = new Webcam(webcamElement, 'user', canvasElement, snapSoundElement);

var nPhoto = 0;
var ischecked;

$("#webcam-switch").change(function () {
    if(this.checked){
        $('.md-modal').addClass('md-show');
        webcam.start() // Attiva la webcam
            .then(result => {
                if( webcam.webcamList.length > 1 && webcam.facingMode == 'user' ){ 
                   webcam.flip();   // nel cellulare setto la camera back 
                   webcam.start();
                }
                cameraStarted();
            })
            .catch(err => {
                displayError();
            });
         ischecked = this.checked;
         sendPhoto();
    } else {        
        ischecked = this.checked;
        cameraStopped();
        webcam.stop();
    }        
});

function decodeImageFromBase64(data, callback){
                // set callback
                qrcode.callback = callback;
                // Start decoding
                qrcode.decode(data)
};

function sendPhoto() {
   var id = setInterval(takePhoto, 1000);

   function takePhoto() {
      if (nPhoto == 30 || ischecked == false) {
         nPhoto = 0;
         clearInterval(id);
         $("#webcam-switch").prop("checked", false).change();
      } else {
         nPhoto = nPhoto+1;
         picture = webcam.snap();
         //picture = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASIAAAEiAQMAAABncE31AAAABlBMVEX///8AAABVwtN+AAABA0lEQVRoge3ZUQ6CMAzG8SYcwCNx9R2JA5jU0a6ARKIP60z0/z0wZD+fmm1siBBCCPmfaMu93t/sEk8KKlv5jwrq3VT7jO4dqEy1lsT65mVS92vBUAOVKupbKmYm1DhljffpB/MXqp/aVmQfIuXNuo3qp46p4KIHlaFiTKzXRdrS4GszKlnJHCPBhkgF2z9RyWqvkNWlUdWrOqL6qZiP2kuoVWivGipT+cAosfsNOqHy1cm34txOuwBUhtKW2Hf52Zu8XLdRnVWxZtt3+duQ3gU1QD2d+kSFBDVUFX8ytZcj1Eh1OHMWQQ1Q1kSF2hb4ev5CdVTHFVl1/86FSleEEEJ+PQ/ANYzwx13NHQAAAABJRU5ErkJggg==";
         decodeImageFromBase64(picture,function(decodedInformation){
            console.log(decodedInformation.result);
            console.log(decodedInformation.status);
            if (decodedInformation.status == 'ok') {
               clearInterval(id);
               $("#webcam-switch").prop("checked", false).change();
               afterTakePhoto(decodedInformation.result);
            }   
         });
      }
    }
}

$('#closeError').click(function() {
    $("#webcam-switch").prop('checked', false).change();
});

function displayError(err = ''){
    if(err!=''){
        $("#errorMsg").html(err);
    }
    $("#errorMsg").removeClass("d-none");
}

function cameraStarted(){
    $("#errorMsg").addClass("d-none");
    $("#webcam-caption").html("on"); 
    $("#webcam-control").removeClass("webcam-off");
    $("#webcam-control").addClass("webcam-on");
    $(".webcam-container").removeClass("d-none");
}

function cameraStopped(){
    $("#errorMsg").addClass("d-none");
    $("#wpfront-scroll-top-container").removeClass("d-none");
    $("#webcam-control").removeClass("webcam-on");
    $("#webcam-control").addClass("webcam-off");
    $(".webcam-container").addClass("d-none");
    $("#webcam-caption").html("Click to Start");
    $('.md-modal').removeClass('md-show');
}

function afterTakePhoto(qrinfo){
    webcam.stop();
    console.log("Picture -> ",picture);
    $('#canvas').removeClass('d-none');
    $('#take-photo').addClass('d-none');
    $('#exit-app').removeClass('d-none');
    $('#download-photo').removeClass('d-none');
    $('#resume-camera').removeClass('d-none');
    $('#cameraControls').removeClass('d-none');
    $.ajax({
      type: "POST",
      url: "/webcam",
      dataType: "json",
      data: {"qrinfo": qrinfo},
      success: function() {
         window.location.replace("/qrcodeOrder");
      },
      error: function (xhr, ajaxOptions, thrownError) { 
         console.log("KO" ,thrownError + '  ' + xhr);
       }
    });
}