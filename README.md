# A Última Manifestação?

Landing page for Amnistia Internacional Portugal's campaign "A Última Manifestação?", built from the [Figma design](https://www.figma.com/design/uG2HZbd7zOldYGwpnWTrq7/Amnistia_Landing).

Static site — no build step, no dependencies.

## Structure

```
index.html
assets/
  css/styles.css
  js/main.js
  fonts/           Minotaur Sans Light (woff2)
  images/          hero, protest photo, footer wordmark
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

- **Display font**: body copy uses the real `Minotaur Sans Light` (`assets/fonts/MinotaurSans-Light.woff2`). The header/footer wordmark still falls back to `Barlow Condensed` since it's actually rendered from a vector asset (`footer-wordmark.svg` / `logo-wordmark.svg`), not live text, so no font file is needed there.
- **Nav anchors**: "Materiais" and "Notícias" don't have dedicated sections in this single-page design — they currently scroll to the nearest related block. If those become separate pages, update the `href`s in `index.html`.
