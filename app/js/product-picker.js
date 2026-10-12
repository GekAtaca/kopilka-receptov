// ═══════════════════════════════════════════════════
// product-picker.js — модалка «База продуктов».
// Открывается из редактора рецепта (шаг 36).
// Пока может тестироваться через консоль:
//   openProductPicker({ onSelect: (p) => console.log(p) })
// ═══════════════════════════════════════════════════

(function(){

  const modal = document.getElementById('modalProductPicker');
  const box   = document.getElementById('modalProductPickerBox');
  if (!modal || !box) return;

   let onSelectCb   = null;
  let excludeIds   = new Set();
  let currentQuery = '';
  let allOwn       = [];   // свои продукты, загружаются при открытии
  let collapsed    = new Set();  // свёрнутые группы (по ключу)
   let currentSort  = 'new-first'; // текущая сортировка «Моих»
  let ctxTargetId  = null;        // ID продукта, на котором открыто контекстное меню
  let ctxTouchTimer = null;       // таймер долгого тапа
  let afterCreate  = 'list';      // что делать после создания: 'list' | 'select'

  // ─── Открыть ───
  async function openProductPicker(options){
    options = options || {};
    onSelectCb = typeof options.onSelect === 'function' ? options.onSelect : null;
    excludeIds = new Set(Array.isArray(options.excludeIds) ? options.excludeIds : []);
    afterCreate = options.afterCreate === 'select' ? 'select' : 'list';
    currentQuery = '';
    collapsed.clear();

    // Пробуем загрузить сохранённое состояние свёрнутости
    let savedCollapsed = null;
    if (typeof Storage !== 'undefined' && Storage.getSetting){
      try { savedCollapsed = await Storage.getSetting('productPickerCollapsed'); }
      catch(e){ savedCollapsed = null; }
    }

    if (Array.isArray(savedCollapsed)){
      // Первый запуск после появления этого кода: сохраняем то, что было
      for (const k of savedCollapsed) collapsed.add(k);
    } else {
      // Совсем первый раз — все базовые группы свёрнуты
      if (typeof PRODUCT_GROUPS !== 'undefined' && Array.isArray(PRODUCT_GROUPS)){
        for (const g of PRODUCT_GROUPS){
          collapsed.add('base:' + g.code);
        }
      }
    }

    // ─── Подтянуть текущий стиль с body ───
    // Чтобы модалка выглядела как карточки сайта.
    box.className = 'modal-product-picker-box dm-scope';
    ['style','palette','theme','shadow'].forEach(key => {
      const attr = 'data-' + key;
      const val = document.body.getAttribute(attr);
      if (val) box.setAttribute(attr, val);
      else     box.removeAttribute(attr);
    });

    allOwn = (typeof Storage !== 'undefined' && Storage.getAllProducts)
      ? await Storage.getAllProducts()
      : [];

    // Сортировка «Моих» — из IndexedDB. По умолчанию — «Сначала новые»
    let savedSort = null;
    if (typeof Storage !== 'undefined' && Storage.getSetting){
      try { savedSort = await Storage.getSetting('productSort'); }
      catch(e){ savedSort = null; }
    }
    currentSort = (savedSort === 'new-first'
                || savedSort === 'old-first'
                || savedSort === 'az'
                || savedSort === 'za')
      ? savedSort : 'new-first';

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    renderPicker();
  }

  // ─── Закрыть ───
   function closeProductPicker(){
    modal.style.display = 'none';
    document.body.style.overflow = '';
    onSelectCb = null;
    excludeIds = new Set();
    currentQuery = '';
    afterCreate = 'list';
  }

  // ─── Собрать разметку модалки ───
  function renderPicker(){
    box.innerHTML = `
      <div class="pp-head">
        <span class="pp-title">База продуктов</span>
        <button type="button" class="pp-close" data-pp-close>✕</button>
      </div>
      <div class="pp-search-row">
        <div class="pp-search-wrap">
          <input type="text" class="pp-search" placeholder="Поиск по названию..." value="${escapeHtml(currentQuery)}">
          <button type="button" class="pp-search-clear" data-pp-clear title="Очистить">✕</button>
        </div>
        <button type="button" class="pp-toggle-all" data-pp-toggle-all title="Развернуть всё">⇕</button>
        <button type="button" class="pp-add" data-pp-add title="Создать новый продукт">+</button>
      </div>
      <div class="pp-list" id="ppList"></div>
      <div class="pp-ctx-menu" id="ppCtxMenu" style="display:none">
        <button type="button" class="pp-ctx-item" data-pp-edit>✎ Редактировать</button>
        <button type="button" class="pp-ctx-item pp-ctx-danger" data-pp-delete>🗑 Удалить</button>
      </div>
    `;

    const searchInput = box.querySelector('.pp-search');
    searchInput.addEventListener('input', (e) => {
      currentQuery = e.target.value;
      updateClearVisibility();
      renderList();
      updateToggleAllButton();
    });
    setTimeout(() => searchInput.focus(), 50);

     updateClearVisibility();
    renderList();
    updateToggleAllButton();

    // При скролле списка и ресайзе окна — закрывать открытый dropdown,
    // потому что он position:fixed и «отвяжется» от кнопки.
    const listEl = box.querySelector('#ppList');
    if (listEl){
      listEl.addEventListener('scroll', () => {
        closeSortDropdowns();
        closeCtxMenu();
      }, { passive: true });
    }
    window.addEventListener('resize', () => {
      closeSortDropdowns();
      closeCtxMenu();
    });
  }

   // ─── Отрисовать список ───
  function renderList(){
    const listEl = box.querySelector('#ppList');
    if (!listEl) return;

    const q = currentQuery.trim().toLowerCase();
    const match = p =>
      !q ||
      (p.name || '').toLowerCase().includes(q) ||
      (p.shortName || '').toLowerCase().includes(q);

    // Свои: фильтр + сортировка по текущему выбору
    const own = sortProducts(
      allOwn
        .filter(p => !excludeIds.has(p.id))
        .filter(match)
    );

    const base = (typeof BASE_PRODUCTS !== 'undefined' ? BASE_PRODUCTS : [])
      .filter(p => !excludeIds.has(p.id))
      .filter(match);

    const parts = [];

    // ⭐ Мои продукты — корневая группа с подгруппами.
    // Показываем всегда, даже если пусто — с подписью «Пока пусто».
    parts.push(ownGroupHtml(own));

    // Базовые группы — все 19, даже пустые
    const groups = (typeof PRODUCT_GROUPS !== 'undefined' ? PRODUCT_GROUPS : [])
      .slice()
      .sort((a,b) => (a.order || 0) - (b.order || 0));

     for (const g of groups){
      const items = base.filter(p => p.group === g.code);
      if (!items.length) continue; // пустые базовые группы не показываем
      parts.push(groupHtml(g.name, items, 'base:' + g.code, false));
    }

    if (!parts.length){
      listEl.innerHTML = '<div class="pp-empty">Ничего не найдено</div>';
    } else {
      listEl.innerHTML = parts.join('');
    }
  }

  // ─── Свёрнута ли группа. При активном поиске — все развёрнуты ───
  function checkCollapsed(key){
    if (currentQuery.trim()) return false;
    return collapsed.has(key);
  }
    // ─── Сортировка «Моих» ───
  function sortProducts(arr){
    const a = arr.slice();
    switch (currentSort){
      case 'new-first':
        return a.sort((x,y) => (y.createdAt || 0) - (x.createdAt || 0));
      case 'old-first':
        return a.sort((x,y) => (x.createdAt || 0) - (y.createdAt || 0));
      case 'az':
        return a.sort((x,y) =>
          (x.shortName || x.name || '').localeCompare(
            y.shortName || y.name || '', 'ru')
        );
      case 'za':
        return a.sort((x,y) =>
          (y.shortName || y.name || '').localeCompare(
            x.shortName || x.name || '', 'ru')
        );
      default:
        return a;
    }
  }

  // ─── Сохранить сортировку ───
  async function saveSort(){
    if (typeof Storage === 'undefined' || !Storage.saveSetting) return;
    try { await Storage.saveSetting('productSort', currentSort); }
    catch(e){ console.warn('[picker] Не сохранилась сортировка', e); }
  }

  // ─── Сменить сортировку и перерисовать ───
  function changeSort(newSort){
    const same = newSort === currentSort;
    currentSort = newSort;
    if (!same) saveSort();
    renderList();
    updateToggleAllButton();
  }

  // ─── Собрать разметку пункта dropdown сортировки ───
  function sortItemHtml(value, icon, label){
    const active = currentSort === value;
    return `
      <div class="pp-sort-item${active ? ' active' : ''}" data-sort="${value}">
        <span class="pp-sort-check">${active ? '✓' : ''}</span>
        <span>${icon} ${label}</span>
      </div>
    `;
  }

  // ─── Собрать dropdown сортировки целиком ───
  function sortDropdownHtml(){
    return `
      <div class="pp-sort-dropdown" data-pp-sort-dropdown>
        ${sortItemHtml('new-first', '🕐', 'Сначала новые')}
        ${sortItemHtml('old-first', '🕐', 'Сначала старые')}
        ${sortItemHtml('az',        '🔤', 'А → Я')}
        ${sortItemHtml('za',        '🔤', 'Я → А')}
      </div>
    `;
  }

// ─── Контекстное меню (правый клик / долгий тап) ───

  // Свой ли это продукт
  function findOwnProduct(id){
    return allOwn.find(p => p.id === id) || null;
  }

  // Открыть меню на продукте по координатам
  function openCtxMenu(productId, x, y){
    const menu = box.querySelector('#ppCtxMenu');
    if (!menu) return;
    ctxTargetId = productId;
    menu.style.display = 'block';
    menu.style.visibility = 'hidden';
    const mw = menu.offsetWidth;
    const mh = menu.offsetHeight;
    let left = x;
    let top  = y;
    if (left + mw > window.innerWidth  - 6) left = window.innerWidth  - mw - 6;
    if (top  + mh > window.innerHeight - 6) top  = window.innerHeight - mh - 6;
    if (left < 6) left = 6;
    if (top  < 6) top  = 6;
    menu.style.left = left + 'px';
    menu.style.top  = top  + 'px';
    menu.style.visibility = '';
  }

  // Закрыть меню
  function closeCtxMenu(){
    const menu = box.querySelector('#ppCtxMenu');
    if (menu) menu.style.display = 'none';
    ctxTargetId = null;
    if (ctxTouchTimer){
      clearTimeout(ctxTouchTimer);
      ctxTouchTimer = null;
    }
  }

    // ─── Показать и спозиционировать dropdown у кнопки ≡ ───
  function positionSortDropdown(btn, drop){
    // Сначала показать, чтобы измерить размеры
    drop.style.visibility = 'hidden';
    drop.classList.add('open');
    const r  = btn.getBoundingClientRect();
    const dh = drop.offsetHeight;
    const dw = drop.offsetWidth;

    // Вверх от кнопки, а если сверху не влезает — вниз
    let top = r.top - dh - 6;
    if (top < 6) top = r.bottom + 6;

    // Выровнять по левому краю кнопки, не вылезая за правый край окна
    let left = r.left;
    if (left + dw > window.innerWidth - 6){
      left = window.innerWidth - dw - 6;
    }
    if (left < 6) left = 6;

    drop.style.top  = top  + 'px';
    drop.style.left = left + 'px';
    drop.style.visibility = '';
  }

  // ─── Закрыть все открытые dropdown сортировки ───
  function closeSortDropdowns(){
    box.querySelectorAll('.pp-sort-dropdown.open').forEach(d => {
      d.classList.remove('open');
      d.style.top = '';
      d.style.left = '';
    });
  }

    // ─── Все возможные ключи групп (для toggle-all) ───
  function getAllGroupKeys(){
    const keys = ['own-root'];
    if (typeof PRODUCT_GROUPS !== 'undefined' && Array.isArray(PRODUCT_GROUPS)){
      for (const g of PRODUCT_GROUPS){
        keys.push('own:' + g.code);
        keys.push('base:' + g.code);
      }
    }
    return keys;
  }

  // ─── Есть ли хоть одна развёрнутая группа ───
  function hasExpanded(){
    if (!collapsed.has('own-root')) return true;
    if (typeof PRODUCT_GROUPS === 'undefined') return false;
    for (const g of PRODUCT_GROUPS){
      if (!collapsed.has('base:' + g.code)) return true;
    }
    return false;
  }

  // ─── Сохранить состояние свёрнутости в IndexedDB ───
  async function saveCollapsed(){
    if (typeof Storage === 'undefined' || !Storage.saveSetting) return;
    try {
      await Storage.saveSetting('productPickerCollapsed', [...collapsed]);
    } catch(e){
      console.warn('[picker] Не сохранилось состояние свёрнутости', e);
    }
  }

  // ─── Обновить иконку и title кнопки «развернуть/свернуть всё» ───
  function updateToggleAllButton(){
    const btn = box.querySelector('[data-pp-toggle-all]');
    if (!btn) return;
    // При активном поиске кнопка не нужна — поиск всё равно всё раскрывает
    if (currentQuery.trim()){
      btn.style.display = 'none';
      return;
    }
    btn.style.display = '';
    const expanded = hasExpanded();
    btn.textContent = expanded ? '⇧' : '⇕';
    btn.title = expanded ? 'Свернуть всё' : 'Развернуть всё';
  }

  // ─── Toggle: свернуть всё / развернуть всё ───
  function toggleAll(){
    const keys = getAllGroupKeys();
    if (hasExpanded()){
      for (const k of keys) collapsed.add(k);
    } else {
      collapsed.clear();
    }
    saveCollapsed();
    renderList();
    updateToggleAllButton();
  }

  function groupHtml(title, items, key, isSub){
    const rows = items.map(p => `
      <li class="pp-item" data-id="${escapeHtml(p.id)}">
        <span class="pp-item-name">${escapeHtml(p.name)}</span>
        <span class="pp-item-kbzhu">${kbzhuLine(p)}</span>
      </li>
    `).join('');
    const isCollapsed = checkCollapsed(key);
    const subClass = isSub ? ' pp-group-sub' : '';
    return `
      <div class="pp-group${subClass}${isCollapsed ? ' collapsed' : ''}" data-group="${escapeHtml(key)}">
        <div class="pp-group-head">
          <span class="pp-group-name">${escapeHtml(title)}</span>
          <span class="pp-group-right">
            <span class="pp-group-count">${items.length}</span>
            <span class="pp-group-arrow">▼</span>
          </span>
        </div>
        <ul class="pp-group-list">${rows}</ul>
      </div>
    `;
  }

  // ─── Корневая группа «⭐ Мои продукты» с подгруппами ───
  function ownGroupHtml(own){
    const groups = (typeof PRODUCT_GROUPS !== 'undefined' ? PRODUCT_GROUPS : [])
      .slice()
      .sort((a,b) => (a.order || 0) - (b.order || 0));

    const subs = [];
    for (const g of groups){
      const items = own.filter(p => p.group === g.code);
      if (!items.length) continue; // пустые подгруппы не показываем
      subs.push(groupHtml(g.name, items, 'own:' + g.code, true));
    }

    // Если своих продуктов нет — «Пока пусто» вместо подгрупп
    const inner = subs.length
      ? subs.join('')
      : '<div class="pp-own-empty">Пока пусто</div>';

        const rootKey = 'own-root';
    const isCollapsed = checkCollapsed(rootKey);
    const showTools = own.length > 0; // кнопки прячем, если «Мои» пусты
    return `
      <div class="pp-group pp-group-root${isCollapsed ? ' collapsed' : ''}" data-group="${escapeHtml(rootKey)}">
        <div class="pp-group-head">
          <span class="pp-group-name">⭐ Мои продукты</span>
          <span class="pp-group-right">
            ${showTools ? '<button type="button" class="pp-sort-btn" data-pp-sort title="Сортировка">≡</button>' : ''}
            <span class="pp-group-count">${own.length}</span>
            <span class="pp-group-arrow">▼</span>
          </span>
          ${showTools ? sortDropdownHtml() : ''}
        </div>
        <div class="pp-group-list pp-own-inner">
          ${inner}
        </div>
      </div>
    `;
  }

  function kbzhuLine(p){
    const n = v => (v === 0 || v) ? String(v).replace('.', ',') : '—';
    return `${n(p.kcal)} · Б${n(p.protein)} · Ж${n(p.fat)} · У${n(p.carbs)}`;
  }
  // ─── Показать/скрыть крестик очистки ───
  function updateClearVisibility(){
    const btn = box.querySelector('.pp-search-clear');
    if (!btn) return;
    if (currentQuery.trim()) btn.classList.add('visible');
    else                     btn.classList.remove('visible');
  }

  // ─── Правый клик (ПК) — контекстное меню ───
  box.addEventListener('contextmenu', (e) => {
    const item = e.target.closest('.pp-item');
    if (!item) return;
    const id = item.dataset.id;
    if (!findOwnProduct(id)) return; // на базовых — системное меню работает
    e.preventDefault();
    if (ctxTargetId) return;
    openCtxMenu(id, e.clientX, e.clientY);
  });

  // ─── Долгий тап (телефон, планшет) ───
  box.addEventListener('touchstart', (e) => {
    const item = e.target.closest('.pp-item');
    if (!item) return;
    const id = item.dataset.id;
    if (!findOwnProduct(id)) return;
    const t = e.touches[0];
    const x = t.clientX;
    const y = t.clientY;
    if (ctxTouchTimer) clearTimeout(ctxTouchTimer);
    ctxTouchTimer = setTimeout(() => {
      ctxTouchTimer = null;
      openCtxMenu(id, x, y);
    }, 500);
  }, { passive: true });

  box.addEventListener('touchend', () => {
    if (ctxTouchTimer){
      clearTimeout(ctxTouchTimer);
      ctxTouchTimer = null;
    }
  });

  box.addEventListener('touchmove', () => {
    if (ctxTouchTimer){
      clearTimeout(ctxTouchTimer);
      ctxTouchTimer = null;
    }
  }, { passive: true });

  // ─── Клики внутри модалки ───
 box.addEventListener('click', (e) => {
    if (e.target.closest('[data-pp-close]')){
      closeProductPicker();
      return;
    }

    // Клик по пункту контекстного меню — Редактировать
    if (e.target.closest('[data-pp-edit]')){
      const id = ctxTargetId;
      closeCtxMenu();
      if (id && typeof openProductForm === 'function'){
        openProductForm({
          productId: id,
          onSaved: async () => {
            // Перерисовать список «Моих» после сохранения
            if (typeof Storage !== 'undefined' && Storage.getAllProducts){
              allOwn = await Storage.getAllProducts();
            }
            renderList();
          }
          // onClose не передаём — пикер уже открыт, открывать заново не надо
        });
      }
      return;
    }
    if (e.target.closest('[data-pp-delete]')){
      const id = ctxTargetId;
      closeCtxMenu();
      if (id && typeof openSoon === 'function'){
        openSoon('🗑 Удалить', 'Удаление появится позже.');
      }
      return;
    }
    if (e.target.closest('[data-pp-clear]')){
      const input = box.querySelector('.pp-search');
      input.value = '';
      currentQuery = '';
      updateClearVisibility();
      renderList();
      updateToggleAllButton();
      input.focus();
      return;
    }
       if (e.target.closest('[data-pp-add]')){
      // Пикер НЕ закрываем — форма открывается поверх него.
      // Сохраняем свёрнутость, чтобы точно ничего не потерялось.
      saveCollapsed();

      if (typeof openProductForm === 'function'){
        openProductForm({
          onSaved: async (product) => {
            if (typeof Storage !== 'undefined' && Storage.getAllProducts){
              allOwn = await Storage.getAllProducts();
            }
            // Принудительно перерисовать список из актуального collapsed
            renderList();
            updateToggleAllButton();

            if (afterCreate === 'select' && product && onSelectCb){
              const cb = onSelectCb;
              closeProductPicker();
              cb(product);
            }
          },
          onClose: () => {
            // Отмена формы — перерисовать список из актуального collapsed
            renderList();
            updateToggleAllButton();
          }
        });
      }
      return;
    }
     // Клик по кнопке ≡ — открыть/закрыть dropdown сортировки
    if (e.target.closest('[data-pp-sort]')){
      const btn = e.target.closest('[data-pp-sort]');
      const drop = btn.closest('.pp-group-head').querySelector('.pp-sort-dropdown');
      if (!drop) return;
      if (drop.classList.contains('open')){
        closeSortDropdowns();
      } else {
        closeSortDropdowns();
        positionSortDropdown(btn, drop);
      }
      return;
    }

   // Клик по пункту dropdown — сменить сортировку
    const sortItem = e.target.closest('[data-sort]');
    if (sortItem){
      changeSort(sortItem.dataset.sort);
      return;
    }

   // Клик внутри открытого dropdown (но не по пункту) — не закрывать и не сворачивать
    if (e.target.closest('.pp-sort-dropdown')){
      return;
    }

   // Клик вне dropdown и вне кнопки — закрыть открытый dropdown
    closeSortDropdowns();
    // Клик вне контекстного меню — закрыть его
    if (ctxTargetId) closeCtxMenu();

   // Кнопка «развернуть / свернуть всё»
    if (e.target.closest('[data-pp-toggle-all]')){
      toggleAll();
      return;
    }

   // Клик по заголовку группы — свернуть / развернуть.
    // При активном поиске группы не сворачиваются — поиск показывает всё.
    const head = e.target.closest('.pp-group-head');
    if (head){
      if (currentQuery.trim()) return;
      const groupEl = head.closest('.pp-group');
      const key = groupEl.dataset.group;
      if (collapsed.has(key)) collapsed.delete(key);
      else                    collapsed.add(key);
      groupEl.classList.toggle('collapsed');
      saveCollapsed();
      updateToggleAllButton();
      return;
    }
    const item = e.target.closest('.pp-item');
    if (!item) return;
    const id = item.dataset.id;
    const product = allOwn.find(p => p.id === id) ||
                    (Storage.getBaseProduct ? Storage.getBaseProduct(id) : null);
    if (product && onSelectCb){
      onSelectCb(product);
    }
    closeProductPicker();
  });

 // ─── Клик по тёмному фону — закрыть ───
  let backdropDown = false;
  modal.addEventListener('mousedown', (e) => {
    backdropDown = (e.target === modal);
  });
  modal.addEventListener('mouseup', (e) => {
    if (backdropDown && e.target === modal) closeProductPicker();
    backdropDown = false;
  });

  // ─── Escape ───
    document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    // Сначала закрыть контекстное меню, если оно открыто
    if (ctxTargetId){
      closeCtxMenu();
      return;
    }
    if (modal.style.display === 'flex'){
      closeProductPicker();
    }
  });

  // ─── Публичное API ───
  window.openProductPicker  = openProductPicker;
  window.closeProductPicker = closeProductPicker;

})();