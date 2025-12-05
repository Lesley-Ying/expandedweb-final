let socket;
let video;
let faceMesh;
let faces = [];

let options = { maxFaces: 1, refineLandmarks: false, flipHorizontal: false };
let OUT_SIZE = 128;
let mouthGraphics;
let isFocused = false;
let icon;
let gridCount = 1;
let cells = [];
let spitCells = []; 



function preload() {
  faceMesh = ml5.faceMesh(options);
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  mouthGraphics = createGraphics(OUT_SIZE, OUT_SIZE);

  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  faceMesh.detectStart(video, gotFaces);

  socket = io();

  regenerateGrid();
  icon = new SearchIcon(width/2-180, 80, width / 2, height / 2);

  setInterval(sendImage, 100);
}

function draw() {
  background(200);
  drawSearchBar(width/2, 100, 400, 40);
  icon.update();
  icon.display();
  
  //background grids
  for (let c of cells) {
    c.update();
    c.display();
  }

  //mouth
  push();
  rectMode(CENTER);
  fill("pink")
  rect(width/2, height/2, 80, 80)
  pop();

  if (faces.length > 0) {
    //let mouthImg = cropMouth();
    //if (mouthImg) {
   
    image(mouthGraphics, width/2-OUT_SIZE/2, height/2-OUT_SIZE/2);
   
    
   // }
    //mouthImg = null;
  }
  //spit
  for (let i = spitCells.length - 1; i >= 0; i--) {
    let ec = spitCells[i];
    ec.update();
    ec.display();
    if (ec.y > height + ec.h) {
      spitCells.splice(i, 1);
    }
  }
  push();
  rectMode(CENTER)
  drawSearchBar(width/2, 80, 400, 40);
  pop();
  icon.update();
  icon.display();
}


function sendImage() {
  if (faces.length === 0) return;

  //let mouthImg = cropMouth();
  //if (!mouthImg) return;

  mouthGraphics.canvas.toBlob(function(blob) {
    socket.emit('image', {
      id: socket.id,
      bytes: blob,
    });
  }, 'image/png', 0.92);
}


function cropMouth() {
  let face = faces[0];
  if (!face) return null;
  let mouthIndex = [
    61, 146, 91, 181, 84, 17, 314, 405,
    321, 375, 291, 308, 324, 318, 402, 317
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
  let side = max(w, h);

  video.loadPixels();
  mouthGraphics.copy(video, minX, minY, maxX-minX, maxY-minY, 0, 0, OUT_SIZE, OUT_SIZE);
  //mouthGraphics.updatePixels();

  /*
  let fixed = createGraphics(640, 480);
  fixed.image(video, 0, 0, 640, 480);
  pg.image(
    fixed,
    0, 0, OUT_SIZE, OUT_SIZE,
    minX, minY, side, side
  );

  pg.filter(BLUR, 3);
  fixed = null;

  return pg;
  */
}
class Cell {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.offsetX = random(1000);
    this.offsetY = random(1000);
    this.amp = 5;
  }

  update() {
    this.dx = (noise(this.offsetX + frameCount * 0.005) - 0.5) * this.amp;
    this.dy = (noise(this.offsetY + frameCount * 0.005) - 0.5) * this.amp;
  }

  display() {
    stroke(0);
    strokeWeight(0.5)
    fill(255);
    rect(this.x + this.dx, this.y + this.dy, this.w, this.h);
  }
}

class spitCell {
  constructor(x, y, w, h) {
    this.x = width / 2; 
    this.y = height / 2;
    this.w = w;
    this.h = h;
    this.vel = createVector(random(-5, 5), random(-15, -5));
    this.acc = createVector(0, 0.5); 
    this.targetX = x;
    this.targetY = y;
    this.angle = random(TWO_PI);
    this.angleVel = random(-0.05, 0.05);
  }

  update() {
    this.vel.add(this.acc); 
    this.x += this.vel.x;
    this.y += this.vel.y;
    this.angle += this.angleVel;
  }

  display() {
    push();
    translate(this.x, this.y);
    rotate(this.angle);
    
    stroke(0);
    strokeWeight(0.5)
    fill(255); 
    rectMode(CENTER); 
    rect(0, 0, this.w, this.h);
    
    pop();
  }
}

function regenerateGrid() {
  cells = [];
  let cols = gridCount;
  let rows = gridCount;

  let cellW = width / cols;
  let cellH = height / rows;

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      cells.push(new Cell(i * cellW, j * cellH, cellW, cellH));
    }
  }
}
class SearchIcon {
  constructor(x, y, tx, ty) {
    this.x = x;
    this.y = y;
    this.targetX = tx;
    this.targetY = ty;
    this.startX = x-3;
    this.startY = y-3;
    this.baseSize = 18;
    this.size = 18;
    this.angle = 0;
    this.moving = false;
    this.returning = false;
  }

  update() {
    if (this.moving) {
      if (!this.returning) {
        this.x += (this.targetX - this.x) * 0.05;
        this.y += (this.targetY - this.y) * 0.05;
        this.size += 0.4;
      }
      if (this.returning) {
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
  if (mouseX > width/2-200 && mouseX < width/2+200 && mouseY > 80 && mouseY < 100) {
    isFocused = true;
    //icon move
    icon.start();
    socket.emit('searchIconTriggered');
    gridCount *= 2;
    if (gridCount > 128) gridCount = 128;
    regenerateGrid();
  }
  //spit trigger
  let rectX = width / 2;
  let rectY = height / 2;
  let rectSize = 80;
  if (mouseX > rectX - rectSize / 2 && 
      mouseX < rectX + rectSize / 2 && 
      mouseY > rectY - rectSize / 2 && 
      mouseY < rectY + rectSize / 2) {
        socket.emit('spitTriggered');
    if (gridCount > 1) {
      let oldGridCount = gridCount;
      let cellW = width / oldGridCount;
      let cellH = height / oldGridCount;
      gridCount = max(1, gridCount / 2); 
      let newGridCount = gridCount;
      let totalRemovedCellCount = oldGridCount * oldGridCount - newGridCount * newGridCount;
      let minspitRatio = 0.1;
      let maxspitRatio = 0.3;
      let spitRatio = random(minspitRatio, maxspitRatio);
      let actualSpitCount = floor(totalRemovedCellCount * spitRatio);
      for (let i = 0; i < actualSpitCount; i++) {
        spitCells.push(new spitCell(0, 0, cellW, cellH)); 
      }
      regenerateGrid(); 
    }
  }
}

function gotFaces(results) {
  faces = results;
  cropMouth();
}
