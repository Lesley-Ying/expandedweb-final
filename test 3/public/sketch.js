/************************************************************
 * Combined ml5 FaceMesh + socket.io — send only mouth image
 ************************************************************/

let faceMesh;
let faces = [];

let socket;
let video;
let images = {};
let mouthCanvas;
let mouthBox = null;

let options = { 
  maxFaces: 1, 
  refineLandmarks: false, 
  flipHorizontal: false 
};

function preload() {
  faceMesh = ml5.faceMesh(options);
}

function setup() {
  createCanvas(640, 640);

  // === video ===
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  // facemesh 开始识别
  faceMesh.detectStart(video, gotFaces);

  // 用来裁切嘴巴的小画布
  mouthCanvas = createGraphics(80, 40);

  // === socket ===
  socket = io();

  socket.on('image', function(data) {
    // 修复: 直接使用 ArrayBuffer 创建 Blob
    let blob = new Blob([data.bytes], { type: 'image/jpeg' });
    let objectUrl = URL.createObjectURL(blob);

    loadImage(objectUrl, function(image) {
      images[data.id] = {
        img: image,
        lastSeen: millis(),
      };
      // 释放旧的 URL
      URL.revokeObjectURL(objectUrl);
    });
  });

  // 控制发送频率（10fps）
  setInterval(sendImage, 100);
}

function draw() {
  background(220);

  // ==== 1. 先画自己的嘴巴（左上角）====
  if (mouthBox && mouthCanvas) {
    // 实时更新自己的嘴巴到 mouthCanvas
    mouthCanvas.copy(
      video,
      mouthBox.x, mouthBox.y, mouthBox.w, mouthBox.h,
      0, 0, mouthCanvas.width, mouthCanvas.height
    );
    
    // 画自己的嘴巴
    image(mouthCanvas, 10, 10);
    
    // 标注
    fill(255, 0, 0);
    noStroke();
    text('You', 10, mouthCanvas.height + 25);
  }

  // ==== 2. 画来自其他用户的嘴巴 ====
  let x = 100; // 从右边开始,给自己留空间
  let y = 10;
  let maxHeight = 0;

  for (let id in images) {
    // 清理超时的图像
    if (millis() - images[id].lastSeen > 3000) {
      delete images[id];
      continue;
    }

    // 换行逻辑
    if (x + images[id].img.width > width) {
      y += maxHeight + 10;
      x = 10;
      maxHeight = 0;
    }

    image(images[id].img, x, y);
    
    // 标注用户 ID
    fill(0, 0, 255);
    noStroke();
    textSize(10);
    text(id.substring(0, 4), x, y + images[id].img.height + 12);
    
    x += images[id].img.width + 10;

    if (images[id].img.height > maxHeight) {
      maxHeight = images[id].img.height;
    }
  }

  // ==== debug：显示检测框 ====
  if (mouthBox) {
    noFill();
    stroke(255, 0, 0);
    strokeWeight(2);
    // 在 video 坐标系中画框(需要知道 video 在哪)
    // 这里简化:在主 canvas 上显示检测信息
    text(`Mouth detected: ${int(mouthBox.w)}x${int(mouthBox.h)}`, 10, height - 10);
  }
}

/************************************************************
 * 识别嘴巴位置
 ************************************************************/
function gotFaces(results) {
  faces = results;

  if (faces.length > 0) {
    let face = faces[0];

    // 关键嘴巴 landmark index
    let indexList = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291];

    let xs = [], ys = [];
    for (let i = 0; i < indexList.length; i++) {
      let kp = face.keypoints[indexList[i]];
      xs.push(kp.x);
      ys.push(kp.y);
    }

    let pad = 10;
    let minX = min(xs) - pad;
    let minY = min(ys) - pad;
    let w = (max(xs) - min(xs)) + pad * 2;
    let h = (max(ys) - min(ys)) + pad * 2;

    mouthBox = { x: minX, y: minY, w: w, h: h };
  } else {
    mouthBox = null;
  }
}

/************************************************************
 * 只发送嘴巴图像
 ************************************************************/
function sendImage() {
  if (!mouthBox) return;

  // 裁切嘴巴并缩放
  mouthCanvas.copy(
    video,
    mouthBox.x, mouthBox.y, mouthBox.w, mouthBox.h,
    0, 0, mouthCanvas.width, mouthCanvas.height
  );

  // 压缩成 JPEG
  mouthCanvas.canvas.toBlob(function(blob) {
    // 修复: 使用 FileReader 转成 ArrayBuffer
    let reader = new FileReader();
    reader.onload = function() {
      socket.emit("image", {
        id: socket.id,
        bytes: reader.result  // ArrayBuffer
      });
    };
    reader.readAsArrayBuffer(blob);
  }, 'image/jpeg', 0.6);
}