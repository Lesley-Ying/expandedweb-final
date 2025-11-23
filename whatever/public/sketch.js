let faceMesh;
let video;
let faces = [];
let socket;

// 存所有用户嘴的图
let mouths = {}; 
// mouths[id] = base64 image

let options = { maxFaces: 1, refineLandmarks: false, flipHorizontal: false };

function preload() {
  faceMesh = ml5.faceMesh(options);
}

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  faceMesh.detectStart(video, gotFaces);

  socket = io();
  socket.on("mouth", receiveMouth);
  socket.on("remove", removeUser);
}

function draw() {
  background(255);

  // 1️⃣ 自己的嘴 → 本地显示
  if (faces.length > 0) {
    let img64 = extractMouth();
    if (img64) {
      socket.emit("mouth", { id: socket.id, img: img64 });
      mouths[socket.id] = img64;
    }
  }

  // 2️⃣ 显示所有用户的嘴
  let x = 20, y = 20;
  for (let id in mouths) {
    showMouthImage(mouths[id], x, y);
    x += 120;
    if (x > width - 120) {
      x = 20;
      y += 120;
    }
  }
}

// =============================================
// 接收其他人的嘴图
// =============================================
function receiveMouth(data) {
  mouths[data.id] = data.img;
}

function removeUser(id) {
  delete mouths[id];
}

// =============================================
// 提取嘴 → 返回 base64 image
// =============================================
function extractMouth() {
  let face = faces[0];
  if (!face) return null;

  let mouthIndex = [
    61, 146, 91, 181, 84, 17, 314, 405, 321, 375,
    291, 308, 324, 318, 402, 317
  ];

  let xs = [];
  let ys = [];

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

  // ---- crop 到 graphics（离屏） ----
  let g = createGraphics(w, h);
  g.image(video, -minX, -minY);

  return g.elt.toDataURL("image/png");
}

// =============================================
// 显示别人嘴部的图
// =============================================
function showMouthImage(base64, x, y) {
  let img = createImg(base64, "");
  img.hide();
  image(img, x, y, 100, 100);
}

function gotFaces(results) {
  faces = results;
}
