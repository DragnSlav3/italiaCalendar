//ID de identificacion del calendario
const calendar = CalendarApp.getCalendarById('<ID GOOGLE CALENDAR>');

var URL = '<URL EVENTO CALENDAR>';

//Webhook a Slack
const SLACK_URL =  '<ID SLACK>';

function recordatorio(){
  importarEventos(1);
}
function cambioCalendar(){
  importarEventos(0);
}

function importarEventos(recordatorio) {
  var fromDate = new Date();
  var toDate;
  if (recordatorio){
    toDate = new Date(fromDate.getTime() + 2 * 1000 * 60 * 60 * 24);
  }
  else {
    toDate = new Date(fromDate.getTime() + 30 * 1000 * 60 * 60 * 24);
  }

  var events = calendar.getEvents(fromDate, toDate);
  events.forEach(evento=>{
    var color = evento.getColor();
    var notes = evento.getDescription();
    
    for (guests = 0; guests < evento.getGuestList().length; guests++){
      var status = evento.getGuestList()[guests].getStatus();

      if (color == "" && status == "no" && !recordatorio) {
        assign_color(evento);
      }
      if (status == "no" && notes == "" && recordatorio){
        sendReminderToSlack(evento);
      }
      if (status == "no" && notes != "" && recordatorio){
        sendReminderToOwner(evento);
      }

      if (notes.indexOf("ok")>-1 && !recordatorio){
        crearNuevosHorarios(evento);
        evento.setDescription("");
        evento.setColor("0");
      }
    }
  })
}

function crearNuevosHorarios(evento){

  //Horarios evento 1
  var event1Start = evento.getStartTime();
  var event1End = evento.getEndTime();

  //Horarios evento 2
  var event2Start = new Date();
  var notes = evento.getDescription().split("\n");
  notes.forEach(linea =>{
    if (linea.indexOf("ok")>-1){
      var datos = linea.split(" ");
      event2Start.setDate(datos[2].split("/")[0]); 
      event2Start.setMonth(datos[2].split("/")[1]-1);
      event2Start.setHours(datos[3].split("-")[0]);
      event2Start.setMinutes(0);
      event2Start.setSeconds(0);
    }
  })
  var event2End = new Date(event2Start.getTime() + 1000 * 60 * 60 );

  //Obtener evento 2
  var secondEvent = calendar.getEvents(event2Start, event2End)[0];
  secondEvent.setColor("0");

  //Cambiar horario evento 1
  evento.setTime(event2Start, event2End);

  //Cambiar horario evento 2
  secondEvent.setTime(event1Start, event1End);
}

function assign_color(event) {
  event.setColor('11');
  sendHelpToSlack(event);
}

function sendHelpToSlack(event) { //Falta editar
  var name = event.getTitle().slice(5, 20);
  const message = name +' tiene un evento al que no puede asistir <' + URL + '|Ver Calendario>';
  sendSlackMessage(message);
}

function sendReminderToOwner(event) {
  var name = event.getTitle();
  const message =  name + ' recuerda aceptar tus ofertas de horarios! Puedes hacerlo desde aqui <' + URL + '|Ver Calendario>';
  sendSlackMessage(message);

}

function sendReminderToSlack(event) {
  var name = event.getTitle().slice(5, 20);
  var sDate = event.getStartTime();
  const message =  name + ' necesita que lo cubran con su chat del ' + sDate + ', AYUDALO! puedes hacerlo desde aqui <' + URL + '|Ver Calendario>';
  sendSlackMessage(message);

}

function sendSlackMessage(text) {
  const slackMessage = {
    text: text
  };

  const options = {
    method: 'POST',
    contentType: 'application/json',
    payload: JSON.stringify(slackMessage)
  };
  UrlFetchApp.fetch(SLACK_URL, options);
}


//Agregar eventos desde SpreadSheet
function addEvents() {
  //ID de identificacion del SpreadSheet
  var spreadsheet = SpreadsheetApp.openById('<ID HOJA DE CALCULO>');
  var configCalendar = spreadsheet.getSheetByName('<NOMBRE HOJA>');
  var signups = configCalendar.getRange("A1:D18").getValues();
  for (x = 0; x < signups.length; x++){
    calendar.createEvent(signups[x][2],signups[x][0], signups[x][1], {sendInvites: true, guests: signups[x][3]});
  }
}

//Eliminar eventos desde una fecha en especifico
function deleteEvent() {
  var events = calendar.getEventsForDay(new Date(2022,4,30));
  for (y = 0; y < events.length; y++){
    events[y].deleteEvent();
  }  
}
  