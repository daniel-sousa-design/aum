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
  // Custom cursor: a 50px 12-gon that inverts whatever sits under it. The same
  // polygon is the site favicon (assets/favicon.svg) - keep the two in step.
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

(() => {
  // Form field constraints on the causes page.
  const form = document.querySelector(".form");
  if (!form) return;

  // Strip anything that does not belong, rather than blocking the keystroke -
  // this also catches paste, drag-drop and autofill, which keydown filters miss.
  const filter = (input, allowed) => {
    input.addEventListener("input", () => {
      const clean = input.value.replace(allowed, "");
      if (clean === input.value) return;
      // Keep the caret where the user left it, minus whatever was removed.
      const at = input.selectionStart - (input.value.length - clean.length);
      input.value = clean;
      input.setSelectionRange(at, at);
    });
  };

  form.querySelectorAll("[data-letters-only]").forEach((input) => {
    filter(input, /[0-9]/g);
  });

  form.querySelectorAll("[data-digits-only]").forEach((input) => {
    filter(input, /[^0-9]/g);
  });

  // Textarea grows with its content. The CSS max-height caps it at 600px and
  // takes over with a scrollbar from there.
  form.querySelectorAll("[data-autogrow]").forEach((area) => {
    const grow = () => {
      // Reset first, or scrollHeight can only ever report a taller box.
      area.style.height = "auto";
      area.style.height = area.scrollHeight + "px";
    };

    area.addEventListener("input", grow);
    grow();
  });
})();

(() => {
  // Styled location suggestions, replacing the native datalist dropdown, which
  // cannot be styled. The datalist stays in the markup: it is the data source
  // here, and the fallback when this script does not run.
  const input = document.querySelector("[data-letters-only][list]");
  if (!input) return;

  const source = document.getElementById(input.getAttribute("list"));
  if (!source) return;

  const values = Array.from(source.options, (option) => option.value);

  // Detach the native dropdown, or both would open at once.
  input.removeAttribute("list");

  const list = document.createElement("ul");
  list.className = "suggest";
  list.id = "localidade-suggest";
  list.setAttribute("role", "listbox");
  list.hidden = true;
  input.parentNode.appendChild(list);

  input.setAttribute("role", "combobox");
  input.setAttribute("aria-expanded", "false");
  input.setAttribute("aria-controls", list.id);
  input.setAttribute("aria-autocomplete", "list");

  // Match without accents, so "evora" finds "Évora".
  const plain = (text) =>
    text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  let matches = [];
  let active = -1;

  const close = () => {
    list.hidden = true;
    list.replaceChildren();
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
    active = -1;
  };

  const highlight = (index) => {
    Array.from(list.children).forEach((option, i) => {
      option.setAttribute("aria-selected", String(i === index));
    });
    active = index;
    if (index < 0) {
      input.removeAttribute("aria-activedescendant");
      return;
    }
    const option = list.children[index];
    input.setAttribute("aria-activedescendant", option.id);
    option.scrollIntoView({ block: "nearest" });
  };

  const choose = (value) => {
    input.value = value;
    close();
    input.focus();
  };

  const open = () => {
    const typed = plain(input.value.trim());
    matches = typed ? values.filter((v) => plain(v).includes(typed)) : [];

    if (!matches.length) {
      close();
      return;
    }

    list.replaceChildren(
      ...matches.map((value, i) => {
        const option = document.createElement("li");
        option.className = "suggest__option";
        option.id = "suggest-option-" + i;
        option.setAttribute("role", "option");
        option.setAttribute("aria-selected", "false");
        option.textContent = value;
        option.addEventListener("mousedown", (event) => {
          // mousedown, not click - blur would close the list first.
          event.preventDefault();
          choose(value);
        });
        return option;
      })
    );

    list.hidden = false;
    input.setAttribute("aria-expanded", "true");
    active = -1;
  };

  input.addEventListener("input", open);
  input.addEventListener("focus", open);
  input.addEventListener("blur", close);

  input.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      close();
      return;
    }

    if (event.key === "Enter" && active >= 0) {
      event.preventDefault();
      choose(matches[active]);
      return;
    }

    const step =
      event.key === "ArrowDown" ? 1 : event.key === "ArrowUp" ? -1 : 0;
    if (!step || list.hidden) return;

    event.preventDefault();
    highlight((active + step + matches.length) % matches.length);
  });
})();

(() => {
  // The suggest-a-cause form has no endpoint yet. Block submission rather than
  // letting it navigate away and look like it worked. Remove data-inactive from
  // the markup once a real action is wired up.
  document.querySelectorAll("form[data-inactive]").forEach((form) => {
    form.addEventListener("submit", (event) => event.preventDefault());
  });

  // Same for the material downloads: the files do not exist yet, so the cards
  // stay put rather than jumping to the top of the page on a dead href.
  document.querySelectorAll("a[data-inactive]").forEach((link) => {
    link.addEventListener("click", (event) => event.preventDefault());
  });
})();
