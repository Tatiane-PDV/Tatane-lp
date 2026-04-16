/**
 * Antes e Depois — Slider
 * Drag/touch comparison slider com navegação por pares
 * Sem dependências externas.
 */

(function () {
  'use strict';

  /* ── Config: procedimentos e número de pares por pasta ── */
  const PROCEDURES = [
    { id: 'botox',                      label: 'Botox',                        pairs: 2 },
    { id: 'bioestimulador',             label: 'Bioestimulador',               pairs: 0 },
    { id: 'bioestimulador-de-colageno', label: 'Bioestimulador de Colágeno',   pairs: 0 },
    { id: 'preenchimento-de-mento',     label: 'Preenchimento de Mento',       pairs: 1 },
    { id: 'preenchimento-de-olheiras',  label: 'Preenchimento de Olheiras',    pairs: 2 },
  ].filter(p => p.pairs > 0);

  /* Image base path — resolve relative to this script file, not the HTML page */
  const BASE_PATH = (function () {
    const scripts = document.querySelectorAll('script[src]');
    for (const s of scripts) {
      if (s.src.includes('antes-depois/script.js')) {
        return s.src.replace('script.js', '');
      }
    }
    return 'antes-depois/';
  })();

  /* ── State per panel ── */
  const panelState = {};

  /* ── Build DOM ── */
  function build() {
    const root = document.getElementById('antes-depois');
    if (!root) return;

    root.innerHTML = `
      <section class="ad-section" aria-label="Resultados Antes e Depois">
        <div class="ad-wrap">

          <header class="ad-header ad-rv">
            <p class="ad-label">Resultados Reais</p>
            <h2 class="ad-title">Antes <em>&amp;</em> Depois</h2>
            <p class="ad-subtitle">Transformações reais com técnica, cuidado e naturalidade.</p>
          </header>

          <nav class="ad-tabs ad-rv ad-rv-d1" role="tablist" aria-label="Procedimentos">
            ${PROCEDURES.map((p, i) => `
              <button
                class="ad-tab${i === 0 ? ' active' : ''}"
                role="tab"
                aria-selected="${i === 0}"
                aria-controls="ad-panel-${p.id}"
                data-proc="${p.id}"
              >${p.label}</button>
            `).join('')}
          </nav>

          <div class="ad-panels ad-rv ad-rv-d2">
            ${PROCEDURES.map((p, i) => buildPanel(p, i)).join('')}
          </div>

        </div>
      </section>`;

    /* Init state + bind events */
    PROCEDURES.forEach((p) => {
      panelState[p.id] = { current: 0 };
      const panel = root.querySelector(`#ad-panel-${p.id}`);
      if (panel) initPanel(panel, p);
    });

    /* Tab switching */
    root.querySelectorAll('.ad-tab').forEach((btn) => {
      btn.addEventListener('click', () => switchTab(root, btn.dataset.proc));
    });

    /* Scroll reveal */
    observeReveal(root);
  }

  /* ── Build one panel ── */
  function buildPanel(proc, idx) {
    const pairs = Array.from({ length: proc.pairs }, (_, i) => i);

    return `
      <div
        id="ad-panel-${proc.id}"
        class="ad-panel${idx === 0 ? ' active' : ''}"
        role="tabpanel"
        aria-labelledby="ad-tab-${proc.id}"
        data-proc="${proc.id}"
        data-pairs="${proc.pairs}"
      >
        <div class="ad-stage">

          <!-- Slider -->
          <div class="ad-slider" data-slider>

            <!-- Placeholder (shown while images load) -->
            <div class="ad-placeholder">
              <svg viewBox="0 0 24 24" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <span>Foto em breve</span>
            </div>

            <!-- Depois (full width — base layer) -->
            <img class="ad-img-after" alt="Depois do procedimento" draggable="false" />

            <!-- Antes (clipped — top layer) -->
            <img class="ad-img-before" alt="Antes do procedimento" draggable="false" />

            <!-- Labels -->
            <span class="ad-lbl ad-lbl-antes" aria-hidden="true">Antes</span>
            <span class="ad-lbl ad-lbl-depois" aria-hidden="true">Depois</span>

            <!-- Divider handle -->
            <div class="ad-handle" data-handle aria-hidden="true">
              <span class="ad-handle-icon">
                <svg viewBox="0 0 10 10"><path d="M3 5L1 3M3 5L1 7M7 5L9 3M7 5L9 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>
              </span>
            </div>
          </div>

          <!-- Navigation -->
          ${proc.pairs > 1 ? `
          <nav class="ad-nav" aria-label="Navegar entre resultados">
            <button class="ad-nav-btn ad-prev" aria-label="Par anterior" disabled>
              <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <div class="ad-dots" role="group" aria-label="Resultados">
              ${pairs.map((i) => `<button class="ad-dot${i === 0 ? ' active' : ''}" aria-label="Par ${i + 1}" data-dot="${i}"></button>`).join('')}
            </div>
            <button class="ad-nav-btn ad-next" aria-label="Próximo par">
              <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </nav>
          <p class="ad-counter" aria-live="polite">1 / ${proc.pairs}</p>
          ` : ''}

        </div>
      </div>`;
  }

  /* ── Init slider interaction for a panel ── */
  function initPanel(panel, proc) {
    const slider   = panel.querySelector('[data-slider]');
    const handle   = panel.querySelector('[data-handle]');
    const imgBefore = panel.querySelector('.ad-img-before');
    const imgAfter  = panel.querySelector('.ad-img-after');
    const prevBtn  = panel.querySelector('.ad-prev');
    const nextBtn  = panel.querySelector('.ad-next');
    const dots     = panel.querySelectorAll('.ad-dot');
    const counter  = panel.querySelector('.ad-counter');

    if (!slider) return;

    /* Load first pair */
    loadPair(panel, proc, 0, imgBefore, imgAfter);

    /* ── Drag logic ── */
    let dragging = false;

    function setPosition(clientX) {
      const rect = slider.getBoundingClientRect();
      let pct = (clientX - rect.left) / rect.width;
      pct = Math.max(0.02, Math.min(0.98, pct));
      const pctPx = (pct * 100).toFixed(2);
      imgBefore.style.clipPath = `inset(0 ${(100 - pct * 100).toFixed(2)}% 0 0)`;
      handle.style.left = `${pctPx}%`;
    }

    /* Mouse */
    slider.addEventListener('mousedown', (e) => {
      dragging = true;
      setPosition(e.clientX);
    });
    window.addEventListener('mousemove', (e) => {
      if (dragging) setPosition(e.clientX);
    });
    window.addEventListener('mouseup', () => { dragging = false; });

    /* Touch */
    slider.addEventListener('touchstart', (e) => {
      dragging = true;
      setPosition(e.touches[0].clientX);
    }, { passive: true });
    window.addEventListener('touchmove', (e) => {
      if (dragging) setPosition(e.touches[0].clientX);
    }, { passive: true });
    window.addEventListener('touchend', () => { dragging = false; });

    /* ── Navigation ── */
    if (prevBtn && nextBtn) {
      prevBtn.addEventListener('click', () => navigate(panel, proc, -1, imgBefore, imgAfter, dots, counter, prevBtn, nextBtn));
      nextBtn.addEventListener('click', () => navigate(panel, proc, +1, imgBefore, imgAfter, dots, counter, prevBtn, nextBtn));
      dots.forEach((dot, i) => {
        dot.addEventListener('click', () => goTo(panel, proc, i, imgBefore, imgAfter, dots, counter, prevBtn, nextBtn));
      });
    }
  }

  /* ── Load a before/after image pair ── */
  function loadPair(panel, proc, idx, imgBefore, imgAfter) {
    const n = idx + 1;
    const base = `${BASE_PATH}${proc.id}/`;

    /* Reset slider to center */
    imgBefore.style.clipPath = 'inset(0 50% 0 0)';
    const handle = panel.querySelector('[data-handle]');
    if (handle) handle.style.left = '50%';

    /* Fade swap */
    const slider = panel.querySelector('[data-slider]');
    slider.style.opacity = '0';
    slider.style.transition = 'opacity .2s ease';

    function onLoad() {
      slider.style.opacity = '1';
    }

    imgAfter.src  = `${base}depois-${n}.jpg`;
    imgBefore.src = `${base}antes-${n}.jpg`;

    imgAfter.onload  = onLoad;
    imgBefore.onload = onLoad;

    /* If images fail (placeholder folder), keep placeholder visible */
    imgAfter.onerror  = () => { imgAfter.style.display  = 'none'; slider.style.opacity = '1'; };
    imgBefore.onerror = () => { imgBefore.style.display = 'none'; slider.style.opacity = '1'; };

    /* Make sure hidden images reappear if re-added */
    imgAfter.style.display  = '';
    imgBefore.style.display = '';
  }

  /* ── Navigate between pairs ── */
  function navigate(panel, proc, dir, imgBefore, imgAfter, dots, counter, prevBtn, nextBtn) {
    const state = panelState[proc.id];
    goTo(panel, proc, state.current + dir, imgBefore, imgAfter, dots, counter, prevBtn, nextBtn);
  }

  function goTo(panel, proc, idx, imgBefore, imgAfter, dots, counter, prevBtn, nextBtn) {
    const state = panelState[proc.id];
    idx = Math.max(0, Math.min(proc.pairs - 1, idx));
    if (idx === state.current) return;
    state.current = idx;
    loadPair(panel, proc, idx, imgBefore, imgAfter);
    dots.forEach((d, i) => d.classList.toggle('active', i === idx));
    if (counter) counter.textContent = `${idx + 1} / ${proc.pairs}`;
    if (prevBtn) prevBtn.disabled = idx === 0;
    if (nextBtn) nextBtn.disabled = idx === proc.pairs - 1;
  }

  /* ── Tab switching ── */
  function switchTab(root, procId) {
    root.querySelectorAll('.ad-tab').forEach((t) => {
      const active = t.dataset.proc === procId;
      t.classList.toggle('active', active);
      t.setAttribute('aria-selected', active);
    });
    root.querySelectorAll('.ad-panel').forEach((p) => {
      p.classList.toggle('active', p.dataset.proc === procId);
    });
  }

  /* ── Scroll reveal (IntersectionObserver) ── */
  function observeReveal(root) {
    if (!('IntersectionObserver' in window)) {
      root.querySelectorAll('.ad-rv').forEach((el) => el.classList.add('ad-vis'));
      return;
    }
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('ad-vis'); obs.unobserve(e.target); } });
    }, { threshold: 0.12 });
    root.querySelectorAll('.ad-rv').forEach((el) => obs.observe(el));
  }

  /* ── Kick off when DOM is ready ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
