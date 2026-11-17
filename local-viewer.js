(() => {
  const MIN_ZOOM = 1;
  const MAX_ZOOM = 2.5;
  const STEP = 0.25;

  function openViewer(trigger) {
    const sourceImage = trigger.querySelector("img");
    if (!sourceImage) return;

    let zoom = MIN_ZOOM;
    const overlay = document.createElement("div");
    overlay.className = "image-lightbox";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");

    const label = (trigger.getAttribute("aria-label") || sourceImage.alt || "Image")
      .replace(/^View larger image:\s*/i, "");

    overlay.innerHTML = `
      <div class="image-lightbox__toolbar">
        <p>${label}</p>
        <div class="image-lightbox__actions" aria-label="Image controls">
          <button type="button" data-action="out" aria-label="Zoom out">−</button>
          <button type="button" data-action="reset" aria-label="Reset zoom">100%</button>
          <button type="button" data-action="in" aria-label="Zoom in">+</button>
          <a href="${sourceImage.src}" target="_blank" rel="noreferrer">Open original</a>
          <button type="button" data-action="close" aria-label="Close image viewer">Close</button>
        </div>
      </div>
      <div class="image-lightbox__viewport">
        <img src="${sourceImage.src}" alt="${sourceImage.alt || ""}" draggable="false">
      </div>`;

    const image = overlay.querySelector(".image-lightbox__viewport img");
    const resetButton = overlay.querySelector('[data-action="reset"]');
    const outButton = overlay.querySelector('[data-action="out"]');
    const inButton = overlay.querySelector('[data-action="in"]');
    const closeButton = overlay.querySelector('[data-action="close"]');
    const previousOverflow = document.body.style.overflow;

    function renderZoom() {
      image.style.width = `${zoom * 100}%`;
      resetButton.textContent = `${Math.round(zoom * 100)}%`;
      outButton.disabled = zoom <= MIN_ZOOM;
      inButton.disabled = zoom >= MAX_ZOOM;
    }

    function close() {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      overlay.remove();
      trigger.focus();
    }

    function onKeyDown(event) {
      if (event.key === "Escape") close();
      if (event.key === "+" || event.key === "=") {
        zoom = Math.min(MAX_ZOOM, zoom + STEP);
        renderZoom();
      }
      if (event.key === "-") {
        zoom = Math.max(MIN_ZOOM, zoom - STEP);
        renderZoom();
      }
    }

    outButton.addEventListener("click", () => {
      zoom = Math.max(MIN_ZOOM, zoom - STEP);
      renderZoom();
    });
    inButton.addEventListener("click", () => {
      zoom = Math.min(MAX_ZOOM, zoom + STEP);
      renderZoom();
    });
    resetButton.addEventListener("click", () => {
      zoom = MIN_ZOOM;
      renderZoom();
    });
    closeButton.addEventListener("click", close);
    document.addEventListener("keydown", onKeyDown);

    document.body.style.overflow = "hidden";
    document.body.appendChild(overlay);
    renderZoom();
    closeButton.focus();
  }

  document.querySelectorAll(".image-zoom-trigger").forEach((trigger) => {
    trigger.addEventListener("click", () => openViewer(trigger));
  });
})();

/* Follow-along section progress for case studies (enabled per page with data-follow). */
(() => {
  const brief = document.querySelector(".case-brief[data-follow]");
  const body = document.querySelector(".case-body");
  const header = document.querySelector(".site-header");
  if (!brief || !body || !header || !("IntersectionObserver" in window)) return;

  const steps = [...brief.querySelectorAll("a[href^='#']")]
    .map((link) => {
      const target = document.getElementById(link.getAttribute("href").slice(1));
      const parts = (link.querySelector("span")?.textContent || "").split("/");
      return target && { target, number: (parts[0] || "").trim(), label: (parts[1] || "").trim() };
    })
    .filter(Boolean);
  if (steps.length < 2) return;

  const bar = document.createElement("nav");
  bar.className = "case-progress";
  bar.setAttribute("aria-label", "Sections of this case study");
  const inner = document.createElement("div");
  inner.className = "case-progress__inner";
  const fill = document.createElement("span");
  fill.className = "case-progress__fill";
  fill.setAttribute("aria-hidden", "true");

  const links = steps.map((step) => {
    const a = document.createElement("a");
    a.href = "#" + step.target.id;
    const n = document.createElement("span");
    n.className = "case-progress__n";
    n.textContent = step.number;
    const l = document.createElement("span");
    l.className = "case-progress__l";
    l.textContent = step.label;
    a.append(n, l);
    inner.appendChild(a);
    return a;
  });
  bar.append(inner, fill);
  header.insertAdjacentElement("afterend", bar);
  document.documentElement.classList.add("has-case-progress");

  const setOffset = () => bar.style.setProperty("--progress-top", header.offsetHeight + "px");
  setOffset();
  window.addEventListener("resize", setOffset);

  let shown = false;
  let active = -1;
  let ticking = false;

  function update() {
    ticking = false;
    const line = header.offsetHeight + bar.offsetHeight + 36;
    const briefGone = brief.getBoundingClientRect().bottom < header.offsetHeight;
    const bodyRect = body.getBoundingClientRect();
    const show = briefGone && bodyRect.bottom > line + 80;
    if (show !== shown) {
      shown = show;
      bar.classList.toggle("is-visible", show);
      bar.toggleAttribute("inert", !show);
    }
    let current = 0;
    steps.forEach((step, i) => {
      if (step.target.getBoundingClientRect().top <= line) current = i;
    });
    if (current !== active) {
      active = current;
      links.forEach((a, i) => {
        a.classList.toggle("is-active", i === current);
        if (i === current) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
    }
    const start = steps[0].target.getBoundingClientRect().top - line;
    const total = bodyRect.bottom - steps[0].target.getBoundingClientRect().top - (window.innerHeight - line);
    const done = total > 0 ? Math.min(1, Math.max(0, -start / total)) : 0;
    fill.style.transform = "scaleX(" + done.toFixed(4) + ")";
  }

  bar.setAttribute("inert", "");
  window.addEventListener("scroll", () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });
  window.addEventListener("resize", update);
  update();
})();

/* Responsibility comparison: view switch and change highlight. */
(() => {
  document.querySelectorAll("[data-resp]").forEach((root) => {
    const views = [...root.querySelectorAll("[data-resp-view]")];
    views.forEach((button) => {
      button.addEventListener("click", () => {
        root.dataset.view = button.dataset.respView;
        views.forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
      });
    });
    const toggle = root.querySelector("[data-resp-changes]");
    if (toggle) {
      toggle.addEventListener("click", () => {
        const on = root.dataset.changes !== "on";
        root.dataset.changes = on ? "on" : "off";
        toggle.setAttribute("aria-pressed", String(on));
      });
    }
  });
})();
