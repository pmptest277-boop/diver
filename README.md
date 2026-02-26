# Diver (潛水員)

網頁版 2D 橫向潛水遊戲原型，依據需求實作：
- 上 1/3 天空、下 2/3 海洋漸層
- 氧氣系統（海中耗氧、水面回氧、低氧警示）
- 生物權重生成與碰撞效果（加減氧、加減分、減速 Debuff）
- 可替換素材架構：目前先用顏色與簡化圖形，後續可替換 SVG/PNG

## 本機執行

```bash
python3 -m http.server 4173
```

開啟 http://127.0.0.1:4173

## E2E 測試（Playwright-like 模擬）

```bash
npm ci
npm run test:e2e
```

測試涵蓋：
- 低氧警示顯示
- 回到水面後回氧
- 鯊魚命中後扣氧、扣分、減速
- 海中氧氣歸零後 Game Over

## CI/CD

GitHub Actions workflow: `.github/workflows/ci-cd.yml`

- CI：執行 E2E 模擬測試
- CD：建置 `dist/` 並上傳 artifact（可直接部署靜態站）
