(() => {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

  /* ---------- theme ---------- */
  const root = document.documentElement;
  const saved = (() => { try { return localStorage.getItem("theme"); } catch { return null; } })();
  root.dataset.theme = saved || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  $("themeBtn").addEventListener("click", () => {
    root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
    try { localStorage.setItem("theme", root.dataset.theme); } catch {}
  });
  $("menuBtn").addEventListener("click", () => $("menu").classList.toggle("open"));
  $("menu").addEventListener("click", e => { if (e.target.tagName === "A") $("menu").classList.remove("open"); });

  /* ---------- download menu ---------- */
  const dlBtn = $("dlBtn"), dlPop = $("dlPop");
  dlBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    dlPop.hidden = !dlPop.hidden;
    dlBtn.setAttribute("aria-expanded", String(!dlPop.hidden));
  });
  document.addEventListener("click", () => { dlPop.hidden = true; dlBtn.setAttribute("aria-expanded", "false"); });
  document.addEventListener("click", (e) => {
    const b = e.target.closest(".dl-btn"); if (!b) return;
    const old = b.textContent; b.textContent = "✓ Downloading…"; b.classList.add("done");
    setTimeout(() => { b.textContent = old; b.classList.remove("done"); }, 2200);
  });

  /* ---------- load data ---------- */
  const load = (url) => fetch(url, { cache: "no-cache" }).then(r => { if (!r.ok) throw new Error(url); return r.json(); });
  Promise.all([load("data/cv.json"), load("data/gallery.json").catch(() => [])])
    .then(([cv, gallery]) => { render(cv); renderGallery(gallery); observe(); })
    .catch(err => {
      document.querySelector("main").insertAdjacentHTML("afterbegin",
        `<p class="wrap empty">Could not load data (${esc(err.message)}). If you opened the file directly, run <code>python3 -m http.server</code> in this folder and visit http://localhost:8000.</p>`);
    });

  /* ---------- render CV ---------- */
  function render(cv) {
    document.title = `${cv.name} | Portfolio`;
    $("brand").textContent = cv.name.split(" ").map(w => w[0]).join("");
    $("heroName").textContent = cv.name;
    $("location").textContent = "📍 " + cv.location;
    $("tagline").textContent = cv.tagline;
    $("summary").textContent = cv.summary;
    $("langs").innerHTML = "<strong>Languages:</strong> " + cv.languages.map(esc).join(" · ");
    $("footName").textContent = cv.name;
    $("year").textContent = new Date().getFullYear();
    const pdf = cv.cvPdf || cv.cvFile;
    $("cvBtn").href = $("cvBtn2").href = $("dlPdf").href = $("cvPdfBtn").href = pdf;
    $("dlDocx").href = $("cvDocxBtn").href = cv.cvFile;
    $("cvLead").textContent = cv.cvBlurb || "";
    $("cvPoints").innerHTML = (cv.cvPoints || []).map(p => `<li>${esc(p)}</li>`).join("");
    renderDonut(cv.experience);
    $("mailBtn").href = "mailto:" + cv.email;

    const links = [];
    if (cv.links.github) links.push(`<a href="${esc(cv.links.github)}" target="_blank" rel="noopener">GitHub</a>`);
    if (cv.links.linkedin) links.push(`<a href="${esc(cv.links.linkedin)}" target="_blank" rel="noopener">LinkedIn</a>`);
    links.push(`<a href="mailto:${esc(cv.email)}">${esc(cv.email)}</a>`);
    $("social").innerHTML = links.join("");

    typeEffect(cv.typedRoles || [cv.title]);
    const ph = $("photo");
    ph.onerror = () => { ph.onerror = null; ph.src = "images/profile.svg"; };
    ph.src = cv.photo || "images/profile.svg";
    $("heroChips").innerHTML = (cv.heroChips || []).map(c => `<span>${esc(c)}</span>`).join("");

    $("stats").innerHTML = cv.stats.map(s =>
      `<div class="stat reveal"><div class="s-ico">${esc(s.icon || "")}</div><b data-to="${s.value}" data-suffix="${esc(s.suffix)}">0</b><span>${esc(s.label)}</span></div>`).join("");

    $("skillsGrid").innerHTML = cv.skills.map(g => `
      <div class="card reveal"><h3><span class="ico">${g.icon}</span>${esc(g.group)}</h3>
      <div class="tags">${g.items.map(i => `<span class="tag">${esc(i)}</span>`).join("")}</div></div>`).join("");

    renderToolkit(cv.toolkit);
    setupForm(cv);
    renderExperience(cv.experience);

    renderProjects(cv.projects);

    $("eduGrid").innerHTML = cv.education.map(e => `
      <div class="card reveal"><h3><span class="ico">🎓</span>${esc(e.title)}</h3><p>${esc(e.org)}</p><p>${esc(e.period)}</p></div>`).join("");
    $("communityGrid").innerHTML = cv.community.map(c => `
      <div class="card reveal"><h3>${esc(c.title)}</h3><p>${esc(c.place)} · ${esc(c.period)}</p><p>${esc(c.text)}</p></div>`).join("");
  }

  function renderToolkit(t) {
    if (!t || (!t.known.length && !t.learning.length)) return;
    const box = (title, icon, list) => list.length ? `
      <div class="card reveal"><h3>${icon} ${title}</h3>
      <div class="tags">${list.map(i => `<span class="tag">${esc(i)}</span>`).join("")}</div></div>` : "";
    $("toolkitGrid").innerHTML = box("Tools I use", "🧰", t.known) + box("Currently learning", "📚", t.learning);
    $("toolkit").hidden = false;
  }

  function setupForm(cv) {
    const form = $("contactForm"), status = $("formStatus");
    const endpoint = cv.contact && cv.contact.formEndpoint;
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = new FormData(form);
      if (f.get("_gotcha")) return;
      const name = (f.get("name") || "").trim(), email = (f.get("email") || "").trim(), message = (f.get("message") || "").trim();
      if (!name || !/^\S+@\S+\.\S+$/.test(email) || !message) { status.textContent = "Please fill in your name, a valid email and a message."; return; }
      if (!endpoint) {
        const body = `${message}\n\n— ${name} (${email})`;
        location.href = `mailto:${cv.email}?subject=${encodeURIComponent("Portfolio enquiry from " + name)}&body=${encodeURIComponent(body)}`;
        status.textContent = "Opening your email app…";
        return;
      }
      status.textContent = "Sending…";
      try {
        const r = await fetch(endpoint, { method: "POST", headers: { "Accept": "application/json", "Content-Type": "application/json" }, body: JSON.stringify({ name, email, message }) });
        if (!r.ok) throw new Error();
        form.reset(); status.textContent = "Thanks! Your message has been sent.";
      } catch { status.textContent = "Sorry, that didn't send. Please email me directly at " + cv.email; }
    });
  }

  function renderProjects(projects) {
    const tags = ["All", ...new Set(projects.flatMap(p => p.tags))];
    const f = $("projectFilters");
    f.innerHTML = tags.map((t, i) => `<button class="chip ${i === 0 ? "active" : ""}" data-t="${esc(t)}">${esc(t)}</button>`).join("");
    $("projectGrid").innerHTML = projects.map(p => `
      <div class="card project reveal" data-tags="${esc(p.tags.join("|"))}">
        ${p.image ? `<div class="thumb-box"><img class="thumb" src="${esc(p.image)}" alt="${esc(p.title)}" loading="lazy"></div>` : ""}
        <div class="body"><h3>${esc(p.title)}${p.placeholder ? '<span class="badge">sample</span>' : ""}</h3>
        <p>${esc(p.description)}</p>
        <div class="tags">${p.tags.map(t => `<span class="tag">${esc(t)}</span>`).join("")}</div>
        ${p.link ? `<p><a href="${esc(p.link)}" target="_blank" rel="noopener">View project →</a></p>` : ""}</div></div>`).join("");
    f.onclick = (e) => {
      const b = e.target.closest("button"); if (!b) return;
      f.querySelectorAll(".chip").forEach(x => x.classList.toggle("active", x === b));
      document.querySelectorAll("#projectGrid .card").forEach(c =>
        c.classList.toggle("hidden", b.dataset.t !== "All" && !c.dataset.tags.split("|").includes(b.dataset.t)));
    };
  }

  /* ---------- donut: experience mix ---------- */
  function unionMonths(list) {
    const iv = list.map(r => [r.start.getFullYear() * 12 + r.start.getMonth(), r.end.getFullYear() * 12 + r.end.getMonth()]).sort((a, b) => a[0] - b[0]);
    let tot = 0, cur = null;
    for (const [s, e] of iv) {
      if (!cur || s > cur[1]) { if (cur) tot += cur[1] - cur[0]; cur = [s, e]; } else cur[1] = Math.max(cur[1], e);
    }
    return tot + (cur ? cur[1] - cur[0] : 0);
  }
  const fmtM = (m) => { const y = Math.floor(m / 12), r = m % 12; return [y ? y + " yr" + (y > 1 ? "s" : "") : "", r ? r + " mo" : ""].filter(Boolean).join(" ") || "0"; };
  function renderDonut(jobs) {
    const rows = jobs.map(j => ({ ...j, ...parsePeriod(j.period) }));
    const rel = unionMonths(rows.filter(r => r.relevant));
    const all = unionMonths(rows);
    const oth = Math.max(0, all - rel);
    const R = 62, C = 2 * Math.PI * R, f = all ? rel / all : 0;
    $("donutCard").innerHTML = `
      <svg viewBox="0 0 160 160" width="150" height="150" role="img" aria-label="Share of career in data and IT roles">
        <circle cx="80" cy="80" r="${R}" fill="none" stroke="var(--border)" stroke-width="18"/>
        <circle class="seg" cx="80" cy="80" r="${R}" fill="none" stroke="var(--primary)" stroke-width="18" stroke-linecap="round"
          style="stroke-dasharray:${(C * f).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 80 80)"/>
        <text x="80" y="78" text-anchor="middle" class="d-big">${Math.round(f * 100)}%</text>
        <text x="80" y="98" text-anchor="middle" class="d-small">data &amp; IT</text>
      </svg>
      <div class="d-legend">
        <h3>Career mix</h3>
        <p><i class="dot hi"></i><b>${fmtM(rel)}</b> in data, IT and reporting roles</p>
        <p><i class="dot lo"></i><b>${fmtM(oth)}</b> in other roles</p>
        <p class="muted small">Calculated from the dates in my CV; overlapping roles are counted once.</p>
      </div>`;
  }

  /* ---------- career chart ---------- */
  const MON = { Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5, Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11 };
  function parsePeriod(p) {
    const [a, b] = p.split(/\s[–-]\s/);
    const toD = (s) => { s = (s || "").trim(); if (/present/i.test(s)) return new Date(); const [m, y] = s.split(" "); return new Date(+y, MON[m] ?? 0, 1); };
    return { start: toD(a), end: toD(b) };
  }
  function fmtDur(s, e) {
    const m = Math.max(1, Math.round((e - s) / (30.44 * 864e5)));
    const y = Math.floor(m / 12), r = m % 12;
    return [y ? y + " yr" + (y > 1 ? "s" : "") : "", r ? r + " mo" : ""].filter(Boolean).join(" ");
  }
  function renderChart(jobs) {
    const rows = jobs.map((j, i) => ({ ...j, ...parsePeriod(j.period), i })).sort((a, b) => a.start - b.start);
    const y0 = Math.min(...rows.map(r => r.start.getFullYear()));
    const y1 = Math.max(...rows.map(r => r.end.getFullYear())) + 1;
    const W = 1000, L = 270, R = 20, T = 28, RH = 30, H = T + rows.length * RH + 10;
    const x = (d) => L + ((d.getFullYear() + d.getMonth() / 12 - y0) / (y1 - y0)) * (W - L - R);
    let s = "";
    for (let y = y0; y <= y1; y++) if ((y - y0) % 2 === 0 || y === y1)
      s += `<line class="grid-l" x1="${x(new Date(y, 0, 1))}" x2="${x(new Date(y, 0, 1))}" y1="${T - 6}" y2="${H - 6}"/><text x="${x(new Date(y, 0, 1))}" y="14" text-anchor="middle">${y}</text>`;
    rows.forEach((r, k) => {
      const yy = T + k * RH, x1 = x(r.start), w = Math.max(6, x(r.end) - x1);
      const label = r.role + " · " + r.org;
      s += `<text class="lbl" x="${L - 10}" y="${yy + 17}" text-anchor="end">${esc(label.length > 38 ? label.slice(0, 37) + "…" : label)}</text>`;
      s += `<rect class="bar ${r.relevant ? "hi" : "lo"}" data-i="${r.i}" x="${x1}" y="${yy + 3}" width="${w}" height="${RH - 8}" rx="6" data-tip="${esc(r.role + " – " + r.org + " | " + r.period + " | " + fmtDur(r.start, r.end))}"/>`;
    });
    const svg = $("careerChart");
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.innerHTML = s;
    svg.onclick = (e) => {
      const b = e.target.closest(".bar"); if (!b) return;
      if (!state.all) { state.all = true; state.q = ""; $("cvSearch").value = ""; state.draw(); }
      const el = document.querySelector(`.job[data-i="${b.dataset.i}"]`);
      if (el) { el.scrollIntoView({ behavior: "smooth", block: "center" }); el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash"); }
    };
  }

  const state = { all: false, q: "", draw: () => {} };
  function renderExperience(jobs) {
    renderChart(jobs);
    const draw = () => {
      const q = state.q.trim().toLowerCase();
      const match = (j) => !q || [j.role, j.org, j.place, j.period, ...j.points].join(" ").toLowerCase().includes(q);
      let n = 0;
      $("timeline").innerHTML = jobs.map((j, i) => {
        const show = q ? match(j) : (state.all || j.relevant);
        if (show) n++;
        return `<article class="job reveal ${show ? "" : "hidden"}" data-i="${i}">
          <h3>${esc(j.role)}</h3>
          <div class="meta">${esc(j.org)} · ${esc(j.place)} · ${esc(j.period)}</div>
          <ul>${j.points.map(p => `<li>${esc(p)}</li>`).join("")}</ul></article>`;
      }).join("");
      $("expToggle").textContent = state.all ? "Show data & IT roles only" : "Show all roles";
      $("expToggle").setAttribute("aria-pressed", state.all);
      $("expToggle").disabled = !!q;
      $("expNote").textContent = q ? `${n} role${n === 1 ? "" : "s"} match “${state.q.trim()}”.` :
        (state.all ? "Showing every role. Click a bar in the chart to jump to that role." : "Showing roles most relevant to data, IT and reporting. Click a bar in the chart to jump to a role.");
      document.querySelectorAll("#skillsGrid .tag").forEach(t => {
        const hit = q && t.textContent.toLowerCase().includes(q);
        t.classList.toggle("hit", !!hit);
        t.classList.toggle("dim", !!q && !hit);
      });
      observe();
    };
    state.draw = draw;
    $("expToggle").onclick = () => { state.all = !state.all; draw(); };
    $("cvSearch").oninput = (e) => { state.q = e.target.value; draw(); };
    draw();
  }

  /* ---------- typing effect ---------- */
  function typeEffect(words) {
    const el = $("typed");
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { el.textContent = words[0]; return; }
    let w = 0, c = 0, del = false;
    (function tick() {
      const word = words[w];
      el.textContent = word.slice(0, c);
      if (!del && c === word.length) { del = true; return setTimeout(tick, 1400); }
      if (del && c === 0) { del = false; w = (w + 1) % words.length; }
      c += del ? -1 : 1;
      setTimeout(tick, del ? 35 : 70);
    })();
  }

  /* ---------- gallery ---------- */
  let shown = [], idx = 0;
  function renderGallery(items) {
    const grid = $("galleryGrid"), filters = $("galleryFilters");
    if (!items.length) {
      grid.innerHTML = `<div class="empty">No pictures yet. Add images to <code>images/gallery/</code> and they will appear here.</div>`;
      return;
    }
    const cats = ["All", ...new Set(items.map(i => i.category))];
    filters.innerHTML = cats.map((c, i) => `<button class="chip ${i === 0 ? "active" : ""}" data-cat="${esc(c)}">${esc(c)}</button>`).join("");
    const draw = (cat) => {
      shown = cat === "All" ? items : items.filter(i => i.category === cat);
      grid.innerHTML = shown.map((it, n) => `
        <figure class="shot reveal" data-n="${n}">
          <img src="${esc(it.src)}" alt="${esc(it.title)}" loading="lazy">
          <figcaption>${esc(it.title)}${it.year ? " · " + esc(it.year) : ""}</figcaption>
        </figure>`).join("");
      observe();
    };
    filters.onclick = (e) => {
      const b = e.target.closest("button"); if (!b) return;
      filters.querySelectorAll(".chip").forEach(x => x.classList.toggle("active", x === b));
      draw(b.dataset.cat);
    };
    grid.onclick = (e) => { const f = e.target.closest(".shot"); if (f) open(+f.dataset.n); };
    draw("All");
  }

  const lb = $("lightbox");
  function open(n) { idx = n; show(); lb.hidden = false; document.body.style.overflow = "hidden"; }
  let timer = null;
  function stopShow() { clearInterval(timer); timer = null; $("lbPlay").classList.remove("on"); $("lbPlay").textContent = "▶ Slideshow"; }
  function close() { stopShow(); lb.hidden = true; document.body.style.overflow = ""; }
  $("lbPlay").onclick = () => {
    if (timer) return stopShow();
    $("lbPlay").classList.add("on"); $("lbPlay").textContent = "⏸ Pause";
    timer = setInterval(() => step(1), 3000);
  };
  let tx = 0;
  lb.addEventListener("touchstart", e => { tx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", e => { const dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1); });
  function show() {
    const it = shown[idx];
    $("lbImg").src = it.src; $("lbImg").alt = it.title;
    $("lbCap").textContent = [it.title, it.year, it.description].filter(Boolean).join(" · ");
  }
  const step = (d) => { idx = (idx + d + shown.length) % shown.length; show(); };
  $("lbClose").onclick = close;
  $("lbPrev").onclick = () => step(-1);
  $("lbNext").onclick = () => step(1);
  lb.addEventListener("click", e => { if (e.target === lb) close(); });
  document.addEventListener("keydown", e => {
    if (lb.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });

  /* ---------- scroll reveal + counters + active nav ---------- */
  let io;
  function observe() {
    io = io || new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        en.target.classList.add("in");
        const b = en.target.querySelector("b[data-to]");
        if (b && !b.dataset.done) { b.dataset.done = 1; count(b); }
        io.unobserve(en.target);
      });
    }, { threshold: .15 });
    document.querySelectorAll(".reveal:not(.in)").forEach(el => io.observe(el));
  }
  function count(el) {
    const to = +el.dataset.to, suf = el.dataset.suffix || "", t0 = performance.now();
    (function f(t) {
      const p = Math.min((t - t0) / 900, 1);
      el.textContent = Math.round(to * p) + (p === 1 ? suf : "");
      if (p < 1) requestAnimationFrame(f);
    })(t0);
  }
  const links = [...document.querySelectorAll("#menu a")];
  const spy = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) links.forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id));
  }), { rootMargin: "-45% 0px -50% 0px" });
  links.forEach(a => { const s = document.querySelector(a.getAttribute("href")); if (s) spy.observe(s); });
})();
