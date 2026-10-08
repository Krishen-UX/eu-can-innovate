# EU CAN Innovate

Website and printable concept note for the EU-Canada Digital Bridge Hackathon, an independent initiative at concept stage. Live at [eucaninnovate.eu](https://www.eucaninnovate.eu).

## Editing content

All texts live in **`content.yml`**: the website, the legal page and the eight-page A4 concept note.

1. Open `content.yml` on GitHub, click the pencil icon, change the text.
2. Click **Commit changes** (directly to `main`).
3. Vercel rebuilds the website (about a minute).
4. The GitHub Action **Update concept note PDF** renders a new PDF and commits it to `pdf/`. Vercel then deploys again, so the download on the website matches the text (about three minutes in total).

Where web and print use different wording, a field has `web:` and `print:` variants. The PDF pages have a fixed A4 size, so after a much longer text, check the PDF (or `/print.html` on the live site).

## Structure

| Path | Purpose |
|---|---|
| `content.yml` | All texts |
| `src/site.css`, `src/site.js` | Website layout and motion |
| `src/print.css` | A4 print layout |
| `src/fonts.css`, `fonts/` | Self-hosted typefaces (Manrope, IBM Plex Sans, IBM Plex Mono; SIL Open Font License) |
| `img/` | Cut-out motifs |
| `scripts/build.mjs` | Builds `dist/index.html`, `dist/legal.html`, `dist/print.html` |
| `scripts/pdf.mjs` | Renders `dist/print.html` to `pdf/EU-CAN-Innovate-Concept-Note.pdf` |
| `pdf/` | The current PDF (written by the GitHub Action) |

## Local use

```sh
npm ci
npm run build                          # site into dist/
npx playwright install chromium        # once
npm run pdf                            # site + PDF
```

Deployments always go through GitHub: push to `main`, Vercel builds from there (`vercel.json`).
