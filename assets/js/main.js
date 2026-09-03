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

  const anim = lottie.loadAnimation({
    container: el,
    renderer: "svg",
    loop: false,
    autoplay: false,
    path: el.dataset.animation,
  });

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReducedMotion) {
    anim.addEventListener("DOMLoaded", () => {
      anim.goToAndStop(anim.totalFrames - 1, true);
    });
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        anim.setDirection(entry.isIntersecting ? 1 : -1);
        anim.play();
      });
    },
    { threshold: 0.2 }
  );

  io.observe(el);
})();
