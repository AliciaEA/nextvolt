(() => {
  const NS = "http://www.w3.org/2000/svg";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let markCount = 0;

  const el = (tag, attrs = {}, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    if (parent) parent.appendChild(n);
    return n;
  };

  const hexPoints = (cx, cy, r) =>
    Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 180) * (60 * i - 90);
      return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
    }).join(" ");

  const polar = (cx, cy, r, deg) => {
    const a = (Math.PI / 180) * deg;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };

  // The NextVolt mark: hexagonal solar panel with a recycling sun at its core.
  function buildMark(svg, { animateCells = false } = {}) {
    const id = `m${markCount++}`;
    const cx = 200, cy = 220;
    const defs = el("defs", {}, svg);
    const clip = el("clipPath", { id: `${id}-clip` }, defs);
    el("polygon", { points: hexPoints(cx, cy, 170) }, clip);
    const shine = el("linearGradient", { id: `${id}-shine`, x1: "0", y1: "0", x2: "1", y2: "1" }, defs);
    el("stop", { offset: "0", "stop-color": "#ffffff", "stop-opacity": "0.35" }, shine);
    el("stop", { offset: "0.5", "stop-color": "#ffffff", "stop-opacity": "0" }, shine);
    const marker = el("marker", { id: `${id}-arrow`, viewBox: "0 0 10 10", refX: "5", refY: "5", markerWidth: "3.2", markerHeight: "3.2", orient: "auto-start-reverse" }, defs);
    el("path", { d: "M0 0 L10 5 L0 10 z", class: "m-arrowhead" }, marker);

    el("polygon", { points: hexPoints(cx, cy, 200), class: "m-frame" }, svg);
    el("polygon", { points: hexPoints(cx, cy, 172), class: "m-inner" }, svg);

    const g = el("g", { "clip-path": `url(#${id}-clip)` }, svg);
    const xs = [20, 110, 200, 290, 380];
    const ys = [40, 110, 180, 260, 330, 400];
    const cells = [];
    for (let r = 0; r < ys.length - 1; r++) {
      for (let c = 0; c < xs.length - 1; c++) {
        cells.push(el("rect", { x: xs[c], y: ys[r], width: xs[c + 1] - xs[c], height: ys[r + 1] - ys[r], class: "m-cell" }, g));
      }
    }
    xs.slice(1, -1).forEach((x) => el("line", { x1: x, y1: 0, x2: x, y2: 440, class: "m-grid" }, g));
    ys.slice(1, -1).forEach((y) => el("line", { x1: 0, y1: y, x2: 400, y2: y, class: "m-grid" }, g));
    el("polygon", { points: "20,40 230,40 20,300", fill: `url(#${id}-shine)` }, g);

    el("circle", { cx, cy, r: 66, class: "m-hub" }, svg);
    el("circle", { cx, cy, r: 24, class: "m-sun" }, svg);
    const arrows = el("g", { class: "m-arrows" }, svg);
    [[200, 330], [20, 150]].forEach(([a1, a2]) => {
      const [x1, y1] = polar(cx, cy, 44, a1);
      const [x2, y2] = polar(cx, cy, 44, a2);
      el("path", { d: `M${x1.toFixed(1)} ${y1.toFixed(1)} A44 44 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`, "marker-end": `url(#${id}-arrow)` }, arrows);
    });

    if (animateCells && !reduceMotion) {
      setInterval(() => {
        const cell = cells[Math.floor(Math.random() * cells.length)];
        cell.classList.add("lit");
        setTimeout(() => cell.classList.remove("lit"), 900 + Math.random() * 900);
      }, 220);
    }
  }

  document.querySelectorAll("#heroMark").forEach((s) => buildMark(s, { animateCells: true }));
  document.querySelectorAll(".mini-mark").forEach((s) => buildMark(s));
  document.querySelectorAll(".core-mark").forEach((s) => buildMark(s, { animateCells: true }));

  // ---------- nav ----------
  const nav = document.querySelector(".nav");
  const burger = document.querySelector(".nav__burger");
  const onScrollNav = () => nav.classList.toggle("is-scrolled", window.scrollY > 10);
  window.addEventListener("scroll", onScrollNav, { passive: true });
  onScrollNav();
  burger.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", String(open));
  });
  nav.querySelectorAll(".nav__links a").forEach((a) =>
    a.addEventListener("click", () => {
      nav.classList.remove("is-open");
      burger.setAttribute("aria-expanded", "false");
    })
  );

  // ---------- counters ----------
  const fmt = (v, dec) => v.toLocaleString("es-ES", { minimumFractionDigits: dec, maximumFractionDigits: dec });
  function runCounter(node) {
    const to = parseFloat(node.dataset.to);
    const dec = parseInt(node.dataset.dec || "0", 10);
    if (reduceMotion) { node.textContent = fmt(to, dec); return; }
    const t0 = performance.now();
    const dur = 1600;
    const tick = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      node.textContent = fmt(to * e, dec);
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  // ---------- reveal ----------
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add("is-in");
        en.target.querySelectorAll(".count").forEach(runCounter);
        io.unobserve(en.target);
      });
    },
    { threshold: 0.18 }
  );
  document.querySelectorAll(".reveal").forEach((n, i) => {
    n.style.transitionDelay = `${(i % 3) * 90}ms`;
    io.observe(n);
  });

  // ---------- journey ----------
  const journey = document.querySelector(".journey");
  const steps = [...document.querySelectorAll(".step")];
  const nodes = [...document.querySelectorAll(".track__nodes li")];
  const fill = document.querySelector(".track__fill");
  const token = document.querySelector(".track__token");
  const line = document.querySelector(".track__line");
  const desktop = window.matchMedia("(min-width: 1021px)");
  let current = -1;

  function setStep(i) {
    if (i === current) return;
    current = i;
    steps.forEach((s, k) => s.classList.toggle("on", k === i));
    nodes.forEach((n, k) => n.classList.toggle("on", k <= i));
  }

  function onJourney() {
    if (!desktop.matches) { steps.forEach((s) => s.classList.add("on")); return; }
    const r = journey.getBoundingClientRect();
    const total = r.height - window.innerHeight;
    const p = Math.min(1, Math.max(0, -r.top / total));
    fill.style.width = `${p * 100}%`;
    token.style.left = `${p * line.offsetWidth}px`;
    setStep(Math.min(steps.length - 1, Math.floor(p * steps.length)));
  }
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { onJourney(); ticking = false; });
  }, { passive: true });
  window.addEventListener("resize", onJourney);
  setStep(0);
  onJourney();

  // ---------- Check simulator + Passport ----------
  const watts = document.getElementById("watts");
  const wOut = document.getElementById("wOut");
  const verdict = document.getElementById("verdict");
  const vBadge = document.getElementById("vBadge");
  const vTitle = document.getElementById("vTitle");
  const vText = document.getElementById("vText");
  const pW = document.getElementById("pW");
  const pSafe = document.getElementById("pSafe");
  const pDest = document.getElementById("pDest");
  const pId = document.getElementById("pId");
  const qr = document.getElementById("qr");
  const passport = document.getElementById("passport");
  const state = { insul: "ok", body: "ok" };

  document.querySelectorAll(".seg").forEach((seg) => {
    seg.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      seg.querySelectorAll("button").forEach((x) => x.classList.toggle("is-on", x === b));
      state[seg.dataset.name] = b.dataset.v;
      update(true);
    });
  });
  watts.addEventListener("input", () => update(false));
  watts.addEventListener("change", () => update(true));

  function seeded(seed) {
    let s = seed >>> 0;
    return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  }

  function drawQR(seed) {
    qr.innerHTML = "";
    const N = 25;
    const rnd = seeded(seed);
    const finder = (x, y) => {
      el("rect", { x, y, width: 7, height: 7 }, qr);
      el("rect", { x: x + 1, y: y + 1, width: 5, height: 5, style: "fill:#fff" }, qr);
      el("rect", { x: x + 2, y: y + 2, width: 3, height: 3 }, qr);
    };
    const inFinder = (x, y) => (x < 8 && y < 8) || (x > N - 9 && y < 8) || (x < 8 && y > N - 9);
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        if (inFinder(x, y)) continue;
        if (rnd() > 0.52) el("rect", { x, y, width: 1, height: 1 }, qr);
      }
    }
    finder(0, 0); finder(N - 7, 0); finder(0, N - 7);
  }

  function update(bump) {
    const w = parseInt(watts.value, 10);
    wOut.textContent = `${w} W`;
    watts.style.setProperty("--p", `${(w / 500) * 100}%`);
    pW.textContent = `${w} W`;

    verdict.classList.remove("is-warn", "is-bad");
    const unsafe = state.insul === "fail" || state.body === "fail";
    if (unsafe) {
      verdict.classList.add("is-bad");
      vBadge.textContent = "No apto";
      vTitle.textContent = "No se reutiliza";
      vText.textContent = state.body === "fail"
        ? "Con vidrio o marco dañados no es seguro reinstalarlo. Va a reparación o a un gestor especializado, con su Passport. Nunca al botadero."
        : "No supera la prueba de seguridad eléctrica. Va a reparación o a un gestor especializado, con su Passport. Nunca al botadero.";
      pSafe.textContent = "No aprobada";
      pDest.textContent = "Reparación o gestor especializado";
    } else if (w < 100) {
      verdict.classList.add("is-warn");
      vBadge.textContent = "Potencia baja";
      vTitle.textContent = "No alcanza para un kit";
      vText.textContent = `Es seguro, pero con ${w} W útiles no cubre ni el kit Doméstico, que necesita al menos 100 W para su bomba de 12 V y 60 W. Se evalúa reparación o gestión especializada.`;
      pSafe.textContent = "Aprobada";
      pDest.textContent = "Reparación o gestor especializado";
    } else {
      vBadge.textContent = "Apto";
      vTitle.textContent = "Apto para segunda vida";
      vText.textContent = `Supera las pruebas con ${w} W útiles. Fit le asigna su nuevo trabajo según la fuente de agua y la altura: el kit Doméstico pide al menos 100 W; Ganado y Agricultura se dimensionan según el caudal y la altura.`;
      pSafe.textContent = "Aprobada";
      pDest.textContent = "Kit NextVolt asignado por Fit";
    }

    const seed = w * 7 + (state.insul === "ok" ? 1 : 3) * 131 + (state.body === "ok" ? 1 : 5) * 977;
    pId.textContent = `NV-26-${String(1000 + (seed % 9000)).padStart(4, "0")}`;
    drawQR(seed);
    if (bump && !reduceMotion) {
      passport.classList.remove("bump");
      void passport.offsetWidth;
      passport.classList.add("bump");
    }
  }
  update(false);
})();
