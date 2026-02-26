import { test, expect } from '@playwright/test';

test('低氧會出現警示，回到水面可回氧', async ({ page }) => {
  await page.goto('/');

  await page.evaluate(() => {
    const g = window.__diverGame;
    g.player.y = 350; // in water
    g.oxygen = 1.0;
    g.update({ dx: 0, dy: 0 }, 0.1);
    g.render();
  });

  await expect(page.locator('#warning')).toContainText('氧氣低');

  const before = await page.locator('#oxygen').innerText();
  await page.evaluate(() => {
    const g = window.__diverGame;
    g.player.y = 20; // surface/sky
    g.update({ dx: 0, dy: 0 }, 1.0);
    g.render();
  });
  const after = await page.locator('#oxygen').innerText();
  expect(Number(after)).toBeGreaterThan(Number(before));
});

test('碰到鯊魚會扣氧扣分並觸發減速', async ({ page }) => {
  await page.goto('/');

  const state = await page.evaluate(() => {
    const g = window.__diverGame;
    g.score = 0;
    g.oxygen = 10;
    g.applyEntity('shark');
    g.render();
    return {
      oxygen: g.oxygen,
      score: g.score,
      debuff: g.debuff.multiplier,
      timeLeft: g.debuff.timeLeft,
    };
  });

  expect(state.oxygen).toBe(5);
  expect(state.score).toBe(-2000);
  expect(state.debuff).toBe(0.5);
  expect(state.timeLeft).toBeGreaterThan(0);
});

test('海中氧氣歸零會結束遊戲', async ({ page }) => {
  await page.goto('/');
  const status = await page.evaluate(() => {
    const g = window.__diverGame;
    g.player.y = 400;
    g.oxygen = 0.01;
    g.update({ dx: 0, dy: 0 }, 1);
    g.render();
    return g.state;
  });
  expect(status).toBe('gameover');
});
