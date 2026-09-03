(() => {
  const header = document.querySelector(".site-header");
  const hero = document.querySelector(".hero");
  const navToggle = document.getElementById("navToggle");
  const siteNav = document.getElementById("siteNav");

  if (header && hero) {
    const toggleScrolled = () => {
      const threshold = hero.offsetHeight - header.offsetHeight;
      header.classList.toggle("site-header--scrolled", window.scrollY > threshold);
    };

    toggleScrolled();
    window.addEventListener("scroll", toggleScrolled, { passive: true });
    window.addEventListener("resize", toggleScrolled);
  }

  if (navToggle && siteNav) {
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
