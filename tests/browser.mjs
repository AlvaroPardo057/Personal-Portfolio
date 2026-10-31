import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  headless: true,
  ...(process.platform === "win32"
    ? {
        executablePath:
          "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      }
    : {}),
  args: ["--no-sandbox", "--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.setDefaultTimeout(20000);
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(
  process.argv[2] || process.env.PORTFOLIO_URL || "http://localhost:5175",
);
await page.waitForFunction(() => window.portfolio);
assert.deepEqual(
  (await page.locator(".landmark-label strong").allTextContents()).map((text) =>
    text.replace(/\s*↗\s*$/, ""),
  ),
  ["About Me", "Interests", "Projects", "Education", "Hobbies", "Contact"],
);
assert.equal(
  await page
    .locator('.panel [data-entity-id="project-details-placeholder"]')
    .count(),
  0,
);
await page.screenshot({ path: "test-results/desktop.png" });
await page.locator("#explore").click();
await page.waitForTimeout(1200);
const before = await page.evaluate(() => window.portfolio.getState().player);
await page.keyboard.down("w");
await page.waitForFunction(
  (z) => window.portfolio.getState().player[2] < z - 0.6,
  before[2],
);
await page.keyboard.up("w");
const after = await page.evaluate(() => window.portfolio.getState().player);
assert.ok(after[2] < before[2] - 0.5, "W moves the player forward");
await page.locator("#help").click();
await page.locator("#reset").click();
await page.waitForTimeout(300);
await page.locator(".chat input").fill("show me energy");
const typingBefore = await page.evaluate(
  () => window.portfolio.getState().player,
);
await page.keyboard.type(" wasd");
assert.deepEqual(
  (await page.evaluate(() => window.portfolio.getState().player)).filter(
    (_, i) => i !== 1,
  ),
  typingBefore.filter((_, i) => i !== 1),
  "Typing cannot move the player",
);
await page.locator(".chat button").click();
await page.waitForTimeout(1500);
assert.ok(
  await page.evaluate(() => window.portfolio.getState().speaking),
  "Guide animates the reply",
);
assert.ok(
  await page.locator(".bubble").isVisible(),
  "Distant speaking guide has a speech bubble",
);
await page.screenshot({ path: "test-results/exploring.png" });
await page.locator("#help").click();
await page.locator("#reset").click();
await page.keyboard.down("w");
await page.waitForFunction(
  () => window.portfolio.getState().activePanels.includes("power-plant"),
  {},
  { timeout: 60000 },
);
await page.keyboard.up("w");
await page.waitForTimeout(400);
assert.ok(
  (
    await page.evaluate(() => window.portfolio.getState().activePanels)
  ).includes("power-plant"),
  "Approaching a structure reveals its panel",
);
await page.screenshot({ path: "test-results/panel.png" });
const interests = page.locator('[data-landmark-id="power-plant"]');
await interests
  .getByRole("button", { name: "Explore Projects", exact: true })
  .click();
assert.ok(
  await page.evaluate(() => window.portfolio.getState().destination),
  "Related content leads the guide to another station",
);
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(600);
assert.ok(
  await page.locator("#joystick").isVisible(),
  "Mobile movement control exists",
);
await page.screenshot({ path: "test-results/mobile.png" });
const stick = await page.locator("#joystick").boundingBox();
console.log("Checking joystick");
const mobileX = await page.evaluate(
  () => window.portfolio.getState().player[0],
);
await page.mouse.move(stick.x + 50, stick.y + 50);
await page.mouse.down();
await page.mouse.move(stick.x + 80, stick.y + 50);
await page.waitForFunction(
  (x) => window.portfolio.getState().player[0] > x + 0.5,
  mobileX,
);
await page.mouse.up();
await page.setViewportSize({ width: 1440, height: 1000 });
console.log("Checking phone approach");
await page.locator("#help").click();
await page.locator("#reset").click();
await page.keyboard.down("s");
await page.waitForFunction(() => window.portfolio.getState().player[2] > 5.5);
await page.keyboard.up("s");
await page.keyboard.down("a");
await page.waitForFunction(
  () => window.portfolio.getState().activePanels.includes("phone"),
  {},
  { timeout: 60000 },
);
await page.keyboard.up("a");
await page.mouse.move(1000, 800);
await page.mouse.down();
await page.mouse.move(700, 800, { steps: 10 });
await page.mouse.up();
const front = page.locator('[data-landmark-id="phone"][data-side="front"]');
console.log("Checking phone HTML button");
try {
  await front.getByRole("button", { name: "Wake the screen" }).click();
} catch (error) {
  await page.screenshot({ path: "test-results/contact-click-failure.png" });
  console.log(
    await front
      .getByRole("button", { name: "Wake the screen" })
      .evaluate((button) => {
        const r = button.getBoundingClientRect(),
          panel = button.closest(".panel");
        return {
          rect: { x: r.x, y: r.y, width: r.width, height: r.height },
          panel: {
            pointerEvents: panel.style.pointerEvents,
            visibility: panel.style.visibility,
            inert: panel.inert,
          },
          hit: document
            .elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)
            ?.outerHTML.slice(0, 300),
        };
      }),
  );
  throw error;
}
assert.match(
  await front.innerText(),
  /You’re connected/,
  "HTML button works in the 3D panel",
);
await page.screenshot({ path: "test-results/phone.png" });
await page.mouse.move(1100, 800);
await page.mouse.down();
await page.mouse.move(550, 800, { steps: 10 });
await page.mouse.up();
await page.waitForTimeout(1000);
assert.equal(
  await page.locator('[data-landmark-id="phone"][data-side="back"]').count(),
  0,
  "Rear panels are removed",
);
await page.screenshot({ path: "test-results/secret.png" });
assert.deepEqual(errors, [], "No runtime exceptions");
console.log(
  "PASS: rendering, keyboard movement, typing isolation, guide speech, proximity panels, mobile joystick, native HTML controls, no rear panels; no runtime exceptions.",
);
await browser.close();
