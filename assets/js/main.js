(() => {
  const header = document.querySelector(".site-header");
  const navToggle = document.getElementById("navToggle");
  const siteNav = document.getElementById("siteNav");

  if (navToggle && siteNav && header) {
    navToggle.addEventListener("click", () => {
      const isOpen = header.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });

    siteNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        header.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }
})();

(() => {
  const el = document.getElementById("countdownValue");
  if (!el) return;

  const target = new Date("2029-09-15T00:00:00+01:00");
  const units = {
    years: el.querySelector('[data-unit="years"]'),
    days: el.querySelector('[data-unit="days"]'),
    hours: el.querySelector('[data-unit="hours"]'),
    minutes: el.querySelector('[data-unit="minutes"]'),
    seconds: el.querySelector('[data-unit="seconds"]'),
  };

  const pad = (n) => String(n).padStart(2, "0");

  const tick = () => {
    const now = new Date();
    let years = target.getFullYear() - now.getFullYear();
    const anchor = new Date(now);
    anchor.setFullYear(now.getFullYear() + years);
    if (anchor > target) {
      years -= 1;
      anchor.setFullYear(anchor.getFullYear() - 1);
    }

    let msLeft = Math.max(0, target - anchor);
    const days = Math.floor(msLeft / 86400000);
    msLeft -= days * 86400000;
    const hours = Math.floor(msLeft / 3600000);
    msLeft -= hours * 3600000;
    const minutes = Math.floor(msLeft / 60000);
    msLeft -= minutes * 60000;
    const seconds = Math.floor(msLeft / 1000);

    units.years.textContent = pad(Math.max(0, years));
    units.days.textContent = pad(days);
    units.hours.textContent = pad(hours);
    units.minutes.textContent = pad(minutes);
    units.seconds.textContent = pad(seconds);
  };

  tick();
  setInterval(tick, 1000);
})();

(() => {
  // Custom cursor: a 50px 20-gon that inverts whatever sits under it.
  // Skipped where there is no real pointer, so touch devices keep their normal
  // behaviour and never end up with the cursor hidden and nothing drawn.
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  const POINTS =
    "62.94,1.70 85.36,14.64 98.30,37.06 98.30,62.94 85.36,85.36 62.94,98.30 " +
    "37.06,98.30 14.64,85.36 1.70,62.94 1.70,37.06 14.64,14.64 37.06,1.70";

  const cursor = document.createElement("div");
  cursor.className = "cursor";
  cursor.setAttribute("aria-hidden", "true");
  cursor.innerHTML =
    '<svg viewBox="0 0 100 100" focusable="false">' +
    '<polygon points="' + POINTS + '" fill="#fff" /></svg>';
  document.body.appendChild(cursor);

  // Set from JS so the native cursor is only hidden once a replacement exists.
  document.documentElement.classList.add("has-custom-cursor");

  let x = 0;
  let y = 0;
  let queued = false;

  const draw = () => {
    queued = false;
    cursor.style.transform = `translate3d(${x - 25}px, ${y - 25}px, 0)`;
  };

  document.addEventListener(
    "pointermove",
    (event) => {
      x = event.clientX;
      y = event.clientY;
      cursor.classList.add("is-visible");

      // Coalesce to one write per frame - pointermove can fire far faster.
      if (!queued) {
        queued = true;
        requestAnimationFrame(draw);
      }
    },
    { passive: true }
  );

  // Leaving the window should take the cursor with it.
  document.addEventListener("pointerleave", () => {
    cursor.classList.remove("is-visible");
  });
})();
