const modalFilters = document.getElementById('modalFilters');
const filterMeals = document.getElementById('filterMeals');
const filterTime = document.getElementById('filterTime');
const filterTags = document.getElementById('filterTags');
const filterFav = document.getElementById('filterFav');
const filterCooked = document.getElementById('filterCooked');
const filterPP = document.getElementById('filterPP');
const filterCount = document.getElementById('filterCount');

// ГЛОБАЛЬНАЯ ФУНКЦИЯ ОТКРЫТИЯ ФИЛЬТРОВ
window.openFiltersModal = async function() {
  const modal = document.getElementById('modalFilters');
  if (!modal) return;
  
  modal.style.display = 'flex';
  
  // Загружаем теги, если их еще нет
  if (filterTags && filterTags.innerHTML.trim() === '') {
    try {
      const allTags = await Storage.getAllTagsMerged();
      // Берем первые 15 тегов
      filterTags.innerHTML = allTags.slice(0, 15).map(t => {
        const name = typeof t === 'string' ? t : (t.name || t);
        return `<label class="filter-check"><input type="checkbox" value="${name}"><span>${name}</span></label>`;
      }).join('');
    } catch (e) {
      console.error('Ошибка загрузки тегов:', e);
      filterTags.innerHTML = '<span style="font-size:12px; opacity:0.5;">Теги не найдены</span>';
    }
  }
  updateFilterCount();
};

document.addEventListener('click', async (e) => {
  if (e.target.closest('#filterCloseBtn')) {
    modalFilters.style.display = 'none';
    return;
  }

  if (e.target.closest('.filter-section-head')) {
    e.target.closest('.filter-section').classList.toggle('open');
    return;
  }

  if (e.target.closest('#filterApplyBtn')) {
    applyFilters();
    modalFilters.style.display = 'none';
    return;
  }

  if (e.target.closest('#filterResetBtn')) {
    document.querySelectorAll('#modalFilters input[type="checkbox"], #modalFilters input[type="radio"]').forEach(cb => cb.checked = false);
    applyFilters();
    return;
  }

  if (e.target.closest('#activeFiltersReset')) {
    document.querySelectorAll('#modalFilters input[type="checkbox"], #modalFilters input[type="radio"]').forEach(cb => cb.checked = false);
    applyFilters();
    return;
  }
});

// Ловим изменения на чекбоксах напрямую (это надежнее)
document.addEventListener('change', (e) => {
  if (e.target.closest('#modalFilters')) {
    updateFilterCount();
  }
});
// И на клики по лейблам (чтобы счетчик менялся мгновенно)
document.addEventListener('click', (e) => {
  if (e.target.closest('.filter-check')) {
    // Даем браузеру миллисекунду обновить состояние чекбокса и вызываем пересчет
    setTimeout(updateFilterCount, 10);
  }
});

async function getFilteredRecipes() {
  const allRecipes = await Storage.getAllRecipes();
  if (!allRecipes) return [];

  const checkedMeals = Array.from(filterMeals.querySelectorAll('input:checked')).map(i => i.value);
  const checkedTime = filterTime.querySelector('input:checked')?.value;
  const checkedTags = Array.from(filterTags.querySelectorAll('input:checked')).map(i => i.value.toLowerCase());
  const isFav = filterFav.checked;
  const isCooked = filterCooked.checked;
  const isPP = filterPP.checked;

  const marks = await Storage.getAllMarks();
  const favIds = new Set(marks.favorite.map(m => m.recipeId));
  const cookedIds = new Set(marks.cooked.map(m => m.recipeId));

  return allRecipes.filter(r => {
    // Приемы пищи
    if (checkedMeals.length > 0 && !checkedMeals.includes(r.meal)) return false;
    
    // Время
    if (checkedTime && checkedTime !== '999') {
      if ((r.time || 0) > parseInt(checkedTime, 10)) return false;
    }
    
    // Теги
    if (checkedTags.length > 0) {
      const rTags = (r.tags || []).map(t => t.toLowerCase());
      if (!checkedTags.every(ct => rTags.includes(ct))) return false;
    }
    
    // Дополнительно
    if (isFav && !favIds.has(r.id)) return false;
    if (isCooked && !cookedIds.has(r.id)) return false;
    
    if (isPP) {
       const rTags = (r.tags || []).map(t => t.toLowerCase());
       if (!rTags.includes('пп')) return false;
    }

    return true;
  });
}

async function updateFilterCount() {
  if (!filterCount) return;
  const filtered = await getFilteredRecipes();
  filterCount.textContent = `Найдено: ${filtered.length}`;
}

async function applyFilters() {
  const filteredIds = new Set((await getFilteredRecipes()).map(r => r.id));
  
  document.querySelectorAll('.recipes-grid .card').forEach(card => {
    card.style.display = filteredIds.has(card.dataset.recipeId) ? '' : 'none';
  });

  document.querySelectorAll('.recipes-section').forEach(section => {
    const visible = section.querySelectorAll('.card:not([style*="display: none"])').length;
    const counter = section.querySelector('.recipes-section-count');
    if (counter) counter.textContent = visible;
  });

  updateActiveFiltersBar();
}

function updateActiveFiltersBar() {
  const bar = document.getElementById('activeFiltersBar');
  if (!bar) return;
  
  const textEl = document.getElementById('activeFiltersText');
  const active = [];
  
  const meals = Array.from(filterMeals.querySelectorAll('input:checked')).map(i => i.parentElement.textContent.trim());
  if (meals.length) active.push(meals.join(', '));
  
  const time = filterTime.querySelector('input:checked');
  if (time && time.value !== '999') active.push(`до ${time.value} мин`);
  
  const tags = Array.from(filterTags.querySelectorAll('input:checked')).map(i => i.value);
  if (tags.length) active.push(tags.join(', '));
  
  if (filterFav.checked) active.push('❤ Избранное');
  if (filterCooked.checked) active.push('👨‍🍳 Приготовлено');
  if (filterPP.checked) active.push('ПП');

  if (active.length > 0) {
    textEl.textContent = 'Фильтры: ' + active.join(' · ');
    bar.classList.add('visible');
  } else {
    bar.classList.remove('visible');
  }
}

// Инициализация плашки
document.addEventListener('DOMContentLoaded', () => {
  const mainContent = document.querySelector('[data-screen="home"] .contents');
  if (mainContent && !document.getElementById('activeFiltersBar')) {
    const bar = document.createElement('div');
    bar.id = 'activeFiltersBar';
    bar.className = 'active-filters-bar';
    bar.innerHTML = `<span class="active-filters-text" id="activeFiltersText"></span><button type="button" class="active-filters-reset" id="activeFiltersReset" title="Сбросить фильтры">✕</button>`;
    mainContent.after(bar);
  }
});