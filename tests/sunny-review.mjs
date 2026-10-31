import { chromium } from "@playwright/test";
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
const page = await browser.newPage({ viewport: { width: 1100, height: 760 } });
await page.goto("http://localhost:5175/");
await page.waitForFunction(() => window.portfolio);
await page.waitForTimeout(1500);
await page.screenshot({
  path: "test-results/sunny-world.jpg",
  type: "jpeg",
  quality: 72,
});
await page.setContent(
  '<body style="margin:0;background:#eee"><img src="http://localhost:5175/references/me.png" style="height:740px;width:600px;object-fit:contain"></body>',
);
await page.locator("img").evaluate((img) => img.decode());
await page.screenshot({
  path: "test-results/reference-review.jpg",
  type: "jpeg",
  quality: 75,
  clip: { x: 0, y: 0, width: 600, height: 760 },
});
await browser.close();
