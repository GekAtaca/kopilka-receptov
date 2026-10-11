// ═══════════════════════════════════════════════════
// card-big.js — большая карточка рецепта (шаг 35.1, MVP).
// Загружается после render.js, до bg.js.
// Умеет: открыть, закрыть, показать рецепт,
//        переключить ❤ 👨‍🍳 🔖, открыть 📅-шторку.
// ═══════════════════════════════════════════════════

const modalRecipe      = document.getElementById('modalRecipe');
const modalRecipeBox   = document.getElementById('modalRecipeBox');
const modalSoon        = document.getElementById('modalSoon');
const modalSoonTitle   = document.getElementById('modalSoonTitle');
const modalSoonText    = document.getElementById('modalSoonText');
const modalRecipeTimer = document.getElementById('modalRecipeTimer');

let currentRecipeId   = null;
let currentPortions   = 2;
let basePortions      = 2;

// ─── Модалка-заглушка «Позже» ───
function openSoon(title, text){
  modalSoonTitle.textContent = title;
  modalSoonText.textContent  = text || 'Это появится позже.';
  modalSoon.style.display = 'flex';
}
function closeSoon(){
  modalSoon.style.display = 'none';
}

// ─── Dropdown «В план» ───
function togglePlanDropdown(){
  const dd = document.getElementById('bPlanDropdown');
  if (!dd) return;
  closeMoreDropdown();
  dd.classList.toggle('open');
}

// ─── Dropdown «Ещё» (внизу, выпадает вверх) ───
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

// ─── Модалка таймера рецепта ───
function openRecipeTimer(){ modalRecipeTimer.style.display = 'flex'; }
function closeRecipeTimer(){ modalRecipeTimer.style.display = 'none'; }

// ─── Загрузить отметки ингредиентов для рецепта ───
async function loadIngredientMarks(recipeId){
  const marks = await Storage.getMarks('ingredient');
  const set = new Set();
  marks.forEach(m => {
    if (m.recipeId === recipeId) set.add(m.extra);
  });
  return set;
}

// ─── Загрузить сохранённые порции для рецепта ───
async function loadPortions(recipeId){
  const marks = await Storage.getMarks('portions');
  const found = marks.find(m => m.recipeId === recipeId);
  return found ? found.extra : null;
}

// ─── Сохранить выбранные порции для рецепта ───
async function savePortions(recipeId, portions){
  if (!recipeId) return;
  await Storage.removeMark('portions', recipeId);
  await Storage.addMark('portions', recipeId, portions);
}

// ─── Собрать HTML большой карточки ───
function buildRecipeCard(recipe, marks, ingMarks){
  const label = MEAL_LABEL[recipe.meal] || '';

  // Теги — первые 5
  const allTags   = recipe.tags || [];
  const shownTags = allTags.slice(0, 5);
  const tagsHtml  = shownTags
    .map(t => `<span class="btag">${escapeHtml(t)}</span>`)
    .join('');

  // КБЖУ + вес порции (если есть)
  const k = recipe.kbzhuSnapshot || {};
  const weightHtml = recipe.weightPerPortion
    ? `<div class="b-kcal-weight">на ${recipe.weightPerPortion} г</div>`
    : '';
  const kcalHtml = `
    ${weightHtml}
    <div class="b-kcal-row">
      <span>${k.kcal} ккал</span><span class="b-dot">·</span>
      <span>Б ${k.protein}</span><span class="b-dot">·</span>
      <span>Ж ${k.fat}</span><span class="b-dot">·</span>
      <span>У ${k.carbs}</span>
    </div>
  `;

   // Ингредиенты — полный список
  const ingHtml = (recipe.ingredients || []).map(ing => {
    const amountStr = formatAmount(ing.amount) + ' ' + escapeHtml(ing.unit);
    const marked = ingMarks.has(ing.name) ? ' marked' : '';
    return `<li>
      <span class="b-chk${marked}" data-action="toggle-ing" data-ing="${escapeHtml(ing.name)}"></span>
      <span class="b-ing-name">${escapeHtml(ing.name)}</span>
      <span class="b-ing-amount" data-base="${ing.amount}" data-unit="${escapeHtml(ing.unit)}">${amountStr}</span>
    </li>`;
  }).join('');

  // Шаги (если есть)
  const steps = recipe.steps || [];
  const stepsHtml = steps.length
    ? `<h3 class="b-h">Приготовление:</h3>
       <ol class="b-steps">${steps.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ol>`
    : '';

  // Устройство готовки (если есть)
  const deviceHtml = recipe.device
    ? `<div class="b-device">
         <span class="b-device-label">Устройство:</span>
         <span class="b-device-val">${escapeHtml(recipe.device)}</span>
       </div>`
    : '';

  // Заметка (если есть)
  const noteHtml = recipe.note
    ? `<div class="b-note">
         <div class="b-note-label">МОЯ ЗАМЕТКА</div>
         <div class="b-note-text">${escapeHtml(recipe.note)}</div>
       </div>`
    : '';

  // Иконки сверху
  const heartCls  = marks.favorite ? 'active' : '';
  const cookedCls = marks.cooked   ? 'active' : '';
  const wantCls   = marks.want     ? 'active' : '';
    const cookedIcon = marks.cooked
    ? '✅'
    : '&#128104;&#8205;&#127859;';   // 👨‍🍳 через HTML-коды (защита от развала)

  // Кнопка версий — только если их больше одной
  const totalVersions = 1 + ((recipe.versions && recipe.versions.length) || 0);
  const versionsBtn = totalVersions > 1
    ? `<button type="button" class="b-act-btn" data-action="versions">🕐 ${recipe.currentVersion} из ${totalVersions}</button>`
    : '';

  // Количество ингредиентов для кнопки 🛒
  const ingCount = (recipe.ingredients || []).length;

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
      <h2 class="b-title">${escapeHtml(recipe.name)}</h2>

      <div class="b-tags">
        ${tagsHtml}
        <button type="button" class="b-tag-edit" data-action="edit-tags" title="Изменить теги">✎</button>
      </div>

      <div class="b-kcal">${kcalHtml}</div>

     <div class="b-ing-header">
        <div class="b-ing-header-left">
          <h3 class="b-h">Ингредиенты:</h3>
          <button type="button" class="b-ing-clear" data-action="clear-ingredients" title="Очистить отметки">🧹</button>
        </div>
        <div class="b-portions">
          <button type="button" class="b-pbtn" data-action="portions-minus">−</button>
          <span class="b-portions-num" data-action="reset-portions">${recipe.portions}</span>
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

// ─── Открыть большую карточку по ID ───
async function openRecipeCard(id){
  if (!id) return;
  const recipe = await Storage.getRecipe(id);
  if (!recipe){
    console.warn('[card-big] рецепт не найден:', id);
    return;
  }
 currentRecipeId = id;
  basePortions    = recipe.portions || 2;

  const savedPortions = await loadPortions(id);
  currentPortions = savedPortions || 4;

  // Собрать отметки рецепта и ингредиентов
  const [favorite, cooked, want, ingMarks] = await Promise.all([
    Storage.isMarked('favorite', id),
    Storage.isMarked('cooked',   id),
    Storage.isMarked('want',     id),
    loadIngredientMarks(id)
  ]);

  modalRecipeBox.innerHTML = buildRecipeCard(recipe, { favorite, cooked, want }, ingMarks);
  modalRecipe.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  updatePortions();
}

// ─── Закрыть большую карточку ───
function closeRecipeCard(){
  modalRecipe.style.display = 'none';
  document.body.style.overflow = '';
  currentRecipeId = null;
}

// ─── Пересчёт порций и ингредиентов ───
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

// ─── Клик по фону — закрыть ───
  let backdropDownRecipe = false;
  modalRecipe.addEventListener('mousedown', (e) => {
    backdropDownRecipe = (e.target === modalRecipe);
  });
  modalRecipe.addEventListener('mouseup', (e) => {
    if (backdropDownRecipe && e.target === modalRecipe) closeRecipeCard();
    backdropDownRecipe = false;
  });

// ─── Делегирование кликов внутри карточки ───
modalRecipeBox.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;

  if (action === 'close'){
    closeRecipeCard();
    return;
  }
 if (action === 'open-plan'){
    togglePlanDropdown();
    return;
  }
  if (action === 'more'){
    toggleMoreDropdown();
    return;
  }
  if (action === 'buy'){
    openSoon('🛒 Купить', 'Кладовая появится позже.');
    return;
  }
  if (action === 'timer'){
    openRecipeTimer();
    return;
  }
  if (action === 'edit'){
    openSoon('✎ Редактор', 'Редактор появится позже.');
    return;
  }
  if (action === 'versions'){
    openSoon('🕐 Версии', 'Версии появятся позже.');
    return;
  }
  if (action === 'share'){
    closeMoreDropdown();
    openSoon('📤 Поделиться', 'Поделиться появится позже.');
    return;
  }
  if (action === 'copy'){
    closeMoreDropdown();
    openSoon('📋 Копировать текст', 'Копирование появится позже.');
    return;
  }
  if (action === 'print'){
    closeMoreDropdown();
    openSoon('🖨 Печать', 'Печать появится позже.');
    return;
  }
  if (action === 'delete'){
    closeMoreDropdown();
    openSoon('🗑 Удалить', 'Удаление появится позже.');
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
    return;
  }
  if (action === 'clear-ingredients'){
    if (!currentRecipeId) return;
    await Storage.removeMark('ingredient', currentRecipeId);
    modalRecipeBox.querySelectorAll('.b-chk.marked').forEach(el => {
      el.classList.remove('marked');
    });
    return;
  }
  if (action === 'edit-tags'){
    openSoon('🏷 Теги', 'Модалка тегов появится позже.');
    return;
  }

  if (!currentRecipeId) return;

  if (action === 'toggle-favorite'){
    const was = await Storage.isMarked('favorite', currentRecipeId);
    if (was) await Storage.removeMark('favorite', currentRecipeId);
    else     await Storage.addMark('favorite', currentRecipeId);
    btn.classList.toggle('active', !was);
    return;
  }
  if (action === 'toggle-cooked'){
    const was = await Storage.isMarked('cooked', currentRecipeId);
    if (was) await Storage.removeMark('cooked', currentRecipeId);
    else     await Storage.addMark('cooked', currentRecipeId);
    const now = !was;
    btn.classList.toggle('active', now);
    btn.innerHTML = now ? '✅' : '&#128104;&#8205;&#127859;';
    return;
  }
  if (action === 'toggle-want'){
    const was = await Storage.isMarked('want', currentRecipeId);
    if (was) await Storage.removeMark('want', currentRecipeId);
    else     await Storage.addMark('want', currentRecipeId);
    btn.classList.toggle('active', !was);
    return;
  }
});

// ─── Закрытие модалки-заглушки «Позже» ───
modalSoon.addEventListener('click', (e) => {
  if (e.target === modalSoon) closeSoon();
});
modalSoon.querySelectorAll('[data-modal-close]').forEach(b => {
  b.addEventListener('click', closeSoon);
});

// ─── Закрытие модалки таймера рецепта ───
modalRecipeTimer.addEventListener('click', (e) => {
  if (e.target === modalRecipeTimer) closeRecipeTimer();
});
document.getElementById('recipeTimerClose').addEventListener('click', closeRecipeTimer);

// ─── Dropdown «В план» — закрывается кликом вне его ───
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

// ─── Escape: сначала заглушки, потом карточка ───
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;

  const dp = document.getElementById('bPlanDropdown');
  if (dp && dp.classList.contains('open')){ dp.classList.remove('open'); return; }

  const dm = document.getElementById('bMoreDropdown');
  if (dm && dm.classList.contains('open')){ dm.classList.remove('open'); return; }

  if (modalSoon.style.display === 'flex'){ closeSoon();         return; }
  if (modalRecipeTimer.style.display === 'flex'){ closeRecipeTimer(); return; }
  if (modalRecipe.style.display === 'flex'){ closeRecipeCard();  return; }
});

// ─── Клик по маленькой карточке — открыть большую ───
// Делегирование: клик по названию или по фото.
// Клик по кнопкам / чекбоксам / порциям — не открывает.
document.addEventListener('click', (e) => {
  const card = e.target.closest('.card');
  if (!card) return;

  // Внутренние элементы, которые НЕ открывают карточку
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