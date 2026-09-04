# A Última Manifestação?

Site for Amnistia Internacional Portugal's campaign "A Última Manifestação?", built from the [Figma design](https://www.figma.com/design/uG2HZbd7zOldYGwpnWTrq7/Amnistia_Landing). Two pages: the single-page home and "A Campanha".

Static site — no build step, no dependencies.

## Structure

```
index.html           home (single page)
campanha.html        "A Campanha"
assets/
  css/styles.css
  js/main.js         nav toggle, countdown
  js/animations.js   scroll reveal for the big paragraphs
  fonts/             Minotaur Sans Light + Bold (woff2)
  images/            hero, protest photos, wordmarks, countdown bg
```

Both pages share one stylesheet and one header/footer, duplicated as markup
since there is no build step. Adding a nav item means editing both files.

## Layout

Content sits on a 6-column grid (`repeat(6, minmax(0, 1fr))`, `--col-gap`,
`padding-inline: var(--gutter)`), exact at the 1728px design width and fluid
below it. `minmax(0, 1fr)` rather than `1fr` matters: the split heading lines
are `white-space: nowrap`, and an `auto` track floor would let their
min-content width force the tracks wider than the container.

Measures that stop part-way through a column are derived from the item's own
width, never viewport units. An item spanning S columns is `S*x + (S-1)g`
wide, so 2.5-of-3 columns is `(2.5/3)W + g/3` (`.campaign__measure`) and
4.5-of-5 is `0.9W + 0.4g` (`.campaign__lead`).

## Type scale

`--fs-big` 70px, `--fs-lead` 44px, `--fs-medium` 40px, `--fs-body` 25px
(default running text), `--fs-small` 20px (nav, and `.campaign__notes` for
the smallest asides).

## Heading animation

`assets/js/animations.js` splits `.statement__heading` and `.rights__title`
into lines and characters and reveals them. Default is a scroll scrub, so
scrolling back up rewinds it. Two opt-ins:

- `data-reveal="autoplay"` — plays once at its own pace when first visible
  and never rewinds.
- `data-reveal-from="center"` — no horizontal slide, so the letter-spacing
  collapses inward from both sides. For centred headings.

Pacing lives in the constants at the top of the file.

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
- **Nav anchors**: "As causas que defendemos", "Participe", "Materiais" and "Notícias" have no dedicated pages — they scroll to the nearest related block on `index.html`. If any becomes its own page, update the `href`s in **both** `index.html` and `campanha.html`.
- **Countdown banner image**: uses `assets/images/countdown-bg.jpg`, cropped from the user-supplied archival broadcast still (pillarbox bars removed, ~1.32:1). Not exported from Figma directly — the Figma MCP integration hit its plan's tool-call rate limit before that asset could be pulled.
- **Countdown target**: hardcoded to `2029-09-15T00:00:00+01:00` (WEST) in `assets/js/main.js`, matching the Figma mockup's static "03:12:03:30:02" snapshot. Update there if the date changes.
- **A Campanha layout**: built from a PNG of the artwork, not read from Figma — the MCP integration is still over its plan's tool-call limit. Column placements land on grid boundaries and should be right; vertical spacing and `--fs-lead` were measured off a ~1/3-scale image and are approximations worth checking against the source file.
- **Polygon outline**: `campanha.html` draws a regular 20-gon inline. The artwork's shape looks slightly irregular, so this reads more geometric than intended. Replace with the real SVG export when Figma access returns.
- **Inline links in the first list**: "os protestos das sufragistas" and "Marcha do Sal" are `<span class="underline">`, not links — no URLs were supplied.
- **`text-wrap: pretty`**: used on the small paragraphs to avoid single-word last lines. Unsupported in Firefox, where it degrades silently to normal wrapping.
