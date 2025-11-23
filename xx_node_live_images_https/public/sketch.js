// Expanded Web
// NYUSH F25 - gohai

let socket;
let video;
let images = {};

function setup() {
  createCanvas(640, 640);
  video = createCapture(VIDEO);
  video.hide();

  socket = io();

  socket.on('image', function(data) {
    console.log('received', data);
    // this essentially turns the received binary image data into a form
    // that p5's loadImage can deal with
    let blob = new Blob([data.bytes], { type: 'image/png' });
    objectUrl = URL.createObjectURL(blob);
    loadImage(objectUrl, function(image) {
      // after loading has finished, we store it in the
      // images object
      images[data.id] = {
        img: image,
        lastSeen: millis(),
      };
    });
  });

  // how often the image data gets sent
  setInterval(sendImage, 100);
}

function draw() {
  background(204);

  // draw all the images (in a grid)
  let x = 0;
  let y = 0;
  let maxHeight = 0;
  for (let id in images) {
    // get rid of entries that are too old
    // the user might have closed the website
    if (millis() - images[id].lastSeen > 3000) {
      delete images[id];
    } else {
      // start a new line if needed
      if (x + images[id].img.width > width) {
        y += maxHeight;
        x = 0;
        maxHeight = 0;
      }
      image(images[id].img, x, y);
      // advance the x and keep track of the maximum height
      x += images[id].img.width;
      if (images[id].img.height > maxHeight) {
        maxHeight = images[id].img.height;
      }
    }
  }
}

function sendImage() {
  // we create a new temporary canvas to draw everything onto
  // that will then get sent to all the other clients
  let pg = createGraphics(160, 120);
  pg.image(video, 0, 0, pg.width, pg.height);

  // this essentially turns the temporary canvas into binary
  // data that then gets sent (with the id) as an "image" event
  pg.canvas.toBlob(function(blob) {
    let data = {
      id: socket.id,
      bytes: blob,
    };
    socket.emit('image', data);
  }, 'image/png', 0.92);
  
}
