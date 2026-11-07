// ═══════════════════════════════════════════════════
// product-card.js — карточка просмотра продукта
// ═══════════════════════════════════════════════════

(function(){
  const modal = document.getElementById('modalProductCard');
  const box = document.getElementById('modalProductCardBox');
  if (!modal || !box) return;

  let currentBase = null;
  let currentOwn = null;
  let viewMode = 'base'; // 'base' | 'own'

  // ─── Утилиты ───
  function escapeHtml(s){
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  async function findOwnCopy(baseId) {
    if (typeof Storage === 'undefined' || !Storage.getAllProducts) return null;
    const own = await Storage.getAllProducts();
    return own.find(p => p.sourceId === baseId) || null;
  }

  function getGroupName(code) {
    if (typeof PRODUCT_GROUPS !== 'undefined' && Array.isArray(PRODUCT_GROUPS)) {
      const g = PRODUCT_GROUPS.find(x => x.code === code);
      if (g) return g.name;
    }
    return code || 'Без группы';
  }

  function formatKbzhu(v) {
    return (v === 0 || v) ? String(v).replace('.', ',') : '—';
  }

  // ─── Открыть карточку ───
  async function openProductCard(product, options = {}) {
    if (!product) return;
    
    // Если передан только ID (строка), загружаем продукт
    if (typeof product === 'string') {
      const p = (typeof Storage !== 'undefined' && Storage.getProduct) 
        ? await Storage.getProduct(product) : null;
      if (!p) return;
      product = p;
    }

    // Определяем, базовый это продукт или свой
    const isBase = product.source === 'base' || (product.id && !product.id.startsWith('product-'));
    
    if (isBase) {
      currentBase = product;
      currentOwn = await findOwnCopy(product.id);
      viewMode = currentOwn ? 'base' : 'base';
    } else {
      currentOwn = product;
      currentBase = null;
      viewMode = 'own';
    }

    // Стили
    box.className = 'modal-product-card-box dm-scope';
    ['style','palette','theme','shadow'].forEach(key => {
      const attr = 'data-' + key;
      const val = document.body.getAttribute(attr);
      if (val) box.setAttribute(attr, val);
      else box.removeAttribute(attr);
    });

    // Умное затемнение: если под нами открыт поиск или пикер, убираем их фон
    const searchModal = document.getElementById('modalSearch');
    const pickerModal = document.getElementById('modalProductPicker');
    
    if (searchModal && searchModal.style.display === 'flex') {
      searchModal.style.background = 'transparent';
    }
    if (pickerModal && pickerModal.style.display === 'flex') {
      pickerModal.style.background = 'transparent';
    }

    modal.style.display = 'flex';
    renderCard(options);
  }

  function renderCard(options) {
    const p = viewMode === 'base' ? currentBase : currentOwn;
    if (!p) return;

    const isBase = viewMode === 'base';
    const groupName = getGroupName(p.group);
    
    // КБЖУ
    const kcal = formatKbzhu(p.kcal);
    const prot = formatKbzhu(p.protein);
    const fat  = formatKbzhu(p.fat);
    const carb = formatKbzhu(p.carbs);

    // Доп. инфо
    let unitText = p.unit || 'г';
    if (p.unit === 'шт' && p.weightPerPiece) unitText += ` (1 шт = ${p.weightPerPiece} г)`;
    if (p.unit === 'мл' && p.density) unitText += ` (плотность ${p.density})`;

    let kbzhuMlNote = '';
    if (p.kbzhuOn100ml && p.kbzhuMl) {
      kbzhuMlNote = `<div class="pc-note">На упаковке: ${p.kbzhuMl.kcal} · Б${p.kbzhuMl.protein} · Ж${p.kbzhuMl.fat} · У${p.kbzhuMl.carbs} на 100 мл</div>`;
    }

    // Переключатель База/Моя
    let toggleHtml = '';
    if (currentBase && currentOwn) {
      toggleHtml = `
        <div class="pc-toggle-wrap">
          <button type="button" class="pc-toggle-btn ${viewMode === 'base' ? 'active' : ''}" data-pc-view="base">📚 База</button>
          <button type="button" class="pc-toggle-btn ${viewMode === 'own' ? 'active' : ''}" data-pc-view="own">⭐ Моя</button>
        </div>
      `;
    }

    // Кнопки
    let actionsHtml = '';
    if (isBase) {
      if (!currentOwn) {
        actionsHtml += `<button type="button" class="pc-btn pc-btn-primary" data-pc-action="copy">📋 Скопировать в мои</button>`;
      } else {
        actionsHtml += `<button type="button" class="pc-btn" data-pc-action="open-own">⭐ Открыть мою версию</button>`;
      }
    } else {
      actionsHtml += `<button type="button" class="pc-btn pc-btn-primary" data-pc-action="edit">✎ Изменить</button>`;
      actionsHtml += `<button type="button" class="pc-btn" data-pc-action="dup">📋 Дублировать</button>`;
    }

    box.innerHTML = `
      <div class="pc-head">
        <span class="pc-title">${isBase ? '📚 ' : '⭐ '}${escapeHtml(p.name)}</span>
        <button type="button" class="pc-close" data-pc-close>✕</button>
      </div>
      
      ${toggleHtml}
      
      <div class="pc-body">
        <div class="pc-info">
          ${p.brand ? `<div class="pc-row"><span class="pc-label">Марка</span><span class="pc-value">${escapeHtml(p.brand)}</span></div>` : ''}
          <div class="pc-row"><span class="pc-label">Группа</span><span class="pc-value">${escapeHtml(groupName)}</span></div>
          <div class="pc-row"><span class="pc-label">Единица</span><span class="pc-value">${escapeHtml(unitText)}</span></div>
        </div>

        <div class="pc-kbzhu-block">
          <div class="pc-kbzhu-title">КБЖУ на 100 г</div>
          <div class="pc-kbzhu-grid">
            <div class="pc-kbzhu-item"><span class="pc-kbzhu-lbl">Ккал</span><span class="pc-kbzhu-val">${kcal}</span></div>
            <div class="pc-kbzhu-item"><span class="pc-kbzhu-lbl">Белки</span><span class="pc-kbzhu-val">${prot}</span></div>
            <div class="pc-kbzhu-item"><span class="pc-kbzhu-lbl">Жиры</span><span class="pc-kbzhu-val">${fat}</span></div>
            <div class="pc-kbzhu-item"><span class="pc-kbzhu-lbl">Углев.</span><span class="pc-kbzhu-val">${carb}</span></div>
          </div>
          ${kbzhuMlNote}
        </div>
      </div>

      <div class="pc-actions">
        ${actionsHtml}
      </div>
    `;

    bindCardEvents(options);
  }

  function bindCardEvents(options) {
    // Закрытие
    box.querySelector('[data-pc-close]')?.addEventListener('click', () => closeProductCard());

    // Переключатель
    box.querySelectorAll('[data-pc-view]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        viewMode = e.target.dataset.pcView;
        renderCard(options);
      });
    });

    // Кнопки действий
    box.querySelector('[data-pc-action="copy"]')?.addEventListener('click', async () => {
      const copy = { ...currentBase };
      delete copy.id;
      copy.sourceId = currentBase.id;
      copy.createdAt = Date.now();
      copy.source = 'own';
      
      closeProductCard();
      if (typeof openProductForm === 'function') {
        openProductForm({
          initialData: copy,
          skipDuplicateCheck: true,
          onSaved: (saved) => {
            if (typeof performSearch === 'function') {
              const input = document.getElementById('searchInput');
              if (input) performSearch(input.value);
            }
            if (options.onCopy) options.onCopy(saved);
            if (typeof showToastMsg === 'function') showToastMsg('Продукт скопирован в мои');
          }
        });
      }
    });

    box.querySelector('[data-pc-action="open-own"]')?.addEventListener('click', () => {
      viewMode = 'own';
      renderCard(options);
    });

    box.querySelector('[data-pc-action="edit"]')?.addEventListener('click', () => {
      closeProductCard();
      if (typeof openProductForm === 'function') {
        openProductForm({
          productId: currentOwn.id,
          onSaved: async () => {
            currentOwn = await Storage.getProduct(currentOwn.id);
            openProductCard(currentOwn, options);
            if (typeof performSearch === 'function') {
              const input = document.getElementById('searchInput');
              if (input) performSearch(input.value);
            }
          }
        });
      }
    });

    box.querySelector('[data-pc-action="dup"]')?.addEventListener('click', () => {
      closeProductCard();
      if (typeof openProductForm === 'function') {
        openProductForm({
          initialData: { ...currentOwn, id: null, name: currentOwn.name + ' (копия)' },
          skipDuplicateCheck: true,
          onSaved: (saved) => {
            if (typeof performSearch === 'function') {
              const input = document.getElementById('searchInput');
              if (input) performSearch(input.value);
            }
            if (options.onCopy) options.onCopy(saved);
            if (typeof showToastMsg === 'function') showToastMsg('Продукт дублирован');
          }
        });
      }
    });
  }

  function closeProductCard() {
    modal.style.display = 'none';
    document.body.style.overflow = '';
    
    // Возвращаем фон окнам под нами
    const searchModal = document.getElementById('modalSearch');
    const pickerModal = document.getElementById('modalProductPicker');
    
    if (searchModal && searchModal.style.display === 'flex') {
      searchModal.style.background = 'rgba(0, 0, 0, 0.5)';
    }
    if (pickerModal && pickerModal.style.display === 'flex') {
      pickerModal.style.background = 'rgba(0, 0, 0, 0.5)';
    }
  }

  // Фон
  let mouseDownTarget = null;
  modal.addEventListener('mousedown', (e) => {
    mouseDownTarget = e.target;
    if (e.target === modal) e.stopPropagation(); // Блокируем клик от поиска
  });
  modal.addEventListener('mouseup', (e) => {
    if (mouseDownTarget === modal && e.target === modal) {
      closeProductCard();
      e.stopPropagation(); // Блокируем клик от поиска
    }
    mouseDownTarget = null;
  });

  // Escape (теперь обрабатывается глобально в modals.js)
  // document.addEventListener('keydown', (e) => {
  //   if (e.key === 'Escape' && modal.style.display === 'flex') closeProductCard();
  // });

  // Публичное API
  window.openProductCard = openProductCard;
  window.closeProductCard = closeProductCard;

})();