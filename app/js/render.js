// ═══════════════════════════════════════════════════
// render.js — превращает объект рецепта в HTML.
// ═══════════════════════════════════════════════════

// ─── Подписи приёма пищи (англ → русский капс) ───
const MEAL_LABEL = {
  breakfast: 'ЗАВТРАК',
  lunch:     'ОБЕД',
  dinner:    'УЖИН',
  snack:     'ПЕРЕКУС'
};

// Память для раскрытых карточек, чтобы они не сворачивались при обновлении
window.expandedRecipes = window.expandedRecipes || new Set();
// Память для позиции скролла, чтобы чекбоксы не выбрасывали наверх
window.cardScrollPositions = window.cardScrollPositions || {};

// ─── Экранирование HTML ───
function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ─── Красивое число ───
function formatAmount(n) {
  if (n == null) return '';
  const r = Math.round(n * 100) / 100;
  if (Number.isInteger(r)) return String(r);
  return String(r).replace('.', ',');
}

// ─── Карточка рецепта (маленькая) ───
function renderRecipeCard(recipe, ingMarks, isFav, isCooked, isWant, savedPortions) {
  const label = MEAL_LABEL[recipe.meal] || '';
  const isExpanded = window.expandedRecipes.has(String(recipe.id)); // Проверяем раскрыта ли карточка
  
  const baseP = recipe.portions || 2;
  const currP = savedPortions || 4;

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

  const smallStepsHtml = (recipe.steps && recipe.steps.length) ? `
    <div class="small-steps-container">
      <div class="small-steps-title">Приготовление:</div>
      <ol class="small-steps-list">
        ${recipe.steps.map(s => `<li>${escapeHtml(s)}</li>`).join('')}
      </ol>
    </div>
  ` : '';

  const hasMoreThan3Ings = (recipe.ingredients || []).length > 3;
  const hasSteps = recipe.steps && recipe.steps.length > 0;
  const showToggleBtn = hasMoreThan3Ings || hasSteps;
  
  // Кнопка меняет текст в зависимости от состояния
  const toggleBtnHtml = showToggleBtn ? `<button class="ing-toggle" data-action="toggle-show-all">${isExpanded ? '▲ скрыть' : '▼ показать все'}</button>` : '';

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
    <div class="note" data-action="open-note-small" data-recipe-id="${escapeHtml(recipe.id)}" style="cursor: pointer;">
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

  const totalIng = (recipe.ingredients || []).length;
  let markedCount = 0;
  if (ingMarks) {
    (recipe.ingredients || []).forEach(ing => {
      if (ingMarks.has(ing.name)) markedCount++;
    });
  }
  const buyCount = markedCount > 0 ? markedCount : totalIng;

  return `
    <div class="card ${isExpanded ? 'show-all' : ''}" data-recipe-id="${escapeHtml(recipe.id)}">
      <div class="card-img">
        ${imgHtml}
        <span class="badge">${label}</span>
        <div class="img-icons">
          <button class="ic ${isFav ? 'active' : ''}" data-action="toggle-favorite-small">❤</button>
          <button class="ic ${isCooked ? 'active' : ''}" data-action="toggle-cooked-small">${isCooked ? '✅' : '&#128104;&#8205;&#127859;'}</button>
          <button class="ic ${isWant ? 'active' : ''}" data-action="toggle-want-small">🔖</button>
          <button class="ic" data-action="open-plan-small">📅</button>
        </div>
        <div class="card-plan-dropdown">
          <label class="b-plan-row"><input type="checkbox" value="family"><span>Семейный</span></label>
          <label class="b-plan-row"><input type="checkbox" value="child"><span>Для ребёнка</span></label>
          <label class="b-plan-row"><input type="checkbox" value="events"><span>События</span></label>
        </div>
      </div>
      <div class="card-body">
        <div class="title">${escapeHtml(recipe.name)}</div>
        <div class="tags">${tagsHtml}</div>
        ${kcalRow}
        
        <!-- Зона скролла (теперь сюда входит и заголовок ингредиентов) -->
        <div class="card-scroll-area">
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
        </div>
        
        ${toggleBtnHtml}
        ${deviceHtml}
        ${noteHtml}
      </div>
      <div class="actions">
        <button class="primary">🛒 ${buyCount}</button>
        <button data-action="open-timer">⏱</button>
        <button data-action="edit-note-small" title="Заметка">📝</button>
        <button data-action="edit-recipe">✎ Изменить</button>
        ${versionsBtn}
      </div>
    </div>
  `;
}

// ═══════════════════════════════════════════════════
// Разложить все рецепты по секциям Главной.
// ═══════════════════════════════════════════════════
async function renderAllRecipes() {
  const all = await Storage.getAllRecipes();
  
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
      // Восстанавливаем позицию скролла, если она была сохранена
    list.forEach(r => {
      const id = String(r.id);
      if (window.cardScrollPositions[id]) {
        const cardEl = grid.querySelector(`.card[data-recipe-id="${id}"]`);
        if (cardEl) {
          const scrollArea = cardEl.querySelector('.card-scroll-area');
          if (scrollArea) {
            scrollArea.scrollTop = window.cardScrollPositions[id];
          }
        }
      }
    });
  });
}

// ─── Обработчики кликов ───
document.addEventListener('click', (e) => {
  const timerBtn = e.target.closest('.card [data-action="open-timer"]');
  if (timerBtn) {
    const card = timerBtn.closest('.card');
    if (card && card.dataset.recipeId) {
      openTimerList(card.dataset.recipeId);
    }
    return;
  }
  // ─── Сохраняем позицию скролла перед кликом на чекбокс или порции ───
  const isActionInsideScroll = e.target.closest('[data-action="toggle-ing-small"]') || 
                               e.target.closest('.portions button') || 
                               e.target.closest('.portions .num');
  
  if (isActionInsideScroll) {
    const card = e.target.closest('.card');
    if (card && card.dataset.recipeId) {
      const scrollArea = card.querySelector('.card-scroll-area');
      if (scrollArea) {
        window.cardScrollPositions[String(card.dataset.recipeId)] = scrollArea.scrollTop;
      }
    }
  }

  // ─── Открытие заметки ───
  const noteBtn = e.target.closest('[data-action="open-note-small"]') || e.target.closest('[data-action="edit-note-small"]');
  if (noteBtn) {
    const card = noteBtn.closest('.card');
    if (card && card.dataset.recipeId) {
      openNoteModal(card.dataset.recipeId);
    }
    return;
  }

  // ─── Запоминаем состояние кнопки "Показать всё / Скрыть" ───
  const toggleBtn = e.target.closest('[data-action="toggle-show-all"]');
  if (toggleBtn) {
    const card = toggleBtn.closest('.card');
    if (card && card.dataset.recipeId) {
      const id = String(card.dataset.recipeId);
            if (card.classList.contains('show-all')) {
        window.expandedRecipes.add(id); // Запомнили, что раскрыто
        delete window.cardScrollPositions[id]; // Сбрасываем скролл при закрытии
      } else {
        window.expandedRecipes.add(id); // Запоминаем, что раскрыто
      }
    }
  }
});

// ═══ Логика модалки заметки ═══
let currentNoteRecipeId = null;

async function openNoteModal(recipeId) {
  currentNoteRecipeId = recipeId;
  const all = await Storage.getAllRecipes();
  const recipe = all.find(r => String(r.id) === String(recipeId));
  
  if (recipe) {
    document.getElementById('noteInput').value = recipe.note || '';
    document.getElementById('modalNote').style.display = 'flex';
  }
}

// Обработчики кнопок внутри модалки
document.addEventListener('DOMContentLoaded', () => {
  const closeBtn = document.getElementById('noteClose');
  const cancelBtn = document.getElementById('noteCancel');
  const saveBtn = document.getElementById('noteSave');

  const hideModal = () => {
    document.getElementById('modalNote').style.display = 'none';
    currentNoteRecipeId = null;
  };

  if (closeBtn) closeBtn.onclick = hideModal;
  if (cancelBtn) cancelBtn.onclick = hideModal;

  if (saveBtn) {
    saveBtn.onclick = async () => {
      const text = document.getElementById('noteInput').value.trim();
      if (currentNoteRecipeId) {
        const all = await Storage.getAllRecipes();
        const recipe = all.find(r => String(r.id) === String(currentNoteRecipeId));
        
        if (recipe) {
          recipe.note = text;
          // Сохраняем в базу (используем стандартный метод сохранения)
          await Storage.saveRecipe(recipe); 
          
          hideModal();
          await renderAllRecipes(); // Перерисовываем маленькие карточки
          
          // Если открыта большая карточка этого рецепта, обновляем и её
          if (typeof refreshCurrentRecipeCard === 'function' && document.getElementById('modalRecipe').style.display === 'flex') {
            refreshCurrentRecipeCard();
          }

          // Показываем уведомление
          if (typeof showToastMsg === 'function') {
            showToastMsg('Заметка сохранена');
          }
        }
      }
    };
  }
});