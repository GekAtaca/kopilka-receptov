// ═══════════════════════════════════════════════════
// shared.js — общие переменные и утилиты.
// Загружается первым, до bg.js и design.js.
// ═══════════════════════════════════════════════════

// ─── Хранилище настроек фона ───
// Формат: { bgId: { iphone:{x,y,z}, ipad:{x,y,z}, pc:{x,y,z} } }
let bgSettings = {};
try {
  bgSettings = JSON.parse(localStorage.getItem('bgSettings') || '{}');
} catch (e) {
  bgSettings = {};
}

// ─── Текущий выбранный фон на сайте ───
let currentBg = '';

// ─── Фон, для которого открыт редактор позиции ───
let bgEditorBg = '';

// ─── Черновик оформления. Живёт, пока открыта панель 🖌 ───
let designDraft = null;

// ─── Сохранённое оформление по экранам (заполняется в design.js) ───
let designData = null;

// ─── Активный экран для оформления ───
let activeDesignScreen = 'home';

// ─── Сохранить bgSettings в localStorage ───
function saveSettingsToStorage() {
  localStorage.setItem('bgSettings', JSON.stringify(bgSettings));
}

// ─── Тип устройства: pc / iphone / ipad ───
function getDeviceType() {
  const hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  if (!hasTouch) return 'pc';
  return window.innerWidth < 600 ? 'iphone' : 'ipad';
}

// ─── Настройки позиции/зума для фона и устройства ───
function getSettingsFor(bg, device) {
  if (!bg) return { x: 0, y: 0, z: 1 };
  const s = bgSettings[bg] && bgSettings[bg][device];
  return s || { x: 0, y: 0, z: 1 };
}