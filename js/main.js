// Shared chrome + interactions: nav, theme, reveals, counters, marquee, tilt, cursor.

// ---------- shared nav / footer ----------
const NAV = `
<header class="nav" id="nav">
  <div class="nav__inner wrap">
    <a class="nav__logo" href="/">
      <span class="nav__mark"></span>
      <span class="nav__word">INVARIANCE<em>AI LABS</em></span>
    </a>
    <nav class="nav__links" id="navLinks">
      <a href="/work">Work</a><a href="/products">Products</a><a href="/lab">The Lab</a><a href="/about">About</a>
      <a class="nav__cta btn btn--primary" href="https://wa.me/917780702120" target="_blank" rel="noopener">Talk to us</a>
    </nav>
    <div class="nav__tools">
      <button class="theme-toggle" id="themeToggle" aria-label="Toggle color theme"><span class="theme-toggle__dot"></span></button>
      <button class="nav__burger" id="burger" aria-label="Menu"><span></span><span></span></button>
    </div>
  </div>
</header>`;

const FOOTER = `
<footer class="footer">
  <div class="wrap">
    <div class="footer__cta" data-reveal>
      <p class="eyebrow">The demo is free</p>
      <h2 class="footer__title">15 minutes.<br><span class="serif gradient-text">Zero obligation.</span></h2>
      <p class="dim footer__line">You talk, we listen, and then we build a working demo on your actual use case before you pay a rupee.</p>
      <a class="btn btn--primary footer__wa" href="https://wa.me/917780702120" target="_blank" rel="noopener">Chat on WhatsApp · +91 77807 02120</a>
    </div>
    <div class="footer__base">
      <span class="mono dim">INVARIANCE AI LABS · HYDERABAD</span>
      <nav class="footer__nav">
        <a href="/work">Work</a><a href="/products">Products</a><a href="/lab">The Lab</a><a href="/about">About</a><a href="/website-guide">How this site was made</a>
      </nav>
      <span class="mono dim">Applied AI for real businesses</span>
    </div>
  </div>
</footer>`;

document.getElementById("chrome-nav")?.insertAdjacentHTML("afterbegin", NAV);
document.getElementById("chrome-footer")?.insertAdjacentHTML("beforeend", FOOTER);

// ---------- theme ----------
const root = document.documentElement;
const saved = localStorage.getItem("inv-theme");
if (saved) root.setAttribute("data-theme", saved);
document.getElementById("themeToggle")?.addEventListener("click", () => {
  const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
  root.setAttribute("data-theme", next);
  localStorage.setItem("inv-theme", next);
});

// ---------- mobile menu ----------
const burger = document.getElementById("burger");
burger?.addEventListener("click", () => {
  document.body.classList.toggle("menu-open");
});

// ---------- nav shrink ----------
let lastY = 0;
addEventListener("scroll", () => {
  const nav = document.getElementById("nav");
  if (!nav) return;
  nav.classList.toggle("nav--scrolled", scrollY > 40);
  nav.classList.toggle("nav--hidden", scrollY > 320 && scrollY > lastY && !document.body.classList.contains("menu-open"));
  lastY = scrollY;
}, { passive: true });

// ---------- reveal on scroll ----------
const io = new IntersectionObserver((es) => {
  es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
}, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));

// ---------- split headline reveal ----------
document.querySelectorAll("[data-split]").forEach((el) => {
  const words = el.textContent.trim().split(/\s+/);
  el.innerHTML = words.map((w) => `<span class="w"><span>${w}</span></span>`).join(" ");
  const wio = new IntersectionObserver((es) => {
    es.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.querySelectorAll(".w > span").forEach((s, i) => { s.style.transitionDelay = `${i * 55}ms`; s.classList.add("up"); });
      wio.unobserve(e.target);
    });
  }, { threshold: 0.4 });
  wio.observe(el);
});

// ---------- counters ----------
document.querySelectorAll("[data-count]").forEach((el) => {
  const cio = new IntersectionObserver((es) => {
    es.forEach((e) => {
      if (!e.isIntersecting) return;
      const target = parseFloat(el.dataset.count);
      const dur = 1600, t0 = performance.now();
      const dec = el.dataset.dec ? parseInt(el.dataset.dec) : 0;
      (function tick(now) {
        const p = Math.min(1, (now - t0) / dur);
        const v = target * (1 - Math.pow(1 - p, 4));
        el.textContent = v.toFixed(dec).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
      cio.unobserve(el);
    });
  }, { threshold: 0.6 });
  cio.observe(el);
});

// ---------- marquee duplication ----------
document.querySelectorAll(".marquee__track").forEach((t) => {
  t.innerHTML += t.innerHTML;
});

// ---------- 3d tilt cards ----------
document.querySelectorAll("[data-tilt]").forEach((card) => {
  card.addEventListener("pointermove", (e) => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    card.style.transform = `perspective(900px) rotateY(${x * 7}deg) rotateX(${-y * 7}deg) translateY(-3px)`;
    card.style.setProperty("--mx", `${(x + 0.5) * 100}%`);
    card.style.setProperty("--my", `${(y + 0.5) * 100}%`);
  });
  card.addEventListener("pointerleave", () => { card.style.transform = ""; });
});

// ---------- magnetic buttons ----------
if (matchMedia("(pointer:fine)").matches) {
  document.querySelectorAll(".btn").forEach((b) => {
    b.addEventListener("pointermove", (e) => {
      const r = b.getBoundingClientRect();
      b.style.translate = `${(e.clientX - r.left - r.width / 2) * 0.18}px ${(e.clientY - r.top - r.height / 2) * 0.3}px`;
    });
    b.addEventListener("pointerleave", () => { b.style.translate = "0 0"; });
  });

  // ---------- ember cursor ----------
  const cur = document.createElement("div");
  cur.className = "cursor"; document.body.appendChild(cur);
  let cx = 0, cy = 0, tx = 0, ty = 0;
  addEventListener("pointermove", (e) => { tx = e.clientX; ty = e.clientY; }, { passive: true });
  (function follow() {
    cx += (tx - cx) * 0.16; cy += (ty - cy) * 0.16;
    cur.style.transform = `translate(${cx}px, ${cy}px)`;
    requestAnimationFrame(follow);
  })();
  document.addEventListener("pointerover", (e) => {
    cur.classList.toggle("cursor--link", !!e.target.closest("a,button,[data-tilt]"));
  });
}

// ---------- parallax layers ----------
const plx = document.querySelectorAll("[data-plx]");
if (plx.length) {
  addEventListener("scroll", () => {
    plx.forEach((el) => {
      const sp = parseFloat(el.dataset.plx || "0.15");
      const r = el.getBoundingClientRect();
      el.style.transform = `translateY(${(r.top - innerHeight / 2) * -sp}px)`;
    });
  }, { passive: true });
}

// ---------- footer year / active nav ----------
document.querySelectorAll(".nav__links a").forEach((a) => {
  if (a.getAttribute("href") !== "/" && location.pathname.startsWith(a.getAttribute("href"))) a.classList.add("active");
});
