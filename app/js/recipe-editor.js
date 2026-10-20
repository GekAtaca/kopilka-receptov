// ═══════════════════════════════════════════════════
// recipe-editor.js — модалка редактора рецепта (шаг 37).
// 37.1 — каркас. 37.2 — основные поля. 37.3 — ингредиенты.
// 37.4 — шаги и время. 37.5 — теги.
// Загружается после card-big.js, до product-picker.js.
// ═══════════════════════════════════════════════════

const modalRecipeEditor = document.getElementById('modalRecipeEditor');
const meTitle           = document.getElementById('meTitle');
const meClose           = document.getElementById('meClose');
const meCancel          = document.getElementById('meCancel');
const meBody            = document.getElementById('meBody');
const meTabs            = document.getElementById('meTabs');

let meEditId        = null;   
let meCurrentRecipe = null;   
let meCurrentTab    = 'manual';
let meDraft         = null;   
let meKbzhuOpen     = false;  
let meDragSrcEl     = null;

const ME_MEALS = [
  { val: 'breakfast', label: '🌅 Завтрак' },
  { val: 'lunch',     label: '🍽 Обед' },
  { val: 'dinner',    label: '🌙 Ужин' },
  { val: 'snack',     label: '🍎 Перекус' }
];
const ME_SOURCES = [
  { val: 'Джулия', label: 'Джулия' },
  { val: 'Мои', label: 'Мои' },
  { val: 'Мама', label: 'Мама' },
  { val: 'Интернет', label: 'Интернет' }
];
const ME_COMPLEXITY = [
  { val: 'Простое', label: 'Простое' },
  { val: 'Среднее', label: 'Среднее' },
  { val: 'Сложное', label: 'Сложное' }
];
const ME_UNITS = ['г', 'мл', 'шт', 'ч. л.', 'ст. л.', 'зуб.'];

const ME_TIME_STAGES = [
  'Подготовка', 'Маринад', 'Готовка', 'Ожидание', 
  'Остывание', 'Замес', 'Расстойка', 'Запекание', 
  'Варка', 'Жарка', 'Тушение'
];

// ─── Сборка Dropdown ───
function meBuildDropdown(field, placeholder, options, defaultValue) {
  const itemsHtml = options.map(o => 
    `<div class="me-dropdown-item" data-val="${o.val}">${o.label}</div>`
  ).join('');
  const current = defaultValue ? options.find(o => o.val === defaultValue) : null;
  const currentLabel = current ? current.label : placeholder;
  const hasValue = current ? 'has-value' : '';
  return `
    <div class="me-dropdown ${hasValue}" data-field="${field}" data-val="${defaultValue || ''}" data-placeholder="${placeholder}">
      <button type="button" class="me-dropdown-btn">
        <span class="me-dd-label">${currentLabel}</span>
        <span class="me-dd-arrow">▼</span>
      </button>
      <div class="me-dropdown-menu">${itemsHtml}</div>
    </div>
  `;
}

// ─── Сборка блока Ингредиентов ───
function meBuildIngredientsHtml() {
  const listHtml = (meDraft.ingredients || []).map((ing, idx) => `
    <li class="me-ing-item" data-idx="${idx}">
      <button type="button" class="me-ing-name-btn" title="${ing.name}">${ing.name}</button>
      <input type="number" class="me-input me-ing-amt" value="${ing.amount}" data-action="change-amt" placeholder="0">
      <select class="me-input me-ing-unit" data-action="change-unit">
        ${ME_UNITS.map(u => `<option value="${u}" ${ing.unit === u ? 'selected' : ''}>${u}</option>`).join('')}
      </select>
      <button type="button" class="me-ing-del" data-action="del-ing" title="Удалить">🗑</button>
    </li>
  `).join('');

  return `
    <div class="me-ing-section">
      <div class="me-ing-header">
        <span class="me-label">Ингредиенты <span class="me-req">*</span></span>
        <button type="button" class="me-add-btn" data-action="add-ing">+ Добавить</button>
      </div>
      <ul class="me-ing-list" id="meIngList">
        ${listHtml}
      </ul>
      <button type="button" class="me-add-btn-bottom" data-action="add-ing">+ Добавить ингредиент</button>
    </div>
    
    <div class="me-portions-wrap">
      <span class="me-label">Эталон порций</span>
      <div class="me-portions">
        <button type="button" class="me-pbtn" data-action="portions-minus">−</button>
        <span class="me-pnum" id="mePortionsNum">${meDraft.portions || 2}</span>
        <button type="button" class="me-pbtn" data-action="portions-plus">+</button>
      </div>
    </div>

    ${meBuildKbzhuHtml()}
  `;
}

// ─── Сборка Шагов ───
function meBuildStepsHtml() {
  const listHtml = (meDraft.steps || []).map((s, idx) => `
    <li class="me-step-item" draggable="true" data-idx="${idx}">
      <div class="me-step-drag" title="Перетащить">⋮⋮</div>
      <div class="me-step-num">${idx + 1}.</div>
      <textarea class="me-step-text" rows="1" data-action="change-step" placeholder="Что нужно сделать...">${s}</textarea>
      <div class="me-step-actions">
        <button type="button" data-action="del-step" title="Удалить">🗑</button>
      </div>
    </li>
  `).join('');

  return `
    <div class="me-steps-section">
      <div class="me-steps-header">
        <span class="me-label">Шаги приготовления</span>
        <button type="button" class="me-add-btn" data-action="add-step">+ Добавить шаг</button>
      </div>
      <ul class="me-steps-list" id="meStepsList">
        ${listHtml}
      </ul>
      <button type="button" class="me-add-btn-bottom" data-action="add-step">+ Добавить шаг</button>
    </div>
  `;
}

// ─── Сборка Блока Времени ───
function meBuildTimeHtml() {
  const split = meDraft.timeSplit;
  const stagesHtml = (meDraft.timeStages || []).map((st, idx) => `
    <li class="me-time-stage" data-idx="${idx}">
      <select class="me-input me-time-select" data-action="change-stage-name">
        ${ME_TIME_STAGES.map(n => `<option value="${n}" ${st.name === n ? 'selected' : ''}>${n}</option>`).join('')}
        <option value="custom" ${!ME_TIME_STAGES.includes(st.name) ? 'selected' : ''}>Свой вариант...</option>
      </select>
      <input type="text" class="me-input me-time-custom" value="${!ME_TIME_STAGES.includes(st.name) ? st.name : ''}" placeholder="Название" style="display:${!ME_TIME_STAGES.includes(st.name) ? 'block' : 'none'}">
      <input type="number" class="me-input me-time-mins" value="${st.mins || ''}" data-action="change-stage-mins" placeholder="мин">
      <button type="button" data-action="del-stage" title="Удалить">🗑</button>
    </li>
  `).join('');

  return `
    <div class="me-time-section">
      <div class="me-time-header">
        <span class="me-label">Время готовки</span>
        <label class="me-checkbox">
          <input type="checkbox" data-action="toggle-time-split" ${split ? 'checked' : ''}>
          <span>Разбить на этапы</span>
        </label>
      </div>

      <div class="me-time-total-wrap" style="display:${split ? 'none' : 'flex'}">
        <input type="number" class="me-input me-time-total-input" value="${meDraft.time || ''}" data-action="change-time-total" placeholder="0">
        <span>мин</span>
      </div>

      <div class="me-time-stages-wrap" style="display:${split ? 'flex' : 'none'}">
        <ul class="me-time-stages-list">${stagesHtml}</ul>
        <button type="button" class="me-add-btn" data-action="add-stage">+ Добавить этап</button>
      </div>
    </div>
  `;
}

// ─── Сборка плашки КБЖУ ───
function meBuildKbzhuHtml() {
  return `
    <div class="me-kbzhu-panel ${meKbzhuOpen ? 'open' : ''}" id="meKbzhuPanel">
      <div class="me-kbzhu-head" data-action="toggle-kbzhu">
        <div class="me-kbzhu-total" id="meKbzhuTotal">КБЖУ блюда</div>
        <span class="me-kbzhu-arrow">▼</span>
      </div>
      <div class="me-kbzhu-details" id="meKbzhuDetails">
        <ul class="me-kbzhu-list" id="meKbzhuList"></ul>
      </div>
    </div>
  `;
}

// ─── HTML полей ───
function meBuildFields(){
  return `
    <div class="me-form">
      <div class="me-field">
        <label class="me-label" for="meName">Название <span class="me-req">*</span></label>
        <input type="text" class="me-input" id="meName" placeholder="Например: Овсянка с ягодами" value="${meDraft ? meDraft.name : ''}">
      </div>

      <div class="me-row3">
        <div class="me-field">
          <label class="me-label">Приём пищи <span class="me-req">*</span></label>
          ${meBuildDropdown('meal', 'Выбрать', ME_MEALS, meDraft ? meDraft.meal : '')}
        </div>
        <div class="me-field">
          <label class="me-label">Источник</label>
          ${meBuildDropdown('source', 'Выбрать', ME_SOURCES, meDraft ? meDraft.source : 'Мои')}
        </div>
        <div class="me-field">
          <label class="me-label">Сложность</label>
          ${meBuildDropdown('complexity', 'Нет', ME_COMPLEXITY, meDraft ? meDraft.complexity : '')}
        </div>
      </div>

      <div class="me-field">
        <div class="me-ing-header" style="margin-top:0;">
          <span class="me-label">Теги</span>
          <button type="button" class="me-add-btn" data-action="edit-tags">✎ Изменить</button>
        </div>
        <div class="me-tags-list" data-action="edit-tags">
          ${
            (meDraft.tags && meDraft.tags.length > 0) 
              ? meDraft.tags.slice(0, 5).map(t => `<span class="me-tag-chip">${t}</span>`).join('') + 
                (meDraft.tags.length > 5 ? `<span class="me-tag-chip me-tag-more">+${meDraft.tags.length - 5}</span>` : '')
              : '<span class="me-tags-empty">Не выбраны</span>'
          }
        </div>
      </div>

      ${meBuildIngredientsHtml()}
      ${meBuildStepsHtml()}
      ${meBuildTimeHtml()}

      <div class="me-field me-version-field" style="display:none">
        <label class="me-label" for="meVersionName">Название версии</label>
        <input type="text" class="me-input" id="meVersionName" placeholder="Версия N">
      </div>
    </div>
  `;
}

function meBuildSoon(text){
  return `<div class="me-soon">${text}</div>`;
}

// ─── Установить значение Dropdown ───
function meSetDropdownValue(dd, val, options) {
  dd.dataset.val = val;
  const labelEl = dd.querySelector('.me-dd-label');
  const opt = options.find(o => o.val === val);
  if (opt) {
    labelEl.textContent = opt.label;
    dd.classList.add('has-value');
  } else {
    labelEl.textContent = dd.dataset.placeholder || 'Выбрать';
    dd.classList.remove('has-value');
  }
  dd.querySelectorAll('.me-dropdown-item').forEach(item => {
    item.classList.toggle('active', item.dataset.val === val);
  });
}

// ─── Пересчёт КБЖУ ───
function meRecalcKbzhu() {
  let totalKcal = 0, totalProt = 0, totalFat = 0, totalCarb = 0;
  const detailsList = document.getElementById('meKbzhuList');
  if (detailsList) detailsList.innerHTML = '';

  if (meDraft.ingredients) {
    meDraft.ingredients.forEach(ing => {
      let grams = parseFloat(ing.amount) || 0;
      if (ing.unit === 'мл') grams = grams * (ing.density || 1);
      if (ing.unit === 'шт') grams = grams * (ing.weightPerPiece || 100);
      const ratio = grams / 100;
      const k = (ing.kcal || 0) * ratio;
      const p = (ing.protein || 0) * ratio;
      const f = (ing.fat || 0) * ratio;
      const c = (ing.carbs || 0) * ratio;

      totalKcal += k; totalProt += p; totalFat += f; totalCarb += c;

      if (detailsList) {
        detailsList.innerHTML += `
          <li>
            <span>${ing.name} (${ing.amount} ${ing.unit})</span>
            <span>${Math.round(k)} ккал</span>
          </li>
        `;
      }
    });
  }

  const pPortions = meDraft.portions || 2;
  const totalEl = document.getElementById('meKbzhuTotal');
  if (totalEl) {
    const f1 = n => Math.round(n * 10) / 10;
    totalEl.innerHTML = `
      <div class="me-kbzhu-row">
        <span>На всё блюдо:</span>
        <b>${Math.round(totalKcal)} ккал</b> · Б ${f1(totalProt)} · Ж ${f1(totalFat)} · У ${f1(totalCarb)}
      </div>
      <div class="me-kbzhu-row per-portion">
        <span>На 1 порцию (из ${pPortions}):</span>
        <b>${Math.round(totalKcal / pPortions)} ккал</b> · Б ${f1(totalProt/pPortions)} · Ж ${f1(totalFat/pPortions)} · У ${f1(totalCarb/pPortions)}
      </div>
    `;
  }
}

// ─── Пересчёт общего времени из этапов ───
function meRecalcTotalTime() {
  if (!meDraft.timeSplit) return;
  let sum = 0;
  (meDraft.timeStages || []).forEach(st => sum += (parseFloat(st.mins) || 0));
  meDraft.time = sum;
  const input = document.querySelector('[data-action="change-time-total"]');
  if (input) input.value = sum || '';
}

// ─── Рендер тела ───
function meRenderBody(){
  if (meCurrentTab === 'text'){
    meBody.innerHTML = meBuildSoon('📋 Загрузка из текста появится позже.');
    return;
  }
  if (meCurrentTab === 'link'){
    meBody.innerHTML = meBuildSoon('🔗 Загрузка по ссылке появится позже.');
    return;
  }
  meBody.innerHTML = meBuildFields();
  meRecalcKbzhu();

  if (meCurrentRecipe) {
    const vf = meBody.querySelector('.me-version-field');
    if (vf) {
      vf.style.display = '';
      document.getElementById('meVersionName').value = meDraft.versionName || '';
    }
  }

  // Принудительный пересчёт высоты текстовых полей шагов.
  setTimeout(() => {
    meBody.querySelectorAll('.me-step-text').forEach(ta => {
      ta.style.height = 'auto';
      ta.style.height = ta.scrollHeight + 'px';
    });
  }, 10);
}

// ─── Собрать значения формы в черновик ───
function meCollectForm(){
  if (!document.getElementById('meName')) return;
  const mealDD   = meBody.querySelector('[data-field="meal"]');
  const sourceDD = meBody.querySelector('[data-field="source"]');
  const compDD   = meBody.querySelector('[data-field="complexity"]');
  const vnEl     = document.getElementById('meVersionName');

  meDraft.name       = document.getElementById('meName').value;
  meDraft.source     = sourceDD ? sourceDD.dataset.val : 'Мои';
  meDraft.meal       = mealDD ? mealDD.dataset.val : '';
  meDraft.complexity = compDD ? compDD.dataset.val : '';
  if (vnEl) meDraft.versionName = vnEl.value;
}

// ─── Открыть ───
async function openRecipeEditor(recipeId){
  meEditId        = recipeId || null;
  meCurrentTab    = 'manual';
  meKbzhuOpen     = false;
  meCurrentRecipe = null;

  const box = modalRecipeEditor.querySelector('.modal-editor-box');
  if (box) {
    ['style','palette','theme','shadow'].forEach(key => {
      const attr = 'data-' + key;
      const val = document.body.getAttribute(attr);
      if (val) box.setAttribute(attr, val);
      else     box.removeAttribute(attr);
    });
  }

  if (meEditId){
    const recipe = await Storage.getRecipe(meEditId);
    if (!recipe){ console.warn('[editor] рецепт не найден:', meEditId); return; }
    meCurrentRecipe = recipe;
    meTitle.textContent = 'Редактировать: ' + (recipe.name || 'рецепт');
    meTabs.style.display = 'none';
    
    meDraft = {
      name: recipe.name || '',
      meal: recipe.meal || '',
      source: recipe.source || 'Мои',
      complexity: recipe.complexity || '',
      portions: recipe.portions || 2,
      versionName: recipe.versionName || '',
      tags: recipe.tags ? [...recipe.tags] : [],
      ingredients: (recipe.ingredients || []).map(i => ({ ...i })),
      steps: recipe.steps ? [...recipe.steps] : [],
      time: recipe.time || '',
      timeSplit: !!recipe.timeSplit,
      timeStages: recipe.timeStages ? recipe.timeStages.map(s => ({ ...s })) : []
    };
  } else {
    meTitle.textContent = 'Добавить рецепт';
    meTabs.style.display = '';
    meTabs.querySelectorAll('.me-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === 'manual');
    });
    
    meDraft = {
      name: '', meal: '', source: 'Мои', complexity: '',
      portions: 2, versionName: '', tags: [], ingredients: [],
      steps: [], time: '', timeSplit: false, timeStages: []
    };
  }

  meRenderBody();
  modalRecipeEditor.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

// ─── Закрыть ───
function closeRecipeEditor(){
  modalRecipeEditor.style.display = 'none';
  document.body.style.overflow = '';
  meEditId = null;
  meCurrentRecipe = null;
  meDraft = null;
}

// ─── Переключение вкладок ───
meTabs.addEventListener('click', (e) => {
  const tab = e.target.closest('.me-tab');
  if (!tab) return;
  if (meCurrentTab === 'manual') meCollectForm();
  meTabs.querySelectorAll('.me-tab').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');
  meCurrentTab = tab.dataset.tab;
  meRenderBody();
});

// ─── Клики внутри тела ───
meBody.addEventListener('click', async (e) => {
  // Dropdown
  const btn = e.target.closest('.me-dropdown-btn');
  if (btn) {
    e.stopPropagation();
    const dd = btn.parentElement;
    const isOpen = dd.classList.contains('open');
    meBody.querySelectorAll('.me-dropdown').forEach(d => d.classList.remove('open'));
    if (!isOpen) dd.classList.add('open');
    return;
  }

  const item = e.target.closest('.me-dropdown-item');
  if (item) {
    const dd = item.parentElement.parentElement;
    const val = item.dataset.val;
    const field = dd.dataset.field;
    let valToSet = val;
    if (field === 'complexity' && dd.dataset.val === val) valToSet = '';
    const options = field === 'meal' ? ME_MEALS : field === 'source' ? ME_SOURCES : ME_COMPLEXITY;
    meSetDropdownValue(dd, valToSet, options);
    dd.classList.remove('open');
    return;
  }

    // Теги
  if (e.target.closest('[data-action="edit-tags"]')) {
    if (typeof openTagModal === 'function') {
      openTagModal(meDraft.tags, (newTags) => {
        meDraft.tags = newTags;
        meRenderBody();
      });
    } else {
      alert('Ошибка: модалка тегов не загружена (openTagModal). Проверьте, подключен ли файл tag-modal.js в index.html.');
    }
    return;
  }

  // Ингредиенты
  if (e.target.closest('[data-action="add-ing"]')) {
    const excludeIds = (meDraft.ingredients || []).map(i => i.productId).filter(id => id);
    if (typeof openProductPicker === 'function') {
      openProductPicker({
        excludeIds: excludeIds,
        onSelect: (product) => {
          meDraft.ingredients.push({
            productId: product.id,
            name: product.shortName || product.name,
            amount: product.unit === 'шт' ? 1 : 100,
            unit: product.unit || 'г',
            kcal: product.kcal, protein: product.protein, fat: product.fat, carbs: product.carbs,
            density: product.density, weightPerPiece: product.weightPerPiece
          });
          meRenderBody();
        }
      });
    }
    return;
  }
  if (e.target.closest('[data-action="del-ing"]')) {
    const idx = parseInt(e.target.closest('.me-ing-item').dataset.idx, 10);
    meDraft.ingredients.splice(idx, 1);
    meRenderBody();
    return;
  }
  if (e.target.closest('[data-action="portions-plus"]')) {
    meDraft.portions++;
    document.getElementById('mePortionsNum').textContent = meDraft.portions;
    meRecalcKbzhu();
    return;
  }
  if (e.target.closest('[data-action="portions-minus"]')) {
    if (meDraft.portions > 1) {
      meDraft.portions--;
      document.getElementById('mePortionsNum').textContent = meDraft.portions;
      meRecalcKbzhu();
    }
    return;
  }
  if (e.target.closest('[data-action="toggle-kbzhu"]')) {
    meKbzhuOpen = !meKbzhuOpen;
    document.getElementById('meKbzhuPanel').classList.toggle('open', meKbzhuOpen);
    return;
  }

  // Шаги
  if (e.target.closest('[data-action="add-step"]')) {
    meDraft.steps.push('');
    meRenderBody();
    const tas = meBody.querySelectorAll('.me-step-text');
    if (tas.length) tas[tas.length-1].focus();
    return;
  }
  if (e.target.closest('[data-action="del-step"]')) {
    const idx = parseInt(e.target.closest('.me-step-item').dataset.idx, 10);
    meDraft.steps.splice(idx, 1);
    meRenderBody();
    return;
  }

  // Время
  if (e.target.closest('[data-action="toggle-time-split"]')) {
    const cb = e.target.closest('[data-action="toggle-time-split"]');
    meDraft.timeSplit = cb.checked;
    
    meDraft.time = '';
    if (meDraft.timeSplit) {
      meDraft.timeStages = [{ name: 'Подготовка', mins: '' }];
    } else {
      meDraft.timeStages = [];
    }
    
    meRenderBody();
    return;
  }
  if (e.target.closest('[data-action="add-stage"]')) {
    meDraft.timeStages.push({ name: 'Готовка', mins: '' });
    meRenderBody();
    return;
  }
  if (e.target.closest('[data-action="del-stage"]')) {
    const idx = parseInt(e.target.closest('.me-time-stage').dataset.idx, 10);
    meDraft.timeStages.splice(idx, 1);
    meRecalcTotalTime();
    meRenderBody();
    return;
  }
});

// ─── Изменения (input / change) ───
meBody.addEventListener('input', (e) => {
  if (e.target.dataset.action === 'change-amt') {
    const idx = parseInt(e.target.closest('.me-ing-item').dataset.idx, 10);
    meDraft.ingredients[idx].amount = parseFloat(e.target.value) || 0;
    meRecalcKbzhu();
  }
  
  if (e.target.dataset.action === 'change-step') {
    const idx = parseInt(e.target.closest('.me-step-item').dataset.idx, 10);
    meDraft.steps[idx] = e.target.value;
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  }

  if (e.target.dataset.action === 'change-time-total') {
    meDraft.time = parseFloat(e.target.value) || '';
  }

  if (e.target.dataset.action === 'change-stage-mins') {
    const idx = parseInt(e.target.closest('.me-time-stage').dataset.idx, 10);
    meDraft.timeStages[idx].mins = parseFloat(e.target.value) || '';
    meRecalcTotalTime();
  }

  if (e.target.dataset.action === 'change-stage-name') {
    const isCustom = e.target.value === 'custom';
    const row = e.target.closest('.me-time-stage');
    const customInput = row.querySelector('.me-time-custom');
    customInput.style.display = isCustom ? 'block' : 'none';
    if (isCustom) customInput.focus();
  }

  if (e.target.classList.contains('me-time-custom')) {
    const idx = parseInt(e.target.closest('.me-time-stage').dataset.idx, 10);
    meDraft.timeStages[idx].name = e.target.value;
  }
});
meBody.addEventListener('change', (e) => {
  if (e.target.dataset.action === 'change-unit') {
    const idx = parseInt(e.target.closest('.me-ing-item').dataset.idx, 10);
    meDraft.ingredients[idx].unit = e.target.value;
    meRecalcKbzhu();
  }
  if (e.target.dataset.action === 'change-stage-name') {
    const val = e.target.value;
    if (val !== 'custom') {
      const idx = parseInt(e.target.closest('.me-time-stage').dataset.idx, 10);
      meDraft.timeStages[idx].name = val;
    }
  }
});

// ─── Drag & Drop для шагов ───
meBody.addEventListener('dragstart', (e) => {
  const item = e.target.closest('.me-step-item');
  if (item) {
    meDragSrcEl = item;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item.dataset.idx);
    item.classList.add('dragging');
  }
});
meBody.addEventListener('dragend', (e) => {
  const item = e.target.closest('.me-step-item');
  if (item) item.classList.remove('dragging');
  meDragSrcEl = null;
});
meBody.addEventListener('dragover', (e) => {
  e.preventDefault();
  const item = e.target.closest('.me-step-item');
  if (item && meDragSrcEl && item !== meDragSrcEl) {
    item.classList.add('drag-over');
  }
});
meBody.addEventListener('dragleave', (e) => {
  const item = e.target.closest('.me-step-item');
  if (item) item.classList.remove('drag-over');
});
meBody.addEventListener('drop', (e) => {
  e.preventDefault();
  const target = e.target.closest('.me-step-item');
  if (target && meDragSrcEl && target !== meDragSrcEl) {
    target.classList.remove('drag-over');
    const fromIdx = parseInt(meDragSrcEl.dataset.idx, 10);
    const toIdx = parseInt(target.dataset.idx, 10);
    const moved = meDraft.steps.splice(fromIdx, 1)[0];
    meDraft.steps.splice(toIdx, 0, moved);
    meRenderBody();
  }
});

// Закрытие дропдаунов
document.addEventListener('click', (e) => {
  if (!e.target.closest('.me-dropdown')) {
    meBody.querySelectorAll('.me-dropdown').forEach(d => d.classList.remove('open'));
  }
});

// ─── Закрытие модалки ───
meClose.addEventListener('click', closeRecipeEditor);
meCancel.addEventListener('click', closeRecipeEditor);

let meBackdropDown = false;
modalRecipeEditor.addEventListener('mousedown', (e) => {
  meBackdropDown = (e.target === modalRecipeEditor);
});
modalRecipeEditor.addEventListener('mouseup', (e) => {
  if (meBackdropDown && e.target === modalRecipeEditor) closeRecipeEditor();
  meBackdropDown = false;
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modalRecipeEditor.style.display === 'flex') closeRecipeEditor();
});

// ─── Меню ➕ → Добавить рецепт ───
(function bindAddMenu(){
  const addMenu = document.getElementById('modalAdd');
  if (!addMenu) return;
  const btn = addMenu.querySelector('[data-action="create-recipe"]');
  if (!btn) return;
  btn.addEventListener('click', () => {
    addMenu.style.display = 'none';
    openRecipeEditor();
  });
})();