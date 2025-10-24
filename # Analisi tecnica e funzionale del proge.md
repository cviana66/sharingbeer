# Analisi tecnica e funzionale del progetto "Sharingbeer"

## Finalità del progetto

Il progetto "Sharingbeer" è una piattaforma web dedicata alla promozione e condivisione della cultura della birra artigianale, con particolare attenzione al Birrificio Viana. La piattaforma permette agli utenti di registrarsi, invitare amici tramite link personalizzati, accedere a promozioni (come birre omaggio), visualizzare prodotti e ricevere consegne a domicilio. Sono inoltre presenti funzionalità di gestione utenti, dashboard amministrativa, integrazione con sistemi di pagamento (Paypal, Axerve), gestione di mappe e geolocalizzazione, e interazione con social network.

## Organizzazione tecnica

La struttura del progetto è suddivisa in diverse directory e file principali:

- **Root directory**: contiene file di configurazione per Docker, Fly.io, npm, e il server principale (`server.js`).
- **app/**: contiene la logica applicativa suddivisa in moduli JavaScript. Qui troviamo la gestione delle rotte (es. `routesDashboard.js`, `routesAuth.js`), l'integrazione con servizi esterni (es. Axerve, Paypal), la gestione delle coordinate geografiche, delle query Overpass, e funzioni di utilità.
- **config/**: presumibilmente contiene file di configurazione per l'applicazione (dettagli non forniti).
- **data/**: directory per dati persistenti o temporanei.
- **public/**: contiene le risorse statiche accessibili dal client, come CSS, JavaScript, font e immagini.
- **uploads/**: directory per la gestione degli upload di file da parte degli utenti.
- **views/**: contiene i template HTML/Nunjucks utilizzati per il rendering lato server delle pagine web (es. privacy, inviti amici, dashboard).
- **.github/**: contiene workflow per l'integrazione continua e automazioni GitHub Actions.

### Dettaglio dei componenti principali

- **server.js**: punto di ingresso dell'applicazione Node.js, avvia il server e configura i middleware principali.
- **service-worker.js**: implementa un service worker per la gestione di caching, notifiche push e miglioramento delle performance lato client.
- **app/routesDashboard.js**: gestisce la dashboard utente, la logica di invito amici, la validazione degli inviti e la visualizzazione dello stato degli amici invitati.
- **views/**: i template gestiscono la presentazione delle informazioni agli utenti, come la lista amici, la privacy, la condivisione degli inviti, ecc.
- **public/js/popups.js**: gestisce la visualizzazione di popup dinamici lato client.
- **public/css/main.css**: contiene la definizione dello stile grafico dell'applicazione.

### Funzionalità chiave

- **Gestione inviti**: gli utenti possono invitare amici tramite link personalizzati, con scadenza e promozioni collegate.
- **Dashboard utente**: visualizzazione dello stato degli inviti, amici registrati, promozioni disponibili.
- **Integrazione pagamenti**: moduli dedicati per Axerve e Paypal.
- **Gestione mappe**: visualizzazione e gestione di dati geografici tramite Overpass API e moduli dedicati.
- **Notifiche e condivisione**: utilizzo delle API di condivisione native del browser e fallback su email.
- **Privacy e GDPR**: gestione dettagliata della privacy, cookie e trattamento dati personali, come descritto nei template HTML dedicati.

## Conclusioni

Il progetto è organizzato secondo le best practice delle applicazioni Node.js modulari, con una chiara separazione tra logica di business, presentazione e risorse statiche. La finalità è offrire una piattaforma di promozione, vendita e community per la birra artigianale, con particolare attenzione all'invito e coinvolgimento di nuovi utenti tramite meccanismi di referral e premi.
