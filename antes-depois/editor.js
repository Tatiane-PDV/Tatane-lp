/**
 * Antes e Depois — Editor de Posicionamento
 * ─────────────────────────────────────────
 * USO TEMPORÁRIO: remove o <script> do index.html após ajustar.
 *
 * Como usar:
 *  1. Clique em "✎ Editar Fotos" (canto inferior direito)
 *  2. Clique em qualquer foto (Antes ou Depois) para selecioná-la
 *  3. Arraste para reposicionar
 *  4. Use a roda do mouse (ou slider) para dar zoom
 *  5. Navegue entre os pares normalmente
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
  let dragActive   = false;
  let dragStart    = { x: 0, y: 0, ox: 50, oy: 50 };

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
        Clique em uma foto para selecionar.<br>
        Arraste para reposicionar.<br>
        Scroll para zoom.
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
    const panel  = document.getElementById('ad-edit-panel');
    toggle.textContent = on ? '✕ Sair do Editor' : '✎ Editar Fotos';
    toggle.style.background = on ? 'rgb(159,84,52)' : 'rgb(111,59,36)';
    panel.style.display = on ? 'block' : 'none';

    document.querySelectorAll('.ad-img-before, .ad-img-after').forEach(img => {
      if (on) {
        img.style.cursor = 'grab';
        img.style.transition = 'none';
        img.addEventListener('mousedown', onImgMouseDown);
        img.addEventListener('wheel', onImgWheel, { passive: false });
        img.addEventListener('click', onImgClick);
      } else {
        img.style.cursor = '';
        img.removeEventListener('mousedown', onImgMouseDown);
        img.removeEventListener('wheel', onImgWheel);
        img.removeEventListener('click', onImgClick);
      }
    });

    if (!on) {
      selectedImg  = null;
      selectedInfo = null;
      document.querySelectorAll('.ad-edit-selected').forEach(el => el.classList.remove('ad-edit-selected'));
    }
  }

  /* ── Selecionar imagem ao clicar ── */
  function onImgClick(e) {
    e.stopPropagation();
    if (dragActive) return;

    const img    = e.currentTarget;
    const panel  = img.closest('.ad-panel');
    const { proc, pair } = getPanelInfo(panel);
    const side   = img.classList.contains('ad-img-before') ? 'antes' : 'depois';

    document.querySelectorAll('.ad-edit-selected').forEach(el => el.classList.remove('ad-edit-selected'));
    img.style.outline = '3px solid rgb(159,84,52)';
    img.classList.add('ad-edit-selected');

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

  /* ── Drag para reposicionar ── */
  function onImgMouseDown(e) {
    if (!editMode || !e.currentTarget.classList.contains('ad-edit-selected')) return;
    e.preventDefault();
    dragActive = false;
    const img = e.currentTarget;
    const conf = getConf(selectedInfo.proc, selectedInfo.pair, selectedInfo.side);
    dragStart = { x: e.clientX, y: e.clientY, ox: conf.x, oy: conf.y };
    img.style.cursor = 'grabbing';

    function onMove(ev) {
      const dx = ev.clientX - dragStart.x;
      const dy = ev.clientY - dragStart.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragActive = true;
      const rect = img.parentElement.getBoundingClientRect();
      conf.x = Math.max(0, Math.min(100, dragStart.ox - (dx / rect.width)  * 100));
      conf.y = Math.max(0, Math.min(100, dragStart.oy - (dy / rect.height) * 100));
      applyConf(img, conf);
      document.getElementById('ad-edit-x').value = conf.x.toFixed(0);
      document.getElementById('ad-edit-y').value = conf.y.toFixed(0);
      updateValues(conf);
    }

    function onUp() {
      img.style.cursor = 'grab';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      setTimeout(() => { dragActive = false; }, 50);
    }

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  /* ── Scroll para zoom ── */
  function onImgWheel(e) {
    if (!editMode || !selectedImg || e.currentTarget !== selectedImg) return;
    e.preventDefault();
    const conf = getConf(selectedInfo.proc, selectedInfo.pair, selectedInfo.side);
    conf.scale = Math.max(1, Math.min(2, conf.scale - e.deltaY * 0.001));
    applyConf(selectedImg, conf);
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

  /* ── Reaplicar config ao trocar par/tab ── */
  function reapplyAll() {
    document.querySelectorAll('.ad-panel.active').forEach(panel => {
      const { proc, pair } = getPanelInfo(panel);
      const imgBefore = panel.querySelector('.ad-img-before');
      const imgAfter  = panel.querySelector('.ad-img-after');
      if (imgBefore) applyConf(imgBefore, getConf(proc, pair, 'antes'));
      if (imgAfter)  applyConf(imgAfter,  getConf(proc, pair, 'depois'));
    });
  }

  /* Observa mudanças no DOM (troca de par/tab) */
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
