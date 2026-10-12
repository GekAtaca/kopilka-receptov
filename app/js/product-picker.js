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
  let collapsed    = new Set();  // свёрнутые группы (по названию)

  // ─── Открыть ───
  async function openProductPicker(options){
    options = options || {};
    onSelectCb = typeof options.onSelect === 'function' ? options.onSelect : null;
    excludeIds = new Set(Array.isArray(options.excludeIds) ? options.excludeIds : []);
     currentQuery = '';
    collapsed.clear();
    // По умолчанию все базовые группы свёрнуты
    if (typeof PRODUCT_GROUPS !== 'undefined' && Array.isArray(PRODUCT_GROUPS)){
      for (const g of PRODUCT_GROUPS){
        collapsed.add('base:' + g.code);
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
        <button type="button" class="pp-add" data-pp-add title="Создать новый продукт">+</button>
      </div>
      <div class="pp-list" id="ppList"></div>
    `;

    const searchInput = box.querySelector('.pp-search');
    searchInput.addEventListener('input', (e) => {
      currentQuery = e.target.value;
      updateClearVisibility();
      renderList();
    });
    setTimeout(() => searchInput.focus(), 50);

    updateClearVisibility();
    renderList();
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

    // Свои: фильтр + сортировка «сначала новые»
    const own = allOwn
      .filter(p => !excludeIds.has(p.id))
      .filter(match)
      .sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0));

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
    return `
      <div class="pp-group pp-group-root${isCollapsed ? ' collapsed' : ''}" data-group="${escapeHtml(rootKey)}">
        <div class="pp-group-head">
          <span class="pp-group-name">⭐ Мои продукты</span>
          <span class="pp-group-right">
            <span class="pp-group-count">${own.length}</span>
            <span class="pp-group-arrow">▼</span>
          </span>
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

  // ─── Клики внутри модалки ───
 box.addEventListener('click', (e) => {
    if (e.target.closest('[data-pp-close]')){
      closeProductPicker();
      return;
    }
    if (e.target.closest('[data-pp-clear]')){
      const input = box.querySelector('.pp-search');
      input.value = '';
      currentQuery = '';
      updateClearVisibility();
      renderList();
      input.focus();
      return;
    }
      if (e.target.closest('[data-pp-add]')){
      // Закрыть пикер, открыть форму создания.
      // При закрытии формы — вернуться в пикер.
      const cb = onSelectCb;
      closeProductPicker();
      if (typeof openProductForm === 'function'){
        openProductForm({
          onSaved: () => {
            // После создания продукт остаётся в списке «Мои продукты».
            // Наружу не отдаём — пусть пользователь сам решит, выбирать его или нет.
            // Разделение поведения (сразу в рецепт / остаться в списке) — на шаге 4.7.
          },
          onClose: () => {
            openProductPicker({ onSelect: cb });
          }
        });
      }
      return;
    }
   // Клик по заголовку группы — свернуть / развернуть
    const head = e.target.closest('.pp-group-head');
    if (head){
      const groupEl = head.closest('.pp-group');
      const title = groupEl.dataset.group;
      if (collapsed.has(title)) collapsed.delete(title);
      else                      collapsed.add(title);
      groupEl.classList.toggle('collapsed');
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
    if (modal.style.display === 'flex'){
      closeProductPicker();
    }
  });

  // ─── Публичное API ───
  window.openProductPicker  = openProductPicker;
  window.closeProductPicker = closeProductPicker;

})();