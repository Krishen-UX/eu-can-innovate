// Renders src/og.html to img/og-image.png (1200 x 630), the image shown when the site is shared
// by mail, LinkedIn or messengers. Run after changing src/og.html; the PNG is committed.
// Set CHROMIUM_PATH to use a locally installed Chromium.
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { cpSync, rmSync } from 'node:fs';
import { chromium } from 'playwright';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
// src/fonts.css points at fonts/ next to it; make the fonts reachable from src/ while rendering.
cpSync(join(root, 'fonts'), join(root, 'src', 'fonts'), { recursive: true });

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(join(root, 'src', 'og.html')).href, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: join(root, 'img', 'og-image.png'), type: 'png' });
await browser.close();
rmSync(join(root, 'src', 'fonts'), { recursive: true, force: true });
console.log('Wrote img/og-image.png');
