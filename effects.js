(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (id) => document.getElementById(id);
  const clean = (s) => s.replace(/[<>&]/g, "");

  /* scroll progress + back to top */
  const bar = $("progress"), top = $("toTop");
  const onScroll = () => {
    const h = document.documentElement;
    bar.style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight || 1) * 100) + "%";
    top.hidden = h.scrollTop < 600;
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  top.onclick = () => scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });

  /* tooltip for chart bars */
  const tip = $("tip");
  document.addEventListener("mousemove", (e) => {
    const t = e.target.closest && e.target.closest("[data-tip]");
    if (!t) { tip.hidden = true; return; }
    tip.innerHTML = t.dataset.tip.split(" | ")
      .map((s, i) => i === 0 ? "<b>" + clean(s) + "</b>" : clean(s)).join("<br>");
    tip.hidden = false;
    tip.style.left = Math.min(e.clientX + 14, innerWidth - 280) + "px";
    tip.style.top = (e.clientY + 16) + "px";
  });

  if (reduce || matchMedia("(pointer: coarse)").matches) return;

  /* card tilt */
  document.addEventListener("mousemove", (e) => {
    const c = e.target.closest && e.target.closest(".card, .stat");
    document.querySelectorAll(".tilt").forEach(el => {
      if (el !== c) { el.style.transform = ""; el.classList.remove("tilt"); }
    });
    if (!c) return;
    const r = c.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
    c.classList.add("tilt");
    c.style.transform = `perspective(700px) rotateY(${px * 8}deg) rotateX(${-py * 8}deg) translateY(-3px)`;
  });

  /* hero particle network */
  const cv = $("bgCanvas");
  if (!cv) return;
  const ctx = cv.getContext("2d");
  let W = 0, H = 0, pts = [], mouse = { x: -999, y: -999 }, running = true, looping = false;
  const dpr = () => devicePixelRatio || 1;

  function resize() {
    const r = cv.getBoundingClientRect(), d = dpr();
    W = cv.width = r.width * d;
    H = cv.height = r.height * d;
    const n = Math.min(70, Math.round(r.width / 16));
    pts = Array.from({ length: n }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - .5) * .4 * d, vy: (Math.random() - .5) * .4 * d
    }));
  }
  addEventListener("resize", resize);
  resize();

  cv.parentElement.addEventListener("mousemove", (e) => {
    const r = cv.getBoundingClientRect(), d = dpr();
    mouse = { x: (e.clientX - r.left) * d, y: (e.clientY - r.top) * d };
  });
  cv.parentElement.addEventListener("mouseleave", () => { mouse = { x: -999, y: -999 }; });

  new IntersectionObserver((es) => {
    running = es[0].isIntersecting;
    if (running && !looping) loop();
  }).observe(cv);

  function loop() {
    if (!running) { looping = false; return; }
    looping = true;
    const col = getComputedStyle(document.documentElement).getPropertyValue("--primary").trim() || "#2563eb";
    const d = dpr(), max = 130 * d;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = col;
    ctx.strokeStyle = col;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
      const dm = Math.hypot(p.x - mouse.x, p.y - mouse.y);
      if (dm < 140 * d && dm > 0) { p.x += (p.x - mouse.x) / dm * 1.2; p.y += (p.y - mouse.y) / dm * 1.2; }
      ctx.globalAlpha = .8;
      ctx.beginPath(); ctx.arc(p.x, p.y, 2.2 * d, 0, 7); ctx.fill();
      for (let k = i + 1; k < pts.length; k++) {
        const q = pts[k], dist = Math.hypot(p.x - q.x, p.y - q.y);
        if (dist < max) {
          ctx.globalAlpha = (1 - dist / max) * .5;
          ctx.lineWidth = d;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
        }
      }
    }
    requestAnimationFrame(loop);
  }
  loop();
})();
