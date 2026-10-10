// ═══════════════════════════════════════════════════
// bg.js — фон сайта и редактор позиции фона.
// Загружается после shared.js, до design.js.
// ═══════════════════════════════════════════════════

// ─── Применить фон к странице ───
function applyBg(bg) {
  const sharp = document.getElementById('bgSharp');
  const blur  = document.getElementById('bgBlur');
  currentBg = bg;

  if (bg === '') {
    sharp.removeAttribute('src');
    sharp.style.removeProperty('--tx');
    sharp.style.removeProperty('--ty');
    sharp.style.removeProperty('--tz');
    blur.removeAttribute('src');
    return;
  }

  sharp.src = 'images/' + bg + '.jpg';
  blur.src  = 'images/' + bg + '.jpg';

  const device = getDeviceType();
  const s = getSettingsFor(bg, device);
  sharp.style.setProperty('--tx', s.x + '%');
  sharp.style.setProperty('--ty', s.y + '%');
  sharp.style.setProperty('--tz', s.z);
}

// ─── Пересчёт фона при изменении размера окна (устройство могло смениться) ───
let resizeTimer = null;
window.addEventListener('resize', () => {
  if (!currentBg) return;
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => applyBg(currentBg), 150);
});

// ─── Клик по квадратику фона в панели 🖌 ───
// Меняем только черновик, страницу не трогаем.
document.querySelectorAll('button[data-bg]').forEach(btn => {
  btn.addEventListener('click', () => {
    if (!designDraft) return;
    designDraft.bg = btn.dataset.bg;
    syncBgActive();
    syncMockupScope();
  });
});

// ═══════════════════════════════════════════════════
// Редактор позиции фона
// ═══════════════════════════════════════════════════

const bgEditor         = document.getElementById('bgEditor');
const bgEditorFrame    = document.getElementById('bgEditorFrame');
const bgEditorImgBlur  = document.getElementById('bgEditorImgBlur');
const bgEditorImgSharp = document.getElementById('bgEditorImgSharp');

let activeDevice = 'pc';
let editX = 0, editY = 0, editZ = 1;
let dragStart = null;
let pinchStart = null;

function updateEditorTransform() {
  bgEditorImgSharp.style.setProperty('--tx', editX + '%');
  bgEditorImgSharp.style.setProperty('--ty', editY + '%');
  bgEditorImgSharp.style.setProperty('--tz', editZ);
}

function initEditorFrame() {
  bgEditorFrame.style.aspectRatio = window.innerWidth + ' / ' + window.innerHeight;
  activeDevice = getDeviceType();
  const s = getSettingsFor(bgEditorBg, activeDevice);
  editX = s.x; editY = s.y; editZ = s.z;
  updateEditorTransform();
}

function openBgEditor() {
  bgEditorBg = (designDraft && designDraft.bg) ? designDraft.bg : currentBg;
  if (!bgEditorBg) {
    alert('Сначала выбери фон в панели.');
    return;
  }
  bgEditorImgBlur.src  = 'images/' + bgEditorBg + '.jpg';
  bgEditorImgSharp.src = 'images/' + bgEditorBg + '.jpg';
  bgEditor.style.display = 'flex';
  requestAnimationFrame(initEditorFrame);
}

function closeBgEditor() {
  bgEditor.style.display = 'none';
  dragStart = null;
  pinchStart = null;
}

// ─── Кнопки редактора ───
document.getElementById('bgEditorClose').addEventListener('click', closeBgEditor);
document.getElementById('bgEditorCancel').addEventListener('click', closeBgEditor);

document.getElementById('bgEditorSave').addEventListener('click', () => {
  if (!bgEditorBg) { closeBgEditor(); return; }
  if (!bgSettings[bgEditorBg]) bgSettings[bgEditorBg] = {};
  bgSettings[bgEditorBg][activeDevice] = { x: editX, y: editY, z: editZ };
  saveSettingsToStorage();
  closeBgEditor();
});

// ─── Зум: колесо мыши (ПК) ───
bgEditorFrame.addEventListener('wheel', (e) => {
  e.preventDefault();
  const factor = 1 - e.deltaY * 0.0015;
  editZ = Math.max(1, Math.min(5, editZ * factor));
  updateEditorTransform();
}, { passive: false });

// ─── Зум: двойной клик — сброс на 1.00× ───
bgEditorFrame.addEventListener('dblclick', () => {
  editZ = 1;
  updateEditorTransform();
});

// ─── Зум: щипок двумя пальцами (телефон/планшет) ───
bgEditorFrame.addEventListener('touchstart', (e) => {
  if (e.touches.length === 2) {
    dragStart = null;
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    pinchStart = { dist: Math.hypot(dx, dy), z: editZ };
    e.preventDefault();
  }
}, { passive: false });

document.addEventListener('touchmove', (e) => {
  if (pinchStart && e.touches.length === 2) {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const dist = Math.hypot(dx, dy);
    editZ = Math.max(1, Math.min(5, pinchStart.z * (dist / pinchStart.dist)));
    updateEditorTransform();
    e.preventDefault();
  }
}, { passive: false });

document.addEventListener('touchend', (e) => {
  if (e.touches.length < 2) pinchStart = null;
});

// ─── Перетаскивание мышью ───
bgEditorFrame.addEventListener('mousedown', (e) => {
  dragStart = { mx: e.clientX, my: e.clientY, x: editX, y: editY };
  bgEditorFrame.style.cursor = 'grabbing';
  e.preventDefault();
});

document.addEventListener('mousemove', (e) => {
  if (!dragStart) return;
  const rect = bgEditorFrame.getBoundingClientRect();
  editX = dragStart.x + ((e.clientX - dragStart.mx) / rect.width)  * 100;
  editY = dragStart.y + ((e.clientY - dragStart.my) / rect.height) * 100;
  updateEditorTransform();
});

document.addEventListener('mouseup', () => {
  if (dragStart) { dragStart = null; bgEditorFrame.style.cursor = 'grab'; }
});

// ─── Перетаскивание пальцем ───
bgEditorFrame.addEventListener('touchstart', (e) => {
  if (e.touches.length !== 1) return;
  const t = e.touches[0];
  dragStart = { mx: t.clientX, my: t.clientY, x: editX, y: editY };
  e.preventDefault();
}, { passive: false });

document.addEventListener('touchmove', (e) => {
  if (!dragStart || e.touches.length !== 1) return;
  const t = e.touches[0];
  const rect = bgEditorFrame.getBoundingClientRect();
  editX = dragStart.x + ((t.clientX - dragStart.mx) / rect.width)  * 100;
  editY = dragStart.y + ((t.clientY - dragStart.my) / rect.height) * 100;
  updateEditorTransform();
  e.preventDefault();
}, { passive: false });

document.addEventListener('touchend', () => { dragStart = null; });