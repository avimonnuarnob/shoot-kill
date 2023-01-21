import './style.css';
import ravenImage from '/raven.png';
import boomImage from '/boom.png';
import killerSound from '/old_school_skill_sound.mp3';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <canvas id="collisonCanvas"></canvas>
  <canvas id="canvas"></canvas>
`;

const canvas = document.querySelector<HTMLCanvasElement>('#canvas')!;
const ctx = canvas.getContext('2d')!;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const collisonCanvas =
  document.querySelector<HTMLCanvasElement>('#collisonCanvas')!;
const collisonCtx = collisonCanvas.getContext('2d', {
  willReadFrequently: true,
})!;
collisonCanvas.width = window.innerWidth;
collisonCanvas.height = window.innerHeight;

ctx.font = '50px Impact';

let timeToNextRaven = 0;
let ravenInterval = 500;
let lastTime = 0;
let score = 0;
let ravens: Raven[] = [];
let explosions: Explosion[] = [];
let particles: Particle[] = [];
let gg = false;

class Raven {
  width: number;
  height: number;
  x: number;
  y: number;
  directionX: number;
  directionY: number;
  markedForDeletion: boolean;
  image: HTMLImageElement;
  spriteWidth: number;
  spriteHeight: number;
  sizeModifier: number;
  frame: number;
  maxFrame: number;
  timeSinceFlap: number;
  flapInterval: number;
  randomColors: number[];
  color: string;
  hasTrail: boolean;

  constructor() {
    this.spriteWidth = 271;
    this.spriteHeight = 194;
    this.sizeModifier = Math.random() * 0.6 + 0.4;
    this.width = this.spriteWidth * this.sizeModifier;
    this.height = this.spriteHeight * this.sizeModifier;
    this.x = canvas.width;
    this.y = Math.random() * (canvas.height - this.height);
    this.directionX = Math.random() * 5 + 3;
    this.directionY = Math.random() * 5 - 2.5;
    this.markedForDeletion = false;
    this.image = new Image();
    this.image.src = ravenImage;
    this.frame = 0;
    this.maxFrame = 4;
    this.timeSinceFlap = 0;
    this.flapInterval = Math.random() * 50 + 50;
    this.randomColors = [
      Math.floor(Math.random() * 255),
      Math.floor(Math.random() * 255),
      Math.floor(Math.random() * 255),
    ];
    this.color =
      'rgb(' +
      this.randomColors[0] +
      ',' +
      this.randomColors[1] +
      ',' +
      this.randomColors[2] +
      ')';
    this.hasTrail = Math.random() > 0.5;
  }

  update(deltaTime: number) {
    this.x -= this.directionX;
    this.y += this.directionY;
    this.timeSinceFlap += deltaTime;

    if (this.y < 0 || this.y + this.height > canvas.height) {
      this.directionY = this.directionY * -1;
    }

    if (this.x < 0 - this.width) {
      this.markedForDeletion = true;
    }

    if (this.timeSinceFlap > this.flapInterval) {
      if (this.frame > this.maxFrame) this.frame = 0;
      else this.frame++;
      this.timeSinceFlap = 0;
      if (this.hasTrail) {
        particles.push(new Particle(this.x, this.y, this.width, this.color));
      }
    }

    if (this.x < 0 - this.width) gg = true;
  }

  draw() {
    collisonCtx.fillStyle = this.color;
    collisonCtx.fillRect(this.x, this.y, this.width, this.height);
    ctx.drawImage(
      this.image,
      this.frame * this.spriteWidth,
      0,
      this.spriteWidth,
      this.spriteHeight,
      this.x,
      this.y,
      this.width,
      this.height,
    );
  }
}

class Explosion {
  image: HTMLImageElement;
  spriteWidth: number;
  spriteHeight: number;
  size: number;
  x: number;
  y: number;
  audio: HTMLAudioElement;
  frame: number;
  timeSinceLastframe: number;
  frameInterval: number;
  markedForDeletion: boolean;

  constructor(x: number, y: number, size: number) {
    this.image = new Image();
    this.image.src = boomImage;
    this.spriteWidth = 200;
    this.spriteHeight = 179;
    this.x = x;
    this.y = y;
    this.size = size;
    this.frame = 0;
    this.audio = new Audio();
    this.audio.src = killerSound;
    this.timeSinceLastframe = 0;
    this.frameInterval = 100;
    this.markedForDeletion = false;
  }

  update(deltaTime: number) {
    if (this.frame === 0) this.audio.play();
    this.timeSinceLastframe += deltaTime;
    if (this.timeSinceLastframe > this.frameInterval) {
      this.frame++;
      this.timeSinceLastframe = 0;
      if (this.frame > 5) this.markedForDeletion = true;
    }
  }

  draw() {
    ctx.drawImage(
      this.image,
      this.frame * this.spriteWidth,
      0,
      this.spriteWidth,
      this.spriteHeight,
      this.x,
      this.y - this.size / 4,
      this.size,
      this.size,
    );
  }
}

class Particle {
  x: number;
  y: number;
  size: number;
  radius: number;
  maxRadius: number;
  color: string;
  markFordeleteation: boolean;
  speedX: number;

  constructor(x: number, y: number, size: number, color: string) {
    this.size = size;
    this.x = x + this.size / 2;
    this.y = y + this.size / 3;
    this.radius = (Math.random() * this.size) / 10;
    this.maxRadius = Math.random() * 20 + 35;
    this.color = color;
    this.markFordeleteation = false;
    this.speedX = Math.random() * 1 + 0.5;
  }

  update() {
    this.x += this.speedX;
    this.radius += 0.2;
    if (this.radius > this.maxRadius - 5) this.markFordeleteation = true;
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = 1 - this.radius / this.maxRadius;
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawScore() {
  ctx.fillStyle = 'black';
  ctx.fillText('Score: ' + score, 50, 75);
  ctx.fillStyle = 'white';
  ctx.fillText('Score: ' + score, 55, 80);
  ctx.save();
  ctx.font = '1rem Imapact';
  ctx.fillText('🏆 Tap them before they get to the other end!', 50, 110);
  ctx.restore();
}

function gameOver() {
  ctx.textAlign = 'center';
  ctx.fillStyle = 'black';

  ctx.fillText(
    'GG! your score is: ' + score,
    canvas.width / 2,
    canvas.height / 2,
  );

  ctx.fillStyle = 'white';

  ctx.fillText(
    'GG! your score is: ' + score,
    canvas.width / 2 + 5,
    canvas.height / 2 + 5,
  );

  const e = document.createElement('div');
  e.innerHTML = 'Restart';
  e.className = 'game-button red';
  document.body.appendChild(e);

  e.addEventListener('click', () => window.location.reload());
}

window.addEventListener('click', (e) => {
  const detecPixelColor = collisonCtx.getImageData(e.x, e.y, 1, 1);
  const pixelColor = detecPixelColor.data;

  ravens.forEach((object) => {
    if (
      object.randomColors[0] === pixelColor[0] &&
      object.randomColors[1] === pixelColor[1] &&
      object.randomColors[2] === pixelColor[2]
    ) {
      object.markedForDeletion = true;
      score++;
      explosions.push(new Explosion(object.x, object.y, object.width));
    }
  });
});

function animate(timestamp: number) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  collisonCtx.clearRect(0, 0, collisonCanvas.width, collisonCanvas.height);
  let deltaTime = timestamp - lastTime;
  lastTime = timestamp;
  timeToNextRaven += deltaTime;

  if (timeToNextRaven > ravenInterval) {
    ravens.push(new Raven());
    ravens.sort((objA, objB) => objA.width - objB.width);
    timeToNextRaven = 0;
  }
  drawScore();
  [...particles, ...ravens, ...explosions].forEach((object) =>
    object.update(deltaTime),
  );
  [...particles, ...ravens, ...explosions].forEach((object) => object.draw());
  ravens = ravens.filter((object) => !object.markedForDeletion);

  if (!gg) requestAnimationFrame(animate);
  else gameOver();
}
animate(0);
