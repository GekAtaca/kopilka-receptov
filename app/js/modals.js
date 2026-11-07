// ═══════════════════════════════════════════════════
// modals.js — модалки плавающих кнопок: ⏲ 🔍 ➕.
// Загружается после screens.js, до fab.js.
// ═══════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', function(){
  const MODAL_MAP = {
    timer:  document.getElementById('modalTimer'),
    search: document.getElementById('modalSearch'),
    add:    document.getElementById('modalAdd')
  };

  function openModal(id){
    const m = MODAL_MAP[id];
    if (!m) return;
    m.style.display = 'flex';
  }

  function closeModal(m){
    m.style.display = 'none';
  }

  // ─── Клик по плавающей кнопке — открыть модалку ───
  document.querySelectorAll('.fab-btn[data-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      openModal(btn.dataset.modal);
    });
  });

  // ─── Клик по фону и по крестику — закрыть ───
  document.querySelectorAll('.modal').forEach(m => {
    m.addEventListener('click', (e) => {
      if (e.target === m) closeModal(m);
    });
    m.querySelectorAll('[data-modal-close]').forEach(x => {
      x.addEventListener('click', () => closeModal(m));
    });
  });

  // ─── Escape — закрыть только верхнюю открытую модалку ───
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    
    const allModals = Array.from(document.querySelectorAll('.modal, .modal-product-picker, .modal-product-form, .modal-product-card, .modal-dup, .modal-recipe'));
    const openModals = allModals.filter(m => m.style.display === 'flex');
    
    if (openModals.length > 0) {
      // Сортируем по z-index (кто выше), чтобы закрыть именно верхнее окно
      openModals.sort((a, b) => {
        const zA = parseInt(window.getComputedStyle(a).zIndex) || 0;
        const zB = parseInt(window.getComputedStyle(b).zIndex) || 0;
        return zB - zA;
      });
      
      openModals[0].style.display = 'none';
      
      // Если закрыли последнее окно, возвращаем скролл странице
      if (openModals.length === 1) {
        document.body.style.overflow = '';
      }
    }
  });
});

  // ─── Обработка кнопки "Добавить продукт" в модалке ➕ ───
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action="create-product"]');
    if (!btn) return;

    // 1. Закрываем окошко Добавить
    const addModal = document.getElementById('modalAdd');
    if (addModal) addModal.style.display = 'none';
    
    // 2. Открываем форму продукта
    if (typeof openProductForm === 'function') {
      openProductForm({
        onSaved: (product) => {
          console.log('Новый продукт создан:', product);
        },
        onClose: () => {
          console.log('Форма продукта закрыта');
        }
      });
    } else {
      console.error('ОШИБКА: Функция openProductForm не найдена! Проверьте, подключен ли product-form.js в index.html');
    }
  });