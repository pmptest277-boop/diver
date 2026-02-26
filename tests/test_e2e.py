from playwright.sync_api import sync_playwright


def test_low_oxygen_warning_and_surface_regen():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto('http://127.0.0.1:4173')
        page.evaluate(
            """
            () => {
              const g = window.__diverGame;
              g.player.y = 350;
              g.oxygen = 1.0;
              g.update({dx:0,dy:0}, 0.1);
              g.render();
            }
            """
        )
        warning = page.locator('#warning').inner_text()
        assert '氧氣低' in warning

        before = float(page.locator('#oxygen').inner_text())
        page.evaluate(
            """
            () => {
              const g = window.__diverGame;
              g.player.y = 20;
              g.update({dx:0,dy:0}, 1);
              g.render();
            }
            """
        )
        after = float(page.locator('#oxygen').inner_text())
        assert after > before
        browser.close()


def test_shark_penalty_and_debuff():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto('http://127.0.0.1:4173')
        state = page.evaluate(
            """
            () => {
              const g = window.__diverGame;
              g.score = 0;
              g.oxygen = 10;
              g.applyEntity('shark');
              return {
                oxygen: g.oxygen,
                score: g.score,
                multiplier: g.debuff.multiplier,
                timeLeft: g.debuff.timeLeft
              };
            }
            """
        )
        assert state['oxygen'] == 5
        assert state['score'] == -2000
        assert state['multiplier'] == 0.5
        assert state['timeLeft'] > 0
        browser.close()
