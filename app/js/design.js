// ═══════════════════════════════════════════════════
// design.js — оформление по экранам, панель 🖌,
// черновик, макет, «Применить к…», предпросмотр.
// Загружается после bg.js, до screens.js.
// ═══════════════════════════════════════════════════

// ─── Константы оформления ───
const DESIGN_KEY = 'design';
const DESIGN_SCREENS = ['home','favorites','plan','pantry'];
const DESIGN_DEFAULTS = {
  style: 'nezhny',
  palette: 'pudrovaya',
  shade: 'nezhnaya',
  shadow: 'parit',
  fabShadow: 'parit',
  theme: 'light',
  bg: ''
};

// ═══════════════════════════════════════════════════
// Загрузка и сохранение оформления
// ═══════════════════════════════════════════════════

function loadDesignData(){
  if (designData) return designData;
  designData = {};
  DESIGN_SCREENS.forEach(s => designData[s] = { ...DESIGN_DEFAULTS });
  return designData;
}

async function loadDesignFromStorage(){
  const d = loadDesignData();
  const v = await Storage.getSetting('design');
  if (v && typeof v === 'object'){
    DESIGN_SCREENS.forEach(s => {
      d[s] = { ...DESIGN_DEFAULTS, ...(v[s] || {}) };
    });
  }
  return d;
}

function getDesignFor(screen){
  const d = loadDesignData();
  return d[screen] || { ...DESIGN_DEFAULTS };
}

function getActiveDesign(){
  return designDraft || getDesignFor(activeDesignScreen);
}

function setDesignFor(screen, patch){
  const d = loadDesignData();
  d[screen] = { ...(d[screen] || DESIGN_DEFAULTS), ...patch };
  Storage.saveSetting('design', d);
}

function applyDesignFor(screen){
  activeDesignScreen = screen;
  const s = getDesignFor(screen);
  document.body.dataset.style = s.style;
  document.body.dataset.palette = s.palette + '-' + s.shade;
  document.body.dataset.shadow = s.shadow;
  document.body.dataset.fabShadow = s.fabShadow;
  if (s.theme === 'dark') document.body.dataset.theme = 'dark';
  else delete document.body.dataset.theme;
  applyBg(s.bg || '');
  syncStyleActive();
  syncPaletteActive();
  syncShadowActive();
  syncBgActive();
  syncThemeToggle();
}

// ═══════════════════════════════════════════════════
// Панель 🖌 — открытие/закрытие, макет
// ═══════════════════════════════════════════════════

const designPanel = document.getElementById('designPanel');

function syncMockupScope(){
  const mock = document.querySelector('.design-panel-mockup');
  if (!mock) return;
  const s = getActiveDesign();
  mock.dataset.style = s.style;
  mock.dataset.palette = s.palette + '-' + s.shade;
  mock.dataset.shadow = s.shadow;
  if (s.theme === 'dark') mock.dataset.theme = 'dark';
  else delete mock.dataset.theme;

  const bgImg = document.getElementById('dmBg');
  if (bgImg){
    if (s.bg){
      bgImg.src = 'images/' + s.bg + '.jpg';
      bgImg.classList.add('dm-bg-on');
    } else {
      bgImg.removeAttribute('src');
      bgImg.classList.remove('dm-bg-on');
    }
  }
}

function syncMockupAspect(){
  const mock = document.querySelector('.design-panel-mockup');
  if (!mock) return;
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (w > 0 && h > 0){
    mock.style.aspectRatio = w + ' / ' + h;
  }
}

function openDesignPanel(){
  designDraft = { ...getActiveDesign() };
  syncStyleActive();
  syncPaletteActive();
  syncShadowActive();
  syncBgActive();
  syncThemeToggle();
  syncMockupScope();
  syncMockupAspect();
  designPanel.style.display = 'flex';
}

function closeDesignPanel(){
  designDraft = null;
  designPanel.style.display = 'none';
}

// ═══════════════════════════════════════════════════
// Окошко «Применить к…» и режим предпросмотра
// ═══════════════════════════════════════════════════

const modalApplyTo    = document.getElementById('modalApplyTo');
const applyToChecks   = modalApplyTo.querySelectorAll('.apply-to-check');
const applyToConfirm  = document.getElementById('applyToConfirm');
const previewBar      = document.getElementById('previewBar');
let isPreviewing = false;

function openApplyTo(){
  applyToChecks.forEach(c => { c.checked = false; });
  applyToConfirm.disabled = true;
  modalApplyTo.style.display = 'flex';
}

function closeApplyTo(){
  modalApplyTo.style.display = 'none';
  if (isPreviewing) exitPreview();
}

function applyDraftToBody(){
  if (!designDraft) return;
  const s = designDraft;
  document.body.dataset.style = s.style;
  document.body.dataset.palette = s.palette + '-' + s.shade;
  document.body.dataset.shadow = s.shadow;
  document.body.dataset.fabShadow = s.fabShadow;
  if (s.theme === 'dark') document.body.dataset.theme = 'dark';
  else delete document.body.dataset.theme;
  applyBg(s.bg || '');
}

function enterPreview(){
  if (!designDraft) return;
  applyDraftToBody();
  designPanel.style.display = 'none';
  previewBar.style.display = 'flex';
  isPreviewing = true;
}

function exitPreview(){
  applyDesignFor(activeDesignScreen);
  previewBar.style.display = 'none';
  designPanel.style.display = 'flex';
  isPreviewing = false;
}

// ─── Кнопки предпросмотра ───
document.getElementById('dpPreview').addEventListener('click', enterPreview);
document.getElementById('previewBack').addEventListener('click', exitPreview);
document.getElementById('previewApply').addEventListener('click', openApplyTo);

// ─── Чекбоксы «Применить к…» ───
function applyToToggleBtn(){
  const anyChecked = Array.from(applyToChecks).some(c => c.checked);
  applyToConfirm.disabled = !anyChecked;
}
applyToChecks.forEach(c => {
  c.addEventListener('change', applyToToggleBtn);
});

// ─── Кнопки окошка «Применить к…» ───
document.getElementById('dpApply').addEventListener('click', openApplyTo);
document.getElementById('applyToClose').addEventListener('click', closeApplyTo);
document.getElementById('applyToCancel').addEventListener('click', closeApplyTo);
modalApplyTo.addEventListener('click', (e) => {
  if (e.target === modalApplyTo) closeApplyTo();
});

applyToConfirm.addEventListener('click', () => {
  if (!designDraft) { closeApplyTo(); return; }
  const chosen = [];
  applyToChecks.forEach(c => { if (c.checked) chosen.push(c.value); });
  if (!chosen.length) return;

  chosen.forEach(screen => {
    setDesignFor(screen, designDraft);
  });

  modalApplyTo.style.display = 'none';
  previewBar.style.display = 'none';
  isPreviewing = false;
  closeDesignPanel();
  applyDesignFor(activeDesignScreen);
});

// ═══════════════════════════════════════════════════
// Стили
// ═══════════════════════════════════════════════════

const dpStyles = document.getElementById('dpStyles');

function syncStyleActive(){
  const cur = getActiveDesign().style;
  dpStyles.querySelectorAll('.dp-chip').forEach(b => {
    b.classList.toggle('active', b.dataset.s === cur);
  });
}
dpStyles.querySelectorAll('.dp-chip').forEach(btn => {
  btn.addEventListener('click', () => {
    if (!designDraft) return;
    designDraft.style = btn.dataset.s;
    syncStyleActive();
    syncMockupScope();
  });
});

// ═══════════════════════════════════════════════════
// Палитра и оттенки
// ═══════════════════════════════════════════════════

const dpPalettes = document.getElementById('dpPalettes');
const dpShades   = document.getElementById('dpShades');

function syncPaletteActive(){
  const s = getActiveDesign();
  dpPalettes.querySelectorAll('.dp-chip').forEach(b => {
    b.classList.toggle('active', b.dataset.p === s.palette);
  });
  dpShades.querySelectorAll('.dp-chip').forEach(b => {
    b.classList.toggle('active', b.dataset.shade === s.shade);
  });
}
dpPalettes.querySelectorAll('.dp-chip').forEach(btn => {
  btn.addEventListener('click', () => {
    if (!designDraft) return;
    designDraft.palette = btn.dataset.p;
    syncPaletteActive();
    syncMockupScope();
  });
});
dpShades.querySelectorAll('.dp-chip').forEach(btn => {
  btn.addEventListener('click', () => {
    if (!designDraft) return;
    designDraft.shade = btn.dataset.shade;
    syncPaletteActive();
    syncMockupScope();
  });
});

// ═══════════════════════════════════════════════════
// Тени
// ═══════════════════════════════════════════════════

const dpShadowsCards = document.getElementById('dpShadowsCards');
const dpShadowsFab   = document.getElementById('dpShadowsFab');
const dpShadowTabs   = document.getElementById('dpShadowTabs');
const SHADOW_TAB_KEY = 'designShadowTab';

let currentShadowTab = 'cards';
try {
  const savedTab = localStorage.getItem(SHADOW_TAB_KEY);
  if (savedTab === 'cards' || savedTab === 'fab') currentShadowTab = savedTab;
} catch(e) {}

function syncShadowActive(){
  const s = getActiveDesign();
  dpShadowsCards.querySelectorAll('.dp-chip').forEach(b => {
    b.classList.toggle('active', b.dataset.sh === s.shadow);
  });
  dpShadowsFab.querySelectorAll('.dp-chip').forEach(b => {
    b.classList.toggle('active', b.dataset.sh === s.fabShadow);
  });
  dpShadowTabs.querySelectorAll('.dp-chip').forEach(b => {
    b.classList.toggle('active', b.dataset.shadowTarget === currentShadowTab);
  });
  dpShadowsCards.style.display = (currentShadowTab === 'cards') ? '' : 'none';
  dpShadowsFab.style.display   = (currentShadowTab === 'fab')   ? '' : 'none';
}
dpShadowsCards.querySelectorAll('.dp-chip').forEach(btn => {
  btn.addEventListener('click', () => {
    if (!designDraft) return;
    designDraft.shadow = btn.dataset.sh;
    syncShadowActive();
    syncMockupScope();
  });
});
dpShadowsFab.querySelectorAll('.dp-chip').forEach(btn => {
  btn.addEventListener('click', () => {
    if (!designDraft) return;
    designDraft.fabShadow = btn.dataset.sh;
    syncShadowActive();
  });
});
dpShadowTabs.querySelectorAll('.dp-chip').forEach(btn => {
  btn.addEventListener('click', () => {
    currentShadowTab = btn.dataset.shadowTarget;
    try { localStorage.setItem(SHADOW_TAB_KEY, currentShadowTab); } catch(e) {}
    syncShadowActive();
  });
});

// ═══════════════════════════════════════════════════
// Фон в панели (подсветка активного квадратика)
// ═══════════════════════════════════════════════════

const dpBgs = document.getElementById('dpBgs');

function syncBgActive(){
  const cur = getActiveDesign().bg || '';
  dpBgs.querySelectorAll('.dp-bg').forEach(b => {
    b.classList.toggle('active', (b.dataset.bg || '') === cur);
  });
}

// ═══════════════════════════════════════════════════
// Тумблер темы
// ═══════════════════════════════════════════════════

const dpThemeToggle = document.getElementById('dpThemeToggle');

function syncThemeToggle(){
  if (dpThemeToggle) dpThemeToggle.dataset.theme = getActiveDesign().theme;
}
dpThemeToggle.addEventListener('click', () => {
  if (!designDraft) return;
  designDraft.theme = (designDraft.theme === 'dark') ? 'light' : 'dark';
  syncThemeToggle();
  syncMockupScope();
});

// ═══════════════════════════════════════════════════
// Сворачивание секций панели
// ═══════════════════════════════════════════════════

const SECTIONS_KEY = 'designSectionsCollapsed';
let collapsedSections = {};
try {
  collapsedSections = JSON.parse(localStorage.getItem(SECTIONS_KEY) || '{}') || {};
} catch(e) { collapsedSections = {}; }

document.querySelectorAll('#designPanel .dp-section').forEach(section => {
  const id = section.dataset.section;
  if (!id) return;
  if (collapsedSections[id]) section.classList.add('collapsed');
  const label = section.querySelector('.dp-section-label');
  if (!label) return;
  label.addEventListener('click', (e) => {
    e.stopPropagation();
    section.classList.toggle('collapsed');
    collapsedSections[id] = section.classList.contains('collapsed');
    try { localStorage.setItem(SECTIONS_KEY, JSON.stringify(collapsedSections)); } catch(e) {}
  });
});

// ═══════════════════════════════════════════════════
// Открытие/закрытие панели 🖌
// ═══════════════════════════════════════════════════

document.getElementById('btnDesign').addEventListener('click', openDesignPanel);
document.getElementById('designPanelClose').addEventListener('click', closeDesignPanel);
designPanel.addEventListener('click', (e) => {
  if (e.target === designPanel) closeDesignPanel();
});

// ─── Escape: сначала редактор фона, потом «Применить к…», потом панель ───
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (bgEditor && bgEditor.style.display === 'flex'){
    closeBgEditor();
    return;
  }
  if (modalApplyTo && modalApplyTo.style.display === 'flex'){
    closeApplyTo();
    return;
  }
  if (designPanel.style.display === 'flex') closeDesignPanel();
});

// ─── Кнопка «📐 Позиция» в панели ───
document.getElementById('dpBgPos').addEventListener('click', () => {
  openBgEditor();
});

// ─── Пересчёт пропорций макета при изменении окна ───
window.addEventListener('resize', () => {
  if (typeof syncMockupAspect === 'function') syncMockupAspect();
});