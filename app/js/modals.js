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

  // ─── Escape — закрыть все открытые модалки ───
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.modal').forEach(m => {
      if (m.style.display === 'flex') closeModal(m);
    });
  });
});