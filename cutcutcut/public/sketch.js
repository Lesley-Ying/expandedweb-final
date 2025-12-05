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
let img1;
let img2;

function preload(){
  img1=loadImage("frame.PNG");
  img2=loadImage("frame2.PNG")
}
function setup() {
  createCanvas(windowWidth, windowHeight);
 
  socket = io();

 
}

function draw() {
  clear()
  image(img1,width/2-175,height/2-100,350,200)
}

