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
try {
  const page = await browser.newPage({
      viewport: { width: 1200, height: 1200 },
    }),
    errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("http://localhost:5175/tests/content-review.html");
  await page.waitForFunction(() => window.contentReview);
  assert.deepEqual(await page.locator(".panel h2").allTextContents(), [
    "About Me",
    "Interests",
    "Projects",
    "Education",
    "Hobbies",
    "Contact",
  ]);
  assert.match(
    await page.locator(".content-quote").innerText(),
    /I have no special talents\. I am only passionately curious\./,
  );
  assert.match(
    await page.locator(".content-quote figcaption").innerText(),
    /Albert Einstein \(1879–1955\)/,
  );
  assert.deepEqual(
    await page
      .locator('[data-section-id="interests"] .content-topic > span')
      .allTextContents(),
    ["AI", "Energy", "Economics & Finance", "Technology", "Entrepreneurship"],
  );
  assert.deepEqual(
    await page
      .locator('[data-section-id="hobbies"] .content-topic > span')
      .allTextContents(),
    ["Gym", "Bike", "Running"],
  );
  assert.match(
    await page.locator('[data-section-id="education"]').innerText(),
    /Mechanical Engineer/,
  );
  assert.match(
    await page.locator('[data-section-id="education"]').innerText(),
    /Finance Minor/,
  );
  const linkedin = page.getByRole("link", { name: "Connect on LinkedIn" });
  assert.equal(
    await linkedin.getAttribute("href"),
    "https://www.linkedin.com/in/alvaro-javier-pardo-alvarez-a306b63b0/",
  );
  assert.equal(await linkedin.getAttribute("rel"), "noopener noreferrer");
  assert.doesNotMatch(
    await page.locator("main").innerText(),
    /\[Placeholder|Open a little reading room|For the curious/,
  );
  await page.evaluate(() =>
    document.addEventListener("portfolio-navigate", (event) => {
      window.lastRoute = event.detail;
    }),
  );
  await page
    .locator('[data-section-id="projects"]')
    .getByRole("button", { name: "Explore Contact", exact: true })
    .click();
  assert.deepEqual(await page.evaluate(() => window.lastRoute), {
    sectionId: "contact",
    objectId: "phone",
  });
  await page
    .getByText("A note for your learning journey", { exact: true })
    .first()
    .click();
  await page
    .getByRole("textbox", { name: "A note for your learning journey" })
    .fill("A device-local learning note");
  assert.equal(
    await page.evaluate(() => localStorage.getItem("portfolio-note")),
    "A device-local learning note",
  );
  await page.getByRole("button", { name: "Wake the screen" }).click();
  await page.getByRole("button", { name: "You’re connected" }).waitFor();
  const expansion = await page.evaluate(async () => {
    const { createSectionPanel } = await import("/src/section-components.js");
    const entities = {
      example: {
        id: "example",
        type: "project",
        title: "<b>Example</b>",
        description: "An explicit test fixture",
        period: "Test period",
        category: "Test category",
        images: [],
        links: [
          { id: "valid", url: "https://example.com", title: "Valid link" },
          { id: "invalid", url: "javascript:alert(1)", title: "Invalid link" },
        ],
      },
      hidden: {
        id: "hidden",
        type: "project",
        title: "Unpublished fixture",
        visible: false,
      },
    };
    const section = {
      id: "fixture",
      title: "Fixture",
      groups: [
        {
          id: "fixture-group",
          entityIds: ["example", "hidden"],
          layout: "stack",
        },
      ],
    };
    const panel = createSectionPanel(section, { entities, sections: [] });
    return {
      text: panel.textContent,
      markup: panel.querySelector("h4").innerHTML,
      links: panel.querySelectorAll("a").length,
      ids: [...panel.querySelectorAll("[data-entity-id]")].map(
        (n) => n.dataset.entityId,
      ),
    };
  });
  assert.match(expansion.text, /Test period/);
  assert.match(expansion.text, /Test category/);
  assert.equal(expansion.links, 1);
  assert.deepEqual(expansion.ids, ["example"]);
  assert.equal(expansion.markup, "&lt;b&gt;Example&lt;/b&gt;");
  await page.screenshot({
    path: "test-results/content-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
    "No mobile horizontal overflow",
  );
  assert.equal(
    await page
      .locator(".panel-header")
      .first()
      .evaluate((n) => getComputedStyle(n).position),
    "static",
  );
  await page.screenshot({
    path: "test-results/content-mobile.png",
    fullPage: true,
  });
  assert.deepEqual(errors, []);
  console.log(
    "PASS: six sections, supplied content, hidden placeholders, links, related navigation events, local notes, extensible cards and mobile layouts.",
  );
} finally {
  await browser.close();
}
