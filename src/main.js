import { DiverGame } from './game.js';

const canvas = document.getElementById('gameCanvas');
const hud = {
  score: document.getElementById('score'),
  oxygen: document.getElementById('oxygen'),
  warning: document.getElementById('warning'),
};

const game = new DiverGame(canvas, hud);
window.__diverGame = game;

const keys = new Set();
window.addEventListener('keydown', (e) => {
  keys.add(e.key.toLowerCase());
  if (e.key.toLowerCase() === 'r') game.reset();
});
window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));

function inputVector() {
  const left = keys.has('a') || keys.has('arrowleft');
  const right = keys.has('d') || keys.has('arrowright');
  const up = keys.has('w') || keys.has('arrowup');
  const down = keys.has('s') || keys.has('arrowdown');
  return {
    dx: (right ? 1 : 0) - (left ? 1 : 0),
    dy: (down ? 1 : 0) - (up ? 1 : 0),
  };
}

let last = performance.now();
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  game.update(inputVector(), dt);
  game.render();
  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);
