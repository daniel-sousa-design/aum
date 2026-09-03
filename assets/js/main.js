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
