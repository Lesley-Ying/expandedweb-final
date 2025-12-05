// Expanded Web
// NYUSH F25 - gohai
/*
 * ml5.js FaceMesh — extract real mouth image
 */

let faceMesh;
let video;
let faces = [];
let isFocused = false;
let icon;

let options = { maxFaces: 1, refineLandmarks: false, flipHorizontal: false };
let pg;


function preload() {
  faceMesh = ml5.faceMesh(options);
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();
  faceMesh.detectStart(video, gotFaces);

  icon = new SearchIcon(120, 100, width / 2, height / 2);

  pg = createGraphics(200, 200);
}


function draw() {
  background(255);
  drawSearchBar(100, 80, 400, 40);
  icon.update();
  icon.display();
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

  let side = max(w, h);
  let OUT = 200;

  pg.clear(); 
  pg.image(video, 0, 0, OUT, OUT, minX, minY, side, side);
  pg.filter(BLUR, 3);

  image(pg, cx - OUT/2, cy - OUT/2);
}

class SearchIcon {
  constructor(x, y, tx, ty) {
    this.x = x;
    this.y = y;
    this.targetX = tx;
    this.targetY = ty;
    this.startX = x;
    this.startY = y;
    this.baseSize = 18;
    this.size = 18;
    this.angle = 0;
    this.moving = false;
    this.returning = false;
  }

  update() {
    if(this.moving){
    if (!this.returning) {
      this.x += (this.targetX - this.x) * 0.05;
      this.y += (this.targetY - this.y) * 0.05;
      this.size += 0.4;
    }
      if(this.returning){
        this.x += (this.startX - this.x) * 0.05;  
        this.y += (this.startY - this.y) * 0.05;  
        this.size -= 0.6;
        if (this.size <= this.baseSize) {
          this.size = this.baseSize;
          this.moving = false;
          this.returning = false;
        }
      
      }
    
    }
    if (this.size >= 80 && !this.returning) {
      this.returning = true;
    }
  }
  display() {
    noFill();
    stroke(120);
    strokeWeight(3);
    push();
    translate(this.x, this.y);
    ellipse(0, 0, this.size, this.size);
    let r = this.size / 2;
    line(r * 0.7, r * 0.7, r * 1.4, r * 1.4);
    pop();
  }
  start() {
    this.moving = true;
  }
}
function drawSearchBar(x, y, w, h) {
  strokeWeight(2);
  fill(255);
  rect(x, y, w, h, 10);
}

function mousePressed() {
  if (mouseX > 100 && mouseX < 500 && mouseY > 80 && mouseY < 120) {
    isFocused = true;
    icon.start();
  } else {
    isFocused = false;
  }
}
function gotFaces(results) {
  faces = results;
}

