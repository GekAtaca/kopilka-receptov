// ═══════════════════════════════════════════════════
// tag-modal.js — модалка выбора тегов для рецепта.
// ═══════════════════════════════════════════════════

const modalTag = document.getElementById('modalTag');
const mtBody   = document.getElementById('mtBody');
const modalTagManage = document.getElementById('modalTagManage');
const tmgList  = document.getElementById('tmgList');
// ═══ КАСТОМНЫЕ ОКНА ═══
function mtCustomConfirm(text, onConfirm) {
  const overlay = document.createElement('div');
  overlay.className = 'mt-dialog-overlay';
  overlay.innerHTML = `
    <div class="mt-dialog">
      <div class="mt-dialog-text">${text}</div>
      <div class="mt-dialog-actions">
        <button class="mt-dialog-btn" id="mtDlgCancel">Отмена</button>
        <button class="mt-dialog-btn primary" id="mtDlgOk">ОК</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('#mtDlgCancel').onclick = () => overlay.remove();
  overlay.querySelector('#mtDlgOk').onclick = () => { onConfirm(); overlay.remove(); };
}

function mtCustomPromptGroup(title, groups, onConfirm) {
  const options = groups.map(g => {
    const name = typeof g === 'string' ? g : g.name;
    const code = typeof g === 'string' ? g : g.code;
    return `<option value="${code}">${name}</option>`;
  }).join('');
  const overlay = document.createElement('div');
  overlay.className = 'mt-dialog-overlay';
  overlay.innerHTML = `
    <div class="mt-dialog">
      <div class="mt-dialog-title">${title}</div>
      <select class="mt-dialog-input" id="mtDlgSelect">${options}</select>
      <div class="mt-dialog-actions">
        <button class="mt-dialog-btn" id="mtDlgCancel">Отмена</button>
        <button class="mt-dialog-btn primary" id="mtDlgOk">Создать</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('#mtDlgCancel').onclick = () => overlay.remove();
  overlay.querySelector('#mtDlgOk').onclick = () => {
    onConfirm(overlay.querySelector('#mtDlgSelect').value);
    overlay.remove();
  };
}

let mtSelected = []; 
let mtOnSave   = null;
let mtAllTags  = [];
let mtGroups   = []; 
let mtSearchQuery = '';

const DEFAULT_GROUPS = [
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

async function openTagModal(selectedTags, onSave) {
  if (!modalTag) return;
  
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

  const head = modalTag.querySelector('.mt-head');
  if (head && !head.querySelector('.mt-gear-btn')) {
    const gear = document.createElement('button');
    gear.className = 'mt-gear-btn';
    gear.innerHTML = '⚙';
    gear.title = 'Управление категориями';
    head.insertBefore(gear, head.querySelector('.mt-close'));
    gear.addEventListener('click', openTagManageModal);
  }

  await mtLoadData();
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

async function mtLoadData() {
  let savedGroups = await Storage.getSetting('customTagGroups');
  if (!savedGroups || !savedGroups.length) {
    savedGroups = DEFAULT_GROUPS;
    await Storage.saveSetting('customTagGroups', savedGroups);
  }
  mtGroups = savedGroups;

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

  mtBody.innerHTML = `
    <div class="mt-selected-wrap">
      <div class="mt-selected-list">${selectedHtml || '<span class="mt-empty">Теги не выбраны</span>'}</div>
    </div>
    <div class="mt-search-row">
      <input type="text" class="mt-search" placeholder="Поиск тега..." value="${mtSearchQuery}">
    </div>
    <div class="mt-list" id="mtListArea"></div>
  `;

  const searchInput = mtBody.querySelector('.mt-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      mtSearchQuery = e.target.value;
      mtRenderListOnly();
    });
  }

  mtRenderListOnly();
}

// 100% защищенная функция получения имени и группы
function getTagName(t) {
  if (!t) return '';
  if (typeof t === 'string') return t;
  return t.name || t.text || t.title || '';
}

function getTagGroup(t) {
  if (!t) return 'misc';
  if (typeof t === 'string') return 'misc';
  return t.group || t.category || 'misc';
}

function mtRenderListOnly() {
  const listEl = document.getElementById('mtListArea');
  if (!listEl) return;

  const q = mtSearchQuery.trim().toLowerCase();
  let groupsHtml = '';

  if (q) {
    const filtered = mtAllTags.filter(t => getTagName(t).toLowerCase().includes(q));
    if (filtered.length) {
      groupsHtml = `<div class="mt-group"><div class="mt-group-body">${filtered.map(t => mtBuildTagRow(t)).join('')}</div></div>`;
    }
    const exactMatch = mtAllTags.some(t => getTagName(t).toLowerCase() === q);
    if (!exactMatch) {
      groupsHtml += `
        <div class="mt-create-wrap">
          <button type="button" class="mt-create-btn" data-action="create-tag">+ Создать тег "${mtSearchQuery.trim()}"</button>
        </div>
      `;
    }
  } else {
    mtGroups.forEach(g => {
      // Поддерживаем и строки, и объекты для групп
      const groupCode = typeof g === 'string' ? g : (g.code || g.name || 'misc');
      const groupName = typeof g === 'string' ? g : (g.name || g.code || 'Разное');
      
      const tagsInGroup = mtAllTags.filter(t => getTagGroup(t) === groupCode);
      
      // if (!tagsInGroup.length) return;
      
      const rows = tagsInGroup.length 
  ? tagsInGroup.map(t => mtBuildTagRow(t)).join('')
  : `<div style="padding: 10px 14px; font-family: 'Nunito', sans-serif; font-size: 13px; opacity: 0.5; font-style: italic;">В этой категории пока нет тегов</div>`;
      groupsHtml += `
        <div class="mt-group">
          <div class="mt-group-head" data-action="toggle-group">
            <span>${groupName}</span>
            <span class="mt-arrow">▼</span>
          </div>
          <div class="mt-group-body">${rows}</div>
        </div>
      `;
    });
  }

  listEl.innerHTML = groupsHtml;
  mtInitSwipes();
}

function mtBuildTagRow(tag) {
  const tagName = getTagName(tag);
  const tagId = typeof tag === 'string' ? tag : (tag.id || tagName);
  const tagSource = typeof tag === 'string' ? 'own' : (tag.source || 'base');
  
  const isSelected = mtSelected.includes(tagName);
  const isOwn = tagSource === 'own' || String(tagId).startsWith('tag-');
  
  return `
    <div class="mt-swipe-wrap" data-id="${tagId}">
      <div class="mt-row-content">
        <input type="checkbox" data-action="toggle-tag" value="${tagName}" ${isSelected ? 'checked' : ''}>
        <span>${tagName}</span>
        ${isOwn ? `<button class="mt-del-btn-pc" data-action="delete-tag" data-id="${tagId}">🗑</button>` : ''}
      </div>
      ${isOwn ? `<button class="mt-delete-action" data-action="delete-tag" data-id="${tagId}">Удалить</button>` : ''}
    </div>
  `;
}

function mtInitSwipes() {
  const wrappers = mtBody.querySelectorAll('.mt-swipe-wrap');
  
  wrappers.forEach(wrap => {
    const content = wrap.querySelector('.mt-row-content');
    if (!wrap.querySelector('.mt-delete-action')) return;

    let startX = 0;
    let currentX = 0;
    let isSwiping = false;

    content.addEventListener('touchstart', (e) => {
      mtBody.querySelectorAll('.mt-row-content.swiped').forEach(el => {
        if (el !== content) el.classList.remove('swiped');
      });
      startX = e.touches[0].clientX;
      currentX = startX;
      isSwiping = false;
      content.style.transition = 'none';
    }, { passive: true });

    content.addEventListener('touchmove', (e) => {
      currentX = e.touches[0].clientX;
      let diff = currentX - startX;
      if (Math.abs(diff) > 10) isSwiping = true;

      if (diff < 0) {
        let move = Math.max(diff, -80);
        content.style.transform = `translateX(${move}px)`;
      } else if (content.classList.contains('swiped')) {
        let move = Math.min(diff - 80, 0);
        content.style.transform = `translateX(${move}px)`;
      }
    }, { passive: true });

    content.addEventListener('touchend', () => {
      content.style.transition = 'transform 0.2s ease-out';
      content.style.transform = '';
      
      let diff = currentX - startX;
      if (!content.classList.contains('swiped') && diff < -40) {
        content.classList.add('swiped');
      } else if (content.classList.contains('swiped') && diff > 40) {
        content.classList.remove('swiped');
      }
      setTimeout(() => { isSwiping = false; }, 50);
    });
    
    content.addEventListener('click', (e) => {
      if (isSwiping) { e.preventDefault(); return; }
      if (content.classList.contains('swiped')) {
        e.preventDefault();
        content.classList.remove('swiped');
        return;
      }
      if (e.target.closest('[data-action="delete-tag"]')) return;
      
      const checkbox = content.querySelector('input[type="checkbox"]');
      if (e.target !== checkbox) {
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  });
}

// ═══ УПРАВЛЕНИЕ КАТЕГОРИЯМИ ═══
function openTagManageModal() {
  modalTagManage.style.display = 'flex';
  document.getElementById('tmgNewName').value = '';
  renderManageList();
}

function closeTagManageModal() {
  modalTagManage.style.display = 'none';
}

function renderManageList() {
  tmgList.innerHTML = mtGroups.map(g => {
    const groupCode = typeof g === 'string' ? g : g.code;
    const groupName = typeof g === 'string' ? g : g.name;
    return `
      <div class="tmg-item">
        <span>${groupName}</span>
        ${groupCode !== 'misc' ? `<button class="tmg-del-btn" data-del-group="${groupCode}">🗑</button>` : ''}
      </div>
    `;
  }).join('');
}

if (modalTagManage) {
  document.getElementById('tagManageClose').addEventListener('click', closeTagManageModal);
  modalTagManage.addEventListener('click', (e) => {
    if (e.target === modalTagManage) closeTagManageModal();
  });

  document.getElementById('tmgCreateBtn').addEventListener('click', async () => {
    const input = document.getElementById('tmgNewName');
    const name = input.value.trim();
    if (!name) return;
    
    const newGroup = { code: 'g_' + Date.now(), name: name };
    // Ищем, где находится "Разное" (misc)
const miscIndex = mtGroups.findIndex(g => (typeof g === 'string' ? g : g.code) === 'misc');
if (miscIndex !== -1) {
  // Вставляем перед "Разным"
  mtGroups.splice(miscIndex, 0, newGroup);
} else {
  // Если "Разного" почему-то нет, кидаем в конец
  mtGroups.push(newGroup);
}
    await Storage.saveSetting('customTagGroups', mtGroups);
    
    input.value = '';
    renderManageList();
    mtRender();
  });

  tmgList.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-del-group]');
    if (!btn) return;
    const code = btn.dataset.delGroup;
    
    mtCustomConfirm('При удалении категории её теги переедут в "Разное". Продолжить?', async () => {
      mtGroups = mtGroups.filter(g => (typeof g === 'string' ? g : g.code) !== code);
      await Storage.saveSetting('customTagGroups', mtGroups);
      
      if (Storage.getAllTags) {
        const ownTags = await Storage.getAllTags();
        for (let tag of ownTags) {
          if (tag.group === code) {
            tag.group = 'misc';
            await Storage.saveTag(tag);
          }
        }
      }
      
      await mtLoadData();
      renderManageList();
      mtRender();
    });
  });
}

// ═══ ОБРАБОТЧИКИ ТЕГОВ ═══
if (modalTag) {
  modalTag.addEventListener('click', async (e) => {
    if (e.target.closest('[data-action="del-tag"]')) {
      const tag = e.target.closest('[data-action="del-tag"]').dataset.tag;
      mtSelected = mtSelected.filter(t => t !== tag);
      mtRender();
      return;
    }
    if (e.target.closest('[data-action="delete-tag"]')) {
      const id = e.target.closest('[data-action="delete-tag"]').dataset.id;
      mtCustomConfirm('Удалить этот тег навсегда?', async () => {
        await Storage.deleteTag(id);
        await mtLoadData();
        const deletedTag = mtAllTags.find(t => (typeof t === 'string' ? t : t.id) === id);
        if (deletedTag) {
          const dName = getTagName(deletedTag);
          mtSelected = mtSelected.filter(t => t !== dName);
        }
        mtRender();
      });
      return;
    }
    if (e.target.closest('[data-action="toggle-group"]')) {
      const group = e.target.closest('.mt-group');
      group.classList.toggle('collapsed');
      return;
    }
    if (e.target.closest('[data-action="create-tag"]')) {
      const newTagName = mtSearchQuery.trim();
      mtCustomPromptGroup(`В какую группу добавить "${newTagName}"?`, mtGroups, async (selectedGroup) => {
        if (Storage.saveTag) {
          await Storage.saveTag({ name: newTagName, group: selectedGroup });
          await mtLoadData();
          if (!mtSelected.includes(newTagName)) mtSelected.push(newTagName);
          mtSearchQuery = '';
          mtRender();
        }
      });
      return;
    }
    if (e.target.closest('[data-action="close"]')) { closeTagModal(); return; }
    if (e.target === modalTag) { closeTagModal(); return; }
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
// ═══ ЗАКРЫТИЕ ПО ESCAPE ═══
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    // Если открыто управление категориями — закрываем сначала его
    if (modalTagManage && modalTagManage.style.display === 'flex') {
      closeTagManageModal();
    } 
    // Иначе, если открыта модалка тегов — закрываем её
    else if (modalTag && modalTag.style.display === 'flex') {
      closeTagModal();
    }
  }
});

window.openTagModal = openTagModal;