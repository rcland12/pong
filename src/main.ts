const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 600;
const PADDLE_WIDTH = 16;
const PADDLE_HEIGHT = 150;
const PADDLE_MARGIN = 32;
const PADDLE_SPEED = 6;
const AVATAR_GAP = 40;
const BALL_RADIUS = 12;
const SCORE_LIMIT = 20;

type Vector = { x: number; y: number };

const body = document.body;
body.style.margin = "0";
body.style.fontFamily = "Inter, 'Segoe UI', system-ui";
body.style.background = "#060914";
body.style.color = "#f4f4f5";
body.style.minHeight = "100vh";
body.style.display = "flex";
body.style.alignItems = "center";
body.style.justifyContent = "center";
body.style.padding = "24px";

const canvas = document.createElement("canvas");
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
canvas.style.borderRadius = "24px";
canvas.style.boxShadow = "0 30px 70px rgba(4, 15, 40, 0.65)";
canvas.style.background = "#070b18";
const rawCtx = canvas.getContext("2d");
if (!rawCtx) {
  throw new Error("unable to create canvas context");
}
const ctx = rawCtx;

const overlay = document.createElement("div");
overlay.style.position = "absolute";
overlay.style.width = `${CANVAS_WIDTH}px`;
overlay.style.textAlign = "center";
overlay.style.top = "18px";
overlay.style.left = "50%";
overlay.style.transform = "translateX(-50%)";
overlay.style.pointerEvents = "none";
overlay.innerHTML = `
  <div style="font-size: 0.9rem; letter-spacing: 0.2em; opacity: 0.7; text-transform: uppercase;">Professional Pong | W/S + ↑/↓ controls</div>
`;

const scoreboard = document.createElement("div");
scoreboard.style.display = "grid";
scoreboard.style.gridTemplateColumns = "1fr 1fr 1fr";
scoreboard.style.gap = "16px";
scoreboard.style.position = "absolute";
scoreboard.style.top = "80px";
scoreboard.style.left = "50%";
scoreboard.style.transform = "translateX(-50%)";
scoreboard.style.width = `${CANVAS_WIDTH - 160}px`;
scoreboard.style.pointerEvents = "none";
scoreboard.innerHTML = `
  <span style="font-size: 1rem; text-align: left; opacity: 0.75;">Status: <strong id=run-status>Paused</strong></span>
  <span style="font-size: 2rem; font-weight: 600; text-align: center;">0 &mdash; 0</span>
  <span style="font-size: 1rem; text-align: right; opacity: 0.75;">Best of ${SCORE_LIMIT}</span>
`;

const container = document.createElement("div");
container.style.position = "relative";
container.style.width = `${CANVAS_WIDTH}px`;
container.style.maxWidth = "100%";
container.style.display = "inline-block";
container.append(canvas, overlay, scoreboard);

const uiPanel = document.createElement("div");
uiPanel.style.marginTop = "24px";
uiPanel.style.width = `${CANVAS_WIDTH}px`;
uiPanel.style.maxWidth = "100%";
uiPanel.style.display = "flex";
uiPanel.style.justifyContent = "space-between";
uiPanel.style.alignItems = "center";

const playButton = document.createElement("button");
playButton.textContent = "Start";
playButton.style.padding = "10px 24px";
playButton.style.border = "none";
playButton.style.borderRadius = "999px";
playButton.style.fontSize = "1rem";
playButton.style.fontWeight = "600";
playButton.style.color = "#fff";
playButton.style.background = "linear-gradient(135deg, #22e0a1, #3b7feb)";
playButton.style.cursor = "pointer";
playButton.style.boxShadow = "0 10px 20px rgba(26, 89, 255, 0.35)";

const infoBlock = document.createElement("div");
infoBlock.style.flex = "1";
infoBlock.style.marginLeft = "20px";
infoBlock.style.fontSize = "0.9rem";
infoBlock.style.opacity = "0.85";
infoBlock.innerText = "Aim for 20 points. Piezo friends welcome. Refresh to reset the entire experience.";

uiPanel.append(playButton, infoBlock);

body.append(container, uiPanel);

type Paddle = {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  color: string;
};

type Ball = {
  pos: Vector;
  vel: Vector;
  radius: number;
  color: string;
};

const leftPaddle: Paddle = {
  x: PADDLE_MARGIN,
  y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
  width: PADDLE_WIDTH,
  height: PADDLE_HEIGHT,
  speed: PADDLE_SPEED,
  color: "#f9f9ff",
};

const rightPaddle: Paddle = {
  x: CANVAS_WIDTH - PADDLE_WIDTH - PADDLE_MARGIN,
  y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
  width: PADDLE_WIDTH,
  height: PADDLE_HEIGHT,
  speed: PADDLE_SPEED * 0.95,
  color: "#f9f9ff",
};

const ball: Ball = {
  pos: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
  vel: { x: 0, y: 0 },
  radius: BALL_RADIUS,
  color: "#00e0ff",
};

let leftScore = 0;
let rightScore = 0;
let running = false;
let lastTime = 0;
const keyState = { w: false, s: false, ArrowUp: false, ArrowDown: false };

function resetBall(direction: number = Math.random() > 0.5 ? 1 : -1) {
  ball.pos.x = CANVAS_WIDTH / 2;
  ball.pos.y = CANVAS_HEIGHT / 2;
  const angle = (Math.random() * 0.4 + 0.1) * Math.PI;
  ball.vel.x = Math.cos(angle) * 6 * direction;
  ball.vel.y = Math.sin(angle) * (Math.random() * 2 + 3) * (Math.random() > 0.5 ? 1 : -1);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function update(dt: number) {
  if (!running) {
    return;
  }
  const delta = dt * 0.06;

  if (keyState.w) {
    leftPaddle.y -= leftPaddle.speed * delta;
  }
  if (keyState.s) {
    leftPaddle.y += leftPaddle.speed * delta;
  }

  if (keyState.ArrowUp) {
    rightPaddle.y -= rightPaddle.speed * delta;
  }
  if (keyState.ArrowDown) {
    rightPaddle.y += rightPaddle.speed * delta;
  }

  const aiTarget = ball.pos.y - rightPaddle.height / 2;
  const aiSpeed = rightPaddle.speed * 0.5;
  if (!keyState.ArrowUp && !keyState.ArrowDown) {
    if (aiTarget > rightPaddle.y + 8) {
      rightPaddle.y += aiSpeed * delta;
    } else if (aiTarget < rightPaddle.y - 8) {
      rightPaddle.y -= aiSpeed * delta;
    }
  }

  leftPaddle.y = clamp(leftPaddle.y, 0, CANVAS_HEIGHT - leftPaddle.height);
  rightPaddle.y = clamp(rightPaddle.y, 0, CANVAS_HEIGHT - rightPaddle.height);

  ball.pos.x += ball.vel.x * delta;
  ball.pos.y += ball.vel.y * delta;

  if (ball.pos.y - ball.radius < 0 || ball.pos.y + ball.radius > CANVAS_HEIGHT) {
    ball.vel.y *= -1;
    ball.pos.y = clamp(ball.pos.y, ball.radius, CANVAS_HEIGHT - ball.radius);
  }

  const collide = (paddle: Paddle) => {
    return (
      ball.pos.x + ball.radius > paddle.x &&
      ball.pos.x - ball.radius < paddle.x + paddle.width &&
      ball.pos.y + ball.radius > paddle.y &&
      ball.pos.y - ball.radius < paddle.y + paddle.height
    );
  };

  if (collide(leftPaddle) && ball.vel.x < 0) {
    const offset = (ball.pos.y - (leftPaddle.y + leftPaddle.height / 2)) / (leftPaddle.height / 2);
    ball.vel.x *= -1.08;
    ball.vel.y = offset * 6;
  }

  if (collide(rightPaddle) && ball.vel.x > 0) {
    const offset = (ball.pos.y - (rightPaddle.y + rightPaddle.height / 2)) / (rightPaddle.height / 2);
    ball.vel.x *= -1.08;
    ball.vel.y = offset * 6;
  }

  if (ball.pos.x - ball.radius <= 0) {
    rightScore += 1;
    resetBall(1);
  } else if (ball.pos.x + ball.radius >= CANVAS_WIDTH) {
    leftScore += 1;
    resetBall(-1);
  }

  if (leftScore >= SCORE_LIMIT || rightScore >= SCORE_LIMIT) {
    running = false;
    playButton.textContent = "Restart";
    const winner = leftScore >= SCORE_LIMIT ? "Left" : "Right";
    (document.getElementById("run-status") as HTMLElement | null)!.innerHTML = `${winner} player wins`;
  }
}

function draw() {
  const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  gradient.addColorStop(0, "#06091a");
  gradient.addColorStop(1, "#0a132a");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 2;
  ctx.setLineDash([18, 18]);
  ctx.beginPath();
  ctx.moveTo(CANVAS_WIDTH / 2, 0);
  ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
  ctx.stroke();
  ctx.setLineDash([]);

  const glow = ctx.createRadialGradient(
    ball.pos.x,
    ball.pos.y,
    ball.radius / 2,
    ball.pos.x,
    ball.pos.y,
    ball.radius * 4
  );
  glow.addColorStop(0, "rgba(0, 224, 255, 0.8)");
  glow.addColorStop(1, "rgba(0, 224, 255, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(ball.pos.x, ball.pos.y, ball.radius * 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#0f1a2f";
  ctx.fillRect(leftPaddle.x, leftPaddle.y, leftPaddle.width, leftPaddle.height);
  ctx.fillRect(rightPaddle.x, rightPaddle.y, rightPaddle.width, rightPaddle.height);

  ctx.fillStyle = ball.color;
  ctx.beginPath();
  ctx.arc(ball.pos.x, ball.pos.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
  ctx.font = "12px 'Segoe UI', system-ui";
  ctx.fillText("Professional Pong", 20, CANVAS_HEIGHT - 14);

  (scoreboard.children[1] as HTMLElement).innerHTML = `${leftScore} &mdash; ${rightScore}`;
  (document.getElementById("run-status") as HTMLElement | null)!.textContent = running ? "Live" : "Paused";
}

function animate(time: number) {
  const delta = time - lastTime;
  lastTime = time;
  update(delta);
  draw();
  requestAnimationFrame(animate);
}

playButton.addEventListener("click", () => {
  if (!running) {
    running = true;
    if (ball.vel.x === 0 && ball.vel.y === 0) {
      resetBall();
    }
    playButton.textContent = "Pause";
  } else {
    running = false;
    playButton.textContent = "Resume";
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key in keyState) {
    keyState[event.key as keyof typeof keyState] = true;
  }
});

window.addEventListener("keyup", (event) => {
  if (event.key in keyState) {
    keyState[event.key as keyof typeof keyState] = false;
  }
});

resetBall();
requestAnimationFrame((t) => {
  lastTime = t;
  animate(t);
});
