export const CONFIG = {
  width: 960,
  height: 540,
  skyRatio: 1 / 3,
  maxOxygen: 10,
  oxygenDrainPerSecond: 0.1,
  oxygenRegenPerSecond: 2,
  warningThreshold: 1,
  baseSpeed: 220,
  spawnIntervalMin: 0.9,
  spawnIntervalMax: 1.3,
  maxEntities: 12,
  debuffDuration: 5,
  entityRadius: 18,
};

export const ENTITY_TABLE = {
  redFish: { weight: 50, oxygen: 0.1, score: 100, color: '#ef4444' },
  blueFish: { weight: 30, oxygen: 0.2, score: 200, color: '#60a5fa' },
  goldFish: { weight: 10, oxygen: 0.5, score: 600, color: '#facc15' },
  turtle: { weight: 3, oxygen: 2, score: 1500, color: '#22c55e' },
  shark: { weight: 3, oxygen: -5, score: -2000, slowMultiplier: 0.5, slowDuration: 5, color: '#94a3b8' },
  octopus: { weight: 4, oxygen: -3, score: -1000, slowMultiplier: 0.8, slowDuration: 5, color: '#a855f7' },
};
