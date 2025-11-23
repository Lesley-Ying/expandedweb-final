let socket;
let video;
let images = {};
let faceMesh;
let faces = [];
let options = { maxFaces: 1, refineLandmarks: false, flipHorizontal: false };
let OUT_SIZE = 128;

function preload() {
  faceMesh = ml5.faceMesh(options);
}

function setup() {
  createCanvas(windowWidth,windowHeight);

  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  faceMesh.detectStart(video, gotFaces);

  socket = io();

  socket.on('image', function(data) {
    let blob = new Blob([data.bytes], { type: 'image/png' });
    objectUrl = URL.createObjectURL(blob);
    loadImage(objectUrl, function(image) {
      images[data.id] = {
        img: image,
        lastSeen: millis(),
      };
    });
  });

  setInterval(sendImage, 100);
}

function draw() {
  background(204);
  let x = 0;
  let y = 0;
  let maxHeight = 0;
  for (let id in images) {
    if (millis() - images[id].lastSeen > 3000) {
      delete images[id];
    } else {
      if (x + OUT_SIZE > width) {
        y += OUT_SIZE;
        x = 0;
      }
      image(images[id].img, x, y, OUT_SIZE, OUT_SIZE);
      x += OUT_SIZE;
    }
  }
}


function sendImage() {
  if (faces.length === 0) return;

  let mouthImg = cropMouth(); 
  if (!mouthImg) return;

  mouthImg.canvas.toBlob(function(blob) {
    let data = {
      id: socket.id,
      bytes: blob,
    };
    socket.emit('image', data);
  }, 'image/png', 0.92);
}

function cropMouth() {
  let face = faces[0];
  if (!face) return null;
  let mouthIndex = [
    61, 146, 91, 181, 84, 17, 314, 405,
    321, 375, 291, 308, 324, 318, 402, 317
  ];

  let xs = [], ys = [];

  for (let i = 0; i < mouthIndex.length; i++) {
    let kp = face.keypoints[mouthIndex[i]];
    xs.push(kp.x);
    ys.push(kp.y);
  }

  let minX = min(xs) - 10;
  let maxX = max(xs) + 10;
  let minY = min(ys) - 10;
  let maxY = max(ys) + 10;

  let w = maxX - minX;
  let h = maxY - minY;
  let side = max(w, h);
  let pg = createGraphics(OUT_SIZE, OUT_SIZE);
  filter(BLUR,3);

  // 1. 先把手机的视频强制缩放到统一比例（这里用电脑 640x480）
let fixed = createGraphics(640, 480);
fixed.image(video, 0, 0, 640, 480);

// 2. 用固定比例的 fixed 来裁嘴巴
pg.image(
  fixed,
  0, 0, OUT_SIZE, OUT_SIZE,
  minX, minY, side, side
);

  pg.filter(BLUR,3);

  return pg;
  filter(BLUR, 3); 
}

function gotFaces(results) {
  faces = results;
}
