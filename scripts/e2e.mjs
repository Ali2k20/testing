/**
 * End-to-end check of the buying path against a running build.
 *
 *   npm run build && npm start        # in one terminal
 *   npm run test:e2e                  # in another
 *
 * Set E2E_BASE_URL to point at a different origin, and CHROMIUM_PATH if your
 * Chromium lives somewhere Playwright cannot find on its own. Pass a directory
 * as the first argument to also write screenshots of each step.
 */
import { chromium } from "playwright";

const base = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const out = process.argv[2] ?? null;
const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
);
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(`console: ${m.text()}`);
});

const step = async (label, fn) => {
  await fn();
  console.log("✓", label);
};

await step("open PDP", async () => {
  await page.goto(`${base}/product/noor-open-abaya`, { waitUntil: "networkidle" });
});

await step("add to bag without size shows error", async () => {
  await page.getByRole("button", { name: /Add to bag/ }).first().click();
  await page.waitForTimeout(300);
  const msg = await page.getByText("Choose a size to continue.").isVisible();
  if (!msg) throw new Error("size validation did not fire");
});

await step("pick colour + size, add to bag opens drawer", async () => {
  await page.getByRole("button", { name: "Camel" }).click();
  await page.getByRole("button", { name: "54", exact: true }).click();
  await page.getByRole("button", { name: /Add to bag/ }).first().click();
  await page.waitForTimeout(700);
  await page.getByRole("dialog", { name: "Shopping bag" }).waitFor({ state: "visible" });
});
if (out) await page.screenshot({ path: `${out}/flow-1-drawer.png` });

await step("free-shipping meter is present", async () => {
  const text = await page.getByRole("dialog", { name: "Shopping bag" }).innerText();
  if (!/Free UAE delivery unlocked/.test(text)) throw new Error(`meter wrong: ${text.slice(0, 200)}`);
});

await step("add a second product", async () => {
  await page.keyboard.press("Escape");
  await page.goto(`${base}/product/silk-sheila`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Add to bag/ }).first().click();
  await page.waitForTimeout(600);
});
if (out) await page.screenshot({ path: `${out}/flow-2-sheila.png`, clip: { x: 0, y: 120, width: 900, height: 880 } });

await step("cart page shows both lines", async () => {
  await page.keyboard.press("Escape");
  await page.goto(`${base}/cart`, { waitUntil: "networkidle" });
  const rows = await page.locator("main ul > li").count();
  if (rows < 2) throw new Error(`expected 2+ cart lines, got ${rows}`);
});
if (out) await page.screenshot({ path: `${out}/flow-3-cart.png`, fullPage: false });

await step("quantity stepper updates the total", async () => {
  const before = await page.locator("aside").innerText();
  await page.getByRole("button", { name: "Increase quantity" }).first().click();
  await page.waitForTimeout(400);
  const after = await page.locator("aside").innerText();
  if (before === after) throw new Error("total did not change after quantity increase");
});

await step("checkout: fill and apply promo", async () => {
  await page.getByRole("link", { name: /Proceed to checkout/ }).click();
  await page.waitForURL("**/checkout");
  await page.getByLabel("Email").fill("mariam@example.ae");
  await page.getByLabel("First name").fill("Mariam");
  await page.getByLabel("Last name").fill("Al Hosani");
  await page.getByLabel("Mobile number").fill("+971 50 123 4567");
  await page.getByLabel("Building, street").fill("Villa 12, Street 4a");
  await page.getByLabel("Area").fill("Jumeirah 1");
  await page.getByLabel("Emirate").selectOption("Sharjah");
  await page.getByLabel("Discount code").fill("FRS50");
  await page.getByRole("button", { name: "Apply" }).click();
  await page.waitForTimeout(300);
  const summary = await page.locator("aside").innerText();
  if (!/FRS50 applied/.test(summary)) throw new Error("promo not applied");
  if (!/Cash-on-delivery fee/.test(summary)) throw new Error("COD fee missing (COD is default)");
});
if (out) await page.screenshot({ path: `${out}/flow-4-checkout.png`, fullPage: true });

await step("place order lands on confirmation with receipt", async () => {
  await page.getByRole("button", { name: /Place order/ }).click();
  await page.waitForURL("**/order-confirmed**");
  await page.waitForTimeout(700);
  const body = await page.locator("main").innerText();
  if (!/FRS-/.test(body)) throw new Error("no order reference");
  if (!/Shukran, Mariam/.test(body)) throw new Error("customer name missing");
  if (!/Sharjah/.test(body)) throw new Error("delivery emirate missing");
});
if (out) await page.screenshot({ path: `${out}/flow-5-confirmed.png`, fullPage: true });

await step("cart is empty after ordering", async () => {
  await page.goto(`${base}/cart`, { waitUntil: "networkidle" });
  const body = await page.locator("main").innerText();
  if (!/Your bag is empty/.test(body)) throw new Error("cart not cleared");
});

await step("cart persists across reload", async () => {
  await page.goto(`${base}/product/amal-everyday-abaya`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "54", exact: true }).click();
  await page.getByRole("button", { name: /Add to bag/ }).first().click();
  await page.waitForTimeout(500);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  const badge = await page.getByRole("button", { name: /Open cart, 1 items/ }).count();
  if (badge === 0) throw new Error("cart did not persist across reload");
});

await step("wishlist toggles and persists", async () => {
  await page.getByRole("button", { name: "Save to wishlist" }).first().click();
  await page.waitForTimeout(300);
  await page.goto(`${base}/wishlist`, { waitUntil: "networkidle" });
  const body = await page.locator("main").innerText();
  if (/Nothing saved yet/.test(body)) throw new Error("wishlist did not persist");
});

await step("shop filters narrow results and update the URL", async () => {
  await page.goto(`${base}/shop`, { waitUntil: "networkidle" });
  const all = await page.locator("main article").count();
  await page.getByRole("button", { name: "Mukhawar", exact: true }).first().click();
  await page.waitForTimeout(600);
  const filtered = await page.locator("main article").count();
  if (filtered >= all || filtered === 0) throw new Error(`filter failed: ${all} -> ${filtered}`);
  if (!page.url().includes("category=mukhawar")) throw new Error(`url not updated: ${page.url()}`);
});

await step("search finds a product", async () => {
  await page.getByRole("button", { name: "Open search" }).click();
  await page.getByRole("textbox", { name: "Search products" }).fill("talli");
  await page.waitForTimeout(400);
  const hit = await page.getByRole("link", { name: /Talli Heritage Mukhawar/ }).count();
  if (hit === 0) throw new Error("search returned nothing for 'talli'");
});

await browser.close();

if (errors.length) {
  console.error(`\nBrowser errors:\n${errors.join("\n")}`);
  process.exit(1);
}
console.log("\nAll checks passed with no browser errors.");
