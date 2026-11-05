let currentSearchTab = 'recipes';
let searchTimeout = null;

const SEARCH_DICTIONARY = {
  'слад': ['слад', 'десе', 'выпе', 'мед', 'саха', 'шоко', 'бана', 'ягод', 'фрук', 'сгущ'],
  'мучн': ['мучн', 'мука', 'тест', 'хлеб', 'пиро', 'блин', 'олад', 'паст'],
  'мясн': ['мясн', 'мясо', 'кури', 'свин', 'говя', 'фарш', 'инде', 'шашл', 'котл'],
  'итал': ['итал', 'паст', 'пицц', 'парм', 'тома', 'бази'],
  'шашл': ['шашл', 'грил', 'манга', 'барб', 'мари', 'мясо', 'кури'],
  'пп':   ['пп', 'поле', 'диет', 'белк', 'низк', 'твор', 'овощ'],
  'быст': ['быст', 'скоп', 'мину', '10', '15', '20'],
  'суп':  ['суп', 'борщ', 'буль', 'похл'],
  'сала': ['сала', 'вине', 'овощ', 'зеле'],
  'завт': ['завт', 'утро', 'омле', 'каша', 'сырн', 'блин']
};

const STOP_WORDS = ['хоче', 'хочу', 'дава', 'приго', 'поест', 'чего', 'что-то', 'пожа', 'найди', 'рецеп', 'кухн', 'блюд'];

// ГЛОБАЛЬНАЯ ФУНКЦИЯ ОТКРЫТИЯ ПОИСКА
window.openSearchModal = function() {
  const modal = document.getElementById('modalSearch');
  if (modal) {
    modal.style.display = 'flex';
    setTimeout(() => {
      const input = document.getElementById('searchInput');
      if (input) input.focus();
    }, 100);
  } else {
    alert('ОШИБКА: Модалка поиска (id="modalSearch") не найдена в файле index.html!');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('searchInput');
  const tabs = document.querySelectorAll('.search-tab');
  if (!input) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentSearchTab = tab.dataset.tab;
      input.placeholder = currentSearchTab === 'recipes' ? 'Что ищем? (название, ингредиент, тег)' : 'Поиск продукта (название, марка)';
      performSearch(input.value);
    });
  });

  const clearBtn = document.getElementById('searchClearBtn');
  input.addEventListener('input', (e) => {
    input.parentElement.classList.toggle('has-value', e.target.value.length > 0);
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => performSearch(e.target.value), 300);
  });
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      input.value = '';
      input.parentElement.classList.remove('has-value');
      performSearch('');
      input.focus();
    });
  }

  document.querySelectorAll('#modalSearch [data-modal-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      input.value = '';
      document.getElementById('searchResults').innerHTML = '<div class="search-empty">Начните вводить запрос...</div>';
    });
  });

  // Защита от закрытия при выделении текста
  const modalSearch = document.getElementById('modalSearch');
  if (modalSearch) {
    let mouseDownTarget = null;
    modalSearch.addEventListener('mousedown', (e) => { mouseDownTarget = e.target; });
    modalSearch.addEventListener('mouseup', (e) => {
      if (mouseDownTarget === modalSearch && e.target === modalSearch) {
        modalSearch.style.display = 'none';
      }
      mouseDownTarget = null;
    });
  }
});

function getStem(word) {
  if (!word) return '';
  const w = word.toLowerCase().replace(/[^а-яёa-z0-9]/g, '');
  return w.length <= 4 ? w : w.slice(0, 4);
}

function countMatches(text, terms) {
  if (!text) return 0;
  const lower = text.toLowerCase();
  return terms.filter(term => lower.includes(term)).length;
}

async function performSearch(query) {
  const rawQuery = query.trim().toLowerCase();
  const resultsEl = document.getElementById('searchResults');
  if (!resultsEl) return;

  if (!rawQuery) {
    resultsEl.innerHTML = '<div class="search-empty">Начните вводить запрос...</div>';
    return;
  }

  let cleanQuery = rawQuery;
  STOP_WORDS.forEach(word => {
    cleanQuery = cleanQuery.replace(new RegExp(`\\b${word}\\w*`, 'gi'), '').trim();
  });
  cleanQuery = cleanQuery.replace(/\s+/g, ' ');
  if (!cleanQuery) cleanQuery = rawQuery;

  if (currentSearchTab === 'recipes') {
    const allRecipes = await Storage.getAllRecipes();
    
    // Отсекаем слова короче 3 букв, чтобы предлоги и союзы не ломали поиск
    let terms = cleanQuery.split(' ').filter(t => t.length > 2);
    if (terms.length === 0) terms = [cleanQuery];

    // Ищем синонимы для наших слов (например, "сладкое" -> "десерт", "выпечка")
    const searchSynonyms = new Set();
    terms.forEach(term => {
      for (const [key, synonyms] of Object.entries(SEARCH_DICTIONARY)) {
        if (key.includes(term) || term.includes(key)) {
          synonyms.forEach(syn => searchSynonyms.add(syn));
        }
      }
    });

    const scoredRecipes = allRecipes.map(r => {
      const rName = (r.name || '').toLowerCase();
      const rTags = (r.tags || []).join(' ').toLowerCase();
      const rIngs = (r.ingredients || []).map(i => i.name.toLowerCase()).join(' ');
      const rNote = (r.note || '').toLowerCase();
      
      let score = 0;
      
      // Оцениваем основные слова
      terms.forEach(term => {
        const stem = getStem(term);
        if (rName.includes(stem)) score += 30;
        if (rTags.includes(stem)) score += 15;
        if (rIngs.includes(stem)) score += 5;
      });
      
      // Оцениваем синонимы (если совпали по словарю)
      searchSynonyms.forEach(syn => {
        if (rName.includes(syn)) score += 20;
        if (rTags.includes(syn)) score += 10;
        if (rIngs.includes(syn)) score += 3;
      });
      
      return { recipe: r, score };
    }).filter(item => item.score > 0);

    scoredRecipes.sort((a, b) => b.score - a.score);
    renderRecipeResults(scoredRecipes.map(i => i.recipe), terms[0]); 
  } else {
    let rawProducts = await Storage.searchProducts(cleanQuery);
    const ownProducts = await Storage.getAllProducts();
    const ownIds = new Set(ownProducts.map(p => p.id));
    
    rawProducts.forEach(p => {
      if (ownIds.has(p.id)) p.source = 'own';
      else p.source = 'base';
    });
    
    renderProductResults(rawProducts, cleanQuery);
  }
}

function renderRecipeResults(recipes, query) {
  const resultsEl = document.getElementById('searchResults');
  if (recipes.length === 0) {
    resultsEl.innerHTML = `<div class="search-empty">По запросу «${query}» ничего не найдено.</div>`;
    return;
  }
  resultsEl.innerHTML = recipes.map(r => `
    <div class="search-result-item" data-recipe-id="${r.id}">
      <div class="search-result-title">${highlightText(r.name, query)}</div>
      <div class="search-result-desc">${MEAL_LABEL[r.meal] || ''} · ${r.kbzhuSnapshot?.kcal || '—'} ккал · ${r.time || '—'} мин</div>
    </div>
  `).join('');

  resultsEl.querySelectorAll('.search-result-item').forEach(item => {
    item.addEventListener('click', () => {
      document.getElementById('modalSearch').style.display = 'none';
      if (typeof openRecipeCard === 'function') openRecipeCard(item.dataset.recipeId);
    });
  });
}

function renderProductResults(products, query) {
  const resultsEl = document.getElementById('searchResults');
  if (products.length === 0) {
    resultsEl.innerHTML = `<div class="search-empty">По запросу «${query}» продуктов не найдено.</div>`;
    return;
  }

  const own = products.filter(p => p.source === 'own');
  const base = products.filter(p => p.source !== 'own');

  const renderItem = (p) => {
    const kcal = (p.kcal === 0 || p.kcal) ? p.kcal : '—';
    const prot = (p.protein === 0 || p.protein) ? p.protein : '—';
    const fat = (p.fat === 0 || p.fat) ? p.fat : '—';
    const carb = (p.carbs === 0 || p.carbs) ? p.carbs : '—';
    const brandStr = p.brand ? ` · ${escapeHtml(p.brand)}` : '';
    
    return `
    <div class="search-result-item" data-product-id="${p.id}">
      <div class="search-result-title">${highlightText(p.name, query)}</div>
      <div class="search-result-desc">${kcal} ккал · Б ${prot} · Ж ${fat} · У ${carb}${brandStr}</div>
    </div>
  `;
  };

  let html = '';
  if (own.length) {
    html += `<div class="search-group-title">⭐ Мои продукты</div>`;
    html += own.map(renderItem).join('');
  }
  if (base.length) {
    html += `<div class="search-group-title">📚 База продуктов</div>`;
    html += base.map(renderItem).join('');
  }

  resultsEl.innerHTML = html;

  resultsEl.querySelectorAll('.search-result-item').forEach(item => {
    item.addEventListener('click', () => {
      const id = item.dataset.productId;
      if (typeof openProductCard === 'function') {
        openProductCard(id);
      }
    });
  });
}

// Глобальное контекстное меню для поиска
document.addEventListener('DOMContentLoaded', () => {
  const resultsEl = document.getElementById('searchResults');
  if (!resultsEl) return;

  resultsEl.addEventListener('contextmenu', (e) => {
    const item = e.target.closest('.search-result-item[data-product-id]');
    if (!item) return;
    e.preventDefault();
    
    const id = item.dataset.productId;
    const menu = document.getElementById('globalProductCtx');
    if (!menu) return;

    const isOwn = id.startsWith('product-');
    menu.dataset.targetId = id;
    
    menu.querySelector('[data-ctx="copy"]').style.display = isOwn ? 'none' : 'block';
    menu.querySelector('[data-ctx="edit"]').style.display = isOwn ? 'block' : 'none';
    menu.querySelector('[data-ctx="dup"]').style.display = isOwn ? 'block' : 'none';
    menu.querySelector('[data-ctx="delete"]').style.display = isOwn ? 'block' : 'none';

    menu.style.display = 'block';
    menu.style.visibility = 'hidden';
    let left = e.clientX, top = e.clientY;
    const mw = menu.offsetWidth, mh = menu.offsetHeight;
    if (left + mw > window.innerWidth - 6) left = window.innerWidth - mw - 6;
    if (top + mh > window.innerHeight - 6) top = window.innerHeight - mh - 6;
    menu.style.left = left + 'px';
    menu.style.top = top + 'px';
    menu.style.visibility = 'visible';
  });

  document.addEventListener('click', async (e) => {
    const menu = document.getElementById('globalProductCtx');
    if (!menu || menu.style.display === 'none') return;

    const btn = e.target.closest('[data-ctx]');
    if (!btn) { menu.style.display = 'none'; return; }

    e.preventDefault(); e.stopPropagation();
    menu.style.display = 'none';
    
    const id = menu.dataset.targetId;
    const action = btn.dataset.ctx;

    if (action === 'view' && typeof openProductCard === 'function') {
      openProductCard(id);
    } else if (action === 'copy') {
      const product = Storage.getBaseProduct ? Storage.getBaseProduct(id) : null;
      if (product && typeof openProductForm === 'function') {
        const copy = { ...product };
        delete copy.id;
        copy.sourceId = product.id;
        copy.createdAt = Date.now();
        copy.source = 'own';
        openProductForm({
          initialData: copy,
          skipDuplicateCheck: true,
          onSaved: () => { const inp = document.getElementById('searchInput'); if (inp) performSearch(inp.value); }
        });
      }
    } else if (action === 'edit' && typeof openProductForm === 'function') {
      openProductForm({
        productId: id,
        onSaved: () => { const inp = document.getElementById('searchInput'); if (inp) performSearch(inp.value); }
      });
    } else if (action === 'dup') {
      const p = await Storage.getProduct(id);
      if (p && typeof openProductForm === 'function') {
        openProductForm({
          initialData: { ...p, id: null, name: p.name + ' (копия)' },
          skipDuplicateCheck: true,
          onSaved: () => { const inp = document.getElementById('searchInput'); if (inp) performSearch(inp.value); }
        });
      }
    }
  });

  const searchModal = document.getElementById('modalSearch');
  if (searchModal) {
    searchModal.addEventListener('scroll', () => {
      const menu = document.getElementById('globalProductCtx');
      if (menu) menu.style.display = 'none';
    }, true);
  }
});

function highlightText(text, query) {
  if (!text || !query) return escapeHtml(text);
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return escapeHtml(text).replace(new RegExp(`(${escapedQuery})`, 'gi'), '<mark>$1</mark>');
}