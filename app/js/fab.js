// ═══════════════════════════════════════════════════
// fab.js — автоскрытие плавающих кнопок (⏲ 🔍 ➕).
// Загружается после modals.js, до main.js.
// ═══════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', function(){
  const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  const fabStack = document.querySelector('.fab-stack');
  if (!fabStack) return;

  const PC_THRESHOLD = 1730;
  const HIDE_DELAY = 2000;

  let lastY = window.scrollY;
  let hideTimer = null;

  function shouldAutoHide(){
    if (isTouch) return true;
    return window.innerWidth < PC_THRESHOLD;
  }

  function showFab(){ fabStack.classList.remove('fab-hidden'); }
  function hideFab(){ fabStack.classList.add('fab-hidden'); }
  function scheduleHide(){
    clearTimeout(hideTimer);
    hideTimer = setTimeout(hideFab, HIDE_DELAY);
  }
  function cancelHide(){ clearTimeout(hideTimer); }

  window.addEventListener('scroll', () => {
    if (!shouldAutoHide()){
      showFab();
      return;
    }
    const y = window.scrollY;
    if (y > lastY + 4){
      hideFab();
      cancelHide();
    } else if (y < lastY - 4){
      showFab();
      cancelHide();
    }
    lastY = y;

    if (!isTouch && !fabStack.classList.contains('fab-hidden')){
      scheduleHide();
    }
  }, { passive: true });

  document.addEventListener('touchstart', () => {
    if (!shouldAutoHide()) return;
    cancelHide();
  }, { passive: true });

  function handleTouchEnd(e){
    if (!shouldAutoHide()) return;
    if (!e.touches || e.touches.length === 0){
      if (!fabStack.classList.contains('fab-hidden')){
        scheduleHide();
      }
    }
  }
  document.addEventListener('touchend', handleTouchEnd, { passive: true });
  document.addEventListener('touchcancel', handleTouchEnd, { passive: true });

  window.addEventListener('resize', () => {
    if (!shouldAutoHide()){
      showFab();
      cancelHide();
    }
  });

  if (!shouldAutoHide()){
    showFab();
  }
});