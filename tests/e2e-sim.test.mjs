import test from 'node:test';
import assert from 'node:assert/strict';
import { DiverGame } from '../src/game.js';
import { CONFIG } from '../src/config.js';

function makeGame() {
  const canvas = { getContext: () => ({
    clearRect() {}, beginPath() {}, ellipse() {}, fill() {}, fillRect() {}, arc() {}, stroke() {}, fillText() {},
    set fillStyle(v) {}, set strokeStyle(v) {}, set lineWidth(v) {}, set font(v) {}, set textAlign(v) {},
  })};
  const hud = { score: { textContent: '' }, oxygen: { textContent: '' }, warning: { textContent: '' } };
  return new DiverGame(canvas, hud, () => 0.1);
}

test('低氧警示與回氧邏輯', () => {
  const game = makeGame();
  game.player.y = 360;
  game.oxygen = 1;
  game.update({ dx: 0, dy: 0 }, 0.1);
  game.render();
  assert.match(game.lastWarning, /氧氣低/);

  const before = game.oxygen;
  game.player.y = 10;
  game.update({ dx: 0, dy: 0 }, 1);
  assert.ok(game.oxygen > before);
});

test('鯊魚效果與 debuff', () => {
  const game = makeGame();
  game.applyEntity('shark');
  assert.equal(game.oxygen, 5);
  assert.equal(game.score, -2000);
  assert.equal(game.debuff.multiplier, 0.5);
  assert.ok(game.debuff.timeLeft > 0);
});

test('海中氧氣歸零 game over', () => {
  const game = makeGame();
  game.player.y = 360;
  game.oxygen = 0.01;
  game.update({ dx: 0, dy: 0 }, 1);
  assert.equal(game.state, 'gameover');
});

test('主角僅能上下移動，左右輸入不生效', () => {
  const game = makeGame();
  const originalX = game.player.x;
  const originalY = game.player.y;

  game.update({ dx: 1, dy: -1 }, 1);

  assert.equal(game.player.x, originalX);
  assert.equal(game.player.y, originalY - CONFIG.baseSpeed);
});

test('鯊魚與章魚速度加倍並帶有模糊追蹤', () => {
  const game = makeGame();
  game.player.y = 420;

  game.rng = () => 0.99;
  game.spawnEntity();
  let predator = game.entities.at(-1);
  while (predator && predator.kind !== 'shark' && predator.kind !== 'octopus') {
    game.spawnEntity();
    predator = game.entities.at(-1);
  }

  assert.ok(predator, 'expected a predator to be spawned');
  assert.ok(predator.speed >= 120 && predator.speed <= 280);

  const initialY = predator.y;
  game.update({ dx: 0, dy: 0 }, 0.5);
  assert.notEqual(predator.y, initialY);
});
