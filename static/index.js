'use strict';


window.onload = async function () {

  // Costanti
  const latSede = 41.8707874; // Latitudine della sede centrale
  const longSede = 12.503540; // Longitudine della sede centrale
  const UNAUTHORIZED = 401; // Codice di stato HTTP per accesso non autorizzato

  // Inizializzazione
  await caricaGoogleMaps(); // Carica la libreria di Google Maps

  var authUser = JSON.parse(window.localStorage.getItem("authUser")); // Recupera l'utente autenticato dal localStorage
  if (authUser) {
    // Se l'utente è autenticato
    if (authUser.primo_accesso) {
      showChangePassword(); // Mostra il modulo per il cambio password
    } else {
      showLanding(); // Mostra la schermata principale
    }
  } else {
    showLogin(); // Mostra il modulo di login
  }

  // Login
  $('#frmLogin').on('submit', function (e) {
    e.preventDefault(); // Previene il comportamento predefinito del form

    let username = $(this).serializeArray()[0].value; // Recupera il nome utente
    let password = $(this).serializeArray()[1].value; // Recupera la password

    inviaRichiesta("POST", "/autentica", { username: username, password: password }).then((response) => {
      if (response.status == UNAUTHORIZED) {
        alert("Username o password errati"); // Mostra un messaggio di errore
        return;
      }

      // L'utente è autenticato correttamente
      window.localStorage.setItem("authUser", JSON.stringify(response.data.data)); // Salva l'utente autenticato nel localStorage
      authUser = response.data.data;

      if (authUser.primo_accesso) {
        showChangePassword(); // Mostra il modulo per il cambio password
      } else {
        showLanding(); // Mostra la schermata principale
      }
    }).catch((error) => {
      alert(error); // Mostra un messaggio di errore
    });
  });

  // Cambio password
  $('#frmChangePassword').on('submit', function (e) {
    e.preventDefault(); // Previene il comportamento predefinito del form

    let password = $(this).serializeArray()[0].value; // Recupera la password attuale
    let new_password = $(this).serializeArray()[1].value; // Recupera la nuova password
    if (password == new_password) {
      alert("La nuova password deve essere diversa dalla vecchia"); // Verifica che la nuova password sia diversa
      return;
    }

    inviaRichiesta("POST", "/cambia_password", { username: authUser.codice_operatore, password: password, new_password: new_password }).then((response) => {
      if (response.status == 200) {
        // La password è stata cambiata correttamente
        authUser.primo_accesso = false;
        authUser.password = new_password;

        window.localStorage.setItem("authUser", JSON.stringify(authUser)); // Aggiorna l'utente nel localStorage

        alert("Password cambiata correttamente"); // Mostra un messaggio di successo
        showLanding(); // Mostra la schermata principale
      } else {
        alert("Password errata"); // Mostra un messaggio di errore
      }
    }).catch((error) => {
      alert(error); // Mostra un messaggio di errore
    });
  });

  // Mostra login
  function showLogin() {
    $('#frmLogin').show(); // Mostra il modulo di login
    $('#frmChangePassword').hide(); // Nasconde il modulo per il cambio password
    $('#divLanding').hide(); // Nasconde la schermata principale
    $('#divAdminLanding').hide(); // Nasconde la schermata per gli amministratori
    $('#divUserLanding').hide(); // Nasconde la schermata per gli utenti
  }

  // Mostra cambio password
  function showChangePassword() {
    $('#frmLogin').hide(); // Nasconde il modulo di login
    $('#frmChangePassword').show(); // Mostra il modulo per il cambio password
    $('#divLanding').hide(); // Nasconde la schermata principale
    $('#divAdminLanding').hide(); // Nasconde la schermata per gli amministratori
    $('#divUserLanding').hide(); // Nasconde la schermata per gli utenti
  }

  // Mostra landing
  function showLanding() {
    $('#frmLogin').hide(); // Nasconde il modulo di login
    $('#frmChangePassword').hide(); // Nasconde il modulo per il cambio password
    $('#divLanding').show(); // Mostra la schermata principale

    if (authUser.amministratore) {
      // Se l'utente è un amministratore
      $('#divAdminLanding').show(); // Mostra la schermata per gli amministratori
      mostraUtenti(); // Mostra la lista degli utenti
      $("#divListBox").on("change", function () {
        mostraDetagli(); // Mostra i dettagli dell'utente selezionato
      });

      let mapContainer = $("#divGoogleApp").get(0); // Contenitore per la mappa
      let mappa;
      let geocoder = new google.maps.Geocoder();
      geocoder.geocode({ "address": "Roma" }, function (results, status) {
        let posizioneSede = {
          "lat": latSede,
          "lng": longSede,
        };
        if (status == google.maps.GeocoderStatus.OK) {
          let mapOptions = {
            "center": posizioneSede,
            "zoom": 10,
            "color": "#000",
          };
          mappa = new google.maps.Map(mapContainer, mapOptions); // Inizializza la mappa
          disegnaMarcatori(mappa); // Disegna i marcatori sulla mappa
        } else {
          alert("indirizzo non valido"); // Mostra un messaggio di errore
        }
      });
    } else {
      $('#divUserLanding').show(); // Mostra la schermata per gli utenti
    }
  }

  // Disegna i marcatori sulla mappa
  function disegnaMarcatori(mappa) {
    let request = inviaRichiesta("GET", "/perizie"); // Richiede la lista delle perizie

    request.catch((error) => {
      alert(error); // Mostra un messaggio di errore
    });
    request.then(function (response) {
      console.log(response.data); // Logga i dati delle perizie

      let posizioneSede = {
        "lat": latSede,
        "lng": longSede,
      };
      let markerOptions = {
        "map": mappa,
        "position": posizioneSede,
        "title": "sede centrale",
        "icon": {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "blue",
          fillOpacity: 1,
          strokeWeight: 1,
          strokeColor: "blue"
        }
      };

      let marker = new google.maps.Marker(markerOptions); // Crea un marcatore per la sede centrale
      marker.addListener("click", function () {
        Swal.fire({
          title: `<p><b>Sede centrale</b></p>`,
          showCloseButton: true,
          icon: 'info',
          width: '600px',
          heightAuto: false,
          customClass: {
            popup: 'swal-height-200px'
          }
        });
      });

      for (const perizia of response.data) {
        // Crea un marcatore per ogni perizia
        let posizione = {
          "lat": perizia.coordinate_geografiche.latitudine,
          "lng": perizia.coordinate_geografiche.longitudine
        };
        let markerOptions = {
          "map": mappa,
          "position": posizione,
          "title": perizia.codice_perizia,
        };

        let marker = new google.maps.Marker(markerOptions);
        marker.addListener("click", function () {
          let formattedDate = new Date(perizia.data_ora).toLocaleDateString('it-IT', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });

          Swal.fire({
            title: `<p><b>Perizia: ${perizia.codice_perizia}</b></p>`,
            html: `<p><b>CodiceOperatore:</b> ${perizia.codice_operatore}</p>
               <p><b>Data e ora:</b> ${formattedDate}</p>
               <p><b>Descrizione:</b> ${perizia.descrizione}</p>
               <h1>Fotografie:</h1>
               <img src="img/perizia.jpg" style="width: 25%; height: 10rem;"></img>
               <img src="img/perizia.jpg" style="width: 25%; height: 10rem;"></img>
               <img src="img/perizia.jpg" style="width: 25%; height: 10rem;"></img>
               <br>
               <br>
               <p><b>Note:</b> ${perizia.fotografie[0].commento}</p>`,
            showCloseButton: true,
            icon: 'info',
            width: '900px',
            heightAuto: false,
            customClass: {
              popup: 'swal-height-300px'
            }
          });
        });
      }
    });
  }

  // Mostra la lista degli utenti
  function mostraUtenti() {
    let request = inviaRichiesta("GET", "/utenti"); // Richiede la lista degli utenti

    request.catch((error) => {
      alert(error); // Mostra un messaggio di errore
    });
    request.then(function (response) {
      console.log(response.data); // Logga i dati degli utenti
      response.data.forEach(function (utente) {
        if (utente.codice_operatore == "ADMIN") {
          return; // Salta l'utente amministratore
        }
        $("<option>")
          .val(utente._id)
          .text(utente.nome + " " + utente.cognome)
          .appendTo("#divListBox"); // Aggiunge l'utente alla lista
      });
    });
  }

  // Mostra i dettagli dell'utente selezionato
  function mostraDetagli() {
    $("#divUserDetails").show(); // Mostra i dettagli dell'utente
    let codiceOperatore = $("#divListBox").val(); // Recupera l'ID dell'utente selezionato
    let request = inviaRichiesta("GET", "/utente", { id: codiceOperatore }); // Richiede i dettagli dell'utente
    request.then(function (response) {
      $('#userName').text(response.data.data.nome); // Mostra il nome
      $('#userLastName').text(response.data.data.cognome); // Mostra il cognome
      $('#userEmail').text(response.data.data.email); // Mostra l'email
      $('#userPerizieCount').text(response.data.data.nPerizie); // Mostra il numero di perizie
    });
    request.catch((error) => {
      alert(error); // Mostra un messaggio di errore
    });
  }

  // Aggiungi un nuovo operatore
  $('#btnAddOperator').on('click', function () {
    Swal.fire({
      title: 'Aggiungi Operatore',
      html: `
      <input id="inputNome" class="swal2-input" placeholder="Nome">
      <input id="inputCognome" class="swal2-input" placeholder="Cognome">
      <input id="inputEmail" class="swal2-input" placeholder="Email">`,
      focusConfirm: false,
      showCancelButton: true,
      cancelButtonText: 'Chiudi',
      preConfirm: () => {
        if (!$('#inputNome').val().length || !$('#inputCognome').val().length || !$('#inputEmail').val().length) {
          Swal.showValidationMessage(`Inserire tutti i campi richiesti`);
        }

        return [
          $('#inputNome').val(),
          $('#inputCognome').val(),
          $('#inputEmail').val()
        ];
      }
    }).then((result) => {
      if (result.isConfirmed) {
        addOperator(); // Aggiunge l'operatore
      }
    });
  });

  function addOperator() {
    let nome = $('#inputNome').val(); // Recupera il nome
    let cognome = $('#inputCognome').val(); // Recupera il cognome
    let email = $('#inputEmail').val(); // Recupera l'email

    inviaRichiesta("POST", "/addOperatore", { nome: nome, cognome: cognome, email: email }).then((response) => {
      if (response.status == 200) {
        Swal.fire({
          icon: 'success',
          text: "Operatore aggiunto correttamente"
        });
      } else {
        Swal.fire({
          icon: 'success',
          text: "Errore nell'aggiunta dell'operatore"
        });
      }
    }).catch((error) => {
      alert(error); // Mostra un messaggio di errore
    });
  }

  // Esci
  $('#aEsci').on('click', function () {
    window.localStorage.removeItem("authUser"); // Rimuove l'utente autenticato dal localStorage
    showLogin(); // Mostra il modulo di login
  });
};
