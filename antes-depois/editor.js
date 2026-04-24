/**
 * Antes e Depois — Editor de Posicionamento
 * ─────────────────────────────────────────
 * USO TEMPORÁRIO: remove o <script> do index.html após ajustar.
 *
 * Como usar:
 *  1. Clique em "✎ Editar Fotos" (canto inferior direito)
 *  2. Clique na metade esquerda (Antes) ou direita (Depois) para selecionar
 *  3. Use os sliders Horizontal / Vertical / Zoom no painel lateral
 *  4. Ou use o scroll do mouse sobre a foto para dar zoom
 *  5. O slider de comparação continua funcionando normalmente
 *  6. Clique em "Copiar Config" e envie o JSON gerado
 */

(function () {
  'use strict';

  /* ── Storage para as configs por imagem ── */
  // chave: "proc:pair:side"  (ex: "botox:1:antes")
  // valor: { x: 50, y: 50, scale: 1 }
  const CONFIG = {};

  function key(proc, pair, side) {
    return `${proc}:${pair}:${side}`;
  }

  function getConf(proc, pair, side) {
    const k = key(proc, pair, side);
    if (!CONFIG[k]) CONFIG[k] = { x: 50, y: 50, scale: 1 };
    return CONFIG[k];
  }

  function applyConf(img, conf) {
    img.style.objectPosition = `${conf.x}% ${conf.y}%`;
    img.style.transform      = `scale(${conf.scale})`;
    img.style.transformOrigin = `${conf.x}% ${conf.y}%`;
  }

  /* ── Detecta proc/pair de um painel ── */
  function getPanelInfo(panel) {
    const proc = panel.dataset.proc;
    const state = window.__adPanelState && window.__adPanelState[proc];
    const pair  = state ? state.current + 1 : 1;
    return { proc, pair };
  }

  /* ── UI do editor ── */
  let editMode = false;
  let selectedImg  = null;
  let selectedInfo = null; // { proc, pair, side }

  function buildUI() {
    /* Botão toggle */
    const toggle = document.createElement('button');
    toggle.id = 'ad-edit-toggle';
    toggle.textContent = '✎ Editar Fotos';
    toggle.style.cssText = `
      position: fixed; bottom: 24px; right: 24px; z-index: 9999;
      font-family: 'Archivo', sans-serif; font-size: 13px; font-weight: 500;
      padding: 0 1.25rem; height: 40px; border-radius: 100px;
      background: rgb(111,59,36); color: #fff; border: none; cursor: pointer;
      box-shadow: 0 4px 16px rgba(111,59,36,.35);
      transition: background .2s, transform .15s;
    `;
    toggle.addEventListener('mouseenter', () => toggle.style.background = 'rgb(159,84,52)');
    toggle.addEventListener('mouseleave', () => toggle.style.background = editMode ? 'rgb(159,84,52)' : 'rgb(111,59,36)');
    toggle.addEventListener('click', () => setEditMode(!editMode));

    /* Painel lateral */
    const panel = document.createElement('div');
    panel.id = 'ad-edit-panel';
    panel.style.cssText = `
      position: fixed; bottom: 76px; right: 24px; z-index: 9999;
      width: 260px; background: #fff;
      border: 1px solid rgba(159,84,52,.2);
      border-radius: 10px; padding: 16px;
      box-shadow: 0 8px 32px rgba(111,59,36,.12);
      font-family: 'Archivo', sans-serif; font-size: 13px; color: rgb(111,59,36);
      display: none;
    `;

    panel.innerHTML = `
      <div style="font-weight:600;margin-bottom:12px;font-size:14px">Ajustar foto</div>
      <div id="ad-edit-hint" style="opacity:.55;font-size:12px;line-height:1.5;margin-bottom:12px">
        Clique em Antes ou Depois para selecionar.<br>
        Use os sliders para reposicionar.<br>
        Scroll do mouse para zoom.
      </div>
      <div id="ad-edit-target" style="display:none">
        <div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;opacity:.5;margin-bottom:8px" id="ad-edit-label">—</div>
        <label style="display:block;margin-bottom:6px">
          Horizontal
          <input type="range" id="ad-edit-x" min="0" max="100" value="50" style="width:100%;margin-top:4px;accent-color:rgb(159,84,52)">
        </label>
        <label style="display:block;margin-bottom:6px">
          Vertical
          <input type="range" id="ad-edit-y" min="0" max="100" value="50" style="width:100%;margin-top:4px;accent-color:rgb(159,84,52)">
        </label>
        <label style="display:block;margin-bottom:12px">
          Zoom
          <input type="range" id="ad-edit-scale" min="100" max="200" value="100" style="width:100%;margin-top:4px;accent-color:rgb(159,84,52)">
        </label>
        <div style="font-size:11px;opacity:.45;margin-bottom:10px" id="ad-edit-values">pos: 50% 50% · zoom: 1×</div>
      </div>
      <button id="ad-copy-btn" style="
        width:100%; height:36px; border-radius:100px;
        background:rgb(159,84,52); color:#fff; border:none;
        font-family:'Archivo',sans-serif; font-size:13px; font-weight:500;
        cursor:pointer; margin-top:4px;
      ">Copiar Config ↗</button>
      <div id="ad-copy-ok" style="font-size:11px;color:rgb(159,84,52);margin-top:6px;display:none;text-align:center">
        ✓ Copiado! Envie o JSON ao Claude.
      </div>
    `;

    document.body.appendChild(toggle);
    document.body.appendChild(panel);

    /* Sliders */
    ['ad-edit-x','ad-edit-y','ad-edit-scale'].forEach(id => {
      document.getElementById(id).addEventListener('input', onSliderChange);
    });

    /* Copy */
    document.getElementById('ad-copy-btn').addEventListener('click', copyConfig);
  }

  function setEditMode(on) {
    editMode = on;
    const toggle = document.getElementById('ad-edit-toggle');
    const uiPanel = document.getElementById('ad-edit-panel');
    toggle.textContent = on ? '✕ Sair do Editor' : '✎ Editar Fotos';
    toggle.style.background = on ? 'rgb(159,84,52)' : 'rgb(111,59,36)';
    uiPanel.style.display = on ? 'block' : 'none';

    if (on) {
      mountOverlays();
    } else {
      removeOverlays();
      selectedImg  = null;
      selectedInfo = null;
    }
  }

  /* ── Overlays clicáveis (um para "antes", outro para "depois") ── */
  /* Resolve o problema de pointer-events:none e clip-path nas imagens  */

  function mountOverlays() {
    document.querySelectorAll('.ad-panel.active [data-slider]').forEach(slider => {
      addOverlaysToSlider(slider);
    });
  }

  function addOverlaysToSlider(slider) {
    if (slider.querySelector('.ad-edit-overlay')) return; // já tem

    ['antes', 'depois'].forEach(side => {
      const ov = document.createElement('div');
      ov.className = 'ad-edit-overlay';
      ov.dataset.side = side;
      ov.style.cssText = `
        position: absolute;
        top: 0; bottom: 0;
        ${side === 'antes' ? 'left: 0; right: 50%' : 'left: 50%; right: 0'};
        z-index: 20;
        cursor: pointer;
        user-select: none;
      `;

      /* Labels de orientação */
      const lbl = document.createElement('div');
      lbl.textContent = side === 'antes' ? '← clique para editar ANTES' : 'clique para editar DEPOIS →';
      lbl.style.cssText = `
        position: absolute; bottom: 52px;
        ${side === 'antes' ? 'left: 8px' : 'right: 8px'};
        font-family: 'Archivo', sans-serif;
        font-size: 10px; letter-spacing: .08em; text-transform: uppercase;
        color: #fff; background: rgba(159,84,52,.7);
        padding: 3px 8px; border-radius: 100px; pointer-events: none;
        white-space: nowrap;
      `;
      ov.appendChild(lbl);

      ov.addEventListener('click', (e) => onOverlayClick(e, slider, side));
      ov.addEventListener('wheel', (e) => onOverlayWheel(e, slider, side), { passive: false });
      slider.appendChild(ov);
    });
  }

  function removeOverlays() {
    document.querySelectorAll('.ad-edit-overlay').forEach(el => el.remove());
    document.querySelectorAll('.ad-edit-selected-outline').forEach(el => {
      el.style.outline = '';
      el.classList.remove('ad-edit-selected-outline');
    });
  }

  /* ── Selecionar via overlay ── */
  function onOverlayClick(e, slider, side) {
    e.stopPropagation();

    const adPanel = slider.closest('.ad-panel');
    const { proc, pair } = getPanelInfo(adPanel);
    const img = side === 'antes'
      ? slider.querySelector('.ad-img-before')
      : slider.querySelector('.ad-img-after');

    /* Limpa seleção anterior */
    document.querySelectorAll('.ad-edit-selected-outline').forEach(el => {
      el.style.outline = '';
      el.classList.remove('ad-edit-selected-outline');
    });

    /* Destaca a imagem selecionada */
    if (img) {
      img.style.outline = `3px solid rgb(159,84,52)`;
      img.style.pointerEvents = 'none'; // mantém inerte para drag funcionar pelo overlay
      img.classList.add('ad-edit-selected-outline');
    }

    /* Destaca o overlay ativo */
    slider.querySelectorAll('.ad-edit-overlay').forEach(ov => {
      ov.style.background = '';
    });
    e.currentTarget.style.background = 'rgba(159,84,52,.08)';

    selectedImg  = img;
    selectedInfo = { proc, pair, side };

    const conf = getConf(proc, pair, side);
    document.getElementById('ad-edit-target').style.display = 'block';
    document.getElementById('ad-edit-hint').style.display   = 'none';
    document.getElementById('ad-edit-label').textContent    = `${proc} · par ${pair} · ${side}`;
    document.getElementById('ad-edit-x').value     = conf.x;
    document.getElementById('ad-edit-y').value     = conf.y;
    document.getElementById('ad-edit-scale').value = Math.round(conf.scale * 100);
    updateValues(conf);
  }

  /* ── Zoom pelo overlay ── */
  function onOverlayWheel(e, slider, side) {
    if (!selectedInfo || selectedInfo.side !== side) return;
    e.preventDefault();
    const conf = getConf(selectedInfo.proc, selectedInfo.pair, side);
    conf.scale = Math.max(1, Math.min(2, conf.scale - e.deltaY * 0.001));
    if (selectedImg) applyConf(selectedImg, conf);
    document.getElementById('ad-edit-scale').value = Math.round(conf.scale * 100);
    updateValues(conf);
  }

  /* ── Sliders ── */
  function onSliderChange() {
    if (!selectedImg || !selectedInfo) return;
    const conf = getConf(selectedInfo.proc, selectedInfo.pair, selectedInfo.side);
    conf.x     = parseFloat(document.getElementById('ad-edit-x').value);
    conf.y     = parseFloat(document.getElementById('ad-edit-y').value);
    conf.scale = parseFloat(document.getElementById('ad-edit-scale').value) / 100;
    applyConf(selectedImg, conf);
    updateValues(conf);
  }

  function updateValues(conf) {
    document.getElementById('ad-edit-values').textContent =
      `pos: ${conf.x.toFixed(0)}% ${conf.y.toFixed(0)}% · zoom: ${conf.scale.toFixed(2)}×`;
  }

  /* ── Reaplicar config e overlays ao trocar par/tab ── */
  /* Só chamado quando um .ad-panel ou .ad-tab muda de active — não quando
     o editor mesmo adiciona classes de seleção nas imagens.             */
  function reapplyAll(mutations) {
    /* Filtra: só reage a mudanças de classe em .ad-panel ou .ad-tab */
    const relevant = mutations && mutations.some(m => {
      const el = m.target;
      return el.classList.contains('ad-panel') || el.classList.contains('ad-tab');
    });
    if (mutations && !relevant) return; /* ignora mudanças do editor */

    document.querySelectorAll('.ad-panel.active').forEach(panel => {
      const { proc, pair } = getPanelInfo(panel);
      const imgBefore = panel.querySelector('.ad-img-before');
      const imgAfter  = panel.querySelector('.ad-img-after');
      if (imgBefore) applyConf(imgBefore, getConf(proc, pair, 'antes'));
      if (imgAfter)  applyConf(imgAfter,  getConf(proc, pair, 'depois'));
    });

    if (editMode) {
      /* Remove overlays de painéis inativos, readiciona nos ativos */
      document.querySelectorAll('.ad-panel:not(.active) .ad-edit-overlay').forEach(el => el.remove());
      document.querySelectorAll('.ad-panel.active [data-slider]').forEach(slider => {
        addOverlaysToSlider(slider);
      });
      /* Reseta seleção só em troca real de tab/par */
      selectedImg  = null;
      selectedInfo = null;
      document.getElementById('ad-edit-target').style.display = 'none';
      document.getElementById('ad-edit-hint').style.display   = 'block';
    }
  }

  /* Observa mudanças de classe apenas nos .ad-panel e .ad-tab (não subtree inteiro) */
  const mutObs = new MutationObserver(reapplyAll);

  /* ── Exportar config ── */
  function copyConfig() {
    const out = {};
    for (const [k, v] of Object.entries(CONFIG)) {
      const [proc, pair, side] = k.split(':');
      if (!out[proc]) out[proc] = {};
      if (!out[proc][pair]) out[proc][pair] = {};
      out[proc][pair][side] = {
        x: parseFloat(v.x.toFixed(1)),
        y: parseFloat(v.y.toFixed(1)),
        scale: parseFloat(v.scale.toFixed(3)),
      };
    }
    const json = JSON.stringify(out, null, 2);
    navigator.clipboard.writeText(json).then(() => {
      const ok = document.getElementById('ad-copy-ok');
      ok.style.display = 'block';
      setTimeout(() => { ok.style.display = 'none'; }, 3000);
    });
  }

  /* ── Init ── */
  function init() {
    buildUI();

    const container = document.getElementById('antes-depois');
    if (container) {
      mutObs.observe(container, { subtree: true, attributes: true, attributeFilter: ['class'] });
    }

    /* Reaplica config quando o usuário navega entre pares */
    document.addEventListener('ad:pairChanged', () => reapplyAll(null));

    /* Expõe estado dos pares para o editor */
    const origBuild = window.__adRegisterState;
    document.addEventListener('ad:stateReady', (e) => {
      window.__adPanelState = e.detail;
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
