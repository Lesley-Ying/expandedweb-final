// Expanded Web
// NYUSH F25 - gohai

// you probably don't even need to modify this file :)

let express = require('express');
let fs = require('node:fs');
let https = require('node:https');  // for HTTPS
let { SerialPort } = require('serialport');
let socketIo = require('socket.io');
let webcam_mjpeg = require('./webcam_mjpeg');
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

// Webcam

if (process.platform == 'darwin') {
  // for macOS
  let options = [
    '-f', 'avfoundation',
    '-framerate', '30',                      // needed
    '-video_size', '1280x720',               // optional: 1920x1080, 640x480 (default: largest)
    '-i', 'default',                         // which camera device (0, 1, ..)
    //'-filter:v', 'fps=10',                 // optional: change framerate
    '-filter:v', 'fps=10,scale=640x360',     // optional: resize output
    '-q:v', '7',                             // optional: quality (1=best, 31=worst)
  ];
  webcam_mjpeg(app, '/stream.mjpeg', options);
} else if (process.platform == 'win32') {
  // for Windows
  let options = [
    '-f', 'dshow',
    '-framerate', '30',
    '-video_size', '1280x720',               // optional: 1920x1080, 640x480 (default: largest)
    '-i', '0',                               // which camera device (0, 1, ..)
    // '-filter:v', 'fps=10',                // optional: change framerate
    '-filter:v', 'fps=10,scale=640x360',     // optional: resize output
    '-q:v', '7',                             // optional: quality (1=best, 31=worst)
  ];
  webcam_mjpeg(app, '/stream.mjpeg', options);
} else {
  console.error('Unsupported OS:', process.platform);
}


server.listen(port, '0.0.0.0', function() {
  console.log('Example app listening on port ' + port);
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