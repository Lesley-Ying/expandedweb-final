// Expanded Web
// NYUSH F25 - gohai

let express = require('express');
let child_process = require('child_process');
let fs = require('fs');

module.exports = function(app, path, options = []) {
  // add common options
  if (!options.includes('-y'))
    options.unshift('-y');
  if (!options.includes('-loglevel'))
    options.unshift('-loglevel', 'error');
  if (!options.includes('-fflags'))
    options.push('-fflags', 'nobuffer');
  if (!options.includes('-c:v'))
    options.push('-c:v', 'mjpeg');
  if (!options.includes('mpjpeg'))
    options.push('-f', 'mpjpeg');
  if (!options.includes('pipe:1'))
    options.push('pipe:1');

  // use a local copy of ffmpeg if provided
  let cmd = fs.existsSync('./ffmpeg') ? './ffmpeg' : 'ffmpeg';
  let ffmpeg = child_process.spawn(cmd, options);

  ffmpeg.on('error', function(err) {
    if (err.code == 'ENOENT') {
      console.error('Make sure ffmpeg is installed or in the local directory');
    } else {
      console.error(err);
    }
    process.exit(1);
  });

  let clients = new Set();

  ffmpeg.stdout.on('data', function(data) {
    for (let client of clients) {
      //console.log('Sending ' + data.length + ' bytes to ' + client.ip);
      client.res.write(data);
    }
  });

  ffmpeg.stderr.on('data', function(data) {
    console.error(data.toString().trim());
  });

  app.get(path, function(req, res) {
    res.writeHead(200, {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Connection': 'close',
      'Content-Type': 'multipart/x-mixed-replace; boundary=ffmpeg',
    });

    clients.add(req);
    console.log(req.ip + ' connected to ' + path);

    // alternatively:
    //ffmpeg.stdout.pipe(res);

    req.on('close', function() {
      clients.delete(req);
      console.log(req.ip + ' disconnected from ' + path);
    });
  });
}
