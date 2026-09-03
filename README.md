# A Última Manifestação?

Landing page for Amnistia Internacional Portugal's campaign "A Última Manifestação?", built from the [Figma design](https://www.figma.com/design/uG2HZbd7zOldYGwpnWTrq7/Amnistia_Landing).

Static site — no build step, no dependencies.

## Structure

```
index.html
assets/
  css/styles.css
  js/main.js
  images/          hero, protest photo, partner logos
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

- **Fonts**: the design uses two licensed brand fonts (`Minotaur Sans` and `Amnistia 04 Condensed`) that aren't publicly available, so the site currently falls back to close system/Google alternatives. Drop the real `.woff2` files into `assets/fonts/` and add `@font-face` rules in `styles.css` to match exactly.
- **Nav anchors**: "Materiais" and "Notícias" don't have dedicated sections in this single-page design — they currently scroll to the nearest related block. If those become separate pages, update the `href`s in `index.html`.
