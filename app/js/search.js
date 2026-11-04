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

  input.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => performSearch(e.target.value), 300);
  });

  document.querySelectorAll('#modalSearch [data-modal-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      input.value = '';
      document.getElementById('searchResults').innerHTML = '<div class="search-empty">Начните вводить запрос...</div>';
    });
  });
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

  const searchTerms = new Set();
  const words = cleanQuery.split(' ');
  
  words.forEach(word => {
    const wordStem = getStem(word);
    searchTerms.add(wordStem);
    for (const [key, synonyms] of Object.entries(SEARCH_DICTIONARY)) {
      if (key.includes(wordStem) || wordStem.includes(key) || synonyms.some(syn => syn.includes(wordStem) || wordStem.includes(syn))) {
         searchTerms.add(key);
         synonyms.forEach(syn => searchTerms.add(syn));
      }
    }
  });
  const termsArray = Array.from(searchTerms);

  if (currentSearchTab === 'recipes') {
    const allRecipes = await Storage.getAllRecipes();
    const scoredRecipes = allRecipes.map(r => {
      const rName = (r.name || '').toLowerCase();
      const rTags = (r.tags || []).join(' ');
      const rIngs = (r.ingredients || []).map(i => i.name).join(' ');
      const rNote = (r.note || '').toLowerCase();
      let score = countMatches(rName, termsArray)*10 + countMatches(rTags, termsArray)*5 + countMatches(rIngs, termsArray)*3 + countMatches(rNote, termsArray)*1;
      return { recipe: r, score };
    }).filter(item => item.score > 0);

    scoredRecipes.sort((a, b) => b.score - a.score);
    renderRecipeResults(scoredRecipes.map(i => i.recipe), words[0] ? words[0].slice(0, 4) : cleanQuery); 
  } else {
    renderProductResults(await Storage.searchProducts(cleanQuery), cleanQuery);
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
  resultsEl.innerHTML = products.map(p => `
    <div class="search-result-item" data-product-id="${p.id}">
      <div class="search-result-title">${highlightText(p.name, query)}${p.brand ? ` (${p.brand})` : ''}</div>
      <div class="search-result-desc">${p.kbzhu?.kcal ? `${p.kbzhu.kcal} ккал · Б ${p.kbzhu.protein} · Ж ${p.kbzhu.fat} · У ${p.kbzhu.carbs}` : 'КБЖУ не указано'} · ${p.source === 'own' ? '⭐ Свой' : '📚 База'}</div>
    </div>
  `).join('');

  resultsEl.querySelectorAll('.search-result-item').forEach(item => {
    item.addEventListener('click', () => {
      document.getElementById('modalSearch').style.display = 'none';
      if (typeof showToastMsg === 'function') showToastMsg('Карточка продукта появится чуть позже');
    });
  });
}

function highlightText(text, query) {
  if (!text || !query) return escapeHtml(text);
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return escapeHtml(text).replace(new RegExp(`(${escapedQuery})`, 'gi'), '<mark>$1</mark>');
}