// ═══════════════════════════════════════════════════
// product-form.js — форма создания / редактирования продукта.
// Подшаг 4.1 — каркас. Поля появятся в 4.2 … 4.4.
// ═══════════════════════════════════════════════════

(function(){

  const modal = document.getElementById('modalProductForm');
  const box   = document.getElementById('modalProductFormBox');
  if (!modal || !box) return;

   let onSavedCb  = null;    // колбэк после сохранения
  let onCloseCb  = null;    // колбэк при ручном закрытии
  let editingId  = null;    // id, если редактируем существующий
  let draft      = null;    // черновик продукта

  // ─── Открыть форму ───
   async function openProductForm(options){
    options = options || {};
    onSavedCb = typeof options.onSaved === 'function' ? options.onSaved : null;
    onCloseCb = typeof options.onClose === 'function' ? options.onClose : null;
    editingId = options.productId || null;

    // Черновик: или загружаем существующий, или пустой
    if (editingId){
      draft = (typeof Storage !== 'undefined' && Storage.getProduct)
        ? await Storage.getProduct(editingId)
        : null;
    } else {
      draft = {
        id: null,
        name: '',
        shortName: '',
        brand: '',
        group: '',
        kcal: null, protein: null, fat: null, carbs: null,
        unit: 'г',
        density: null,
        weightPerPiece: null,
        source: 'own'
      };
    }

    // ─── Подтянуть текущий стиль с body ───
    ['style','palette','theme','shadow'].forEach(key => {
      const attr = 'data-' + key;
      const val = document.body.getAttribute(attr);
      if (val) box.setAttribute(attr, val);
      else     box.removeAttribute(attr);
    });

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    renderForm();
  }

  // ─── Закрыть форму ───
  function closeProductForm(){
    modal.style.display = 'none';
    document.body.style.overflow = '';
    onSavedCb = null;
    editingId = null;
    draft     = null;
    // Если форма была открыта из пикера — вернуться в пикер
    const back = onCloseCb;
    onCloseCb = null;
    if (typeof back === 'function') back();
  }

  // ─── Собрать разметку формы ───
   function renderForm(){
    const title = editingId ? 'Редактировать продукт' : 'Новый продукт';

    // Список групп из готовой базы
    const groups = (typeof PRODUCT_GROUPS !== 'undefined' && Array.isArray(PRODUCT_GROUPS))
      ? PRODUCT_GROUPS.slice().sort((a,b) => (a.order||0) - (b.order||0))
      : [];

    const groupOptions = groups.map(g =>
      `<option value="${g.code}"${draft.group === g.code ? ' selected' : ''}>${escapeHtml(g.name)}</option>`
    ).join('');

    box.innerHTML = `
      <div class="pf-head">
        <span class="pf-title">${title}</span>
        <button type="button" class="pf-close" data-pf-close>✕</button>
      </div>

      <div class="pf-body">
        <div class="pf-field">
          <label class="pf-label">Название <span class="pf-req">*</span></label>
          <input type="text" class="pf-input" data-field="name"
                 value="${escapeHtml(draft.name || '')}"
                 placeholder="Например: Молоко Простоквашино 3.2%">
        </div>

        <div class="pf-field">
          <label class="pf-label">Короткое название</label>
          <input type="text" class="pf-input" data-field="shortName"
                 value="${escapeHtml(draft.shortName || '')}"
                 placeholder="Например: Молоко 3.2%">
        </div>

        <div class="pf-field">
          <label class="pf-label">Марка</label>
          <input type="text" class="pf-input" data-field="brand"
                 value="${escapeHtml(draft.brand || '')}"
                 placeholder="Например: Простоквашино">
        </div>

                <div class="pf-field">
          <label class="pf-label">Группа <span class="pf-req">*</span></label>
          <select class="pf-select" data-field="group">
            <option value="">— выберите группу —</option>
            ${groupOptions}
          </select>
        </div>

        <div class="pf-field">
          <label class="pf-label">КБЖУ на 100 г <span class="pf-req">*</span></label>
          <div class="pf-kbzhu-row">
            <input type="number" step="0.1" min="0" class="pf-input pf-kbzhu" data-field="kcal"
                   value="${draft.kcal ?? ''}" placeholder="ккал">
            <input type="number" step="0.1" min="0" class="pf-input pf-kbzhu" data-field="protein"
                   value="${draft.protein ?? ''}" placeholder="Б">
            <input type="number" step="0.1" min="0" class="pf-input pf-kbzhu" data-field="fat"
                   value="${draft.fat ?? ''}" placeholder="Ж">
            <input type="number" step="0.1" min="0" class="pf-input pf-kbzhu" data-field="carbs"
                   value="${draft.carbs ?? ''}" placeholder="У">
          </div>
        </div>

        <div class="pf-field">
          <label class="pf-label">Единица по умолчанию</label>
          <div class="pf-units">
            <button type="button" class="pf-unit${draft.unit === 'г'  ? ' active' : ''}" data-unit="г">г</button>
            <button type="button" class="pf-unit${draft.unit === 'мл' ? ' active' : ''}" data-unit="мл">мл</button>
            <button type="button" class="pf-unit${draft.unit === 'шт' ? ' active' : ''}" data-unit="шт">шт</button>
          </div>
        </div>

        <div class="pf-conditional" id="pfWeightPiece" style="display:none">
          <div class="pf-field">
            <label class="pf-label">Вес 1 шт, г <span class="pf-req">*</span></label>
            <input type="number" step="0.1" min="0" class="pf-input" data-field="weightPerPiece"
                   value="${draft.weightPerPiece ?? ''}" placeholder="Например: 60">
          </div>
        </div>

        <div class="pf-conditional" id="pfDensity" style="display:none">
          <div class="pf-field">
            <label class="pf-label">Плотность, г/мл</label>
            <input type="number" step="0.01" min="0" class="pf-input" data-field="density"
                   value="${draft.density ?? 1}" placeholder="Например: 1.03">
          </div>
          <label class="pf-checkbox">
            <input type="checkbox" data-field="kbzhuOn100ml">
            <span>У меня КБЖУ на 100 мл (пересчитать на 100 г)</span>
          </label>
        </div>
      </div>

      <div class="pf-error" id="pfError" style="display:none"></div>

      <div class="pf-actions">
        <button type="button" class="pf-btn" data-pf-cancel>Отмена</button>
        <button type="button" class="pf-btn pf-btn-primary" data-pf-save>Сохранить</button>
      </div>
    `;

    bindFormInputs();
    updateSaveState();
  }

  // ─── Обработчики на полях ───
   function bindFormInputs(){
    box.querySelectorAll('[data-field]').forEach(el => {
      const isCheckbox = el.type === 'checkbox';
      const evt = el.tagName === 'SELECT' || isCheckbox ? 'change' : 'input';
      el.addEventListener(evt, () => {
        if (isCheckbox){
          draft[el.dataset.field] = el.checked;
        } else if (el.type === 'number'){
          // Числовые поля: сохраняем как число (или null, если пусто)
          const v = el.value.trim();
          draft[el.dataset.field] = v === '' ? null : parseFloat(v);
        } else {
          draft[el.dataset.field] = el.value;
        }
        el.classList.remove('pf-invalid');
        hideError();
        updateSaveState();
      });
    });

    // Кнопки-единицы
    box.querySelectorAll('.pf-unit').forEach(btn => {
      btn.addEventListener('click', () => {
        draft.unit = btn.dataset.unit;
        box.querySelectorAll('.pf-unit').forEach(b =>
          b.classList.toggle('active', b.dataset.unit === draft.unit)
        );
        updateConditionalFields();
        updateSaveState();
      });
    });

    updateConditionalFields();
  }

  // ─── Показать/скрыть условные поля ───
  function updateConditionalFields(){
    const w = box.querySelector('#pfWeightPiece');
    const d = box.querySelector('#pfDensity');
    if (w) w.style.display = draft.unit === 'шт' ? 'block' : 'none';
    if (d) d.style.display = draft.unit === 'мл' ? 'block' : 'none';
  }

  // ─── Обязательные поля заполнены? ───
    function isFormValid(){
    if (!(draft.name  || '').trim()) return false;
    if (!(draft.group || '').trim()) return false;
    if (draft.kcal    === null || draft.kcal    === undefined) return false;
    if (draft.protein === null || draft.protein === undefined) return false;
    if (draft.fat     === null || draft.fat     === undefined) return false;
    if (draft.carbs   === null || draft.carbs   === undefined) return false;
    if (draft.unit === 'шт' && (draft.weightPerPiece === null || draft.weightPerPiece === undefined)) return false;
    return true;
  }

  // ─── Обновить вид кнопки «Сохранить» ───
  function updateSaveState(){
    const btn = box.querySelector('[data-pf-save]');
    if (!btn) return;
    if (isFormValid()) btn.classList.remove('inactive');
    else               btn.classList.add('inactive');
  }

  // ─── Показать сообщение об ошибке ───
  function showError(text){
    const el = box.querySelector('#pfError');
    if (!el) return;
    el.textContent = text;
    el.style.display = 'block';
  }

  function hideError(){
    const el = box.querySelector('#pfError');
    if (!el) return;
    el.style.display = 'none';
  }

  // ─── Проверка при клике на «Сохранить» ───
 function validateAndReport(){
    const missing = [];
    if (!(draft.name  || '').trim()) missing.push('Название');
    if (!(draft.group || '').trim()) missing.push('Группа');
    if (draft.kcal    === null || draft.kcal    === undefined) missing.push('Ккал');
    if (draft.protein === null || draft.protein === undefined) missing.push('Белки');
    if (draft.fat     === null || draft.fat     === undefined) missing.push('Жиры');
    if (draft.carbs   === null || draft.carbs   === undefined) missing.push('Углеводы');
    if (draft.unit === 'шт' && (draft.weightPerPiece === null || draft.weightPerPiece === undefined))
      missing.push('Вес 1 шт');

    if (!missing.length){
      hideError();
      return true;
    }

    box.querySelectorAll('[data-field]').forEach(el => {
      const f = el.dataset.field;
      el.classList.remove('pf-invalid');
      if (f === 'name'  && !(draft.name  || '').trim()) el.classList.add('pf-invalid');
      if (f === 'group' && !(draft.group || '').trim()) el.classList.add('pf-invalid');
      if (['kcal','protein','fat','carbs'].includes(f) &&
          (draft[f] === null || draft[f] === undefined)) el.classList.add('pf-invalid');
      if (f === 'weightPerPiece' && draft.unit === 'шт' &&
          (draft.weightPerPiece === null || draft.weightPerPiece === undefined)) el.classList.add('pf-invalid');
    });

    showError('Заполните: ' + missing.join(', '));

    const first = box.querySelector('.pf-invalid');
    if (first) first.focus();

    return false;
  }

  // ─── Клики внутри формы ───
  box.addEventListener('click', (e) => {
    if (e.target.closest('[data-pf-close]') || e.target.closest('[data-pf-cancel]')){
      closeProductForm();
      return;
    }
     if (e.target.closest('[data-pf-save]')){
      if (!validateAndReport()) return;
      // Пока — заглушка. В 4.4 здесь будет реальное сохранение.
      if (typeof openSoon === 'function'){
        openSoon('💾 Сохранить', 'Сохранение появится в подшаге 4.4.');
      }
      return;
    }
  });

   // ─── Клик по тёмному фону — закрыть ───
  // Только если и нажатие, и отпускание были на фоне.
  // Иначе выделение текста в поле закроет форму.
  let backdropDown = false;
  modal.addEventListener('mousedown', (e) => {
    backdropDown = (e.target === modal);
  });
  modal.addEventListener('mouseup', (e) => {
    if (backdropDown && e.target === modal) closeProductForm();
    backdropDown = false;
  });

  // ─── Escape ───
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (modal.style.display === 'flex') closeProductForm();
  });

  // ─── Публичное API ───
  window.openProductForm  = openProductForm;
  window.closeProductForm = closeProductForm;

})();