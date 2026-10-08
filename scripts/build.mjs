// Builds the website and the print version from content.yml into dist/.
//   dist/index.html   the website
//   dist/legal.html   legal notice and privacy policy
//   dist/print.html   the eight-page A4 concept note (rendered to PDF by scripts/pdf.mjs)
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');
const c = yaml.load(read('content.yml'));

// ---------- helpers ----------
const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// Plain text with [link](url) support and line breaks.
const inline = (s) => esc(s)
  .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|mailto:[^)\s]+)\)/g, '<a href="$2">$1</a>')
  .replace(/\n/g, '<br>');
// Pick the web or print variant of a field.
const pick = (x, mode) => (x && typeof x === 'object' && !Array.isArray(x) && ('web' in x || 'print' in x))
  ? (x[mode] ?? x.web ?? x.print) : x;
const W = (x) => inline(pick(x, 'web'));
const P = (x) => inline(pick(x, 'print'));
// Headlines: one line per row in print, flowing text on the web.
const lines = (x, mode) => String(pick(x, mode)).split('\n').map((l) => l.trim()).filter(Boolean);
const headWeb = (x) => lines(x, 'web').map(esc).join(' ');
const headPrint = (x) => lines(x, 'print').map(esc).join('<br>');
const pad = (n) => String(n).padStart(2, '0');
const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const mark = (cls = 'mark', href = '#top') =>
  `<a class="${cls}" href="${href}"><span class="eu">EU</span> <span class="ca">CAN</span> Innovate</a>`;
const name = esc(c.meta.name);
const pdfHref = esc(c.meta.pdf_file);
const linkedinText = esc(c.contact.linkedin.replace(/^https?:\/\/(www\.)?/, ''));

const fontsCss = read('src/fonts.css');
const siteCss = read('src/site.css');
const siteJs = read('src/site.js');
const printCss = read('src/print.css');

// ---------- shared web chrome ----------
const navItems = [
  ['vision', c.vision.tab], ['tracks', 'Tracks'], ['format', c.format.tab],
  ['method', c.method.tab], ['timeline', c.timeline.tab], ['partners', pick(c.partners.tab, 'web')],
];
const header = (base = '') => `<header class="site-head">
  <div class="wrap">
    ${mark('mark', base ? base : '#top')}
    <nav class="nav mono" aria-label="Sections">
${navItems.map(([id, label]) => `      <a href="${base}#${id}">${esc(label)}</a>`).join('\n')}
    </nav>
    <a class="btn" href="${base}#contact">${esc(c.nav.cta)}</a>
  </div>
</header>`;
const footer = `<footer class="wrap mono">
  <span><span style="color: var(--eu)">EU</span> <span style="color: var(--ca)">CAN</span> Innovate · ${esc(c.meta.footer_note)}</span>
  <span>${esc(c.meta.disclaimer)}</span>
  <span class="legal-links"><a href="${pdfHref}">Concept note (PDF)</a><a href="legal.html">${esc(c.legal.link_label)}</a></span>
</footer>`;
const doc = ({ title, description, robots, css, body }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
${description ? `<meta name="description" content="${esc(description)}">\n` : ''}${robots ? `<meta name="robots" content="${robots}">\n` : ''}<title>${title}</title>
<style>
${css}
</style>
</head>
<body>
${body}
</body>
</html>
`;
const secTop = (label, n) =>
  `<div class="sec-top mono"><span>${esc(label)}</span><span>${name}</span><span>${pad(n)}</span></div>`;

// ---------- website ----------
const v = c.vision, t = c.tracks, f = c.format, m = c.method, tl = c.timeline, p = c.partners, a = c.about;
const siteBody = `${header()}

<main id="top">
  <section class="hero wrap" aria-labelledby="title">
    <div class="hero-meta mono"><span>${esc(c.cover.kicker_left)}</span><span>${esc(c.cover.kicker_right)}</span><span>${esc(c.meta.date_short)}</span></div>
    <h1 id="title"><span class="eu">EU</span> <span class="ca">CAN</span><br>Innovate</h1>
    <div class="hero-intro">
      <div class="sub">${esc(c.meta.subtitle)}</div>
      <div>
        <p>${W(c.cover.intro)}</p>
        <div class="ctas">
          <a class="btn solid" href="#contact">${esc(c.cover.cta_primary)}</a>
          <a class="btn" href="#tracks">${esc(c.cover.cta_secondary)}</a>
          <a class="btn" href="${pdfHref}" download>${esc(c.meta.pdf_label)}</a>
        </div>
      </div>
    </div>
  </section>

  <div class="bleed">
    <div class="comp comp-hero">
      <img class="subject" src="img/cover-hands.png" alt="${esc(c.cover.image_alt)}" width="1536" height="688">
      <div class="field f-ca" aria-hidden="true"></div>
      <div class="field f-eu" aria-hidden="true"></div>
      <dl class="hubs mono">
${c.cover.hubs.map((h) => `        <dt>${esc(h.label)}</dt><dd>${esc(h.cities)}</dd>`).join('\n')}
      </dl>
    </div>
  </div>

  <section id="vision" class="wrap" aria-labelledby="vision-h">
    ${secTop(v.tab, 1)}
    <div class="sec-head">
      <span class="mono">Section 01</span>
      <h2 id="vision-h">${headWeb(v.title)}</h2>
    </div>
    <div class="cols-2">
      <div class="spacer"></div>
      <div class="text-2">
        <div>
${v.left.map((x, i) => `          <p${i === 0 ? ' class="dropcap"' : ''}>${W(x)}</p>`).join('\n')}
        </div>
        <div>
${v.right.map((x) => `          <p>${W(x)}</p>`).join('\n')}
        </div>
      </div>
    </div>
    <div class="quote-row">
      <div class="label"><div class="bar"></div><span class="mono">${esc(v.quote_label)}</span></div>
      <div class="quote"><blockquote>${W(v.quote)}</blockquote></div>
    </div>
  </section>

  <section id="tracks" class="wrap" aria-labelledby="tracks-h">
    ${secTop(t.tab, 2)}
    <div class="sec-head">
      <span class="mono">Section 02</span>
      <div>
        <h2 id="tracks-h">${headWeb(t.title)}</h2>
        <p class="lede">${W(t.lede)}</p>
      </div>
    </div>
    <div class="rule-2"></div>
    <div class="tracks">
${t.items.map((x, i) => `      <article class="track">
        <span class="mono">${esc(x.code)}</span>
        <h3>${esc(x.title)}</h3>
        <div class="hr"></div>
        <p>${W(x.text)}</p>
        <div class="shot"><img src="${esc(x.image)}" alt="${esc(x.image_alt)}"><div class="field ${i % 2 ? 'f-eu' : 'f-ca'}" aria-hidden="true"></div></div>
      </article>`).join('\n')}
    </div>
  </section>

  <section id="format" class="wrap" aria-labelledby="format-h">
    ${secTop(f.tab, 3)}
    <div class="sec-head">
      <span class="mono">Section 03</span>
      <h2 id="format-h">${headWeb(f.title)}</h2>
    </div>
    <div class="format-grid">
      <div class="spacer"></div>
      <div class="facts">
${f.facts.map((x) => `        <div class="fact"><span class="mono">${esc(x.label)}</span><p>${W(x.text)}</p></div>`).join('\n')}
      </div>
    </div>
    <div class="room-head"><h3>${esc(f.room_title)}</h3><div class="line"></div></div>
    <div class="room">
${f.room.map((x, i) => `      <div><span class="mono">${pad(i + 1)}</span><strong>${esc(x.title)}</strong><span class="d">${W(x.text)}</span></div>`).join('\n')}
    </div>
    <div class="badge-comp">
      <div class="bar"></div>
      <img src="img/format-badge-crop.png" alt="${esc(f.image_alt)}" width="730" height="732">
      <div class="field f-eu" aria-hidden="true"></div>
    </div>
  </section>

  <section id="method" class="wrap" aria-labelledby="method-h">
    ${secTop(m.tab, 4)}
    <div class="sec-head">
      <span class="mono">Section 04</span>
      <div>
        <h2 id="method-h">${headWeb(m.title)}</h2>
        <p class="lede">${W(m.lede)}</p>
      </div>
    </div>
    <div class="rule-2"></div>
    <div class="reqs">
${m.requirements.map((x, i) => `      <div class="req"><span class="num" style="color: var(--${['eu', 'ink', 'ca'][i % 3]})">${pad(i + 1)}</span><h3>${esc(x.title)}</h3><p>${W(x.text)}</p></div>`).join('\n')}
    </div>
    <div class="aim"><span class="mono">${esc(m.aim_label)}</span><p>${W(m.aim)}</p></div>
    <div class="flow-cap mono">${esc(m.flow_label)}</div>
    <div class="flow">
${m.days.map((x, i) => `      <div class="day d${(i % 3) + 1}"><span class="mono soft">${esc(x.label)}</span><div><h3>${esc(x.title)}</h3><p class="soft">${W(x.text)}</p></div></div>`).join('\n')}
    </div>
  </section>

  <section id="timeline" class="wrap" aria-labelledby="timeline-h">
    ${secTop(tl.tab, 5)}
    <div class="sec-head">
      <span class="mono">Section 05</span>
      <h2 id="timeline-h">${headWeb(tl.title)}</h2>
    </div>
    <ol class="phases" style="list-style: none; padding: 0; margin-bottom: 0;">
${tl.phases.map((x, i) => `      <li class="phase"><span class="num">${pad(i + 1)}</span><span class="when">${esc(x.when)}</span><div><strong>${esc(x.title)}</strong><p>${W(x.text)}</p></div></li>`).join('\n')}
    </ol>
    <div class="note-row"><div class="bar eu"></div><p>${W(tl.note)}</p></div>
  </section>

  <section id="partners" class="wrap" aria-labelledby="partners-h">
    ${secTop(pick(p.tab, 'web'), 6)}
    <div class="sec-head">
      <span class="mono">Section 06</span>
      <div>
        <h2 id="partners-h">${headWeb(p.title)}</h2>
        <p class="lede">${W(p.lede)}</p>
      </div>
    </div>
    <div class="cats">
${p.categories.map((x, i) => `      <div class="cat"><span class="mono">${letters[i]}</span><p>${W(x)}</p></div>`).join('\n')}
    </div>
    <div class="questions">
      <div class="qh"><h3>${esc(p.questions_title)}</h3><div class="line"></div></div>
      <ol class="qs">
${p.questions.map((x, i) => `        <li><span class="mono">${pad(i + 1)}</span><span>${W(x)}</span></li>`).join('\n')}
      </ol>
    </div>
  </section>

  <section id="contact" class="contact" aria-labelledby="contact-h" style="padding-bottom: 0;">
    <div class="wrap">${secTop(a.tab, 7)}</div>
    <div class="bleed">
      <div class="comp comp-contact">
        <img class="subject" src="img/contact-cable.png" alt="${esc(a.image_alt)}" width="1536" height="467">
        <div class="field f-eu" aria-hidden="true"></div>
        <div class="field f-ca" aria-hidden="true"></div>
      </div>
    </div>
    <div class="wrap">
      <h2 id="contact-h">${lines(a.title, 'web').map((l, i, arr) => i === arr.length - 1 ? `<span class="ca">${esc(l)}</span>` : esc(l)).join('<br>')}</h2>
      <div class="about">
        <div><span class="mono">${esc(a.initiator_label)}</span><p>${W(a.initiator)}</p></div>
        <div><span class="mono">${esc(pick(a.status_label, 'web'))}</span><p>${W(a.status)}</p><p style="margin-top: 14px"><a href="${pdfHref}" download>${esc(c.meta.pdf_label)}</a></p></div>
      </div>
      <div class="card">
        <div><span class="mono">Initiator</span><div class="name">${esc(c.contact.name)}</div><div class="val" style="color: var(--ink-3)">${esc(c.contact.location)}</div></div>
        <div><span class="mono">Email</span><div class="val" id="email">${esc(c.contact.email)}</div><button class="btn copy" id="copy-email" type="button">${esc(a.copy_button)}</button></div>
        <div><span class="mono">LinkedIn</span><div class="val"><a href="${esc(c.contact.linkedin)}">${linkedinText}</a></div></div>
      </div>
    </div>
  </section>

</main>

${footer}

<script>
${siteJs.replace("'Copy address'", JSON.stringify(a.copy_button))}</script>`;

// ---------- legal page ----------
const L = c.legal;
const legalBody = `${header('index.html')}
<main>
  <section id="legal" class="legal wrap" style="padding-top: clamp(40px, 6vw, 72px)" aria-labelledby="legal-h">
    <div class="sec-top mono"><span>${esc(L.page_title)}</span><span>${name}</span><span><a href="index.html" style="color: inherit">${esc(L.back_label)}</a></span></div>
    <h1 id="legal-h" style="font-weight: 200; font-size: clamp(40px, 6vw, 72px); line-height: 1; letter-spacing: -0.04em; margin-top: clamp(32px, 5vw, 56px)">${esc(L.page_title)}</h1>
    <div class="legal-grid">
${L.columns.map((col) => `      <div id="${esc(col.id)}">
        <h2>${esc(col.title)}</h2>
${col.blocks.map((b) => `        <h3>${esc(b.heading)}</h3>\n${(b.paragraphs ?? [b.text]).map((x) => `        <p>${inline(x)}</p>`).join('\n')}`).join('\n')}
      </div>`).join('\n')}
    </div>
  </section>
</main>

${footer}`;

// ---------- print version ----------
const top = (label, n, thick = false) => `<div class="top"><div class="rule${thick ? ' thick' : ''}"></div><div class="meta mono"><div>${esc(label)}</div><div>${n === 1 ? esc(c.cover.kicker_right) : name}</div><div>${pad(n)}</div></div></div>`;
const head = (sec, title, lede, extra = '') => `<div class="head"><div class="mono">Section ${pad(sec)}</div>${lede
  ? `<div class="stack"><h2 class="h2">${headPrint(title)}</h2><p class="lede"${extra}>${P(lede)}</p></div>`
  : `<h2 class="h2">${headPrint(title)}</h2>`}</div>`;
const firstLetter = (s) => {
  const txt = String(pick(s, 'print'));
  return `<span class="dropcap">${esc(txt[0])}</span>${inline(txt.slice(1))}`;
};
const trackLeft = [-14, 166.5, 333, 499.5];

const printBody = `
<section class="page full cover">
  ${top(c.cover.kicker_left, 1, true)}
  <div style="display: flex; flex-direction: column; gap: 32px">
    <div class="cover-comp">
      <img src="img/cover-hands.png" alt="${esc(c.cover.image_alt)}">
      <div class="field f-ca"></div>
      <div class="field f-eu"></div>
      <dl class="hubs">
${c.cover.hubs.map((h) => `        <dt>${esc(h.label)}</dt><dd>${esc(h.cities)}</dd>`).join('\n')}
      </dl>
    </div>
    <h1 class="cover-title"><span><span class="eu">EU</span> <span class="ca">CAN</span></span><span>Innovate</span></h1>
    <div class="subtitle"><div class="bar"></div><div>${esc(c.meta.subtitle)}</div></div>
  </div>
  <div class="colophon">
    <div class="rule"></div>
    <div class="cols">
      <div><div class="mono">${esc(c.cover.prepared_by_label)}</div><div style="font-weight: 600">${esc(c.contact.name)}</div><div>${esc(c.contact.city)}</div></div>
      <div><div class="mono">${esc(c.cover.status_label)}</div><div>${P(c.cover.status)}</div></div>
      <div><div class="mono">${esc(c.cover.date_label)}</div><div>${esc(c.meta.date)}</div></div>
    </div>
  </div>
</section>

<section class="page" style="gap: 36px">
  ${top(v.tab, 2)}
  ${head(1, v.title)}
  <div class="text-2">
    <div>${v.left.map((x, i) => `<p>${i === 0 ? firstLetter(x) : P(x)}</p>`).join('')}</div>
    <div>${v.right.map((x) => `<p>${P(x)}</p>`).join('')}</div>
  </div>
  <div class="quote-row">
    <div class="label"><div class="bar"></div><div class="mono">${esc(v.quote_label)}</div></div>
    <div class="quote"><blockquote>${P(v.quote)}</blockquote></div>
  </div>
</section>

<section class="page">
  ${top(t.tab, 3)}
  ${head(2, t.title, t.lede)}
  <div class="rule-2"></div>
  <div class="cols-4">
${t.items.map((x) => `    <div class="track"><div class="mono">${esc(x.code)}</div><h3>${esc(x.title)}</h3><div class="hr"></div><p>${P(x.text)}</p></div>`).join('\n')}
  </div>
  <div class="shots">
${t.items.map((x, i) => `    <div class="shot" style="left: ${trackLeft[i] ?? i * 166.5}px"><img src="${esc(x.image)}" alt="${esc(x.image_alt)}"><div class="field ${i % 2 ? 'f-eu' : 'f-ca'}"></div></div>`).join('\n')}
  </div>
</section>

<section class="page">
  ${top(f.tab, 4)}
  ${head(3, f.title)}
  <div class="facts-row"><div></div><div class="facts">
${f.facts.map((x) => `    <div class="fact"><div class="mono">${esc(x.label)}</div><div>${P(x.text)}</div></div>`).join('\n')}
  </div></div>
  <div class="room">
    <div class="line-head"><h3>${esc(f.room_title)}</h3><div class="line"></div></div>
    <div class="cols-3">
${f.room.map((x, i) => `      <div class="who"><div class="num">${pad(i + 1)}</div><strong>${esc(x.title)}</strong><span>${P(x.text)}</span></div>`).join('\n')}
    </div>
  </div>
  <div class="badge">
    <div class="bar"></div>
    <img src="img/format-badge-crop.png" alt="${esc(f.image_alt)}">
    <div class="field f-eu"></div>
  </div>
</section>

<section class="page">
  ${top(m.tab, 5)}
  ${head(4, m.title, m.lede, ' style="max-width: 460px"')}
  <div class="rule-2"></div>
  <div class="cols-3">
${m.requirements.map((x, i) => `    <div class="req"><div class="num">${pad(i + 1)}</div><h3>${esc(x.title)}</h3><p>${P(x.text)}</p></div>`).join('\n')}
  </div>
  <div class="rule-1"></div>
  <div class="aim"><div class="mono">${esc(m.aim_label)}</div><p>${P(m.aim)}</p></div>
  <div class="flow">
    <div class="mono">${esc(m.flow_label)}</div>
    <div class="days">
${m.days.map((x, i) => `      <div class="day d${(i % 3) + 1}"><div class="mono soft">${esc(x.label)}</div><div><h3>${esc(x.title)}</h3><p class="soft">${P(x.text)}</p></div></div>`).join('\n')}
    </div>
  </div>
</section>

<section class="page">
  ${top(tl.tab, 6)}
  ${head(5, tl.title)}
  <div class="phases">
${tl.phases.map((x, i) => `    <div class="phase"><div class="num">${pad(i + 1)}</div><div class="when">${esc(x.when)}</div><div class="what"><strong>${esc(x.title)}</strong><p>${P(x.text)}</p></div></div>`).join('\n')}
  </div>
  <div class="note"><div class="bar"></div><p>${P(tl.note)}</p></div>
</section>

<section class="page partners">
  ${top(pick(p.tab, 'print'), 7)}
  ${head(6, p.title, p.lede)}
  <div class="cats">
${p.categories.map((x, i) => `    <div class="cat"><div class="mono">${letters[i]}</div><div>${P(x)}</div></div>`).join('\n')}
  </div>
  <div class="questions">
    <div class="bar"></div>
    <div class="box">
      <div class="line-head"><h3>${esc(p.questions_title)}</h3><div class="line"></div></div>
      <div class="qs">
${p.questions.map((x, i) => `        <div><span class="n">${pad(i + 1)}</span><span>${P(x)}</span></div>`).join('\n')}
      </div>
    </div>
  </div>
</section>

<section class="page full contact">
  ${top(a.tab, 8, true)}
  <div class="contact-main">
    <div class="contact-comp">
      <img src="img/contact-cable.png" alt="${esc(a.image_alt)}">
      <div class="field f-eu"></div>
      <div class="field f-ca"></div>
    </div>
    <h2 class="contact-title">${lines(a.title, 'print').map((l) => `<span>${esc(l)}</span>`).join('')}</h2>
    <div class="about">
      <div><div class="mono">${esc(a.initiator_label)}</div><p>${P(a.initiator)}</p></div>
      <div><div class="mono">${esc(pick(a.status_label, 'print'))}</div><p>${P(a.status)}</p></div>
    </div>
  </div>
  <div class="card">
    <div class="bar"></div>
    <div class="cols">
      <div><div class="name">${esc(c.contact.name)}</div><div class="loc">${esc(c.contact.location)}</div></div>
      <div class="item"><div class="mono">LinkedIn</div><a href="${esc(c.contact.linkedin)}">${linkedinText}</a></div>
      <div class="item"><div class="mono">Email</div><div class="v">${esc(c.contact.email)}</div></div>
    </div>
  </div>
</section>
`;

// ---------- write ----------
const dist = join(root, 'dist');
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
cpSync(join(root, 'img'), join(dist, 'img'), { recursive: true });
cpSync(join(root, 'fonts'), join(dist, 'fonts'), { recursive: true });
const pdfSrc = join(root, 'pdf', c.meta.pdf_file);
if (existsSync(pdfSrc)) cpSync(pdfSrc, join(dist, c.meta.pdf_file));
else console.warn(`Note: ${c.meta.pdf_file} not found in pdf/ yet. Run "npm run pdf" or let the GitHub Action create it.`);

writeFileSync(join(dist, 'index.html'), doc({
  title: name, description: c.meta.description, css: fontsCss + '\n' + siteCss, body: siteBody,
}));
writeFileSync(join(dist, 'legal.html'), doc({
  title: `${name}, Legal`, robots: 'noindex', css: fontsCss + '\n' + siteCss, body: legalBody,
}));
writeFileSync(join(dist, 'print.html'), doc({
  title: `${name}, Concept Note`, robots: 'noindex', css: fontsCss + '\n' + printCss, body: printBody,
}));
console.log('Built dist/index.html, dist/legal.html, dist/print.html');
