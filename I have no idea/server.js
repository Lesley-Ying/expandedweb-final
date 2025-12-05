// Expanded Web
// NYUSH F25 - gohai

// you probably don't even need to modify this file :)

let express = require('express');
let fs = require('node:fs');
let https = require('node:https');  // for HTTPS
let { SerialPort } = require('serialport');
let socketIo = require('socket.io');

let app = express();

// for HTTPS
let privateKey = fs.readFileSync('certs/privkey.pem', 'utf8');
let certificate = fs.readFileSync('certs/fullchain.pem', 'utf8');
let server = https.createServer({ key: privateKey, cert: certificate }, app);

// allow up to 10 MB of data to be sent across
let io = new socketIo.Server(server, { maxHttpBufferSize: 1e7 });
let port = 3000;
let arduino = null;
let mode=0;
//let servo1Angle=90;
let servo1Pos=0;
//let servo2Angle=30;
let servo2Pos=0;
let servo1Spd=0;
let servo2Spd=0;




app.use(express.static('public'));
tryConnectArduino();

let servo1MoveRequests = 0;

function updateServo() {
  if (servo1MoveRequests > 0) {

    servo1Angle = 170;
    moveServo();
    setTimeout(function() {
      servo1Angle = 10;
      moveServo();
      setTimeout(function() {
        servo1Angle = 30;
        moveServo();
        servo1MoveRequests--;
        console.log('completed request');
        setTimeout(updateServo, 100);
      }, 2000);
    }, 500);
  } else {
    setTimeout(updateServo, 100);
  }
  /*
  servo1Pos+=servo1Spd;
  servo2Pos+=servo2Spd;

  if (mode == 1) {
    servo1Angle = Math.floor(90 + Math.sin(servo1Pos) * 65);
    if (servo1Pos >=60) {
      servo1Spd*=-1;
    }else if(servo1Pos<0){
      servo1Pos=0;
      mode=0;
      console.log('Servo 1 cycle complete');
    }
  } else if (mode == 2) {
    servo2Angle = Math.floor(30 - Math.sin(degToRad(servo2Pos)) *35); 
    if (servo2Pos >= 60) {
      servo2Spd*=-1;
    }else if(servo2Pos<0){
      servo2Pos=0;
      mode=0;
      console.log('Servo 2 cycle complete');
    }
  }
  let command = servo1Angle + ',' + servo2Angle + '\n';  
  if (arduino && arduino.isOpen&&mode!==0) {
    arduino.write(command);
  }
  */
}
updateServo();

//setInterval(updateServo, 100);

let servo1Angle = 90;
let servo2Angle = 90;

function degToRad(deg) {
  return deg * Math.PI / 180;
}

function moveServo() {
  let command = Math.floor(servo1Angle) + ',' + Math.floor(servo2Angle) + '\n';  
  if (arduino) {
    arduino.write(command);
  }
}

io.on('connection', function(socket) {
  console.log(socket.id + ' connected from ' + socket.handshake.address);

  socket.on('disconnect', function(reason) {
    console.log(socket.id + ' disconnected');
  });
  
  socket.on('searchIconTriggered', function() {
    servo1MoveRequests++;
    console.log('added request');
    //mode=1;
    //servo1Spd=2;
    socket.broadcast.emit('searchIconTriggered');
  });

  socket.on('spitTriggered', function() {
    console.log('Spit triggered - activating servo 2');
   mode=2;
   servo2Spd=2;
    socket.broadcast.emit('spitTriggered');
  });

  socket.onAny(function(event, ...args) {
    //console.log(socket.id, event, ...args);
    socket.broadcast.emit(event, ...args);
  });
});

server.listen(port, '0.0.0.0', function() {
  console.log('Example app listening on port ' + port + ' for HTTPS');
});

/*
 * Helper functions for talking to Arduino
 */
async function tryConnectArduino(baudRate = 57600) {
  if (arduino && arduino.isOpen) {
    return;  // port is already open
  }
  try {
    let port = await getArduino();
    if (port) {
      arduino = new SerialPort({
        path: port.path,
        baudRate: baudRate,
      }, function(err) {
        if (err) {
          console.error(err.message);
        }
      });
      console.log('Opening connection with Arduino serial number ' + port.serialNumber);
    }
  } catch (e) {
    console.error('Error opening Arduino:', e);
  }
}
async function getArduino() {
  let ports = await SerialPort.list();
  for (port of ports) {
    if (port.vendorId == '2341' || port.vendorId == '3343')
      return port;
  }
  return null;
}