(() => {
  const headings = document.querySelectorAll(".statement__heading, .rights__title");
  if (!headings.length || !window.gsap || !window.SplitText) return;

  // Gap between the text and the underline bar, as a multiple of the
  // underlined text's own font-size. Measured from the containing LINE's
  // own bottom edge (not the glyph baseline) since consecutive wrapped
  // lines sit with zero natural leading between them here - so this value
  // is usually negative (pulling the bar up, into the current line's own
  // box) to clear the letters without cutting into the line below.
  // Tune this single value to move the bar closer to (more negative) or
  // further from (less negative / positive) the letters.
  // Mirrored as --underline-gap in styles.css for the footer links; keep the
  // two in step.
  const UNDERLINE_GAP_EM = -0.005;

  // Scroll distance the whole reveal is spread across, in px: a per-line
  // component plus a fixed tail. The timeline is scrubbed by scroll, so
  // these set how far you must scroll for it to complete - larger values
  // advance the animation less per pixel scrolled, i.e. slower.
  const SCROLL_PER_LINE = 100;
  const SCROLL_TAIL = 240;

  // How heavily the timeline lags the raw scroll position, in seconds.
  // Higher = more glide, and the reveal keeps easing onward briefly after
  // you stop scrolling instead of halting dead.
  const SCRUB_SMOOTHING = 3;

  // How far each line slides in from the left, in px. Centred headings use 0:
  // with the text centred, collapsing letter-spacing alone pulls the glyphs in
  // from both sides towards the middle, and any x offset would break that
  // symmetry by dragging the whole line sideways as well.
  const REVEAL_X = 56;

  gsap.registerPlugin(SplitText, ScrollTrigger);

  const initHeadingReveal = (heading) => {
    let currentTrigger = null;
    let bars = [];

    // data-reveal="autoplay" opts a heading out of the scrub: it plays once at
    // its own pace the moment it is visible, and never rewinds.
    //
    // hasCompleted tracks whether the reveal has FINISHED, not whether it has
    // started. autoSplit re-splits whenever layout settles after load, and each
    // re-split builds a fresh timeline; a "has started" flag would let that
    // second pass cancel a reveal still in flight, leaving the heading frozen.
    const autoplay = heading.dataset.reveal === "autoplay";
    const fromX = heading.dataset.revealFrom === "center" ? 0 : REVEAL_X;
    let hasCompleted = false;

    SplitText.create(heading, {
      type: "lines, chars",
      linesClass: "line",
      charsClass: "char",
      mask: "lines",
      autoSplit: true,
      onSplit(self) {
        bars.forEach((bar) => bar.remove());
        bars = [];

        const tl = gsap.timeline({ paused: true });

        self.lines.forEach((line, i) => {
          const chars = line.querySelectorAll(".char");
          const at = i * 0.5;
          const underlines = line.querySelectorAll(".underline");

          // Measure and place underline bars before any transform-affecting
          // tweens are created (GSAP renders a fromTo's "from" state immediately).
          underlines.forEach((u) => {
            u.style.textDecoration = "none";

            const bar = document.createElement("span");
            bar.className = "underline-bar";
            heading.appendChild(bar);
            bars.push(bar);

            const headingRect = heading.getBoundingClientRect();
            const r = u.getBoundingClientRect();
            const lineRect = line.getBoundingClientRect();
            const gap = parseFloat(getComputedStyle(u).fontSize) * UNDERLINE_GAP_EM;
            bar.style.left = r.left - headingRect.left + "px";
            bar.style.top = lineRect.bottom - headingRect.top + gap + "px";
            bar.style.width = r.width + "px";

            tl.fromTo(
              bar,
              { scaleX: 0 },
              { scaleX: 1, duration: 0.9, ease: "power2.inOut" },
              at + 0.6
            );
          });

          tl.fromTo(
            line,
            { x: fromX, letterSpacing: "0.05em" },
            { x: 0, letterSpacing: "0em", duration: 1.6, ease: "power2.inOut" },
            at
          );

          if (chars.length) {
            tl.fromTo(
              chars,
              { autoAlpha: 0 },
              { autoAlpha: 1, duration: 0.2, ease: "power2.inOut", stagger: 0.035 },
              at
            );
          }
        });

        if (currentTrigger) currentTrigger.kill();

        if (autoplay) {
          // SplitText resets the timeline handed back from onSplit once this
          // callback returns, so anything set synchronously here is discarded -
          // every state change below has to wait a frame. (The scrub path below
          // is unaffected: it only ever writes progress from onRefresh/onUpdate,
          // which already run later.)
          if (hasCompleted) {
            requestAnimationFrame(() => tl.progress(1));
            return tl;
          }

          tl.eventCallback("onComplete", () => {
            hasCompleted = true;
          });

          // Scoped to this split, so a re-split before the reveal finishes
          // restarts it rather than dropping it.
          let started = false;
          const play = () => {
            if (started) return;
            started = true;
            tl.play(0);
          };

          currentTrigger = ScrollTrigger.create({
            trigger: heading,
            start: "top 90%",
            once: true,
            onEnter: play,
          });

          // onEnter only fires when the start line is crossed, so a heading
          // already on screen at load - this one sits at the top of the page -
          // would never trigger it. Check the position directly instead.
          requestAnimationFrame(() => {
            if (heading.getBoundingClientRect().top < window.innerHeight * 0.9) {
              play();
            }
          });

          return tl;
        }

        const proxy = { p: 0 };

        currentTrigger = ScrollTrigger.create({
          trigger: heading,
          start: "top 84%",
          end: "+=" + (self.lines.length * SCROLL_PER_LINE + SCROLL_TAIL),
          onUpdate(self) {
            gsap.to(proxy, {
              p: self.progress,
              duration: SCRUB_SMOOTHING,
              ease: "power4.out",
              overwrite: true,
              onUpdate: () => tl.progress(proxy.p),
            });
          },
          onRefresh(self) {
            proxy.p = self.progress;
            tl.progress(self.progress);
          },
        });

        return tl;
      },
    });
  };

  document.fonts.ready.then(() => {
    headings.forEach(initHeadingReveal);
  });
})();

/* -------------------------------------------------------------------------
   Footer link underlines

   Scrubbed by scroll in both directions, the same way the big paragraphs are:
   a paused timeline whose progress is driven by a smoothed proxy, so it runs
   forwards as you scroll down and rewinds as you scroll back up.

   The bar is a background gradient (see .is-animated in styles.css) because
   these links wrap; its width is written here rather than tweened directly, so
   nothing depends on GSAP interpolating a "0% 2px" -> "100% 2px" string.
   ------------------------------------------------------------------------- */
(() => {
  const contacts = document.querySelectorAll(".site-footer__contact");
  if (!contacts.length || !window.gsap || !window.ScrollTrigger) return;

  // The CSS already shows the underline drawn; leave it alone.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // Bar thickness, and the hold before it starts drawing - expressed in
  // timeline seconds, so under a scrub it reads as a fraction of the scroll
  // range rather than as wall-clock time.
  const BAR_HEIGHT = "2px";
  const UNDERLINE_DELAY = 0.2;
  const UNDERLINE_DURATION = 0.9;

  // Same lag the heading scrub uses; declared here because that one lives in
  // another IIFE's scope. Keep the two in step.
  const SCRUB_SMOOTHING = 3;

  gsap.registerPlugin(ScrollTrigger);

  contacts.forEach((contact) => {
    const links = contact.querySelectorAll("a");
    if (!links.length) return;

    // Added from JS so the plain text-decoration underline survives without it.
    contact.classList.add("is-animated");

    const state = { p: 0 };
    const apply = () => {
      const width = state.p * 100 + "%";
      links.forEach((link) => {
        link.style.backgroundSize = width + " " + BAR_HEIGHT;
      });
    };

    const tl = gsap.timeline({ paused: true, onUpdate: apply });
    tl.fromTo(
      state,
      { p: 0 },
      { p: 1, duration: UNDERLINE_DURATION, ease: "power2.inOut" },
      UNDERLINE_DELAY
    );

    const proxy = { p: 0 };

    ScrollTrigger.create({
      trigger: contact,
      start: "top 90%",
      end: "top 40%",
      onUpdate(self) {
        gsap.to(proxy, {
          p: self.progress,
          duration: SCRUB_SMOOTHING,
          ease: "power4.out",
          overwrite: true,
          onUpdate: () => tl.progress(proxy.p),
        });
      },
      onRefresh(self) {
        proxy.p = self.progress;
        tl.progress(self.progress);
      },
    });
  });
})();

/* -------------------------------------------------------------------------
   Campaign figure

   Rises into place as you scroll through it, scrubbed in both directions with
   the same smoothing the headings and the footer underline use.
   ------------------------------------------------------------------------- */
(() => {
  const figures = document.querySelectorAll(".campaign__figure");
  if (!figures.length || !window.gsap || !window.ScrollTrigger) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // How far below its resting position the figure starts, in px.
  const RISE = 80;

  // Matches the heading scrub; declared here because that one is scoped to
  // another IIFE. Keep the two in step.
  const SCRUB_SMOOTHING = 3;

  gsap.registerPlugin(ScrollTrigger);

  figures.forEach((figure) => {
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(
      figure,
      { y: RISE },
      { y: 0, duration: 1, ease: "power2.inOut" }
    );

    const proxy = { p: 0 };

    ScrollTrigger.create({
      trigger: figure,
      start: "top bottom",
      end: "top 40%",
      onUpdate(self) {
        gsap.to(proxy, {
          p: self.progress,
          duration: SCRUB_SMOOTHING,
          ease: "power4.out",
          overwrite: true,
          onUpdate: () => tl.progress(proxy.p),
        });
      },
      onRefresh(self) {
        proxy.p = self.progress;
        tl.progress(self.progress);
      },
    });
  });
})();
