const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function initPageLoad() {
  window.addEventListener("DOMContentLoaded", () => {
    requestAnimationFrame(() => document.body.classList.add("is-loaded"));
  });
}

function initHeaderScroll() {
  const header = document.querySelector("[data-header]");
  if (!header) return;

  const updateHeader = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 40);
  };

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });
}

function initActiveNavigation() {
  const current = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".site-nav a, .menu-overlay__nav a").forEach((link) => {
    const target = link.getAttribute("href");
    if (target === current) link.classList.add("is-active");
  });
}

function initMenuOverlay() {
  const overlay = document.querySelector("[data-menu-overlay]");
  const toggle = document.querySelector("[data-menu-toggle]");
  const close = document.querySelector("[data-menu-close]");
  const links = overlay ? overlay.querySelectorAll("a") : [];
  if (!overlay || !toggle || !close) return;

  const setOpen = (isOpen) => {
    overlay.classList.toggle("is-open", isOpen);
    overlay.setAttribute("aria-hidden", String(!isOpen));
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
    document.body.classList.toggle("menu-open", isOpen);
    if (isOpen) close.focus({ preventScroll: true });
  };

  toggle.addEventListener("click", () => setOpen(!overlay.classList.contains("is-open")));
  close.addEventListener("click", () => setOpen(false));
  links.forEach((link) => link.addEventListener("click", () => setOpen(false)));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false);
  });
}

function initRevealAnimations() {
  const elements = document.querySelectorAll(".reveal");
  if (!elements.length) return;

  if (!("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14, rootMargin: "0px 0px -8% 0px" }
  );

  elements.forEach((element) => observer.observe(element));
}

function initCounterStats() {
  const counters = document.querySelectorAll("[data-count]");
  const results = document.querySelector(".results");
  if (!counters.length || !results) return;

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    counters.forEach((counter) => {
      counter.textContent = counter.dataset.count;
    });
    return;
  }

  let hasRun = false;
  const animateCounter = (counter) => {
    const target = Number(counter.dataset.count);
    const duration = 1400;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      counter.textContent = Math.round(target * eased).toString();
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting) && !hasRun) {
        hasRun = true;
        counters.forEach((counter) => animateCounter(counter));
        observer.disconnect();
      }
    },
    { threshold: 0.35 }
  );

  observer.observe(results);
}

function initParallax() {
  const elements = document.querySelectorAll("[data-parallax]");
  if (!elements.length || prefersReducedMotion) return;

  let ticking = false;
  const update = () => {
    const viewportHeight = window.innerHeight;
    elements.forEach((element) => {
      const amount = Math.min(Number(element.dataset.parallax) || 12, 30);
      const rect = element.getBoundingClientRect();
      const progress = (rect.top + rect.height / 2 - viewportHeight / 2) / viewportHeight;
      const offset = Math.max(Math.min(progress * -amount, amount), -amount);
      element.style.setProperty("--parallax-y", `${offset}px`);
    });
    ticking = false;
  };

  const requestUpdate = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };

  update();
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
}

function initForms() {
  document.querySelectorAll("[data-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const status = form.querySelector("[data-form-status]");
      if (status) status.textContent = "Gracias. Recibimos tu consulta y te responderemos a la brevedad.";
      form.reset();
    });
  });
}

function initHorizontalOverflowGuard() {
  const width = document.documentElement.scrollWidth - document.documentElement.clientWidth;
  if (width > 1) console.warn(`Se detectó posible scroll horizontal de ${width}px.`);
}

initPageLoad();
initHeaderScroll();
initActiveNavigation();
initMenuOverlay();
initRevealAnimations();
initCounterStats();
initParallax();
initForms();
window.addEventListener("load", initHorizontalOverflowGuard);
