(() => {
  const headings = document.querySelectorAll(".statement__heading, .rights__title, .participate__lead");
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
   Link underlines

   Scrubbed by scroll in both directions, the same way the big paragraphs are:
   a paused timeline whose progress is driven by a smoothed proxy, so it runs
   forwards as you scroll down and rewinds as you scroll back up.

   The bar is a background gradient (see .is-animated in styles.css) because
   these links wrap; its width is written here rather than tweened directly, so
   nothing depends on GSAP interpolating a "0% 2px" -> "100% 2px" string.

   Hover is left to CSS: a keyframe animation outranks the inline width written
   here for as long as it runs, then hands the underline straight back to the
   scroll position - so a link can be re-wiped on hover without the two
   fighting over the same property.
   ------------------------------------------------------------------------- */
(() => {
  // Every block whose links draw themselves on the way past: the footer
  // contact copy, and the two on the Participe page.
  const blocks = document.querySelectorAll(
    ".site-footer__contact, .participate__list, .participate__note"
  );
  if (!blocks.length || !window.gsap || !window.ScrollTrigger) return;

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

  blocks.forEach((block) => {
    // .participate__pending is underlined but is not a link yet, so it is
    // drawn along with them rather than sitting there already underlined.
    const links = block.querySelectorAll("a, .participate__pending");
    if (!links.length) return;

    // Added from JS so the plain text-decoration underline survives without it.
    block.classList.add("is-animated");

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
      trigger: block,
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

/* -------------------------------------------------------------------------
   Cause selector

   Clicking a cause swaps the panel beside it, revealing the new content top
   to bottom. Panels are all present in the markup and only hidden from JS, so
   without it every panel stays readable rather than becoming unreachable.
   ------------------------------------------------------------------------- */
(() => {
  const list = document.querySelector(".causes__list");
  if (!list || !window.gsap) return;

  const buttons = Array.from(list.querySelectorAll(".causes__item"));
  if (!buttons.length) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Two behaviours from the same markup, matching the two layouts in the
  // stylesheet. Wide: the panel is out of flow in the right-hand column, one
  // always showing, and switching cause cross-fades it - clicking the open
  // cause leaves it open, since closing it would leave the column empty.
  // Narrow: the panel opens under its own title, growing its height while its
  // contents fade up into the space, and clicking the open cause closes it.
  const narrow = window.matchMedia("(max-width: 700px)");

  const OPEN = 0.6;
  const CLOSE = 0.45;
  const RISE = 16;
  const STAGGER = 0.05;

  // The cause shown by default on wide screens, where something has to be.
  const DEFAULT_CAUSE = "migrantes";

  const panelOf = (button) =>
    document.getElementById(button.getAttribute("aria-controls"));

  let current = null;

  const close = (button, animate) => {
    const panel = panelOf(button);
    button.setAttribute("aria-expanded", "false");
    gsap.killTweensOf([panel, panel.children]);

    if (!narrow.matches) {
      // Height belongs to the accordion; the column layout sizes itself.
      gsap.set(panel, { visibility: "hidden", clearProps: "height" });
      return;
    }

    if (!animate || reduced) {
      gsap.set(panel, { height: 0, visibility: "hidden" });
      return;
    }

    gsap.to(panel, {
      height: 0,
      duration: CLOSE,
      ease: "power2.inOut",
      onComplete: () => gsap.set(panel, { visibility: "hidden" }),
    });
  };

  const open = (button, animate) => {
    const panel = panelOf(button);
    button.setAttribute("aria-expanded", "true");
    gsap.killTweensOf([panel, panel.children]);
    gsap.set(panel, { visibility: "visible" });

    if (!narrow.matches) {
      gsap.set(panel, { clearProps: "height" });
    } else if (!animate || reduced) {
      gsap.set(panel, { height: "auto" });
    } else {
      gsap.to(panel, { height: "auto", duration: OPEN, ease: "power2.inOut" });
    }

    if (!animate || reduced) {
      gsap.set(panel.children, { clearProps: "all" });
      return;
    }

    gsap.fromTo(
      panel.children,
      { y: RISE, autoAlpha: 0 },
      {
        y: 0,
        autoAlpha: 1,
        duration: OPEN,
        ease: "power2.out",
        stagger: STAGGER,
        overwrite: true,
      }
    );
  };

  const select = (button) => {
    if (current === button) {
      // Only the accordion can close back to nothing.
      if (!narrow.matches) return;
      close(button, true);
      current = null;
      return;
    }

    if (current) close(current, true);
    open(button, true);
    current = button;
  };

  // Re-seat everything for the current layout: nothing open in the accordion,
  // the default cause open beside the list. Runs at load and whenever the
  // breakpoint is crossed, so a panel left open in one layout does not carry a
  // stale inline height into the other.
  const reset = () => {
    const keep = narrow.matches
      ? null
      : current ||
        buttons.find((b) => panelOf(b).dataset.cause === DEFAULT_CAUSE) ||
        buttons[0];

    buttons.forEach((button) => {
      if (button !== keep) close(button, false);
    });

    current = keep || null;
    if (keep) open(keep, false);
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => select(button));

    // Up and down walk the list, matching its vertical layout. Enter and Space
    // are the button's own, so they are left alone.
    button.addEventListener("keydown", (event) => {
      const step =
        event.key === "ArrowDown" ? 1 : event.key === "ArrowUp" ? -1 : 0;
      if (!step) return;
      event.preventDefault();
      const i = buttons.indexOf(button);
      buttons[(i + step + buttons.length) % buttons.length].focus();
    });
  });

  narrow.addEventListener("change", reset);
  reset();
})();

/* -------------------------------------------------------------------------
   Cause gallery physics

   Matter.js rather than a hand-rolled loop: these need true polygon collision
   (the outlines are 8-20 sided), locked rotation, and a cursor that nudges
   them. A tween engine cannot do contact resolution, and hand-rolling SAT with
   resting contacts is a lot of subtle code for a decorative effect.

   The vertex lists below are the same ones the CSS clip-paths use, so the
   shape that collides is exactly the shape you see.
   ------------------------------------------------------------------------- */
(() => {
  const stage = document.querySelector(".gallery__stage");
  if (!stage || !window.Matter) return;

  const tiles = Array.from(stage.querySelectorAll(".gallery__tile"));
  if (!tiles.length) return;

  const GALLERY_SHAPES = {"shape1":[[0.0,37.06],[6.25,20.28],[10.58,13.99],[25.96,3.5],[40.38,0.0],[65.38,1.4],[75.96,4.2],[90.87,16.08],[96.15,25.17],[100.0,38.46],[99.52,63.64],[95.19,76.92],[89.42,86.01],[71.15,97.2],[59.13,100.0],[40.38,100.0],[23.56,95.8],[10.58,86.01],[3.37,74.13],[0.0,62.94]],"shape2":[[0.0,40.27],[8.15,4.03],[37.62,0.0],[67.71,0.67],[92.48,4.7],[100.0,40.27],[100.0,59.73],[91.85,95.97],[62.38,100.0],[32.92,99.33],[7.52,94.63],[0.0,59.73]],"shape3":[[0.0,32.87],[22.81,0.0],[77.95,0.7],[100.0,32.87],[99.62,68.53],[77.57,100.0],[22.43,100.0],[0.0,67.13]],"shape4":[[0.0,41.22],[7.92,10.69],[36.98,0.0],[65.28,0.76],[92.45,11.45],[100.0,41.22],[100.0,58.78],[92.08,89.31],[63.4,100.0],[36.98,100.0],[7.55,88.55],[0.0,59.54]]};

  const { Engine, Bodies, Composite, Body, Vector } = Matter;

  const REFERENCE_WIDTH = 1728;
  const WALL = 200;          // wall thickness, well clear of the play area
  const CURSOR_RADIUS = 260; // how close the pointer has to be to push a tile
  const CURSOR_FORCE = 0.9;  // gentle, so they drift rather than shove
  const MAX_TILT = 25;       // degrees of random lean, either way

  let engine = null;
  let bodies = [];
  let frame = null;
  let started = false;
  const pointer = { x: -9999, y: -9999, active: false };

  const build = () => {
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    const scale = Math.min(1, Math.max(0.38, width / REFERENCE_WIDTH));

    engine = Engine.create({ enableSleeping: true });
    // Held at 0 so the tiles sit where they are placed; released on view.
    engine.gravity.y = 0;

    Composite.add(engine.world, [
      Bodies.rectangle(width / 2, height + WALL / 2, width + WALL * 2, WALL, { isStatic: true }),
      Bodies.rectangle(-WALL / 2, height / 2, WALL, height * 4, { isStatic: true }),
      Bodies.rectangle(width + WALL / 2, height / 2, WALL, height * 4, { isStatic: true }),
    ]);

    bodies = tiles.map((tile, index) => {
      const shape = tile.querySelector(".gallery__shape");
      const h = Number(tile.dataset.h) * scale;
      const ratio = getComputedStyle(shape).aspectRatio.split("/");
      const w = h * (Number(ratio[0]) / Number(ratio[1] || 1));

      tile.style.width = w + "px";
      tile.style.height = h + "px";

      const points = GALLERY_SHAPES[tile.dataset.shape].map(([px, py]) => ({
        x: (px / 100) * w,
        y: (py / 100) * h,
      }));

      // All of them are placed across the upper part of the stage and are
      // already on screen before anything moves - they drop from where they sit
      // rather than flying in one at a time from off-screen. Held until
      // released. Simulated over 16 runs, this 3-column layout packs tighter
      // than spreading them evenly across the width.
      const columns = 3;
      const column = index % columns;
      const row = Math.floor(index / columns);
      const cell = width / columns;
      const x = Math.min(
        width - w / 2,
        Math.max(w / 2, column * cell + cell / 2 + (Math.random() - 0.5) * cell * 0.4)
      );
      const y = h / 2 + row * height * 0.11 + Math.random() * height * 0.05;

      // Deliberately not created static. A body built with isStatic: true
      // records its static mass as its "original", so releasing it later
      // restores inverseMass = 0 and the position goes NaN. Zero gravity holds
      // them still just as well, and releasing is then one line.
      const body = Bodies.fromVertices(x, y, [points], {
        restitution: 0.06,   // almost no bounce - they land and stay
        friction: 0.6,       // high, so a tile does not slide out from under
        frictionAir: 0.012,
        // Locks rotation: with infinite inertia no torque can spin the body,
        // so they cannot tumble or trip over one another.
        inertia: Infinity,
        sleepThreshold: 40,
      });

      // A random lean at the start, kept for the whole fall: inertia is
      // infinite, so nothing can add or remove spin once it is set. That gives
      // the pile some variety without letting the tiles tumble.
      Body.setAngle(body, ((Math.random() * 2 - 1) * MAX_TILT * Math.PI) / 180);
      Composite.add(engine.world, body);
      return { tile, body, w, h };
    });

    return { width, height };
  };

  const nudge = () => {
    if (!pointer.active) return;
    bodies.forEach(({ body }) => {
      const dx = body.position.x - pointer.x;
      const dy = body.position.y - pointer.y;
      const dist = Math.hypot(dx, dy);
      if (dist > CURSOR_RADIUS || dist < 1) return;

      // Falls off with distance, so the push is soft at the edge of reach.
      const strength = (1 - dist / CURSOR_RADIUS) * CURSOR_FORCE * body.mass * 0.0006;
      Body.applyForce(body, body.position, {
        x: (dx / dist) * strength,
        y: (dy / dist) * strength,
      });
    });
  };

  const draw = () => {
    bodies.forEach(({ tile, body, w, h }) => {
      // Rotate about the tile's own centre, which is where Matter rotates the
      // body's vertices, so the drawn shape and the colliding shape agree.
      tile.style.transform =
        "translate3d(" + (body.position.x - w / 2) + "px," +
        (body.position.y - h / 2) + "px,0) rotate(" + body.angle + "rad)";
    });
  };

  const tick = () => {
    nudge();
    Engine.update(engine, 1000 / 60);
    draw();
    frame = requestAnimationFrame(tick);
  };

  const start = () => {
    if (started) return;
    started = true;

    build();
    stage.classList.add("is-ready");
    draw();

    // One frame with everything visible and still, then let go - so the tiles
    // read as already being there rather than arriving.
    const release = () => {
      engine.gravity.y = 2.4; // heavy - they come down fast
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      release();
      for (let i = 0; i < 900; i += 1) Engine.update(engine, 1000 / 60);
      draw();
      return;
    }

    setTimeout(release, 220);
    tick();
  };

  stage.addEventListener("pointermove", (event) => {
    const box = stage.getBoundingClientRect();
    pointer.x = event.clientX - box.left;
    pointer.y = event.clientY - box.top;
    pointer.active = true;
  });

  stage.addEventListener("pointerleave", () => {
    pointer.active = false;
  });

  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      start();
    },
    // threshold 0, not a ratio: the stage is far taller than the viewport, so
    // 0.1 would need 425px of it on screen and never fires on a short window.
    { threshold: 0 }
  );
  observer.observe(stage);

  let resizeTimer = null;
  window.addEventListener("resize", () => {
    if (!started) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (frame) cancelAnimationFrame(frame);
      Composite.clear(engine.world, false);
      build();
      engine.gravity.y = 2.4;
      for (let i = 0; i < 900; i += 1) Engine.update(engine, 1000 / 60);
      draw();
      tick();
    }, 250);
  });
})();
