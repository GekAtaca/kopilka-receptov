document.addEventListener('DOMContentLoaded', () => {
  // 1. Инициализация плашки фильтров
  const mainContent = document.querySelector('[data-screen="home"] .contents');
  if (mainContent && !document.getElementById('activeFiltersBar')) {
    const bar = document.createElement('div');
    bar.id = 'activeFiltersBar';
    bar.className = 'active-filters-bar';
    bar.innerHTML = `
      <div class="active-filters-content">
        <span class="active-filters-label">Фильтры:</span>
        <div class="active-filters-chips" id="activeFiltersChips"></div>
      </div>
      <button type="button" class="active-filters-reset" id="activeFiltersReset" title="Сбросить все фильтры">✕</button>
    `;
    mainContent.after(bar);
  }
});

// ГЛОБАЛЬНАЯ ФУНКЦИЯ ОТКРЫТИЯ ФИЛЬТРОВ
window.openFiltersModal = async function() {
  const modal = document.getElementById('modalFilters');
  if (!modal) return;
  
  modal.style.display = 'flex';
  
  const filterTags = document.getElementById('filterTags');
  
  if (filterTags) {
    filterTags.innerHTML = '<span style="font-size:13px; opacity:0.6; font-style:italic;">Загрузка тегов...</span>';
    
    try {
      const allTags = await Storage.getAllTagsMerged();
      let customGroups = await Storage.getSetting('customTagGroups');
      
      if (!customGroups || !customGroups.length) {
        customGroups = [
          { code: 'vkus', name: 'Вкус' }, { code: 'nastroenie', name: 'Настроение' },
          { code: 'dieta', name: 'Диета' }, { code: 'sposob', name: 'Способ готовки' },
          { code: 'slozhnost', name: 'Сложность' }, { code: 'povod', name: 'Повод' },
          { code: 'sezon', name: 'Сезон' }, { code: 'kuhnya', name: 'Кухня' },
          { code: 'tekstura', name: 'Текстура' }, { code: 'temperatura', name: 'Температура' },
          { code: 'portsiya', name: 'Порция' }, { code: 'komu', name: 'Кому' },
          { code: 'vremya', name: 'Время суток' }, { code: 'stil', name: 'Стиль питания' },
          { code: 'poleznost', name: 'Полезность' }, { code: 'osobennost', name: 'Особенность' },
          { code: 'misc', name: 'Разное' }
        ];
      }

      const grouped = {};
      customGroups.forEach(g => grouped[g.code] = { name: g.name, tags: [] });
      
      allTags.forEach(t => {
        const gCode = typeof t === 'string' ? 'misc' : (t.group || 'misc');
        const tagName = typeof t === 'string' ? t : (t.name || t.text || '');
        if (grouped[gCode]) {
          grouped[gCode].tags.push(tagName);
        } else {
          if (!grouped['misc']) grouped['misc'] = { name: 'Разное', tags: [] };
          grouped['misc'].tags.push(tagName);
        }
      });
      
      const activeGroups = Object.entries(grouped).filter(([code, data]) => data.tags.length > 0);

      if (activeGroups.length === 0) {
        filterTags.innerHTML = '<span style="font-size:13px; opacity:0.6; font-style:italic;">Пока нет тегов</span>';
      } else {
        let tabsHtml = activeGroups.map(([code, data], index) => 
          `<button type="button" class="ft-tab ${index === 0 ? 'active' : ''}" data-group="${code}">${data.name}</button>`
        ).join('');

        filterTags.innerHTML = `
          <div class="ft-tabs-wrapper">
            <button type="button" class="ft-arrow ft-arrow-left" id="ftArrowLeft" style="visibility:hidden;">◀</button>
            <div class="ft-tabs-viewport" id="ftViewport">
              <div class="ft-tabs" id="ftTabsContainer">${tabsHtml}</div>
            </div>
            <button type="button" class="ft-arrow ft-arrow-right" id="ftArrowRight" style="visibility:hidden;">▶</button>
          </div>
          <div class="ft-tags-list" id="ftTagsList"></div>
        `;

        // ═══ ЛОГИКА ПОСТРАНИЧНОГО ЛИСТАНИЯ (Скролл через скрытие) ═══
        const viewport = document.getElementById('ftViewport');
        const container = document.getElementById('ftTabsContainer');
        const arrowLeft = document.getElementById('ftArrowLeft');
        const arrowRight = document.getElementById('ftArrowRight');
        const tabs = Array.from(container.children);

        let pages = [];
        let currentPage = 0;

        const calculatePages = () => {
          // 1. Показываем все вкладки для замера
          tabs.forEach(t => t.style.display = 'inline-flex');

          const vWidth = viewport.clientWidth;
          if (vWidth < 10) return; // Ждем, пока модалка отрисуется

          pages = [];
          let currentStart = 0;
          let currentWidth = 0;

          for (let i = 0; i < tabs.length; i++) {
            const tabWidth = tabs[i].offsetWidth;
            const gap = i > currentStart ? 6 : 0;

            // Запас 4px, чтобы точно ничего не обрезалось
            if (currentWidth + gap + tabWidth > vWidth - 4 && i > currentStart) {
              pages.push({ start: currentStart, end: i - 1 });
              currentStart = i;
              currentWidth = tabWidth;
            } else {
              currentWidth += gap + tabWidth;
            }
          }

          if (currentStart < tabs.length) {
            pages.push({ start: currentStart, end: tabs.length - 1 });
          }

          currentPage = 0;
          updateView();
        };

        const updateView = () => {
          if (pages.length <= 1) {
            arrowLeft.style.visibility = 'hidden';
            arrowRight.style.visibility = 'hidden';
          } else {
            arrowLeft.style.visibility = 'visible';
            arrowRight.style.visibility = 'visible';
            arrowLeft.disabled = currentPage === 0;
            arrowRight.disabled = currentPage === pages.length - 1;
          }

          const page = pages[currentPage];

          tabs.forEach((tab, index) => {
            if (index >= page.start && index <= page.end) {
              tab.style.display = 'inline-flex';
            } else {
              tab.style.display = 'none';
            }
          });
        };

        arrowLeft.addEventListener('click', () => {
          if (currentPage > 0) { currentPage--; updateView(); }
        });

        arrowRight.addEventListener('click', () => {
          if (currentPage < pages.length - 1) { currentPage++; updateView(); }
        });

        if (window.filterResizeObserver) {
            window.filterResizeObserver.disconnect();
        }
        window.filterResizeObserver = new ResizeObserver(() => {
            calculatePages();
        });
        window.filterResizeObserver.observe(viewport);

        // Функция отрисовки чипсов с тегами
        const renderTagChips = (tags) => {
          const list = document.getElementById('ftTagsList');
          const checkedTags = Array.from(document.querySelectorAll('#filterTags input:checked')).map(i => i.value);

          list.innerHTML = tags.map(tag => {
            const isChecked = checkedTags.includes(tag);
            return `<label class="filter-check"><input type="checkbox" value="${tag}" ${isChecked ? 'checked' : ''}><span>${tag}</span></label>`;
          }).join('');
          
          list.querySelectorAll('.filter-check').forEach(el => {
            el.addEventListener('click', () => setTimeout(updateFilterCount, 10));
          });
        };

        const tabBtns = filterTags.querySelectorAll('.ft-tab');
        tabBtns.forEach(tab => {
          tab.addEventListener('click', () => {
            tabBtns.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const groupCode = tab.dataset.group;
            renderTagChips(grouped[groupCode].tags);
          });
        });

        renderTagChips(activeGroups[0][1].tags);
      }

    } catch (e) {
      console.error('Ошибка загрузки тегов:', e);
      filterTags.innerHTML = '<span style="font-size:13px; opacity:0.6; font-style:italic; color: #ff8098;">Ошибка загрузки</span>';
    }
  }
  
  updateFilterCount();
};

document.addEventListener('click', async (e) => {
  if (e.target.closest('#filterCloseBtn')) {
    document.getElementById('modalFilters').style.display = 'none';
    return;
  }

  if (e.target.closest('.filter-section-head')) {
    e.target.closest('.filter-section').classList.toggle('open');
    return;
  }

  if (e.target.closest('#filterApplyBtn')) {
    applyFilters();
    document.getElementById('modalFilters').style.display = 'none';
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

  // Удаление отдельного фильтра по крестику на плашке
  const chipRemove = e.target.closest('.af-chip-remove');
  if (chipRemove) {
    const type = chipRemove.dataset.type;
    const val = chipRemove.dataset.value;
    
    if (type === 'meal') {
      const cb = document.getElementById('filterMeals').querySelector(`input[value="${val}"]`);
      if (cb) cb.checked = false;
    } else if (type === 'time') {
      const cb = document.getElementById('filterTime').querySelector(`input[value="${val}"]`);
      if (cb) cb.checked = false;
    } else if (type === 'tag') {
      const cb = document.getElementById('filterTags').querySelector(`input[value="${val}"]`);
      if (cb) cb.checked = false;
    } else if (type === 'fav') {
      document.getElementById('filterFav').checked = false;
    } else if (type === 'cooked') {
      document.getElementById('filterCooked').checked = false;
    } else if (type === 'pp') {
      document.getElementById('filterPP').checked = false;
    }
    
    applyFilters();
    return;
  }
});

// Ловим изменения на чекбоксах
document.addEventListener('change', (e) => {
  if (e.target.closest('#modalFilters')) {
    updateFilterCount();
  }
});
document.addEventListener('click', (e) => {
  if (e.target.closest('.filter-check')) {
    setTimeout(updateFilterCount, 10);
  }
});

async function getFilteredRecipes() {
  const allRecipes = await Storage.getAllRecipes();
  if (!allRecipes) return [];

  const filterMeals = document.getElementById('filterMeals');
  const filterTime = document.getElementById('filterTime');
  const filterTags = document.getElementById('filterTags');
  const filterFav = document.getElementById('filterFav');
  const filterCooked = document.getElementById('filterCooked');
  const filterPP = document.getElementById('filterPP');

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
    if (checkedMeals.length > 0 && !checkedMeals.includes(r.meal)) return false;
    if (checkedTime && checkedTime !== '999') {
      if ((r.time || 0) > parseInt(checkedTime, 10)) return false;
    }
    if (checkedTags.length > 0) {
      const rTags = (r.tags || []).map(t => t.toLowerCase());
      if (!checkedTags.every(ct => rTags.includes(ct))) return false;
    }
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
  const filterCount = document.getElementById('filterCount');
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
    const visibleCards = section.querySelectorAll('.card:not([style*="display: none"])').length;
    const counter = section.querySelector('.recipes-section-count');
    
    if (counter) counter.textContent = visibleCards;
    
    // Скрываем целую секцию (например, "Завтраки"), если в ней 0 рецептов
    if (visibleCards === 0) {
      section.style.display = 'none';
    } else {
      section.style.display = '';
    }
  });

  updateActiveFiltersBar();
}

function updateActiveFiltersBar() {
  const bar = document.getElementById('activeFiltersBar');
  if (!bar) return;
  
  const chipsContainer = document.getElementById('activeFiltersChips');
  const active = [];
  
  const filterMeals = document.getElementById('filterMeals');
  const filterTime = document.getElementById('filterTime');
  const filterTags = document.getElementById('filterTags');
  const filterFav = document.getElementById('filterFav');
  const filterCooked = document.getElementById('filterCooked');
  const filterPP = document.getElementById('filterPP');

  // Собираем все активные фильтры в массив объектов
  Array.from(filterMeals.querySelectorAll('input:checked')).forEach(m => {
    active.push({ type: 'meal', value: m.value, label: m.parentElement.textContent.trim() });
  });
  
  const time = filterTime.querySelector('input:checked');
  if (time && time.value !== '999') {
    active.push({ type: 'time', value: time.value, label: `до ${time.value} мин` });
  }
  
  Array.from(filterTags.querySelectorAll('input:checked')).forEach(t => {
    active.push({ type: 'tag', value: t.value, label: t.value });
  });
  
  if (filterFav.checked) active.push({ type: 'fav', value: 'true', label: '❤ Избранное' });
  if (filterCooked.checked) active.push({ type: 'cooked', value: 'true', label: '👨‍🍳 Приготовлено' });
  if (filterPP.checked) active.push({ type: 'pp', value: 'true', label: 'ПП' });

  if (active.length > 0) {
    chipsContainer.innerHTML = active.map(f => `
      <span class="af-chip">
        ${f.label} 
        <button type="button" class="af-chip-remove" data-type="${f.type}" data-value="${f.value}">×</button>
      </span>
    `).join('');
    bar.classList.add('visible');
  } else {
    bar.classList.remove('visible');
    chipsContainer.innerHTML = '';
  }
}