# A Última Manifestação?

Landing page for Amnistia Internacional Portugal's campaign "A Última Manifestação?", built from the [Figma design](https://www.figma.com/design/uG2HZbd7zOldYGwpnWTrq7/Amnistia_Landing).

Static site — no build step. One runtime dependency (Lottie, for the
footer animation), vendored locally — see below.

## Structure

```
index.html
assets/
  css/styles.css
  js/main.js
  js/vendor/lottie.min.js   Lottie player (self-hosted, v5.12.2)
  fonts/                    Minotaur Sans Light (woff2)
  images/                   hero, protest photo, header wordmark
  animations/               footer-logo.json (Lottie reveal animation)
```

## Run locally

```
python3 -m http.server 4321
```

Then open http://localhost:4321.

## Deploy to GitHub Pages

1. Push this repo to GitHub.
2. In the repo, go to **Settings → Pages**.
3. Under "Build and deployment", set **Source** to "Deploy from a branch", branch `main`, folder `/ (root)`.
4. Save — the site will be live at `https://<user>.github.io/<repo>/` within a minute or two.

## Known gaps

- **Display font**: body copy uses the real `Minotaur Sans Light` (`assets/fonts/MinotaurSans-Light.woff2`). The header wordmark still falls back to `Barlow Condensed` since it's actually rendered from a vector asset (`logo-wordmark.svg`), not live text, so no font file is needed there.
- **Nav anchors**: "Materiais" and "Notícias" don't have dedicated sections in this single-page design — they currently scroll to the nearest related block. If those become separate pages, update the `href`s in `index.html`.
- **Footer animation size**: `assets/animations/footer-logo.json` is ~4.8MB (frame-by-frame vector data, not reducible without re-exporting from the source tool). It plays forward when scrolled into view and reverses when scrolled out (`assets/js/main.js`), and is skipped in favor of a static final frame when the OS `prefers-reduced-motion` setting is on. Worth revisiting if load time on slow connections becomes a concern.
