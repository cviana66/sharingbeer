(function(){
  var COUNT = 0;
  var SAFE_TIMEOUT_MS = 5000; // fallback per evitare loader bloccato
  var safeTimer = null;

  function getEl(){
    return document.getElementById('loading');
  }

  function show(){
    COUNT++;
    var el = getEl();
    if (el) el.style.display = 'block';
    document.body && document.body.setAttribute('aria-busy','true');
  }

  function reallyHide(){
    var el = getEl();
    if (el) el.style.display = 'none';
    document.body && document.body.removeAttribute('aria-busy');
  }

  function hide(){
    if (COUNT > 0) COUNT--;
    if (COUNT === 0) reallyHide();
  }

  function reset(){
    COUNT = 0;
    reallyHide();
  }

  function wrap(p){
    show();
    return Promise.resolve(p).finally(hide);
  }

  function earlyHideSetup(){
    // Se il DOM è già pronto (o quasi), prova a nascondere subito
    try {
      if (document.readyState === 'interactive' || document.readyState === 'complete') {
        reset();
      } else {
        document.addEventListener('readystatechange', function(){
          if (document.readyState === 'interactive') {
            reset();
          }
        }, { once: true });

        document.addEventListener('DOMContentLoaded', function(){
          reset();
        }, { once: true });

        window.addEventListener('load', function(){
          reset();
        }, { once: true });
      }

      // Timeout di sicurezza per evitare blocchi infiniti
      if (safeTimer) clearTimeout(safeTimer);
      safeTimer = setTimeout(function(){ reset(); }, SAFE_TIMEOUT_MS);
    } catch(e) { /* no-op */ }
  }

  function globalGuards(){
    // In caso di errori non gestiti, evita di lasciare il loader appeso
    window.addEventListener('error', function(){
      // Non forziamo l'hide se l'app ha davvero bisogno del loader,
      // ma reset come ultima spiaggia previene blocchi infiniti
      setTimeout(reset, 1000);
    });
    window.addEventListener('unhandledrejection', function(){
      setTimeout(reset, 1000);
    });
  }

  window.Loader = {
    show: show,
    hide: hide,
    reset: reset,
    wrap: wrap
  };

  // Inizializzazione automatica
  globalGuards();
  earlyHideSetup();
})();
