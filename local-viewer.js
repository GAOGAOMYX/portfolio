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
