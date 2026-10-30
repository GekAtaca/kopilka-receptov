// ═══════════════════════════════════════════════════
// card-big.js — большая карточка рецепта.
// ═══════════════════════════════════════════════════

const modalRecipe      = document.getElementById('modalRecipe');
const modalRecipeBox   = document.getElementById('modalRecipeBox');
const modalSoon        = document.getElementById('modalSoon');
const modalSoonTitle   = document.getElementById('modalSoonTitle');
const modalSoonText    = document.getElementById('modalSoonText');
let currentRecipeId   = null;
let currentPortions   = 2;
let basePortions      = 2;
let currentRecipeObj  = null;

function openSoon(title, text){
  modalSoonTitle.textContent = title;
  modalSoonText.textContent  = text || 'Это появится позже.';
  modalSoon.style.display = 'flex';
}
function closeSoon(){
  modalSoon.style.display = 'none';
}

function togglePlanDropdown(){
  const dd = document.getElementById('bPlanDropdown');
  if (!dd) return;
  closeMoreDropdown();
  dd.classList.toggle('open');
}

function toggleMoreDropdown(){
  const dd = document.getElementById('bMoreDropdown');
  if (!dd) return;
  closePlanDropdown();
  dd.classList.toggle('open');
}
function closeMoreDropdown(){
  const dd = document.getElementById('bMoreDropdown');
  if (dd) dd.classList.remove('open');
}
function closePlanDropdown(){
  const dd = document.getElementById('bPlanDropdown');
  if (dd) dd.classList.remove('open');
}

function openRecipeTimer(){
  if (typeof openTimerList === 'function') openTimerList(currentRecipeId);
}

async function loadIngredientMarks(recipeId){
  const marks = await Storage.getMarks('ingredient');
  const set = new Set();
  marks.forEach(m => {
    if (m.recipeId === recipeId) set.add(m.extra);
  });
  return set;
}

async function loadPortions(recipeId){
  const marks = await Storage.getMarks('portions');
  const found = marks.find(m => m.recipeId === recipeId);
  return found ? found.extra : null;
}

async function savePortions(recipeId, portions){
  if (!recipeId) return;
  await Storage.removeMark('portions', recipeId);
  await Storage.addMark('portions', recipeId, portions);
}

function buildRecipeCard(recipe, marks, ingMarks){
  const label = MEAL_LABEL[recipe.meal] || '';

  const allTags   = recipe.tags || [];
  const shownTags = allTags.slice(0, 5);
  const tagsHtml  = shownTags
    .map(t => `<span class="btag">${escapeHtml(t)}</span>`)
    .join('');

  const k = recipe.kbzhuSnapshot || {};
  const weightHtml = recipe.weightPerPortion
    ? `<div class="b-kcal-weight">на ${recipe.weightPerPortion} г</div>`
    : '';
  
  const kcalVal = (k.kcal !== undefined && k.kcal !== null) ? k.kcal : '—';
  const protVal = (k.protein !== undefined && k.protein !== null) ? k.protein : '—';
  const fatVal = (k.fat !== undefined && k.fat !== null) ? k.fat : '—';
  const carbVal = (k.carbs !== undefined && k.carbs !== null) ? k.carbs : '—';

  const kcalHtml = `
    ${weightHtml}
    <div class="b-kcal-row">
      <span>${kcalVal} ккал</span><span class="b-dot">·</span>
      <span>Б ${protVal}</span><span class="b-dot">·</span>
      <span>Ж ${fatVal}</span><span class="b-dot">·</span>
      <span>У ${carbVal}</span>
    </div>
  `;

  const ingHtml = (recipe.ingredients || []).map(ing => {
    const amountStr = formatAmount(ing.amount) + ' ' + escapeHtml(ing.unit);
    const marked = ingMarks.has(ing.name) ? ' marked' : '';
    return `<li>
      <span class="b-chk${marked}" data-action="toggle-ing" data-ing="${escapeHtml(ing.name)}"></span>
      <span class="b-ing-name">${escapeHtml(ing.name)}</span>
      <span class="b-ing-amount" data-base="${ing.amount}" data-unit="${escapeHtml(ing.unit)}">${amountStr}</span>
    </li>`;
  }).join('');

  const steps = recipe.steps || [];
  const stepsHtml = steps.length
    ? `<div class="b-h">Приготовление:</div>
       <ol class="b-steps">${steps.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ol>`
    : '';

  const deviceHtml = recipe.device
    ? `<div class="b-device">
         <span class="b-device-label">Устройство:</span>
         <span class="b-device-val">${escapeHtml(recipe.device)}</span>
       </div>`
    : '';

  const noteHtml = recipe.note
    ? `<div class="b-note">
         <div class="b-note-label">МОЯ ЗАМЕТКА</div>
         <div class="b-note-text">${escapeHtml(recipe.note)}</div>
       </div>`
    : '';

  const heartCls  = marks.favorite ? 'active' : '';
  const cookedCls = marks.cooked   ? 'active' : '';
  const wantCls   = marks.want     ? 'active' : '';
  const cookedIcon = marks.cooked
    ? '✅'
    : '&#128104;&#8205;&#127859;';

  // Кнопка версий
  const totalVersions = 1 + ((recipe.versions && recipe.versions.length) || 0);
  const versionsBtn = totalVersions > 1
    ? `<button type="button" class="b-act-btn" data-action="versions">🕐 ${recipe.currentVersion || 1} из ${totalVersions}</button>`
    : '';

  const totalIng = (recipe.ingredients || []).length;
  let markedIng = 0;
  if (ingMarks) {
    (recipe.ingredients || []).forEach(ing => {
      if (ingMarks.has(ing.name)) markedIng++;
    });
  }
  const ingCount = markedIng > 0 ? markedIng : totalIng;

  return `
    <div class="b-photo">
      <span class="b-badge">${label}</span>
       <div class="b-icons">
        <button type="button" class="b-icon ${heartCls}"  data-action="toggle-favorite" title="Избранное">❤</button>
        <button type="button" class="b-icon ${cookedCls}" data-action="toggle-cooked"   title="Приготовлено">${cookedIcon}</button>
        <button type="button" class="b-icon ${wantCls}"   data-action="toggle-want"     title="Хочу приготовить">🔖</button>
        <button type="button" class="b-icon"              data-action="open-plan"       title="В план">📅</button>
        <button type="button" class="b-close"             data-action="close"           title="Закрыть">✕</button>
      </div>
      <div class="b-plan-dropdown" id="bPlanDropdown">
        <label class="b-plan-row"><input type="checkbox" value="family"><span>Семейный</span></label>
        <label class="b-plan-row"><input type="checkbox" value="child"><span>Для ребёнка</span></label>
        <label class="b-plan-row"><input type="checkbox" value="events"><span>События</span></label>
      </div>
    </div>

     <div class="modal-recipe-inner">
    <div class="b-body">
      <div class="b-title">${escapeHtml(recipe.name)}</div>

      <div class="b-tags">
        ${tagsHtml}
        <button type="button" class="b-tag-edit" data-action="edit-tags" title="Изменить теги">✎</button>
      </div>

      <div class="b-kcal">${kcalHtml}</div>

     <div class="b-ing-header">
        <div class="b-ing-header-left">
          <div class="b-h">Ингредиенты:</div>
          <button type="button" class="b-ing-clear" data-action="clear-ingredients" title="Очистить отметки">🧹</button>
        </div>
        <div class="b-portions">
          <button type="button" class="b-pbtn" data-action="portions-minus">−</button>
          <span class="b-portions-num" data-action="reset-portions">${recipe.portions || 2}</span>
          <button type="button" class="b-pbtn" data-action="portions-plus">+</button>
        </div>
      </div>
      <ul class="b-ing">${ingHtml}</ul>

       ${stepsHtml}
      ${deviceHtml}
       ${noteHtml}
    </div>
    </div>

    <div class="b-actions-wrap">
      <div class="b-actions">
        <button type="button" class="b-act-btn b-act-primary" data-action="buy">🛒 ${ingCount}</button>
        <button type="button" class="b-act-btn" data-action="timer">⏱</button>
        <button type="button" class="b-act-btn" data-action="edit">✎ Изменить</button>
        ${versionsBtn}
        <button type="button" class="b-act-btn b-act-more" data-action="more">⋯</button>
      </div>
      <div class="b-more-dropdown" id="bMoreDropdown">
        <button type="button" class="b-more-item" data-action="share">📤 Поделиться</button>
        <button type="button" class="b-more-item" data-action="copy">📋 Копировать текст</button>
        <button type="button" class="b-more-item" data-action="print">🖨 Печать</button>
        <button type="button" class="b-more-item" data-action="delete">🗑 Удалить</button>
      </div>
    </div>
  `;
}

async function openRecipeCard(id){
  if (!id) return;
  const recipe = await Storage.getRecipe(id);
  if (!recipe){
    console.warn('[card-big] рецепт не найден:', id);
    return;
  }
  
  currentRecipeId = id;
  currentRecipeObj = recipe;
  basePortions    = recipe.portions || 2;

  const savedPortions = await loadPortions(id);
  currentPortions = savedPortions || 4;

  const [favorite, cooked, want, ingMarks] = await Promise.all([
    Storage.isMarked('favorite', id),
    Storage.isMarked('cooked',   id),
    Storage.isMarked('want',     id),
    loadIngredientMarks(id)
  ]);

  // Принудительно ставим класс dm-scope и копируем текущий стиль с body
  modalRecipeBox.className = 'modal-recipe-box dm-scope';
  ['style','palette','theme','shadow'].forEach(key => {
    const attr = 'data-' + key;
    const val = document.body.getAttribute(attr);
    if (val) modalRecipeBox.setAttribute(attr, val);
    else modalRecipeBox.removeAttribute(attr);
  });

  modalRecipeBox.innerHTML = buildRecipeCard(recipe, { favorite, cooked, want }, ingMarks);
  modalRecipe.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  updatePortions();
  updateBuyButton();
}

function updateBuyButton() {
  const buyBtn = modalRecipeBox.querySelector('[data-action="buy"]');
  if (!buyBtn || !currentRecipeObj) return;
  
  const marked = modalRecipeBox.querySelectorAll('.b-chk.marked').length;
  const total = (currentRecipeObj.ingredients || []).length;
  
  buyBtn.textContent = `🛒 ${marked > 0 ? marked : total}`;
}

function closeRecipeCard(){
  modalRecipe.style.display = 'none';
  document.body.style.overflow = '';
  currentRecipeId = null;
  currentRecipeObj = null;
  // renderAllRecipes() убрали, чтобы не сбивать скрытие карточки при удалении
}

async function refreshCurrentRecipeCard(){
  if (!currentRecipeId) return;
  await openRecipeCard(currentRecipeId);
}

function updatePortions(){
  const num = modalRecipeBox.querySelector('.b-portions-num');
  if (num) num.textContent = currentPortions;

  const minus = modalRecipeBox.querySelector('[data-action="portions-minus"]');
  if (minus){
    if (currentPortions <= 1) minus.setAttribute('disabled', '');
    else                      minus.removeAttribute('disabled');
  }

  const coef = currentPortions / basePortions;
  modalRecipeBox.querySelectorAll('.b-ing-amount').forEach(el => {
    const base = parseFloat(el.dataset.base);
    const unit = el.dataset.unit || '';
    if (isNaN(base)) return;
    el.textContent = formatAmount(base * coef) + ' ' + unit;
  });
}

let backdropDownRecipe = false;
modalRecipe.addEventListener('mousedown', (e) => {
  backdropDownRecipe = (e.target === modalRecipe);
});
modalRecipe.addEventListener('mouseup', (e) => {
  if (backdropDownRecipe && e.target === modalRecipe) closeRecipeCard();
  backdropDownRecipe = false;
});

modalRecipeBox.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;

  if (action === 'close'){ closeRecipeCard(); return; }
  if (action === 'open-plan'){ togglePlanDropdown(); return; }
  if (action === 'more'){ toggleMoreDropdown(); return; }
  if (action === 'buy'){ openSoon('🛒 Купить', 'Кладовая появится позже.'); return; }
  if (action === 'timer'){ openRecipeTimer(); return; }
  
  if (action === 'edit'){ 
    if (typeof openRecipeEditor === 'function') openRecipeEditor(currentRecipeId);
    return; 
  }
  
  if (action === 'versions'){
    openVersionsModal();
    return;
  }
  
  if (action === 'share'){ closeMoreDropdown(); openSoon('📤 Поделиться', 'Поделиться появится позже.'); return; }
  if (action === 'copy'){ closeMoreDropdown(); openSoon('📋 Копировать текст', 'Копирование появится позже.'); return; }
  if (action === 'print'){ closeMoreDropdown(); openSoon('🖨 Печать', 'Печать появится позже.'); return; }
  
  if (action === 'delete'){
    closeMoreDropdown();
    const idToDelete = currentRecipeId;
    const recipeName = currentRecipeObj ? currentRecipeObj.name : 'Рецепт';
    
    // 1. Закрываем большую карточку сразу
    closeRecipeCard(); 
    
    // 2. Находим маленькую карточку на Главной и прячем её
    const cardEl = document.querySelector(`.card[data-recipe-id="${idToDelete}"]`);
    if (cardEl) cardEl.style.display = 'none';
    
    // 3. Запускаем таймер отмены
    UndoManager.add({
      message: `«${recipeName}» удалён`,
      onUndo: () => {
        // Возвращаем карточку на место
        if (cardEl) cardEl.style.display = '';
      },
      onConfirm: async () => {
        // Если 10 секунд прошло — удаляем из базы и чистим отметки
        await Storage.deleteRecipe(idToDelete);
        await Storage.removeMark('favorite', idToDelete);
        await Storage.removeMark('cooked', idToDelete);
        await Storage.removeMark('want', idToDelete);
        await Storage.removeMark('ingredient', idToDelete);
        await Storage.removeMark('portions', idToDelete);
        // И тихо обновляем счетчики в секциях (без перерисовки карточек)
        updateSectionCounters();
      }
    });
    return;
  }

  if (action === 'portions-plus'){
    currentPortions++;
    updatePortions();
    if (currentRecipeId) await savePortions(currentRecipeId, currentPortions);
    return;
  }
  if (action === 'portions-minus'){
    if (currentPortions <= 1) return;
    currentPortions--;
    updatePortions();
    if (currentRecipeId) await savePortions(currentRecipeId, currentPortions);
    return;
  }
  if (action === 'reset-portions'){
    currentPortions = 4;
    updatePortions();
    if (currentRecipeId) await savePortions(currentRecipeId, 4);
    return;
  }
  if (action === 'toggle-ing'){
    const ingName = btn.dataset.ing;
    if (!ingName || !currentRecipeId) return;
    const was = btn.classList.contains('marked');
    if (was){
      await Storage.removeMark('ingredient', currentRecipeId, ingName);
      btn.classList.remove('marked');
    } else {
      await Storage.addMark('ingredient', currentRecipeId, ingName);
      btn.classList.add('marked');
    }
    updateBuyButton();
    if (typeof renderAllRecipes === 'function') renderAllRecipes();
    return;
  }
  if (action === 'clear-ingredients'){
    if (!currentRecipeId) return;
    await Storage.removeMark('ingredient', currentRecipeId);
    modalRecipeBox.querySelectorAll('.b-chk.marked').forEach(el => {
      el.classList.remove('marked');
    });
    updateBuyButton();
    if (typeof renderAllRecipes === 'function') renderAllRecipes();
    return;
  }
  if (action === 'edit-tags'){ openSoon('🏷 Теги', 'Модалка тегов появится позже.'); return; }

  if (!currentRecipeId) return;

  if (action === 'toggle-favorite'){
    const was = await Storage.isMarked('favorite', currentRecipeId);
    if (was) await Storage.removeMark('favorite', currentRecipeId);
    else     await Storage.addMark('favorite', currentRecipeId);
    btn.classList.toggle('active', !was);
    if (typeof renderAllRecipes === 'function') renderAllRecipes();
    return;
  }
  if (action === 'toggle-cooked'){
    const was = await Storage.isMarked('cooked', currentRecipeId);
    if (was) await Storage.removeMark('cooked', currentRecipeId);
    else     await Storage.addMark('cooked', currentRecipeId);
    const now = !was;
    btn.classList.toggle('active', now);
    btn.innerHTML = now ? '✅' : '&#128104;&#8205;&#127859;';
    if (typeof renderAllRecipes === 'function') renderAllRecipes();
    return;
  }
  if (action === 'toggle-want'){
    const was = await Storage.isMarked('want', currentRecipeId);
    if (was) await Storage.removeMark('want', currentRecipeId);
    else     await Storage.addMark('want', currentRecipeId);
    btn.classList.toggle('active', !was);
    if (typeof renderAllRecipes === 'function') renderAllRecipes();
    return;
  }
});

modalSoon.addEventListener('click', (e) => {
  if (e.target === modalSoon) closeSoon();
});
modalSoon.querySelectorAll('[data-modal-close]').forEach(b => {
  b.addEventListener('click', closeSoon);
});

// Старый обработчик таймера удален, логика перенесена в timer.js

document.addEventListener('click', (e) => {
  const dd = document.getElementById('bPlanDropdown');
  if (dd && dd.classList.contains('open')){
    if (!e.target.closest('#bPlanDropdown') && !e.target.closest('[data-action="open-plan"]')){
      dd.classList.remove('open');
    }
  }
  const dm = document.getElementById('bMoreDropdown');
  if (dm && dm.classList.contains('open')){
    if (!e.target.closest('#bMoreDropdown') && !e.target.closest('[data-action="more"]')){
      dm.classList.remove('open');
    }
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  const dp = document.getElementById('bPlanDropdown');
  if (dp && dp.classList.contains('open')){ dp.classList.remove('open'); return; }
  const dm = document.getElementById('bMoreDropdown');
  if (dm && dm.classList.contains('open')){ dm.classList.remove('open'); return; }
  if (modalSoon.style.display === 'flex'){ closeSoon(); return; }
  if (modalRecipe.style.display === 'flex'){ closeRecipeCard(); return; }
});

document.addEventListener('click', (e) => {
  const card = e.target.closest('.card');
  if (!card) return;
  if (e.target.closest('button')) return;
  if (e.target.closest('.portions')) return;
  if (e.target.closest('.ing-list')) return;
  if (e.target.closest('.chk')) return;
  const isTitle = e.target.closest('.title');
  const isPhoto = e.target.closest('.card-img');
  if (!isTitle && !isPhoto) return;
  const id = card.dataset.recipeId;
  if (id && typeof openRecipeCard === 'function') openRecipeCard(id);
});

// ═══════════════════════════════════════════════════
// ЛОГИКА ВЕРСИЙ (Шаг 38.1)
// ═══════════════════════════════════════════════════

const modalVersions = document.getElementById('modalVersions');
const versionsList  = document.getElementById('versionsList');

function openVersionsModal() {
  if (!currentRecipeObj) return;
  
  const versions = currentRecipeObj.versions || [];
  const currentNum = currentRecipeObj.currentVersion || 1;
  const currentName = currentRecipeObj.versionName || `Версия ${currentNum}`;
  
  const allVersions = [];
  
  allVersions.push({
    num: currentNum,
    name: currentName,
    isCurrent: true,
    idx: -1
  });
  
  versions.forEach((v, i) => {
    const vNum = v.currentVersion || (i + 1);
    const vName = v.versionName || `Версия ${vNum}`;
    allVersions.push({
      num: vNum,
      name: vName,
      isCurrent: false,
      idx: i
    });
  });
  
  allVersions.sort((a, b) => a.num - b.num);
  
  let html = '';
  allVersions.forEach(v => {
    if (v.isCurrent) {
      html += `
        <div class="version-row active" data-ver="${v.num}">
          <span>${v.num}. ${v.name} (текущая)</span>
        </div>
      `;
    } else {
      html += `
        <div class="version-row" data-ver="${v.num}" data-idx="${v.idx}">
          <span>${v.num}. ${v.name}</span>
          <button type="button" class="version-del-btn" data-action="del-version" data-idx="${v.idx}" title="Удалить версию">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
              <path d="M10 11v6"></path>
              <path d="M14 11v6"></path>
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
            </svg>
          </button>
        </div>
      `;
    }
  });

  versionsList.innerHTML = html;
  modalVersions.style.display = 'flex';
}

modalVersions.addEventListener('click', (e) => {
  if (e.target === modalVersions || e.target.closest('[data-action="close-versions"]')) {
    modalVersions.style.display = 'none';
    return;
  }
});

versionsList.addEventListener('click', async (e) => {
  if (e.target.closest('[data-action="del-version"]')) {
    const idx = parseInt(e.target.closest('[data-action="del-version"]').dataset.idx, 10);
    await deleteVersion(idx);
    return;
  }

  const row = e.target.closest('.version-row');
  if (row && !row.classList.contains('active')) {
    const idx = parseInt(row.dataset.idx, 10);
    await switchVersion(idx);
  }
});

let longPressTimer;
versionsList.addEventListener('touchstart', (e) => {
  const row = e.target.closest('.version-row');
  if (!row || row.classList.contains('active')) return;
  longPressTimer = setTimeout(() => {
    const idx = parseInt(row.dataset.idx, 10);
    if (confirm('Удалить эту версию?')) {
      deleteVersion(idx);
    }
  }, 600);
}, { passive: true });

versionsList.addEventListener('touchend', () => clearTimeout(longPressTimer));
versionsList.addEventListener('touchmove', () => clearTimeout(longPressTimer), { passive: true });

async function deleteVersion(idx) {
  if (!currentRecipeObj) return;
  if (!confirm('Удалить эту версию?')) return;
  if (!currentRecipeObj.versions) currentRecipeObj.versions = [];
  
  currentRecipeObj.versions.splice(idx, 1);
  renumberVersions(currentRecipeObj);
  await Storage.saveRecipe(currentRecipeObj);
  
  openRecipeCard(currentRecipeId);
  openVersionsModal(); 
  if (typeof renderAllRecipes === 'function') renderAllRecipes();
}

function renumberVersions(recipe) {
  const items = [];
  items.push({ isCurrent: true, oldNum: recipe.currentVersion || 1, ref: recipe });
  (recipe.versions || []).forEach((v, i) => {
    items.push({ isCurrent: false, oldNum: v.currentVersion || (i + 1), ref: v });
  });
  items.sort((a, b) => a.oldNum - b.oldNum);
  let newNum = 1;
  items.forEach(item => {
    item.ref.currentVersion = newNum;
    if (item.ref.versionName && /^Версия \d+$/.test(item.ref.versionName)) {
      item.ref.versionName = 'Версия ' + newNum;
    }
    newNum++;
  });
}

async function switchVersion(idx) {
  if (!currentRecipeObj) return;
  
  const versions = currentRecipeObj.versions || [];
  const selectedVersion = versions[idx];
  if (!selectedVersion) return;

  const currentSnapshot = { ...currentRecipeObj };
  delete currentSnapshot.versions; 
  
  versions[idx] = currentSnapshot; 
  
  currentRecipeObj.name = selectedVersion.name;
  currentRecipeObj.meal = selectedVersion.meal;
  currentRecipeObj.source = selectedVersion.source;
  currentRecipeObj.complexity = selectedVersion.complexity;
  currentRecipeObj.versionName = selectedVersion.versionName;
  currentRecipeObj.currentVersion = selectedVersion.currentVersion;
  currentRecipeObj.ingredients = selectedVersion.ingredients;
  currentRecipeObj.steps = selectedVersion.steps;
  currentRecipeObj.time = selectedVersion.time;
  currentRecipeObj.timeSplit = selectedVersion.timeSplit;
  currentRecipeObj.timeStages = selectedVersion.timeStages;
  currentRecipeObj.tags = selectedVersion.tags;
  currentRecipeObj.kbzhuSnapshot = selectedVersion.kbzhuSnapshot;

  await Storage.saveRecipe(currentRecipeObj);
  
  modalVersions.style.display = 'none';
  openRecipeCard(currentRecipeId);
  if (typeof renderAllRecipes === 'function') renderAllRecipes();
}

// ─── Обработка кнопок маленькой карточки на Главной ───
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('.card [data-action]');
  if (!btn) return;
  
  const card = btn.closest('.card');
  if (!card) return;
  const id = card.dataset.recipeId;
  const action = btn.dataset.action;

  if (action === 'toggle-show-all') {
    card.classList.toggle('show-all');
    const isShown = card.classList.contains('show-all');
    btn.textContent = isShown ? '▲ скрыть' : '▼ показать все';
    return;
  }

  if (action === 'clear-ingredients-small') {
    await Storage.removeMark('ingredient', id);
    card.querySelectorAll('.chk.marked').forEach(el => el.classList.remove('marked'));
    const buyBtn = card.querySelector('.actions .primary');
    if (buyBtn) {
      const total = card.querySelectorAll('.chk').length;
      buyBtn.textContent = `🛒 ${total}`;
    }
    if (typeof renderAllRecipes === 'function') renderAllRecipes();
    return;
  }

  if (action === 'portions-plus-small' || action === 'portions-minus-small' || action === 'reset-portions-small') {
    const portionsWrap = card.querySelector('.portions');
    const numEl = portionsWrap.querySelector('.num');
    const base = parseFloat(portionsWrap.dataset.base) || 2;
    let current = parseFloat(numEl.textContent) || 4;

    if (action === 'portions-plus-small') current++;
    if (action === 'portions-minus-small') current = Math.max(1, current - 1);
    if (action === 'reset-portions-small') current = 4;

    numEl.textContent = current;
    
    // Пересчитываем ингредиенты
    const coef = current / base;
    card.querySelectorAll('.ing-amount').forEach(el => {
      const b = parseFloat(el.dataset.base);
      const unit = el.dataset.unit || '';
      if (!isNaN(b)) el.textContent = formatAmount(b * coef) + ' ' + unit;
    });

    // Сохраняем в базу
    await Storage.removeMark('portions', id);
    await Storage.addMark('portions', id, current);
    return;
  }

  if (action === 'toggle-ing-small') {
    const ingName = btn.dataset.ing;
    if (!ingName) return;
    const was = btn.classList.contains('marked');
    if (was) {
      await Storage.removeMark('ingredient', id, ingName);
      btn.classList.remove('marked');
    } else {
      await Storage.addMark('ingredient', id, ingName);
      btn.classList.add('marked');
    }
    
    const buyBtn = card.querySelector('.actions .primary');
    if (buyBtn) {
      const marked = card.querySelectorAll('.chk.marked').length;
      const total = card.querySelectorAll('.chk').length;
      buyBtn.textContent = `🛒 ${marked > 0 ? marked : total}`;
    }
    // Синхронизируем состояние с большой карточкой (на случай, если она откроется)
    if (typeof renderAllRecipes === 'function') renderAllRecipes();
    return;
  }

  if (action === 'toggle-favorite-small') {
    const was = btn.classList.contains('active');
    if (was) await Storage.removeMark('favorite', id);
    else await Storage.addMark('favorite', id);
    btn.classList.toggle('active', !was);
    return;
  }

  if (action === 'toggle-cooked-small') {
    const was = btn.classList.contains('active');
    if (was) await Storage.removeMark('cooked', id);
    else await Storage.addMark('cooked', id);
    const now = !was;
    btn.classList.toggle('active', now);
    btn.innerHTML = now ? '✅' : '&#128104;&#8205;&#127859;';
    return;
  }

  if (action === 'toggle-want-small') {
    const was = btn.classList.contains('active');
    if (was) await Storage.removeMark('want', id);
    else await Storage.addMark('want', id);
    btn.classList.toggle('active', !was);
    return;
  }

  if (action === 'open-plan-small') {
    if (typeof openSoon === 'function') openSoon('📅 В план', 'Выбор плана из карточки на Главной появится чуть позже.');
    return;
  }

  if (action === 'edit-recipe') {
    if (typeof openRecipeEditor === 'function') openRecipeEditor(id);
  }
  
  if (action === 'open-versions') {
    // Загружаем рецепт, чтобы модалка версий знала, что показывать
    const recipe = await Storage.getRecipe(id);
    if (recipe) {
      currentRecipeId = id;
      currentRecipeObj = recipe;
      openVersionsModal();
    }
  }
});

// ─── Точечное обновление счетчиков (без перерисовки) ───
function updateSectionCounters() {
  document.querySelectorAll('.recipes-section').forEach(section => {
    const visibleCards = section.querySelectorAll('.recipes-grid .card:not([style*="display: none"])');
    const counter = section.querySelector('.recipes-section-count');
    if (counter) counter.textContent = visibleCards.length;
  });
}