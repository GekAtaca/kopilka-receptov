// ═══════════════════════════════════════════════════
// recipe-editor.js — модалка редактора рецепта (с вкладками устройств).
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
let meDevices       = [];
let meActiveDeviceIndex = 0; // Какая вкладка устройства сейчас открыта
const meSaveBtn     = document.getElementById('meSave');

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

function meBuildIngredientsHtml() {
  const activeData = meDraft.devicesData[meActiveDeviceIndex];
  const listHtml = (activeData.ingredients || []).map((ing, idx) => `
    <li class="me-ing-item" data-idx="${idx}">
      <button type="button" class="me-ing-name-btn" title="${ing.name}">${ing.name}</button>
      <input type="number" name="ingAmount" class="me-input me-ing-amt" value="${ing.amount}" data-action="change-amt" placeholder="0">
      <select name="ingUnit" class="me-input me-ing-unit" data-action="change-unit">
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

function meBuildStepsHtml() {
  const activeData = meDraft.devicesData[meActiveDeviceIndex];
  const listHtml = (activeData.steps || []).map((s, idx) => `
    <li class="me-step-item" draggable="true" data-idx="${idx}">
      <div class="me-step-drag" title="Перетащить">⋮⋮</div>
      <div class="me-step-num">${idx + 1}.</div>
      <textarea name="stepText" class="me-step-text" rows="1" data-action="change-step" placeholder="Что нужно сделать...">${s}</textarea>
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

function meBuildTimeHtml() {
  const activeData = meDraft.devicesData[meActiveDeviceIndex];
  const split = activeData.timeSplit;
  const stagesHtml = (activeData.timeStages || []).map((st, idx) => `
    <li class="me-time-stage" data-idx="${idx}">
      <select name="stageName" class="me-input me-time-select" data-action="change-stage-name">
        ${ME_TIME_STAGES.map(n => `<option value="${n}" ${st.name === n ? 'selected' : ''}>${n}</option>`).join('')}
        <option value="custom" ${!ME_TIME_STAGES.includes(st.name) ? 'selected' : ''}>Свой вариант...</option>
      </select>
      <input type="text" name="timeCustom" class="me-input me-time-custom" value="${!ME_TIME_STAGES.includes(st.name) ? st.name : ''}" placeholder="Название" style="display:${!ME_TIME_STAGES.includes(st.name) ? 'block' : 'none'}">
      <input type="number" name="timeMins" class="me-input me-time-mins" value="${st.mins || ''}" data-action="change-stage-mins" placeholder="мин">
      <button type="button" data-action="del-stage" title="Удалить">🗑</button>
    </li>
  `).join('');

  return `
    <div class="me-time-section">
      <div class="me-time-header">
        <span class="me-label">Время готовки</span>
        <label class="me-checkbox">
          <input type="checkbox" name="timeSplit" data-action="toggle-time-split" ${split ? 'checked' : ''}>
          <span>Разбить на этапы</span>
        </label>
      </div>

      <div class="me-time-total-wrap" style="display:${split ? 'none' : 'flex'}">
        <input type="number" name="timeTotal" class="me-input me-time-total-input" value="${activeData.time || ''}" data-action="change-time-total" placeholder="0">
        <span>мин</span>
      </div>

      <div class="me-time-stages-wrap" style="display:${split ? 'flex' : 'none'}">
        <ul class="me-time-stages-list">${stagesHtml}</ul>
        <button type="button" class="me-add-btn" data-action="add-stage">+ Добавить этап</button>
      </div>
    </div>
  `;
}

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

function meBuildFields(){
  const activeData = meDraft.devicesData[meActiveDeviceIndex];
  
  // Панель вкладок устройств
  let tabsHtml = `<div class="me-device-tabs-wrap">`;
  meDraft.devicesData.forEach((d, idx) => {
    const isActive = idx === meActiveDeviceIndex;
    const devName = d.device || 'Без названия';
    tabsHtml += `
      <div class="me-device-tab ${isActive ? 'active' : ''}" data-action="switch-device" data-idx="${idx}">
        ${devName}
        ${meDraft.devicesData.length > 1 ? `<span class="me-tab-del" data-action="del-device" data-idx="${idx}">✕</span>` : ''}
      </div>
    `;
  });
  tabsHtml += `<button type="button" class="me-device-tab-add" data-action="add-device">+ Добавить</button>`;
  tabsHtml += `</div>`;

  return `
    <div class="me-form">
      ${tabsHtml}

      <div class="me-field">
        <label class="me-label" for="meRecipeName">Название <span class="me-req">*</span></label>
        <input type="text" name="recipeName" class="me-input" id="meRecipeName" placeholder="Например: Овсянка с ягодами" value="${meDraft ? meDraft.name : ''}">
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
        <div class="me-ing-header" style="margin-top:0; margin-bottom:6px;">
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

      <div class="me-device-fields">
        <div class="me-field" style="margin-bottom: 16px;">
          <div class="me-ing-header" style="margin-top:0; margin-bottom:6px;">
            <span class="me-label">Устройство для этой вкладки</span>
            <button type="button" class="me-add-btn" data-action="manage-devices">⚙ Настроить</button>
          </div>
          ${meBuildDropdown('device', 'Выбрать', [{ val: '', label: 'Не выбрано' }, ...meDevices.map(d => ({ val: d, label: d }))], activeData.device || '')}
        </div>

        ${meBuildIngredientsHtml()}
        ${meBuildStepsHtml()}
        ${meBuildTimeHtml()}
      </div>
    </div>
  `;
}

function meBuildSoon(text){
  return `<div class="me-soon">${text}</div>`;
}

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

function meRecalcKbzhu() {
  const activeData = meDraft.devicesData[meActiveDeviceIndex];
  let totalKcal = 0, totalProt = 0, totalFat = 0, totalCarb = 0;
  const detailsList = document.getElementById('meKbzhuList');
  if (detailsList) detailsList.innerHTML = '';

  if (activeData.ingredients) {
    activeData.ingredients.forEach(ing => {
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

function meRecalcTotalTime() {
  const activeData = meDraft.devicesData[meActiveDeviceIndex];
  if (!activeData.timeSplit) return;
  let sum = 0;
  (activeData.timeStages || []).forEach(st => sum += (parseFloat(st.mins) || 0));
  activeData.time = sum;
  const input = document.querySelector('[data-action="change-time-total"]');
  if (input) input.value = sum || '';
}

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

/* Этот блок удалён, так как нижнее поле версии больше не используется */

  setTimeout(() => {
    meBody.querySelectorAll('.me-step-text').forEach(ta => {
      ta.style.height = 'auto';
      ta.style.height = ta.scrollHeight + 'px';
    });
  }, 10);
}

function meCollectForm(){
  if (!document.getElementById('meRecipeName')) return;
  const mealDD   = meBody.querySelector('[data-field="meal"]');
  const sourceDD = meBody.querySelector('[data-field="source"]');
  const compDD   = meBody.querySelector('[data-field="complexity"]');
  const deviceDD = meBody.querySelector('[data-field="device"]');
  const vnEl     = document.getElementById('meVersionName');

  meDraft.name       = document.getElementById('meRecipeName').value;
  meDraft.source     = sourceDD ? sourceDD.dataset.val : 'Мои';
  meDraft.meal       = mealDD ? mealDD.dataset.val : '';
  meDraft.complexity = compDD ? compDD.dataset.val : '';
  
  // Сохраняем устройство в активную вкладку
  if (deviceDD) {
    meDraft.devicesData[meActiveDeviceIndex].device = deviceDD.dataset.val;
  }
  
  if (vnEl) meDraft.versionName = vnEl.value;
}

async function openRecipeEditor(recipeId){
  meEditId        = recipeId || null;
  meCurrentTab    = 'manual';
  meKbzhuOpen     = false;
  meCurrentRecipe = null;
  meActiveDeviceIndex = 0; // Сбрасываем на первую вкладку
  meDevices = await Storage.getDevices();

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
    
    // Конвертация старого формата в новый (devicesData)
    let devicesData = [];
    if (recipe.devicesData && recipe.devicesData.length > 0) {
      devicesData = JSON.parse(JSON.stringify(recipe.devicesData));
    } else {
      devicesData = [{
        device: recipe.device || '',
        ingredients: recipe.ingredients ? [...recipe.ingredients] : [],
        steps: recipe.steps ? [...recipe.steps] : [],
        time: recipe.time || '',
        timeSplit: !!recipe.timeSplit,
        timeStages: recipe.timeStages ? recipe.timeStages.map(s => ({ ...s })) : []
      }];
    }

    meDraft = {
      name: recipe.name || '',
      meal: recipe.meal || '',
      source: recipe.source || 'Мои',
      complexity: recipe.complexity || '',
      portions: recipe.portions || 2,
      versionName: recipe.versionName || '',
      currentVersion: recipe.currentVersion || 1,
      versions: recipe.versions ? [...recipe.versions] : [],
      tags: recipe.tags ? [...recipe.tags] : [],
      devicesData: devicesData
    };
  } else {
    meTitle.textContent = 'Добавить рецепт';
    meTabs.style.display = '';
    meTabs.querySelectorAll('.me-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === 'manual');
    });
    
    meDraft = {
      name: '', meal: '', source: 'Мои', complexity: '',
      portions: 2, versionName: 'Версия 1', currentVersion: 1, versions: [],
      tags: [],
      devicesData: [{
        device: '', ingredients: [], steps: [], time: '', timeSplit: false, timeStages: []
      }]
    };
  }

  meRenderBody();
  modalRecipeEditor.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeRecipeEditor(){
  modalRecipeEditor.style.display = 'none';
  document.body.style.overflow = '';
  meEditId = null;
  meCurrentRecipe = null;
  meDraft = null;
}

meTabs.addEventListener('click', (e) => {
  const tab = e.target.closest('.me-tab');
  if (!tab) return;
  if (meCurrentTab === 'manual') meCollectForm();
  meTabs.querySelectorAll('.me-tab').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');
  meCurrentTab = tab.dataset.tab;
  meRenderBody();
});

meBody.addEventListener('click', async (e) => {
  if (meCurrentTab === 'manual') meCollectForm();

  // ─── ВКЛАДКИ УСТРОЙСТВ ───
  const tabBtn = e.target.closest('.me-device-tab');
  if (tabBtn) {
    const delBtn = e.target.closest('.me-tab-del');
    if (delBtn) {
      e.stopPropagation();
      if (meDraft.devicesData.length <= 1) return;
      const idx = parseInt(delBtn.dataset.idx, 10);
      if (confirm('Удалить эту вкладку устройства? Все ингредиенты и шаги внутри неё удалятся.')) {
        meDraft.devicesData.splice(idx, 1);
        if (meActiveDeviceIndex >= meDraft.devicesData.length) {
          meActiveDeviceIndex = meDraft.devicesData.length - 1;
        }
        meRenderBody();
      }
      return;
    }
    const idx = parseInt(tabBtn.dataset.idx, 10);
    if (idx !== meActiveDeviceIndex) {
      meActiveDeviceIndex = idx;
      meRenderBody();
    }
    return;
  }

  if (e.target.closest('[data-action="add-device"]')) {
    meDraft.devicesData.push({
      device: '', ingredients: [], steps: [], time: '', timeSplit: false, timeStages: []
    });
    meActiveDeviceIndex = meDraft.devicesData.length - 1;
    meRenderBody();
    return;
  }

  // ─── ОСТАЛЬНЫЕ КНОПКИ ───
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
    let options = field === 'meal' ? ME_MEALS : field === 'source' ? ME_SOURCES : ME_COMPLEXITY;
    if (field === 'device') options = [{ val: '', label: 'Не выбрано' }, ...meDevices.map(d => ({ val: d, label: d }))];
    
    meSetDropdownValue(dd, valToSet, options);
    dd.classList.remove('open');
    
    if (field === 'meal') meDraft.meal = valToSet;
    if (field === 'source') meDraft.source = valToSet;
    if (field === 'complexity') meDraft.complexity = valToSet;
    if (field === 'device') {
      meDraft.devicesData[meActiveDeviceIndex].device = valToSet;
      // Обновляем название на самой вкладке
      const activeTabEl = meBody.querySelector(`.me-device-tab[data-idx="${meActiveDeviceIndex}"]`);
      if (activeTabEl) {
        const delBtn = activeTabEl.querySelector('.me-tab-del');
        activeTabEl.innerHTML = (valToSet || 'Без названия') + (delBtn ? delBtn.outerHTML : '');
      }
    }

    if (field === 'meal' && valToSet) {
      const b = dd.querySelector('.me-dropdown-btn');
      if (b) b.classList.remove('invalid');
    }
    return;
  }

  if (e.target.closest('[data-action="manage-devices"]')) {
    openDeviceManager(async () => {
      meDevices = await Storage.getDevices();
      const activeData = meDraft.devicesData[meActiveDeviceIndex];
      if (activeData.device && !meDevices.includes(activeData.device)) {
        activeData.device = ''; 
      }
      meRenderBody();
    });
    return;
  }

  if (e.target.closest('[data-action="edit-tags"]')) {
    if (typeof openTagModal === 'function') {
      openTagModal(meDraft.tags, (newTags) => {
        meDraft.tags = newTags;
        meRenderBody();
      });
    }
    return;
  }

  if (e.target.closest('[data-action="add-ing"]')) {
    const activeData = meDraft.devicesData[meActiveDeviceIndex];
    const excludeIds = (activeData.ingredients || []).map(i => i.productId).filter(id => id);
    if (typeof openProductPicker === 'function') {
      openProductPicker({
        excludeIds: excludeIds,
        onSelect: (product) => {
          activeData.ingredients.push({
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
    const activeData = meDraft.devicesData[meActiveDeviceIndex];
    const idx = parseInt(e.target.closest('.me-ing-item').dataset.idx, 10);
    const deleted = activeData.ingredients.splice(idx, 1)[0]; 
    meRenderBody();
    showToast('Ингредиент удалён', () => {
      activeData.ingredients.splice(idx, 0, deleted);
      meRenderBody();
    });
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

  if (e.target.closest('[data-action="add-step"]')) {
    const activeData = meDraft.devicesData[meActiveDeviceIndex];
    activeData.steps.push('');
    meRenderBody();
    const tas = meBody.querySelectorAll('.me-step-text');
    if (tas.length) tas[tas.length-1].focus();
    return;
  }
  if (e.target.closest('[data-action="del-step"]')) {
    const activeData = meDraft.devicesData[meActiveDeviceIndex];
    const idx = parseInt(e.target.closest('.me-step-item').dataset.idx, 10);
    const deleted = activeData.steps.splice(idx, 1)[0];
    meRenderBody();
    showToast('Шаг удалён', () => {
      activeData.steps.splice(idx, 0, deleted);
      meRenderBody();
    });
    return;
  }

  if (e.target.closest('[data-action="toggle-time-split"]')) {
    const activeData = meDraft.devicesData[meActiveDeviceIndex];
    const cb = e.target.closest('[data-action="toggle-time-split"]');
    activeData.timeSplit = cb.checked;
    activeData.time = '';
    if (activeData.timeSplit) {
      activeData.timeStages = [{ name: 'Подготовка', mins: '' }];
    } else {
      activeData.timeStages = [];
    }
    meRenderBody();
    return;
  }
  if (e.target.closest('[data-action="add-stage"]')) {
    const activeData = meDraft.devicesData[meActiveDeviceIndex];
    activeData.timeStages.push({ name: 'Готовка', mins: '' });
    meRenderBody();
    return;
  }
  if (e.target.closest('[data-action="del-stage"]')) {
    const activeData = meDraft.devicesData[meActiveDeviceIndex];
    const idx = parseInt(e.target.closest('.me-time-stage').dataset.idx, 10);
    activeData.timeStages.splice(idx, 1);
    meRecalcTotalTime();
    meRenderBody();
    return;
  }
});

meBody.addEventListener('input', (e) => {
  const activeData = meDraft.devicesData[meActiveDeviceIndex];
  
  if (e.target.dataset.action === 'change-amt') {
    const idx = parseInt(e.target.closest('.me-ing-item').dataset.idx, 10);
    activeData.ingredients[idx].amount = parseFloat(e.target.value) || 0;
    meRecalcKbzhu();
  }
  
  if (e.target.dataset.action === 'change-step') {
    const idx = parseInt(e.target.closest('.me-step-item').dataset.idx, 10);
    activeData.steps[idx] = e.target.value;
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  }

  if (e.target.dataset.action === 'change-time-total') {
    activeData.time = parseFloat(e.target.value) || '';
  }

  if (e.target.dataset.action === 'change-stage-mins') {
    const idx = parseInt(e.target.closest('.me-time-stage').dataset.idx, 10);
    activeData.timeStages[idx].mins = parseFloat(e.target.value) || '';
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
    activeData.timeStages[idx].name = e.target.value;
  }
});
meBody.addEventListener('change', (e) => {
  const activeData = meDraft.devicesData[meActiveDeviceIndex];
  if (e.target.dataset.action === 'change-unit') {
    const idx = parseInt(e.target.closest('.me-ing-item').dataset.idx, 10);
    activeData.ingredients[idx].unit = e.target.value;
    meRecalcKbzhu();
  }
  if (e.target.dataset.action === 'change-stage-name') {
    const val = e.target.value;
    if (val !== 'custom') {
      const idx = parseInt(e.target.closest('.me-time-stage').dataset.idx, 10);
      activeData.timeStages[idx].name = val;
    }
  }
});

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
    const activeData = meDraft.devicesData[meActiveDeviceIndex];
    const fromIdx = parseInt(meDragSrcEl.dataset.idx, 10);
    const toIdx = parseInt(target.dataset.idx, 10);
    const moved = activeData.steps.splice(fromIdx, 1)[0];
    activeData.steps.splice(toIdx, 0, moved);
    meRenderBody();
  }
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('.me-dropdown')) {
    meBody.querySelectorAll('.me-dropdown').forEach(d => d.classList.remove('open'));
  }
});

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

const meSaveArrow       = document.getElementById('meSaveArrow');
const meSplitDropdown   = document.getElementById('meSplitDropdown');
const modalVersionName  = document.getElementById('modalVersionName');
const mvnInput          = document.getElementById('mvnInput');

if (meSaveArrow && meSplitDropdown) {
  meSaveArrow.addEventListener('click', (e) => {
    e.stopPropagation();
    meSplitDropdown.classList.toggle('open');
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.me-split-wrap')) {
      meSplitDropdown.classList.remove('open');
    }
  });

  meSplitDropdown.addEventListener('click', (e) => {
    if (e.target.closest('[data-action="create-version"]')) {
      meSplitDropdown.classList.remove('open');
      if (modalVersionName) {
        const nextVer = meGetNextVersionNumber();
        if (mvnInput) {
          mvnInput.value = '';
          mvnInput.placeholder = 'Версия ' + nextVer;
        }
        modalVersionName.style.display = 'flex';
        setTimeout(() => { if (mvnInput) mvnInput.focus(); }, 50);
      }
    }
  });
}

const mvnCloseBtn = document.getElementById('mvnClose');
if (mvnCloseBtn && modalVersionName) {
  mvnCloseBtn.addEventListener('click', () => {
    modalVersionName.style.display = 'none';
  });
}
const mvnCancelBtn = document.getElementById('mvnCancel');
if (mvnCancelBtn && modalVersionName) {
  mvnCancelBtn.addEventListener('click', () => {
    modalVersionName.style.display = 'none';
  });
}

// ─── ФУНКЦИЯ ПОДГОТОВКИ К СОХРАНЕНИЮ (собирает плоские поля из 1-й вкладки) ───
function prepareRecipeToSave(draft) {
  meCollectForm();
  const mainData = draft.devicesData[0]; // Берем данные из первой вкладки для совместимости
  
  let totalTime = mainData.time;
  if (mainData.timeSplit) {
    totalTime = 0;
    (mainData.timeStages || []).forEach(st => totalTime += (parseFloat(st.mins) || 0));
  }

  let totalKcal = 0, totalProt = 0, totalFat = 0, totalCarb = 0;
  (mainData.ingredients || []).forEach(ing => {
    let grams = parseFloat(ing.amount) || 0;
    if (ing.unit === 'мл') grams = grams * (ing.density || 1);
    if (ing.unit === 'шт') grams = grams * (ing.weightPerPiece || 100);
    const ratio = grams / 100;
    totalKcal += (ing.kcal || 0) * ratio;
    totalProt += (ing.protein || 0) * ratio;
    totalFat += (ing.fat || 0) * ratio;
    totalCarb += (ing.carbs || 0) * ratio;
  });
  
  const portions = draft.portions || 1;
  const snapshot = {
    kcal: Math.round(totalKcal / portions),
    protein: Math.round((totalProt / portions) * 10) / 10,
    fat: Math.round((totalFat / portions) * 10) / 10,
    carbs: Math.round((totalCarb / portions) * 10) / 10
  };

  return {
    ...draft,
    device: mainData.device || '',
    ingredients: mainData.ingredients || [],
    steps: mainData.steps || [],
    time: totalTime,
    timeSplit: mainData.timeSplit,
    timeStages: mainData.timeStages || [],
    kbzhuSnapshot: snapshot
  };
}

const mvnSaveBtn = document.getElementById('mvnSave');
if (mvnSaveBtn && modalVersionName && mvnInput) {
  mvnSaveBtn.addEventListener('click', async () => {
    const newName = mvnInput.value.trim();
    const nextVer = meGetNextVersionNumber();
    
    // 1. Снимок СТАРОЙ версии
    let oldVersionSnapshot = null;
    if (meCurrentRecipe) {
      oldVersionSnapshot = JSON.parse(JSON.stringify(meCurrentRecipe));
      delete oldVersionSnapshot.versions;
    } else {
      oldVersionSnapshot = JSON.parse(JSON.stringify(meDraft));
      delete oldVersionSnapshot.versions;
    }

    // 2. Применяем новые правки
    meCollectForm();
    
    // 3. Сохраняем старую версию в архив
    if (!meDraft.versions) meDraft.versions = [];
    meDraft.versions.push(oldVersionSnapshot);
    
    meDraft.currentVersion = nextVer;
    meDraft.versionName = newName || ('Версия ' + nextVer);
    meDraft.name = newName || meDraft.name; // Название версии подставляется в верхнее поле
    
    if (!meValidate()) {
      meDraft.versions.pop();
      meDraft.currentVersion = nextVer - 1;
      meDraft.versionName = '';
      return;
    }

    const recipeToSave = prepareRecipeToSave(meDraft);
    if (meEditId) recipeToSave.id = meEditId;

    try {
      const saved = await Storage.saveRecipe(recipeToSave);
      if (!meEditId) meEditId = saved.id;
      meCurrentRecipe = saved;

      showToast('Создана версия ' + nextVer + ' (сохранено)');
      modalVersionName.style.display = 'none';
      closeRecipeEditor();
      if (typeof refreshCurrentRecipeCard === 'function') await refreshCurrentRecipeCard();
      if (typeof renderAllRecipes === 'function') renderAllRecipes();
    } catch (err) {
      console.error('[editor] Ошибка автосохранения:', err);
      showToast('Ошибка сохранения!');
    }
  });
}

function showToast(text, undoCallback) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.style.display = 'flex';
  toast.style.alignItems = 'center';
  toast.style.gap = '12px';
  
  const textSpan = document.createElement('span');
  textSpan.textContent = text;
  toast.appendChild(textSpan);

  if (undoCallback) {
    const btn = document.createElement('button');
    btn.textContent = 'Отменить';
    btn.style.background = '#e69db5';
    btn.style.color = '#fff';
    btn.style.border = 'none';
    btn.style.padding = '4px 10px';
    btn.style.borderRadius = '6px';
    btn.style.cursor = 'pointer';
    btn.style.fontWeight = 'bold';
    btn.style.fontFamily = 'inherit';
    btn.onclick = () => {
      undoCallback();
      toast.remove();
    };
    toast.appendChild(btn);
  }

  container.appendChild(toast);
  setTimeout(() => { toast.remove(); }, 5000);
}

function meValidate() {
  let isValid = true;
  let firstErrorEl = null;

  const nameInput = document.getElementById('meRecipeName');
  if (nameInput && !nameInput.value.trim()) {
    nameInput.classList.add('invalid');
    isValid = false;
    if (!firstErrorEl) firstErrorEl = nameInput;
  } else if (nameInput) {
    nameInput.classList.remove('invalid');
  }

  const mealDD = meBody.querySelector('[data-field="meal"]');
  const mealBtn = mealDD ? mealDD.querySelector('.me-dropdown-btn') : null;
  if (!meDraft.meal) {
    if (mealBtn) {
      mealBtn.classList.add('invalid');
      if (!firstErrorEl) firstErrorEl = mealBtn;
    }
    isValid = false;
  } else if (mealBtn) {
    mealBtn.classList.remove('invalid');
  }

  // Проверяем, что хотя бы в одной вкладке есть ингредиенты
  let hasIngredients = false;
  meDraft.devicesData.forEach(d => {
    if (d.ingredients && d.ingredients.length > 0) hasIngredients = true;
  });

  const ingSection = document.querySelector('.me-ing-section');
  if (!hasIngredients) {
    if (ingSection) {
      ingSection.classList.add('invalid');
      if (!firstErrorEl) firstErrorEl = ingSection;
    }
    isValid = false;
  } else if (ingSection) {
    ingSection.classList.remove('invalid');
  }

  if (!isValid && firstErrorEl) {
    firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    showToast('Заполните обязательные поля!');
  }

  return isValid;
}

function meGetNextVersionNumber() {
  let max = 0;
  if (meDraft) {
    if (meDraft.currentVersion) max = Math.max(max, meDraft.currentVersion);
    (meDraft.versions || []).forEach(v => {
      if (v.currentVersion) max = Math.max(max, v.currentVersion);
    });
  }
  return max + 1;
}

async function meSaveRecipe() {
  meCollectForm();
  if (!meValidate()) return;

  const recipeToSave = prepareRecipeToSave(meDraft);

  if (meEditId) {
    recipeToSave.id = meEditId;
    
    // Умная очистка галочек ингредиентов (проверяем по всем устройствам)
    const oldIngredients = meCurrentRecipe.ingredients || [];
    const newNamesSet = new Set();
    recipeToSave.devicesData.forEach(d => {
      (d.ingredients || []).forEach(i => newNamesSet.add(i.name));
    });
    
    for (const oldIng of oldIngredients) {
      if (!newNamesSet.has(oldIng.name)) {
        await Storage.removeMark('ingredient', meEditId, oldIng.name);
      }
    }
  }

  try {
    await Storage.saveRecipe(recipeToSave);
    closeRecipeEditor();
    showToast('Рецепт сохранен!');
    if (typeof refreshCurrentRecipeCard === 'function') await refreshCurrentRecipeCard();
    if (typeof renderAllRecipes === 'function') {
      renderAllRecipes();
    }
  } catch (err) {
    console.error('[editor] Ошибка сохранения:', err);
    showToast('Ошибка сохранения!');
  }
}

if (meSaveBtn) {
  meSaveBtn.addEventListener('click', meSaveRecipe);
}

// ═══ Управление устройствами ═══
function openDeviceManager(onSave) {
  const modal = document.getElementById('modalDeviceManage');
  const list = document.getElementById('devList');
  const input = document.getElementById('devNewName');
  if (!modal) return;

  let currentDevices = [];
  
  const renderList = () => {
    list.innerHTML = currentDevices.map((d, i) => `
      <div class="tmg-item">
        <span>${d}</span>
        <button type="button" class="tmg-del-btn" data-idx="${i}">🗑</button>
      </div>
    `).join('');
  };

  Storage.getDevices().then(devs => {
    currentDevices = devs;
    renderList();
  });

  modal.style.display = 'flex';

  const close = () => {
    modal.style.display = 'none';
    if (onSave) onSave();
  };

  document.getElementById('devManageClose').onclick = close;

  document.getElementById('devCreateBtn').onclick = async () => {
    const val = input.value.trim();
    if (val && !currentDevices.includes(val)) {
      currentDevices.push(val);
      await Storage.saveDevices(currentDevices);
      input.value = '';
      renderList();
    }
  };

  list.onclick = async (e) => {
    const btn = e.target.closest('.tmg-del-btn');
    if (btn) {
      const idx = parseInt(btn.dataset.idx);
      const deletedDev = currentDevices[idx];
      
      currentDevices.splice(idx, 1);
      await Storage.saveDevices(currentDevices);
      renderList();

      // 1. Убираем из всех рецептов в базе (включая devicesData)
      const allRecipes = await Storage.getAllRecipes();
      for (const r of allRecipes) {
        let changed = false;
        if (r.device === deletedDev) { r.device = ''; changed = true; }
        if (r.devicesData) {
          r.devicesData.forEach(d => {
            if (d.device === deletedDev) { d.device = ''; changed = true; }
          });
        }
        if (changed) await Storage.saveRecipe(r);
      }
      
      // 2. Если это устройство сейчас выбрано в открытом редакторе — сбрасываем его
      if (meDraft) {
        meDraft.devicesData.forEach(d => {
          if (d.device === deletedDev) d.device = '';
        });
      }

      // 3. Обновляем карточки на фоне и в открытом редакторе
      if (typeof renderAllRecipes === 'function') renderAllRecipes();
      meRenderBody(); 
    }
  };
}