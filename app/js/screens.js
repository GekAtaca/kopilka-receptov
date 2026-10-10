// ═══════════════════════════════════════════════════
// screens.js — переключение 4 экранов и сворачивание содержания.
// Загружается после design.js, до modals.js.
// ═══════════════════════════════════════════════════

// ─── Свернуть / развернуть содержание ───
document.getElementById('contentsHead').addEventListener('click', () => {
  document.getElementById('contents').classList.toggle('open');
});

document.querySelectorAll('.head-btn').forEach(btn => {
  btn.addEventListener('click', (e) => e.stopPropagation());
});

// ─── Переключение экранов ───
document.addEventListener('DOMContentLoaded', function(){
  const SCREEN_KEY = 'activeScreen';
  const VALID_SCREENS = ['home','favorites','plan','pantry'];

  const navBtns = document.querySelectorAll('.nav-btn');
  const screens = document.querySelectorAll('.screen');

  function showScreen(name){
    if (!VALID_SCREENS.includes(name)) name = 'home';
    screens.forEach(s => {
      s.classList.toggle('active', s.dataset.screen === name);
    });
    navBtns.forEach(b => {
      b.classList.toggle('active', b.dataset.screen === name);
    });
    try { localStorage.setItem(SCREEN_KEY, name); } catch(e) {}
    if (typeof applyDesignFor === 'function') applyDesignFor(name);
  }

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      showScreen(btn.dataset.screen);
      window.scrollTo({ top: 0, behavior: 'auto' });
    });
  });

  // Восстановление при загрузке
  const saved = localStorage.getItem(SCREEN_KEY);
  if (saved && VALID_SCREENS.includes(saved)) {
    showScreen(saved);
  } else {
    if (typeof applyDesignFor === 'function') applyDesignFor('home');
  }
});