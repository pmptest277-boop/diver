import { CONFIG, ENTITY_TABLE } from './config.js';

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

function isPredator(kind) {
  return kind === 'shark' || kind === 'octopus';
}

function weightedPick(rng = Math.random) {
  const entries = Object.entries(ENTITY_TABLE);
  const total = entries.reduce((s, [, e]) => s + e.weight, 0);
  let roll = rng() * total;
  for (const [kind, data] of entries) {
    roll -= data.weight;
    if (roll <= 0) return kind;
  }
  return entries[0][0];
}

export class DiverGame {
  constructor(canvas, hud, rng = Math.random) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.hud = hud;
    this.rng = rng;
    this.reset();
  }

  reset() {
    this.score = 0;
    this.oxygen = CONFIG.maxOxygen;
    this.state = 'playing';
    this.player = { x: CONFIG.width * 0.25, y: CONFIG.height * 0.5, r: 14 };
    this.entities = [];
    this.debuff = { multiplier: 1, timeLeft: 0 };
    this.spawnTimer = 0;
    this.spawnEvery = this.randomSpawnInterval();
    this.lastWarning = '';
  }

  randomSpawnInterval() {
    return CONFIG.spawnIntervalMin + this.rng() * (CONFIG.spawnIntervalMax - CONFIG.spawnIntervalMin);
  }

  get waterline() { return CONFIG.height * CONFIG.skyRatio; }
  get inWater() { return this.player.y + this.player.r > this.waterline; }

  applyEntity(kind) {
    const e = ENTITY_TABLE[kind];
    this.oxygen = clamp(this.oxygen + e.oxygen, 0, CONFIG.maxOxygen);
    this.score += e.score;
    if (e.slowMultiplier) {
      this.debuff.multiplier = Math.min(this.debuff.multiplier, e.slowMultiplier);
      this.debuff.timeLeft = Math.max(this.debuff.timeLeft, e.slowDuration ?? CONFIG.debuffDuration);
    }
  }

  spawnEntity() {
    if (this.entities.length >= CONFIG.maxEntities) return;
    const kind = weightedPick(this.rng);
    const rightToLeft = this.rng() > 0.5;
    const y = this.waterline + 24 + this.rng() * (CONFIG.height - this.waterline - 90);
    const baseSpeed = 60 + this.rng() * 80;
    const speed = isPredator(kind) ? baseSpeed * CONFIG.predatorSpeedMultiplier : baseSpeed;
    this.entities.push({
      kind,
      x: rightToLeft ? CONFIG.width + 30 : -30,
      y,
      r: CONFIG.entityRadius,
      speed,
      vx: rightToLeft ? -speed : speed,
      vy: 0,
      color: ENTITY_TABLE[kind].color,
    });
  }

  update(input, dt) {
    if (this.state !== 'playing') return;

    if (this.debuff.timeLeft > 0) {
      this.debuff.timeLeft -= dt;
      if (this.debuff.timeLeft <= 0) this.debuff.multiplier = 1;
    }

    const speed = CONFIG.baseSpeed * this.debuff.multiplier;
    this.player.x = clamp(this.player.x, this.player.r, CONFIG.width - this.player.r);
    this.player.y = clamp(this.player.y + input.dy * speed * dt, this.player.r, CONFIG.height - this.player.r);

    if (this.inWater) {
      this.oxygen -= CONFIG.oxygenDrainPerSecond * dt;
      if (this.oxygen <= 0) {
        this.oxygen = 0;
        this.state = 'gameover';
      }
    } else {
      this.oxygen = clamp(this.oxygen + CONFIG.oxygenRegenPerSecond * dt, 0, CONFIG.maxOxygen);
    }

    this.spawnTimer += dt;
    if (this.spawnTimer >= this.spawnEvery) {
      this.spawnTimer = 0;
      this.spawnEvery = this.randomSpawnInterval();
      this.spawnEntity();
    }

    for (const e of this.entities) {
      if (isPredator(e.kind)) {
        const wobble = (this.rng() - 0.5) * CONFIG.predatorTrackingWobble;
        const targetY = this.player.y + wobble;
        const deltaY = targetY - e.y;
        const desiredVy = Math.sign(deltaY) * Math.min(Math.abs(deltaY) * 2, e.speed * 0.65);
        e.vy += (desiredVy - e.vy) * CONFIG.predatorTrackingStrength * dt;
        e.vy = clamp(e.vy, -e.speed * 0.75, e.speed * 0.75);
      }

      e.x += e.vx * dt;
      e.y = clamp(e.y + (e.vy ?? 0) * dt, this.waterline + 12, CONFIG.height - 60);
    }
    this.entities = this.entities.filter((e) => e.x > -50 && e.x < CONFIG.width + 50);

    for (let i = this.entities.length - 1; i >= 0; i--) {
      const e = this.entities[i];
      const d = Math.hypot(this.player.x - e.x, this.player.y - e.y);
      if (d < this.player.r + e.r) {
        this.applyEntity(e.kind);
        this.entities.splice(i, 1);
      }
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, CONFIG.width, CONFIG.height);

    // clouds
    ctx.fillStyle = '#ffffff66';
    ctx.beginPath(); ctx.ellipse(170, 70, 45, 20, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(680, 95, 60, 24, 0, 0, Math.PI * 2); ctx.fill();

    // seabed and obstacles
    ctx.fillStyle = '#9a7b4f';
    ctx.fillRect(0, CONFIG.height - 48, CONFIG.width, 48);
    ctx.fillStyle = '#1faa59';
    for (let x = 30; x < CONFIG.width; x += 70) ctx.fillRect(x, CONFIG.height - 82, 8, 34);
    ctx.fillStyle = '#ff7f50';
    ctx.fillRect(450, CONFIG.height - 90, 75, 42);

    for (const e of this.entities) {
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.ellipse(e.x, e.y, e.r + 5, e.r, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = this.state === 'gameover' ? '#ef4444' : '#e2e8f0';
    ctx.beginPath();
    ctx.arc(this.player.x, this.player.y, this.player.r, 0, Math.PI * 2);
    ctx.fill();

    if (this.debuff.multiplier < 1) {
      ctx.strokeStyle = this.debuff.multiplier <= 0.5 ? '#ef4444' : '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.player.x, this.player.y, this.player.r + 7, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (this.state === 'gameover') {
      ctx.fillStyle = '#000000aa';
      ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 42px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', CONFIG.width / 2, CONFIG.height / 2);
    }

    this.updateHud();
  }

  updateHud() {
    this.hud.score.textContent = String(this.score);
    this.hud.oxygen.textContent = this.oxygen.toFixed(1);
    const warning = this.oxygen <= CONFIG.warningThreshold ? '⚠ 氧氣低！請盡快浮出水面' : '';
    this.hud.warning.textContent = warning;
    this.lastWarning = warning;
  }
}
