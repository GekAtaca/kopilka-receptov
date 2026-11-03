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

// ─── Красивое число: 60 → «60», 4.5 → «4,5», 0.25 → «0,25» ───
function formatAmount(n) {
  if (n == null) return '';
  const r = Math.round(n * 100) / 100;
  if (Number.isInteger(r)) return String(r);
  return String(r).replace('.', ',');
}

// ─── Карточка рецепта (маленькая) ───
function renderRecipeCard(recipe, ingMarks, isFav, isCooked, isWant, savedPortions) {
  const label = MEAL_LABEL[recipe.meal] || '';
  
  const baseP = recipe.portions || 2;
  const currP = savedPortions || 4; // Если нет сохранённых, ставим 4, как в большой карточке

  const tagsHtml = (recipe.tags || [])
    .map(t => `<span>${escapeHtml(t)}</span>`)
    .join('');

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

  const coef = currP / baseP;

  const ingRows = (recipe.ingredients || []).map(ing => {
    const amountVal = ing.amount * coef;
    const amountStr = formatAmount(amountVal) + ' ' + escapeHtml(ing.unit);
    const isMarked = ingMarks && ingMarks.has(ing.name) ? ' marked' : '';
    return `<li>
      <span class="chk${isMarked}" data-action="toggle-ing-small" data-ing="${escapeHtml(ing.name)}"></span>
      <span class="ing-name">${escapeHtml(ing.name)}</span>
      <span class="ing-amount" data-base="${ing.amount}" data-unit="${escapeHtml(ing.unit)}">${amountStr}</span>
    </li>`;
  }).join('');

  // Шаги для маленькой карточки (скрыты по умолчанию)
  const smallStepsHtml = (recipe.steps && recipe.steps.length) ? `
    <div class="small-steps-container">
      <div class="small-steps-title">Приготовление:</div>
      <ol class="small-steps-list">
        ${recipe.steps.map(s => `<li>${escapeHtml(s)}</li>`).join('')}
      </ol>
    </div>
  ` : '';

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

  const noteHtml = recipe.note ? `
    <div class="note">
      <span class="note-label">МОЯ ЗАМЕТКА</span>
      <span class="note-text">${escapeHtml(recipe.note)}</span>
    </div>
  ` : '';

  const totalVersions = 1 + ((recipe.versions && recipe.versions.length) || 0);
  const versionsBtn = totalVersions > 1
    ? `<button data-action="open-versions">🕐 ${recipe.currentVersion} из ${totalVersions}</button>`
    : '';

  const firstPhoto = (recipe.photos && recipe.photos[0]) || '';
  const imgHtml = firstPhoto
    ? `<img src="${escapeHtml(firstPhoto)}" alt="" onerror="this.style.display='none'">`
    : '';

  return `
    <div class="card" data-recipe-id="${escapeHtml(recipe.id)}">
      <div class="card-img">
        ${imgHtml}
        <span class="badge">${label}</span>
        <div class="img-icons">
          <button class="ic ${isFav ? 'active' : ''}" data-action="toggle-favorite-small">❤</button>
          <button class="ic ${isCooked ? 'active' : ''}" data-action="toggle-cooked-small">${isCooked ? '✅' : '&#128104;&#8205;&#127859;'}</button>
          <button class="ic ${isWant ? 'active' : ''}" data-action="toggle-want-small">🔖</button>
          <button class="ic" data-action="open-plan-small">📅</button>
        </div>
      </div>
      <div class="card-body">
        <div class="title">${escapeHtml(recipe.name)}</div>
        <div class="tags">${tagsHtml}</div>
        ${kcalRow}
        <div class="ing-header">
          <div class="ing-header-left">
            <span class="ing-title">Ингредиенты:</span>
            <button type="button" class="ing-clear" data-action="clear-ingredients-small" title="Очистить отметки">🧹</button>
          </div>
          <span class="portions" data-base="${baseP}">
            <button data-action="portions-minus-small">−</button>
            <span class="num" data-action="reset-portions-small" style="cursor:pointer;">${currP}</span>
            <button data-action="portions-plus-small">+</button>
          </span>
        </div>
        <ul class="ing-list">${ingRows}</ul>
        ${smallStepsHtml}
        <button class="ing-toggle" data-action="toggle-show-all">▼ показать все</button>
        ${deviceHtml}
        ${noteHtml}
      </div>
        <button class="primary">🛒 ${
          (() => {
            let marked = 0;
            if (ingMarks) {
              (recipe.ingredients || []).forEach(ing => {
                if (ingMarks.has(ing.name)) marked++;
              });
            }
            return marked > 0 ? marked : (recipe.ingredients || []).length;
          })()
        }</button>
        <button data-action="open-timer">⏱</button>
        <button data-action="edit-recipe">✎ Изменить</button>
        <button data-action="edit-note-small" title="Заметка">📝</button>
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
  
  // Загружаем все отметки
  const ingMarks = await Storage.getMarks('ingredient');
  const favMarks = await Storage.getMarks('favorite');
  const cookedMarks = await Storage.getMarks('cooked');
  const wantMarks = await Storage.getMarks('want');

  const ingMarksByRecipe = {};
  ingMarks.forEach(m => {
    if (!ingMarksByRecipe[m.recipeId]) ingMarksByRecipe[m.recipeId] = new Set();
    ingMarksByRecipe[m.recipeId].add(m.extra);
  });

  const portMarks = await Storage.getMarks('portions');
  const portionsByRecipe = {};
  portMarks.forEach(m => portionsByRecipe[m.recipeId] = m.extra);

  const favIds = new Set(favMarks.map(m => m.recipeId));
  const cookedIds = new Set(cookedMarks.map(m => m.recipeId));
  const wantIds = new Set(wantMarks.map(m => m.recipeId));

  const meals = ['breakfast', 'lunch', 'dinner', 'snack'];

  meals.forEach(meal => {
    const section = document.querySelector('.recipes-section[data-meal="' + meal + '"]');
    if (!section) return;

    const grid    = section.querySelector('.recipes-grid');
    const counter = section.querySelector('.recipes-section-count');
    if (!grid) return;

    const list = all.filter(r => r.meal === meal);
    grid.innerHTML = list.map(r => {
      return renderRecipeCard(
        r, 
        ingMarksByRecipe[r.id], 
        favIds.has(r.id), 
        cookedIds.has(r.id), 
        wantIds.has(r.id),
        portionsByRecipe[r.id]
      );
    }).join('');
    if (counter) counter.textContent = list.length;
  });
}

// ─── Открытие таймера из маленькой карточки на Главной ───
document.addEventListener('click', (e) => {
  const timerBtn = e.target.closest('.card [data-action="open-timer"]');
  if (!timerBtn) return;
  
  // Находим ID рецепта у карточки
  const card = timerBtn.closest('.card');
  if (card && card.dataset.recipeId) {
    openTimerList(card.dataset.recipeId);
  }
});