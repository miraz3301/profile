/* Page 2 behaviour: scroll lock until entered, hero fade, reveal animations, nav highlight */
(function () {
  const root = document.documentElement;
  const enter = document.getElementById("enter");

  // 1) no scrolling until the visitor clicks "click to enter..."
  root.classList.add("locked");
  const unlock = () => root.classList.remove("locked");
  if (enter) {
    enter.addEventListener("click", unlock);
    enter.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") unlock(); });
  } else unlock();

  // 2) scroll progress -> --p (0 to 1) drives the hero fade + background dim
  const toTop = document.getElementById("to-top");
  let ticking = false;
  function update() {
    ticking = false;
    const h = window.innerHeight;
    const p = Math.min(1, Math.max(0, window.scrollY / (h * 0.75)));
    root.style.setProperty("--p", p.toFixed(3));
    root.classList.toggle("hero-gone", p >= 0.98);
    root.classList.toggle("past-hero", window.scrollY > h * 0.6);
  }
  window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener("resize", update);
  update();

  if (toTop) toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  // 3) reveal elements as they enter the screen
  const items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    items.forEach((el) => io.observe(el));
  } else items.forEach((el) => el.classList.add("in"));

  // 4) highlight the current section in the top nav
  const links = [...document.querySelectorAll(".topnav a")];
  const map = new Map(links.map((a) => [a.getAttribute("href").slice(1), a]));
  if ("IntersectionObserver" in window) {
    const so = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          links.forEach((a) => a.classList.remove("active"));
          const a = map.get(e.target.id);
          if (a) a.classList.add("active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    map.forEach((_, id) => { const s = document.getElementById(id); if (s) so.observe(s); });
  }
})();
