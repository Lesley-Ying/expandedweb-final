let video;
let faceapi;
let detections = [];
let smoothLeft = { x: 0, y: 0, w: 0, h: 0 };
let smoothRight = { x: 0, y: 0, w: 0, h: 0 };
let smoothing = 0.2;
function setup() {
  createCanvas(800, 600);

  // Webcam
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  // FaceApi options
  const options = {
    withLandmarks: true,
    withDescriptors: false,
    minConfidence: 0.4
  };

  faceapi = ml5.faceApi(video, options, modelReady);
}

function modelReady() {
  console.log("FaceApi model loaded");
  faceapi.detect(gotResults);
}

function gotResults(err, result) {
  if (err) {
    console.error(err);
    return;
  }
  detections = result;
  faceapi.detect(gotResults);
}


function draw() {
  background(20);

  if (detections.length > 0) {
    let parts = detections[0].parts;
    drawEye(parts.leftEye, "left");
    drawEye(parts.rightEye, "right");
  }
}


function drawEye(eyePts, label) {

  // Raw bbox
  let minX = min(eyePts.map(p => p._x));
  let maxX = max(eyePts.map(p => p._x));
  let minY = min(eyePts.map(p => p._y));
  let maxY = max(eyePts.map(p => p._y));

  let w = maxX - minX;
  let h = maxY - minY;

  // Add padding for visual stability
  let pad = 15;
  let bx = minX - pad;
  let by = minY - pad;
  let bw = w + pad * 2;
  let bh = h + pad * 2;

  // Choose left/right smoothing buffer
  let target = label === "left" ? smoothLeft : smoothRight;

  // Smooth the motion (LERP)
  target.x = lerp(target.x, bx, smoothing);
  target.y = lerp(target.y, by, smoothing);
  target.w = lerp(target.w, bw, smoothing);
  target.h = lerp(target.h, bh, smoothing);

  // Position on canvas
  let drawX = label === "left" ? 150 : 450;

  // Draw + Stylize
  push();

  image(
    video,
    drawX, 150,
    target.w * 2, target.h * 2,
    target.x, target.y,
    target.w, target.h
  );

  // 🎨 POSTERIZE effect (板绘风格)
  filter(POSTERIZE, 3);

  pop();
}