(() => {
  // Fill these in to enable the order buttons.
  const CONTACT = {
    whatsapp: "", // international format, digits only, e.g. "50588888888"
    email: "",
  };

  const NS = "http://www.w3.org/2000/svg";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

  // NextVolt mark: hexagonal solar panel with a recycling sun at its core.
  function buildMark(svg) {
    const cx = 200, cy = 220;
    const defs = el("defs", {}, svg);
    const clip = el("clipPath", { id: "mclip" }, defs);
    el("polygon", { points: hexPoints(cx, cy, 170) }, clip);
    const shine = el("linearGradient", { id: "mshine", x1: "0", y1: "0", x2: "1", y2: "1" }, defs);
    el("stop", { offset: "0", "stop-color": "#fff", "stop-opacity": "0.35" }, shine);
    el("stop", { offset: "0.5", "stop-color": "#fff", "stop-opacity": "0" }, shine);
    const marker = el("marker", { id: "marrow", viewBox: "0 0 10 10", refX: "5", refY: "5", markerWidth: "3.2", markerHeight: "3.2", orient: "auto-start-reverse" }, defs);
    el("path", { d: "M0 0 L10 5 L0 10 z", class: "m-arrowhead" }, marker);

    el("polygon", { points: hexPoints(cx, cy, 200), class: "m-frame" }, svg);
    el("polygon", { points: hexPoints(cx, cy, 172), class: "m-inner" }, svg);
    const g = el("g", { "clip-path": "url(#mclip)" }, svg);
    const xs = [20, 110, 200, 290, 380];
    const ys = [40, 110, 180, 260, 330, 400];
    const cells = [];
    for (let r = 0; r < ys.length - 1; r++)
      for (let c = 0; c < xs.length - 1; c++)
        cells.push(el("rect", { x: xs[c], y: ys[r], width: xs[c + 1] - xs[c], height: ys[r + 1] - ys[r], class: "m-cell" }, g));
    xs.slice(1, -1).forEach((x) => el("line", { x1: x, y1: 0, x2: x, y2: 440, class: "m-grid" }, g));
    ys.slice(1, -1).forEach((y) => el("line", { x1: 0, y1: y, x2: 400, y2: y, class: "m-grid" }, g));
    el("polygon", { points: "20,40 230,40 20,300", fill: "url(#mshine)" }, g);
    el("circle", { cx, cy, r: 66, class: "m-hub" }, svg);
    el("circle", { cx, cy, r: 24, class: "m-sun" }, svg);
    const arrows = el("g", { class: "m-arrows" }, svg);
    [[200, 330], [20, 150]].forEach(([a1, a2]) => {
      const [x1, y1] = polar(cx, cy, 44, a1);
      const [x2, y2] = polar(cx, cy, 44, a2);
      el("path", { d: `M${x1.toFixed(1)} ${y1.toFixed(1)} A44 44 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`, "marker-end": "url(#marrow)" }, arrows);
    });
    if (!reduceMotion) {
      setInterval(() => {
        const cell = cells[Math.floor(Math.random() * cells.length)];
        cell.classList.add("lit");
        setTimeout(() => cell.classList.remove("lit"), 1200);
      }, 300);
    }
  }
  const hero = document.getElementById("heroMark");
  if (hero) buildMark(hero);

  // Reveal on scroll
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add("is-in");
      io.unobserve(en.target);
    });
  }, { threshold: 0.15 });
  document.querySelectorAll(".reveal").forEach((n) => io.observe(n));

  // Order buttons
  let chosen = "";
  document.querySelectorAll("[data-kit]").forEach((a) =>
    a.addEventListener("click", () => { chosen = a.dataset.kit; renderContact(); })
  );

  const box = document.getElementById("contactButtons");
  const note = document.getElementById("contactNote");
  const baseNote = note.textContent;

  function message() {
    return chosen === "Retiro de paneles"
      ? "Hola NextVolt, tengo paneles solares retirados y quiero coordinar un retiro."
      : `Hola NextVolt, me interesa el kit ${chosen || "solar"}. Mi fuente de agua es: `;
  }

  function renderContact() {
    box.innerHTML = "";
    if (CONTACT.whatsapp) {
      const a = document.createElement("a");
      a.className = "btn btn--gold";
      a.href = `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(message())}`;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = "Escribir por WhatsApp";
      box.appendChild(a);
    }
    if (CONTACT.email) {
      const a = document.createElement("a");
      a.className = "btn btn--ghost";
      a.style.color = "#fff";
      a.style.boxShadow = "inset 0 0 0 2px #fff";
      a.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent("Pedido NextVolt" + (chosen ? " · " + chosen : ""))}&body=${encodeURIComponent(message())}`;
      a.textContent = "Escribir por correo";
      box.appendChild(a);
    }
    const hasContact = Boolean(CONTACT.whatsapp || CONTACT.email);
    note.textContent = hasContact ? baseNote : `Muy pronto abriremos los pedidos. ${baseNote}`;
  }
  renderContact();
})();
