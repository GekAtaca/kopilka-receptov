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
  const isExpanded = window.expandedRecipes.has(String(recipe.id));
  
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

  // === НАЧАЛО ЗАМЕНЫ: Устройства ===
  const currentDevice = recipe.devicesData.find(d => d.id === recipe.currentDeviceId) || recipe.devicesData[0];
  
  const deviceHtml = recipe.devicesData && recipe.devicesData.length > 0 
    ? `
      <button type="button" 
              class="cook-unit-toggle" 
              data-action="toggle-device-list" 
              aria-expanded="false">
        <div class="cook-unit">
          <div class="unit-head">
            <div class="unit-name">
              <span class="current-device-name">${escapeHtml(currentDevice.name)}</span>
              <span class="chev">▼</span>
            </div>
          </div>
        </div>
      </button>
      <div id="device-list-${escapeHtml(recipe.id)}" class="cook-unit-dropdown" style="display: none;">
        ${recipe.devicesData.map(d => `
          <button type="button" 
                  class="cook-unit-option ${d.id === recipe.currentDeviceId ? 'active' : ''}" 
                  data-action="switch-device" 
                  data-device-id="${escapeHtml(d.id)}">
            ${escapeHtml(d.name)}
          </button>
        `).join('')}
      </div>
    ` 
    : (currentDevice 
      ? `<div class="cook-unit"><div class="unit-name">${escapeHtml(currentDevice.name)}</div></div>` 
      : '');
  // === КОНЕЦ ЗАМЕНЫ: Устройства ===

  const ingRows = (currentDevice.ingredients || []).map(ing => {
    const amountVal = ing.amount * coef;
    const amountStr = formatAmount(amountVal) + ' ' + escapeHtml(ing.unit);
    const isMarked = ingMarks && ingMarks.has(ing.name) ? ' marked' : '';
    return `<li>
      <span class="chk${isMarked}" data-action="toggle-ing-small" data-ing="${escapeHtml(ing.name)}"></span>
      <span class="ing-name">${escapeHtml(ing.name)}</span>
      <span class="ing-amount" data-base="${ing.amount}" data-unit="${escapeHtml(ing.unit)}">${amountStr}</span>
    </li>`;
  }).join('');

  const smallStepsHtml = (currentDevice.steps || []).length 
    ? `
      <div class="small-steps-container">
        <div class="small-steps-title">Приготовление:</div>
        <ol class="small-steps-list">
          ${currentDevice.steps.map(s => `<li>${escapeHtml(s)}</li>`).join('')}
        </ol>
      </div>
    ` 
    : '';

  const hasMoreThan3Ings = (currentDevice.ingredients || []).length > 3;
  const hasSteps = currentDevice.steps && currentDevice.steps.length > 0;
  const showToggleBtn = hasMoreThan3Ings || hasSteps;
  
  const toggleBtnHtml = showToggleBtn ? `<button class="ing-toggle" data-action="toggle-show-all">${isExpanded ? '▲ скрыть' : '▼ показать все'}</button>` : '';

  const totalIng = (currentDevice.ingredients || []).length;
  let markedCount = 0;
  if (ingMarks) {
    (currentDevice.ingredients || []).forEach(ing => {
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
  const btn = e.target.closest('[data-action]');
  if (!btn) return;

  // === НАЧАЛО ЗАМЕНЫ: Логика устройств ===
  const toggleDeviceBtn = e.target.closest('[data-action="toggle-device-list"]');
  if (toggleDeviceBtn) {
    const card = toggleDeviceBtn.closest('.card');
    const list = card.querySelector('.cook-unit-dropdown');
    const isOpen = list.style.display === 'block';
    list.style.display = isOpen ? 'none' : 'block';
    toggleDeviceBtn.setAttribute('aria-expanded', String(!isOpen));
    toggleDeviceBtn.classList.toggle('active', !isOpen);
    return;
  }

  const switchDeviceBtn = e.target.closest('[data-action="switch-device"]');
  if (switchDeviceBtn) {
    const card = switchDeviceBtn.closest('.card');
    const recipeId = card.dataset.recipeId;
    const newDeviceId = switchDeviceBtn.dataset.deviceId;
    
    Storage.getRecipe(recipeId).then(recipe => {
      if (!recipe) return;
      
      recipe.currentDeviceId = newDeviceId;
      
      // Перерисовываем контент внутри карточки
      const ingList = card.querySelector('.ing-list');
      const stepsList = card.querySelector('.small-steps-list');
      const timeDisplay = card.querySelector('.time-display');
      
      const device = recipe.devicesData.find(d => d.id === newDeviceId);
      if (device) {
        // Ингредиенты
        ingList.innerHTML = '';
        const coef = currentPortions / (recipe.portions || 2);
        device.ingredients.forEach(ing => {
          const amountVal = ing.amount * coef;
          const amountStr = formatAmount(amountVal) + ' ' + escapeHtml(ing.unit);
          const isMarked = ingMarks && ingMarks.has(ing.name) ? ' marked' : '';
          ingList.innerHTML += `<li>
            <span class="chk${isMarked}" data-action="toggle-ing-small" data-ing="${escapeHtml(ing.name)}"></span>
            <span class="ing-name">${escapeHtml(ing.name)}</span>
            <span class="ing-amount">${amountStr}</span>
          </li>`;
        });

        // Шаги
        if (stepsList) {
          stepsList.innerHTML = '';
          device.steps.forEach(s => {
            stepsList.innerHTML += `<li>${escapeHtml(s)}</li>`;
          });
        }

        // Время
        if (timeDisplay && device.time) {
          timeDisplay.textContent = `⏱ ${device.time} мин`;
        }
      }

      Storage.saveRecipe(recipe);
      
      // Закрываем список
      const list = card.querySelector('.cook-unit-dropdown');
      const toggleBtn = card.querySelector('[data-action="toggle-device-list"]');
      list.style.display = 'none';
      toggleBtn.setAttribute('aria-expanded', 'false');
      toggleBtn.classList.remove('active');
    });
    return;
  }
  // === КОНЕЦ ЗАМЕНЫ: Логика устройств ===

  // ... (остальной код обработчика кликов остается без изменений)
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