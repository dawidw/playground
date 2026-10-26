#!/usr/bin/env node
/**
 * Capture 800×500 preview.png for each agent-commerce entry folder.
 * Requires: local http.server on port 8080, playwright chromium.
 */
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync, unlinkSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const base = process.env.PREVIEW_BASE_URL || "http://localhost:8080/experiments";

async function snap(page, outPath) {
  await page.evaluate(() => {
    if (typeof fit === "function") fit();
  });
  const screen = page.locator("#screen");
  await screen.waitFor({ state: "visible", timeout: 20000 });
  const tmp = outPath.replace(/\.png$/, ".raw.png");
  await screen.screenshot({ path: tmp });
  execFileSync(
    "ffmpeg",
    [
      "-y",
      "-i",
      tmp,
      "-update",
      "1",
      "-frames:v",
      "1",
      "-vf",
      "scale=800:500:force_original_aspect_ratio=decrease,pad=800:500:(ow-iw)/2:(oh-ih)/2:color=0x171D1C",
      outPath,
    ],
    { stdio: "pipe" },
  );
  try {
    unlinkSync(tmp);
  } catch {
    /* ignore */
  }
}

/** Click a suggestion chip by label (avoids composer overlap in mobile layout). */
async function clickOpt(page, pattern) {
  await page.waitForFunction(
    (re) => {
      const buttons = [...document.querySelectorAll(".optpanel .opt-row")];
      const b = buttons.find((el) => new RegExp(re, "i").test(el.textContent || ""));
      if (b) {
        b.click();
        return true;
      }
      return false;
    },
    pattern,
    { timeout: 60000 },
  );
  await page.waitForTimeout(700);
}

const jobs = [
  {
    dir: "agent-commerce-shop",
    url: `${base}/agent-commerce-shop/`,
    async prep(page) {
      await page.waitForSelector("#thread .msg.in", { timeout: 25000 });
      await page.waitForSelector(".optpanel .opt-row", { timeout: 25000 });
      await page.waitForTimeout(1000);
    },
  },
  {
    dir: "agent-commerce-inpost",
    url: `${base}/agent-commerce-inpost/`,
    async prep(page) {
      await page.waitForSelector("#thread .msg", { timeout: 20000 });
      const stickyPush = page.locator("#push.on");
      await stickyPush.waitFor({ state: "visible", timeout: 20000 });
      await stickyPush.click();
      await page.waitForTimeout(800);
      const deadline = Date.now() + 120000;
      while (Date.now() < deadline) {
        const pay = page.locator(".card .pay");
        if (await pay.count() && await pay.first().isVisible()) break;
        const sfgo = page.locator("#sfgo");
        if (await sfgo.count() && await sfgo.isVisible()) {
          await sfgo.click();
          await page.waitForTimeout(2000);
          continue;
        }
        const goEnabled = page.locator(".card.connect .go:not([disabled])");
        if (await goEnabled.count()) {
          await goEnabled.first().click({ timeout: 5000 });
          await page.waitForTimeout(2000);
          continue;
        }
        await page.waitForTimeout(400);
      }
      await page.waitForSelector(".card .pay", { timeout: 10000 });
      await page.waitForTimeout(600);
    },
  },
  {
    dir: "agent-commerce-trusted",
    url: `${base}/agent-commerce-trusted/`,
    async prep(page) {
      await page.waitForSelector(".optpanel .opt-row", { timeout: 25000 });
      await clickOpt(page, "Partner");
      await clickOpt(page, "Yes, that");
      const deadline = Date.now() + 150000;
      while (Date.now() < deadline) {
        if (await page.locator(".card.qty").count()) break;
        const hasBuy = await page.evaluate(() =>
          [...document.querySelectorAll(".optpanel .opt-row")].some((el) => /buy tickets/i.test(el.textContent || "")),
        );
        if (hasBuy) {
          await clickOpt(page, "buy tickets");
          continue;
        }
        await page.waitForTimeout(500);
      }
      await page.waitForSelector(".card.qty", { timeout: 15000 });
      await page.waitForTimeout(600);
    },
  },
  {
    dir: "agent-commerce-returns",
    url: `${base}/agent-commerce-returns/`,
    async prep(page) {
      await page.waitForSelector(".card.orders .ord-list", { timeout: 45000 });
      await page.waitForTimeout(800);
    },
  },
];

const browser = await chromium.launch({ headless: true });
// ≤640px layout: phone fills the viewport (no CSS zoom), so screenshots are reliable in headless.
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});

for (const job of jobs) {
  const page = await context.newPage();
  console.log("Capturing", job.dir, "…");
  await page.goto(job.url, { waitUntil: "networkidle" });
  await job.prep(page);
  const out = path.join(root, "experiments", job.dir, "preview.png");
  mkdirSync(path.dirname(out), { recursive: true });
  await snap(page, out);
  console.log("Wrote", out);
  await page.close();
}

await browser.close();
console.log("Done.");
