(() => {
  const headings = document.querySelectorAll(".statement__heading");
  if (!headings.length || !window.gsap || !window.SplitText) return;

  // Gap between the text and the underline bar, as a multiple of the
  // underlined text's own font-size. Measured from the containing LINE's
  // own bottom edge (not the glyph baseline) since consecutive wrapped
  // lines sit with zero natural leading between them here - so this value
  // is usually negative (pulling the bar up, into the current line's own
  // box) to clear the letters without cutting into the line below.
  // Tune this single value to move the bar closer to (more negative) or
  // further from (less negative / positive) the letters.
  const UNDERLINE_GAP_EM = -0.005;

  gsap.registerPlugin(SplitText, ScrollTrigger);

  const initHeadingReveal = (heading) => {
    let currentTrigger = null;
    let bars = [];

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
            { x: 56, letterSpacing: "0.25em" },
            { x: 0, letterSpacing: "0em", duration: 1.6, ease: "power2.inOut" },
            at
          );

          if (chars.length) {
            tl.fromTo(
              chars,
              { autoAlpha: 0 },
              { autoAlpha: 1, duration: 0.3, ease: "power2.inOut", stagger: 0.035 },
              at
            );
          }
        });

        if (currentTrigger) currentTrigger.kill();

        const proxy = { p: 0 };

        currentTrigger = ScrollTrigger.create({
          trigger: heading,
          start: "top 84%",
          end: "+=" + (self.lines.length * 80 + 200),
          onUpdate(self) {
            gsap.to(proxy, {
              p: self.progress,
              duration: 2,
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
