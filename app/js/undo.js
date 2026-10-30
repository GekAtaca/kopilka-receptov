// ═══════════════════════════════════════════════════
// undo.js — Глобальный менеджер отмены действий.
// ═══════════════════════════════════════════════════

const UndoManager = (function() {
  const activeToasts = []; // Храним активные таймеры
  const MAX_TOASTS = 3;    // Максимум 3 плашки на экране
  const TIMEOUT_MS = 15000; // 15 секунд

  function createToast(message, onUndo, onConfirm) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    // Если плашек слишком много — самую старую принудительно подтверждаем
    if (activeToasts.length >= MAX_TOASTS) {
      const oldest = activeToasts.shift();
      oldest.confirm();
    }

    const toast = document.createElement('div');
    toast.className = 'toast toast-undo';
    // ═══ Уничтожаем любые CSS-анимации, которые могут скрыть плашку раньше времени ═══
    toast.style.animation = 'none'; 
    
    // Текст и кнопка
    toast.innerHTML = `
      <span class="toast-msg">${message}</span>
      <button type="button" class="toast-undo-btn">Отменить</button>
    `;

    let isCancelled = false;
    let isHovered = false;
    let timeLeft = TIMEOUT_MS;
    let startTime = Date.now();
    let timerId = null;
    let id = Date.now() + Math.random();
    
    // Функция закрытия плашки
    const closeToast = () => {
      if (isCancelled) return;
      isCancelled = true;
      if (timerId) clearTimeout(timerId);
      toast.style.opacity = '0'; // Плавно скрываем
      toast.style.transform = 'translateY(20px)';
      setTimeout(() => {
        toast.remove();
        const idx = activeToasts.findIndex(t => t.id === id);
        if (idx !== -1) activeToasts.splice(idx, 1);
      }, 300);
    };

    // Функции для менеджера
    const confirmAction = () => {
      closeToast();
      if (onConfirm) onConfirm();
    };

    const undoAction = () => {
      closeToast();
      if (onUndo) onUndo();
    };

    // Вешаем обработчик на кнопку "Отменить"
    toast.querySelector('.toast-undo-btn').addEventListener('click', undoAction);

    // Запуск и управление таймером
    const startTimer = () => {
      startTime = Date.now();
      timerId = setTimeout(confirmAction, timeLeft);
    };

    // Универсальная функция паузы (работает и для мыши, и для пальца)
    const pauseTimer = () => {
      if (isCancelled || isHovered) return;
      isHovered = true;
      clearTimeout(timerId);
      timeLeft -= (Date.now() - startTime);
      if (timeLeft < 0) timeLeft = 0;
    };

    // Универсальная функция возобновления
    const resumeTimer = () => {
      if (isCancelled || !isHovered) return;
      isHovered = false;
      startTimer();
    };

    // Для ПК (мышь)
    toast.addEventListener('mouseenter', pauseTimer);
    toast.addEventListener('mouseleave', resumeTimer);
    
    // Для телефонов (палец)
    toast.addEventListener('touchstart', pauseTimer, { passive: true });
    toast.addEventListener('touchend', resumeTimer, { passive: true });
    toast.addEventListener('touchcancel', resumeTimer, { passive: true });

    // Добавляем в контейнер
    container.appendChild(toast);
    
    // Запускаем таймер при создании
    startTimer();

    // Сохраняем в активные
    activeToasts.push({
      id: id,
      confirm: confirmAction,
      undo: undoAction
    });
  }

  return {
    add: function({ message, onUndo, onConfirm }) {
      createToast(message, onUndo, onConfirm);
    }
  };
})();