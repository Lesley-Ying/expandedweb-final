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
  createCanvas(windowWidth,windowHeight);
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

    drawMouth(mouthIndex, face, width/2, height/2); 
  }
}

// function drawMouth(indexList, face, x, y) {
  
//   let xs = [];
//   let ys = [];

//   for (let i = 0; i < indexList.length; i++) {
//     let kp = face.keypoints[indexList[i]];
//     xs.push(kp.x);
//     ys.push(kp.y);
//   }

//   let minX = min(xs);
//   let maxX = max(xs);
//   let minY = min(ys);
//   let maxY = max(ys);
//   let pad = 10;
//   minX -= pad;
//   minY -= pad;
//   let w = (maxX - minX) + pad * 2;
//   let h = (maxY - minY) + pad * 2;
//   image(video, x, y, w * 2, h * 2, minX, minY, w, h);
//   filter(BLUR, 3); 
// }
function drawMouth(indexList, face, cx, cy) {

  // -------- 1. 计算嘴巴 bounding box --------
  let xs = [], ys = [];

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
  let w = (maxX - minX) + pad * 2;
  let h = (maxY - minY) + pad * 2;

  // -------- 2. 固定输出为正方形 (200x200) --------
  let OUT = 200;
  let side = max(w, h);  // 从原视频取出的区域大小

  // -------- 3. 保证嘴巴中心对齐正方形中心 --------
  let pg = createGraphics(OUT, OUT);

  pg.image(
    video,
    0, 0, OUT, OUT,        // 目标：固定 200×200
    minX, minY, side, side // 来源区域：随嘴巴大小变化，但输出是固定大小
  );

  pg.filter(BLUR, 3);

  // -------- 4. 绘制在屏幕正中心（cx, cy 为中心点） --------
  image(pg, cx - OUT/2, cy - OUT/2);
}

function gotFaces(results) {
  faces = results;
}
