// Expanded Web
// NYUSH F25 - gohai

// you probably don't even need to modify this file :)

let express = require('express');
let fs = require('node:fs');
let https = require('node:https');  // for HTTPS
let socketIo = require('socket.io');

let app = express();

// for HTTPS
let privateKey = fs.readFileSync('certs/privkey.pem', 'utf8');
let certificate = fs.readFileSync('certs/fullchain.pem', 'utf8');
let server = https.createServer({ key: privateKey, cert: certificate }, app);

// allow up to 10 MB of data to be sent across
let io = new socketIo.Server(server, { maxHttpBufferSize: 1e7 });
let port = 3000;

app.use(express.static('public'));


io.on('connection', function(socket) {
  console.log(socket.id + ' connected from ' + socket.handshake.address);

  socket.on('disconnect', function(reason) {
    console.log(socket.id + ' disconnected');
  });

  socket.onAny(function(event, ...args) {
    console.log(socket.id, event, ...args);
    socket.broadcast.emit(event, ...args);
  });
});

server.listen(port, '0.0.0.0', function() {
  console.log('Example app listening on port ' + port + ' for HTTPS');
});
