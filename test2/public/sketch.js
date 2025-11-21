// Expanded Web
// NYUSH F25 - gohai
/*
 * ml5.js FaceMesh — extract real mouth image
 */

let faceMesh;
let video;
let faces = [];

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
}

function draw() {
  background(255);

  if (faces.length > 0) {
    let face = faces[0];
    let mouthIndex = [
      61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308, 324, 318, 402, 317
    ];

    drawMouth(mouthIndex, face, 170, 200); 
  }
}

function drawMouth(indexList, face, x, y) {
  
  let xs = [];
  let ys = [];

  for (let i = 0; i < indexList.length; i++) {
    let kp = face.keypoints[indexList[i]];
    xs.push(kp.x);
    ys.push(kp.y);
  }

  let minX = min(xs);
  let maxX = max(xs);
  let minY = min(ys);
  let maxY = max(ys);
  let pad = 10;
  minX -= pad;
  minY -= pad;
  let w = (maxX - minX) + pad * 2;
  let h = (maxY - minY) + pad * 2;
  image(video, x, y, w * 2, h * 2, minX, minY, w, h);
  filter(POSTERIZE, 3); 
}

function gotFaces(results) {
  faces = results;
}
