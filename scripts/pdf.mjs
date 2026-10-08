// Renders dist/print.html to pdf/<pdf_file> with headless Chromium (Playwright).
// Run "npm run build" first. Set CHROMIUM_PATH to use a locally installed Chromium.
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import yaml from 'js-yaml';
import { chromium } from 'playwright';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const c = yaml.load(readFileSync(join(root, 'content.yml'), 'utf8'));
const out = join(root, 'pdf', c.meta.pdf_file);
mkdirSync(dirname(out), { recursive: true });

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage();
await page.goto(pathToFileURL(join(root, 'dist', 'print.html')).href, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.emulateMedia({ media: 'print' });
await page.pdf({
  path: out,
  format: 'A4',
  printBackground: true,
  preferCSSPageSize: true,
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
  tagged: true,
});
await browser.close();
console.log(`Wrote pdf/${c.meta.pdf_file}`);
