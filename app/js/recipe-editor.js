// ═══════════════════════════════════════════════════
// recipe-editor.js — модалка редактора рецепта (шаг 37).
// 37.1 — каркас. 37.2 — основные поля (Dropdown).
// Загружается после card-big.js, до product-picker.js.
// ═══════════════════════════════════════════════════

const modalRecipeEditor = document.getElementById('modalRecipeEditor');
const meTitle           = document.getElementById('meTitle');
const meClose           = document.getElementById('meClose');
const meCancel          = document.getElementById('meCancel');
const meBody            = document.getElementById('meBody');
const meTabs            = document.getElementById('meTabs');

let meEditId        = null;   // ID рецепта при редактировании, иначе null
let meCurrentRecipe = null;   // объект рецепта при редактировании
let meCurrentTab    = 'manual';
let meDraft         = null;   // черновик полей (только в памяти)

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

// ─── Сборка одного Dropdown ───
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

// ─── HTML полей ───
function meBuildFields(){
  return `
    <div class="me-form">
      <div class="me-field">
        <label class="me-label" for="meName">Название <span class="me-req">*</span></label>
        <input type="text" class="me-input" id="meName" placeholder="Например: Овсянка с ягодами">
      </div>

      <div class="me-row3">
        <div class="me-field">
          <label class="me-label">Приём пищи <span class="me-req">*</span></label>
          ${meBuildDropdown('meal', 'Выбрать', ME_MEALS)}
        </div>

        <div class="me-field">
          <label class="me-label">Источник</label>
          ${meBuildDropdown('source', 'Выбрать', ME_SOURCES)}
        </div>

        <div class="me-field">
          <label class="me-label">Сложность</label>
          ${meBuildDropdown('complexity', 'Нет', ME_COMPLEXITY)}
        </div>
      </div>

      <div class="me-field me-version-field" style="display:none">
        <label class="me-label" for="meVersionName">Название версии</label>
        <input type="text" class="me-input" id="meVersionName" placeholder="Версия N">
      </div>

      <div class="me-skel-note">Ингредиенты, шаги и время появятся в подшагах 37.3–37.4</div>
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
  meFillForm();
}

// ─── Собрать значения формы в черновик ───
function meCollectForm(){
  if (!document.getElementById('meName')) return;
  const nameEl   = document.getElementById('meName');
  const vnEl     = document.getElementById('meVersionName');
  
  const mealDD   = meBody.querySelector('[data-field="meal"]');
  const sourceDD = meBody.querySelector('[data-field="source"]');
  const compDD   = meBody.querySelector('[data-field="complexity"]');

  meDraft = {
    name:        nameEl ? nameEl.value : '',
    source:      sourceDD ? sourceDD.dataset.val : 'Мои',
    meal:        mealDD ? mealDD.dataset.val : '',
    complexity:  compDD ? compDD.dataset.val : '',
    versionName: vnEl ? vnEl.value : ''
  };
}

// ─── Заполнить поля ───
function meFillForm(){
  const src = meDraft || meCurrentRecipe || {};

  const nameEl = document.getElementById('meName');
  nameEl.value = src.name || '';

  const mealDD = meBody.querySelector('[data-field="meal"]');
  if (mealDD) meSetDropdownValue(mealDD, src.meal || '', ME_MEALS);

  const sourceDD = meBody.querySelector('[data-field="source"]');
  const defaultSource = src.source || 'Мои';
  if (sourceDD) meSetDropdownValue(sourceDD, defaultSource, ME_SOURCES);

  const compDD = meBody.querySelector('[data-field="complexity"]');
  if (compDD) meSetDropdownValue(compDD, src.complexity || '', ME_COMPLEXITY);

  const versionField = meBody.querySelector('.me-version-field');
  if (meCurrentRecipe){
    versionField.style.display = '';
    document.getElementById('meVersionName').value = src.versionName || '';
  } else {
    versionField.style.display = 'none';
  }
}

// ─── Открыть ───
async function openRecipeEditor(recipeId){
  meEditId        = recipeId || null;
  meCurrentTab    = 'manual';
  meDraft         = null;
  meCurrentRecipe = null;

  if (meEditId){
    const recipe = await Storage.getRecipe(meEditId);
    if (!recipe){ console.warn('[editor] рецепт не найден:', meEditId); return; }
    meCurrentRecipe = recipe;
    meTitle.textContent = 'Редактировать: ' + (recipe.name || 'рецепт');
    meTabs.style.display = 'none';
  } else {
    meTitle.textContent = 'Добавить рецепт';
    meTabs.style.display = '';
    meTabs.querySelectorAll('.me-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === 'manual');
    });
  }

  meRenderBody();
  modalRecipeEditor.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

// ─── Закрыть ───
function closeRecipeEditor(){
  modalRecipeEditor.style.display = 'none';
  document.body.style.overflow = '';
  meEditId        = null;
  meCurrentRecipe = null;
  meDraft         = null;
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

// ─── Клики по Dropdown ───
meBody.addEventListener('click', (e) => {
  // 1. Клик по кнопке дропдауна
  const btn = e.target.closest('.me-dropdown-btn');
  if (btn) {
    e.stopPropagation();
    const dd = btn.parentElement;
    const isOpen = dd.classList.contains('open');
    
    // Закрываем все остальные
    meBody.querySelectorAll('.me-dropdown').forEach(d => d.classList.remove('open'));
    if (!isOpen) dd.classList.add('open');
    return;
  }

  // 2. Клик по пункту меню
  const item = e.target.closest('.me-dropdown-item');
  if (item) {
    const dd = item.parentElement.parentElement;
    const val = item.dataset.val;
    const field = dd.dataset.field;
    
    let valToSet = val;
    // Для сложности: если кликнули по уже выбранному, то снимаем выбор
    if (field === 'complexity' && dd.dataset.val === val) {
      valToSet = '';
    }
    
    const options = field === 'meal' ? ME_MEALS : field === 'source' ? ME_SOURCES : ME_COMPLEXITY;
    meSetDropdownValue(dd, valToSet, options);
    dd.classList.remove('open');
    return;
  }
});

// Закрытие дропдаунов по клику вне их
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
  if (e.key !== 'Escape') return;
  if (modalRecipeEditor.style.display === 'flex') closeRecipeEditor();
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