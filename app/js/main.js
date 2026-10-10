// ═══════════════════════════════════════════════════
// main.js — запуск сайта.
// Загружается последним. Порядок:
//   1. Инициализировать IndexedDB
//   2. Загрузить оформление и фон из IndexedDB
//   3. Запустить переключение экранов
//   4. Скрыть заставку
// ═══════════════════════════════════════════════════

async function boot(){
  // 1. Скрыть заставку через 1.2 секунды — независимо от того, что будет дальше.
  //    Если что-то упадёт — заставка всё равно уйдёт, и будет видно ошибку.
  setTimeout(() => {
    const l = document.getElementById('loader');
    if (l) l.classList.add('hide');
  }, 1200);

  // 2. Открыть базу, создать таблицы, мигрировать из localStorage (один раз)
  await Storage.init();

   // 3. Загрузить данные из IndexedDB в переменные в памяти
  await loadDesignFromStorage();
  await loadSharedFromStorage();
  const savedScreen = await Storage.getSetting('activeScreen');

  // 4. Запустить интерфейс
  initScreens(savedScreen);
}

if (document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}