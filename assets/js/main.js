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
  const el = document.getElementById("footerLogoAnimation");
  if (!el || typeof lottie === "undefined") return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const anim = lottie.loadAnimation({
    container: el,
    renderer: "svg",
    loop: true,
    autoplay: !prefersReducedMotion,
    path: el.dataset.animation,
  });

  if (prefersReducedMotion) {
    anim.addEventListener("DOMLoaded", () => {
      anim.goToAndStop(anim.totalFrames - 1, true);
    });
  }
})();
