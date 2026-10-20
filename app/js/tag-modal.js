// ═══════════════════════════════════════════════════
// tag-modal.js — модалка выбора тегов для рецепта.
// ═══════════════════════════════════════════════════

const modalTag = document.getElementById('modalTag');
const mtBody   = document.getElementById('mtBody');

let mtSelected = []; 
let mtOnSave   = null;
let mtAllTags  = [];
let mtSearchQuery = '';

const TAG_GROUPS = [
  { code: 'vkus', name: 'Вкус' },
  { code: 'nastroenie', name: 'Настроение' },
  { code: 'dieta', name: 'Диета' },
  { code: 'sposob', name: 'Способ готовки' },
  { code: 'slozhnost', name: 'Сложность' },
  { code: 'povod', name: 'Повод' },
  { code: 'sezon', name: 'Сезон' },
  { code: 'kuhnya', name: 'Кухня' },
  { code: 'tekstura', name: 'Текстура' },
  { code: 'temperatura', name: 'Температура' },
  { code: 'portsiya', name: 'Порция' },
  { code: 'komu', name: 'Кому' },
  { code: 'vremya', name: 'Время суток' },
  { code: 'stil', name: 'Стиль питания' },
  { code: 'poleznost', name: 'Полезность' },
  { code: 'osobennost', name: 'Особенность' }
];

async function openTagModal(selectedTags, onSave) {
  if (!modalTag) {
    alert('Ошибка: HTML модалки тегов не найден в index.html!');
    return;
  }
  
  mtSelected = Array.isArray(selectedTags) ? [...selectedTags] : [];
  mtOnSave = onSave;
  mtSearchQuery = '';
  
  const box = modalTag.querySelector('.modal-tag-box');
  if (box) {
    ['style','palette','theme','shadow'].forEach(key => {
      const attr = 'data-' + key;
      const val = document.body.getAttribute(attr);
      if (val) box.setAttribute(attr, val);
      else     box.removeAttribute(attr);
    });
  }

  await mtLoadTags();
  mtRender();
  
  modalTag.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeTagModal() {
  if (!modalTag) return;
  modalTag.style.display = 'none';
  document.body.style.overflow = '';
  mtOnSave = null;
}

async function mtLoadTags() {
  if (typeof Storage !== 'undefined' && Storage.getAllTagsMerged) {
    mtAllTags = await Storage.getAllTagsMerged();
  } else {
    mtAllTags = typeof BASE_TAGS !== 'undefined' ? BASE_TAGS : [];
  }
}

function mtRender() {
  if (!mtBody) return;

  const selectedHtml = mtSelected.map(t => `
    <span class="mt-chip" data-tag="${t}">
      ${t} <button type="button" data-action="del-tag" data-tag="${t}">×</button>
    </span>
  `).join('');

  const q = mtSearchQuery.trim().toLowerCase();
  let groupsHtml = '';
  
  if (q) {
    const filtered = mtAllTags.filter(t => t.name.toLowerCase().includes(q));
    if (filtered.length) {
      groupsHtml = `<div class="mt-group"><div class="mt-group-body">${filtered.map(t => mtBuildTagRow(t.name)).join('')}</div></div>`;
    }
    const exactMatch = mtAllTags.some(t => t.name.toLowerCase() === q);
    if (!exactMatch) {
      groupsHtml += `
        <div class="mt-create-wrap">
          <button type="button" class="mt-create-btn" data-action="create-tag">+ Создать тег "${mtSearchQuery.trim()}"</button>
        </div>
      `;
    }
  } else {
    TAG_GROUPS.forEach(g => {
      const tagsInGroup = mtAllTags.filter(t => t.group === g.code);
      if (!tagsInGroup.length) return;
      
      const rows = tagsInGroup.map(t => mtBuildTagRow(t.name)).join('');
      groupsHtml += `
        <div class="mt-group">
          <div class="mt-group-head" data-action="toggle-group">
            <span>${g.name}</span>
            <span class="mt-arrow">▼</span>
          </div>
          <div class="mt-group-body">${rows}</div>
        </div>
      `;
    });
  }

  mtBody.innerHTML = `
    <div class="mt-selected-wrap">
      <div class="mt-selected-list">${selectedHtml || '<span class="mt-empty">Теги не выбраны</span>'}</div>
    </div>
    <div class="mt-search-row">
      <input type="text" class="mt-search" placeholder="Поиск тега..." value="${mtSearchQuery}">
    </div>
    <div class="mt-list">${groupsHtml}</div>
  `;

  const searchInput = mtBody.querySelector('.mt-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      mtSearchQuery = e.target.value;
      mtRenderListOnly();
    });
  }
}

function mtRenderListOnly() {
  const q = mtSearchQuery.trim().toLowerCase();
  const listEl = mtBody.querySelector('.mt-list');
  if (!listEl) return;

  let groupsHtml = '';
  if (q) {
    const filtered = mtAllTags.filter(t => t.name.toLowerCase().includes(q));
    if (filtered.length) {
      groupsHtml = `<div class="mt-group"><div class="mt-group-body">${filtered.map(t => mtBuildTagRow(t.name)).join('')}</div></div>`;
    }
    const exactMatch = mtAllTags.some(t => t.name.toLowerCase() === q);
    if (!exactMatch) {
      groupsHtml += `
        <div class="mt-create-wrap">
          <button type="button" class="mt-create-btn" data-action="create-tag">+ Создать тег "${mtSearchQuery.trim()}"</button>
        </div>
      `;
    }
  } else {
    TAG_GROUPS.forEach(g => {
      const tagsInGroup = mtAllTags.filter(t => t.group === g.code);
      if (!tagsInGroup.length) return;
      const rows = tagsInGroup.map(t => mtBuildTagRow(t.name)).join('');
      groupsHtml += `
        <div class="mt-group">
          <div class="mt-group-head" data-action="toggle-group">
            <span>${g.name}</span>
            <span class="mt-arrow">▼</span>
          </div>
          <div class="mt-group-body">${rows}</div>
        </div>
      `;
    });
  }
  listEl.innerHTML = groupsHtml;
}

function mtBuildTagRow(name) {
  const isSelected = mtSelected.includes(name);
  return `
    <label class="mt-row">
      <input type="checkbox" data-action="toggle-tag" value="${name}" ${isSelected ? 'checked' : ''}>
      <span>${name}</span>
    </label>
  `;
}

if (modalTag) {
  modalTag.addEventListener('click', async (e) => {
    if (e.target.closest('[data-action="del-tag"]')) {
      const tag = e.target.closest('[data-action="del-tag"]').dataset.tag;
      mtSelected = mtSelected.filter(t => t !== tag);
      mtRender();
      return;
    }

    if (e.target.closest('[data-action="toggle-group"]')) {
      const group = e.target.closest('.mt-group');
      group.classList.toggle('collapsed');
      return;
    }

    if (e.target.closest('[data-action="create-tag"]')) {
      const newTagName = mtSearchQuery.trim();
      const res = await window.prompt("Выберите группу для тега (1-16):\n" + TAG_GROUPS.map((g,i) => `${i+1}. ${g.name}`).join('\n'));
      if (res === null) return;
      
      let selectedGroup = 'vkus';
      const idx = parseInt(res, 10) - 1;
      if (TAG_GROUPS[idx]) selectedGroup = TAG_GROUPS[idx].code;
      
      if (typeof Storage !== 'undefined' && Storage.saveTag) {
        await Storage.saveTag({ name: newTagName, group: selectedGroup });
        await mtLoadTags();
        if (!mtSelected.includes(newTagName)) mtSelected.push(newTagName);
        mtSearchQuery = '';
        mtRender();
      }
      return;
    }

    if (e.target.closest('[data-action="close"]')) {
      closeTagModal();
      return;
    }

    if (e.target.closest('[data-action="save"]')) {
      if (mtOnSave) mtOnSave(mtSelected);
      closeTagModal();
      return;
    }
  });

  modalTag.addEventListener('change', (e) => {
    if (e.target.dataset.action === 'toggle-tag') {
      const tag = e.target.value;
      if (e.target.checked) {
        if (!mtSelected.includes(tag)) mtSelected.push(tag);
      } else {
        mtSelected = mtSelected.filter(t => t !== tag);
      }
      const selectedList = mtBody.querySelector('.mt-selected-list');
      if (selectedList) {
        selectedList.innerHTML = mtSelected.map(t => `
          <span class="mt-chip" data-tag="${t}">
            ${t} <button type="button" data-action="del-tag" data-tag="${t}">×</button>
          </span>
        `).join('') || '<span class="mt-empty">Теги не выбраны</span>';
      }
    }
  });
}

window.openTagModal = openTagModal;