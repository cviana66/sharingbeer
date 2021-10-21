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
                console.log("webcam started");
            })
            .catch(err => {
                displayError();
            });
         console.log('this.checked-> ',this.checked)
         ischecked = this.checked;
         sendPhoto();
    }
    else {        
        console.log('this.checked-> ',this.checked)
        ischecked = this.checked;
        cameraStopped();
        webcam.stop();
        console.log("webcam stopped");
    }        
});

function decodeImageFromBase64(data, callback){
                // set callback
                qrcode.callback = callback;
                //console.log('qrcode.callback-> ',qrcode.callback)
                // Start decoding
                qrcode.decode(data)
};

function sendPhoto() {
   var id = setInterval(takePhoto, 1000);

   function takePhoto() {
      if (nPhoto == 30 || ischecked == false) {
         console.log ('nPhoto-> ',nPhoto);
         nPhoto = 0;
         clearInterval(id);
         $("#webcam-switch").prop("checked", false).change();
      } else {
         console.log('nPhoto-> ',nPhoto);
         console.log('ischecked-> ',ischecked);
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


$('#cameraFlip').click(function() {
    webcam.flip();
    webcam.start();  
});

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
    $('.flash').hide();
    $("#webcam-caption").html("on"); 
    $("#webcam-control").removeClass("webcam-off");
    $("#webcam-control").addClass("webcam-on");
    $(".webcam-container").removeClass("d-none");
    /*
    if( webcam.webcamList.length > 1){
        $("#cameraFlip").removeClass('d-none');
    }*/
    //$("#wpfront-scroll-top-container").addClass("d-none");
    //window.scrollTo(0, 0); 
    //$('body').css('overflow-y','hidden');
}

function cameraStopped(){
    $("#errorMsg").addClass("d-none");
    $("#wpfront-scroll-top-container").removeClass("d-none");
    $("#webcam-control").removeClass("webcam-on");
    $("#webcam-control").addClass("webcam-off");
    $("#cameraFlip").addClass('d-none');
    $(".webcam-container").addClass("d-none");
    $("#webcam-caption").html("Click to Start");
    $('.md-modal').removeClass('md-show');

}


$("#take-photo").click(function () {
    beforeTakePhoto();
    var picture = webcam.snap();
    //document.querySelector('#download-photo').href = picture;
    afterTakePhoto(picture);
});

function beforeTakePhoto(){
    $('.flash')
        .show() 
        .animate({opacity: 0.3}, 500) 
        .fadeOut(500)
        .css({'opacity': 0.7});
    window.scrollTo(0, 0); 
    $('#webcam-control').addClass('d-none');
    $('#cameraControls').addClass('d-none');
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

function removeCapture(){
    $('#canvas').addClass('d-none');
    $('#webcam-control').removeClass('d-none');
    $('#cameraControls').removeClass('d-none');
    $('#take-photo').removeClass('d-none');
    $('#exit-app').addClass('d-none');
    $('#download-photo').addClass('d-none');
    $('#resume-camera').addClass('d-none');
}

$("#resume-camera").click(function () {
    webcam.stream()
        .then(facingMode =>{
            removeCapture();
        });
});

$("#exit-app").click(function () {
    removeCapture();
    $("#webcam-switch").prop("checked", false).change();
});