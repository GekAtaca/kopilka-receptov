// ═══════════════════════════════════════════════════
// render.js — превращает объект рецепта в HTML.
// Загружается после demo-recipes.js, до bg.js.
//
// Пока умеет только маленькую карточку.
// Большая карточка — отдельный шаг (шаг 35).
// ═══════════════════════════════════════════════════

// ─── Подписи приёма пищи (англ → русский капс) ───
const MEAL_LABEL = {
  breakfast: 'ЗАВТРАК',
  lunch:     'ОБЕД',
  dinner:    'УЖИН',
  snack:     'ПЕРЕКУС'
};

// ─── Экранирование HTML (защита от случайных < > & " ') ───
function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ─── Красивое число: 0.5 → «1/2», 1.5 → «1 1/2», 60 → «60» ───
function formatAmount(n) {
  if (n == null) return '';
  if (Number.isInteger(n)) return String(n);
  const whole = Math.floor(n);
  const frac = n - whole;
  let fracStr;
  if (Math.abs(frac - 0.5)  < 0.01) fracStr = '1/2';
  else if (Math.abs(frac - 0.25) < 0.01) fracStr = '1/4';
  else if (Math.abs(frac - 0.75) < 0.01) fracStr = '3/4';
  else fracStr = frac.toFixed(2).replace('0.', '');
  if (whole === 0) return fracStr;
  return whole + ' ' + fracStr;
}

// ─── Карточка рецепта (маленькая) ───
function renderRecipeCard(recipe) {
  const label = MEAL_LABEL[recipe.meal] || '';

  // Теги (CSS сам обрежет до 3 в обычной карточке)
  const tagsHtml = (recipe.tags || [])
    .map(t => `<span>${escapeHtml(t)}</span>`)
    .join('');

  // КБЖУ-строка (снимок старых цифр)
  const k = recipe.kbzhuSnapshot || {};
  const kcalRow = `
    <div class="kcal-row">
      <span>${k.kcal} ккал</span><span>·</span>
      <span>Б ${k.protein}</span><span>·</span>
      <span>Ж ${k.fat}</span><span>·</span>
      <span>У ${k.carbs}</span><span>·</span>
      <span class="time-display time-auto">⏱ ${recipe.time} мин</span>
    </div>
  `;

  // Ингредиенты
  const ingRows = (recipe.ingredients || []).map(ing => {
    const amountStr = formatAmount(ing.amount) + ' ' + escapeHtml(ing.unit);
    return `<li>
      <span class="chk"></span>
      <span class="ing-name">${escapeHtml(ing.name)}</span>
      <span class="ing-amount">${amountStr}</span>
    </li>`;
  }).join('');

  // Устройство готовки (если есть)
  const deviceHtml = recipe.device ? `
    <div class="cook-unit">
      <div class="unit-head">
        <div class="unit-name">
          <span>${escapeHtml(recipe.device)}</span>
          <span class="chev">▼</span>
        </div>
      </div>
    </div>
  ` : '';

  // Заметка (если есть)
  const noteHtml = recipe.note ? `
    <div class="note">
      <span class="note-label">МОЯ ЗАМЕТКА</span>
      <span class="note-text">${escapeHtml(recipe.note)}</span>
    </div>
  ` : '';

  // Кнопка версий — показывается только если версий больше одной
  const totalVersions = 1 + ((recipe.versions && recipe.versions.length) || 0);
  const versionsBtn = totalVersions > 1
    ? `<button>🕐 ${recipe.currentVersion} из ${totalVersions}</button>`
    : '';

  // Фото (пока photos: [] — покажется градиент-заглушка)
  const firstPhoto = (recipe.photos && recipe.photos[0]) || '';
  const imgHtml = firstPhoto
    ? `<img src="${firstPhoto}" alt="" onerror="this.style.display='none'">`
    : '';

  return `
    <div class="card" data-recipe-id="${escapeHtml(recipe.id)}">
      <div class="card-img">
        ${imgHtml}
        <span class="badge">${label}</span>
        <div class="img-icons">
          <button class="ic">❤</button>
          <button class="ic">⏱</button>
          <button class="ic">&#128104;&#8205;&#127859;</button>
          <button class="ic">📅</button>
          <button class="ic">🔖</button>
        </div>
      </div>
      <div class="card-body">
        <div class="title">${escapeHtml(recipe.name)}</div>
        <div class="tags">${tagsHtml}</div>
        ${kcalRow}
        <div class="ing-header">
          <span class="ing-title">Ингредиенты:</span>
          <span class="portions">
            <button>−</button>
            <span class="num">${recipe.portions}</span>
            <button>+</button>
          </span>
        </div>
        <ul class="ing-list">${ingRows}</ul>
        <button class="ing-toggle">▼ показать все</button>
        ${deviceHtml}
        ${noteHtml}
      </div>
      <div class="actions">
        <button class="primary">🛒 ${recipe.ingredients.length}</button>
        <button>✎ Изменить</button>
        ${versionsBtn}
      </div>
    </div>
  `;
}

// ═══════════════════════════════════════════════════
// Разложить все рецепты по секциям Главной.
// Асинхронная: читает рецепты из IndexedDB.
// ═══════════════════════════════════════════════════
async function renderAllRecipes() {
  const all = await Storage.getAllRecipes();

  const meals = ['breakfast', 'lunch', 'dinner', 'snack'];

  meals.forEach(meal => {
    const section = document.querySelector('.recipes-section[data-meal="' + meal + '"]');
    if (!section) return;

    const grid    = section.querySelector('.recipes-grid');
    const counter = section.querySelector('.recipes-section-count');
    if (!grid) return;

    const list = all.filter(r => r.meal === meal);
    grid.innerHTML = list.map(renderRecipeCard).join('');
    if (counter) counter.textContent = list.length;
  });
}