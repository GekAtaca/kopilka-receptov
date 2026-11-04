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

  // 2б. Если база пустая — залить 9 демо-рецептов (один раз, флаг demoSeeded)
  await Storage.seedDemoRecipes();

   // 3. Загрузить данные из IndexedDB в переменные в памяти
  await loadDesignFromStorage();
  await loadSharedFromStorage();
  const savedScreen = await Storage.getSetting('activeScreen');

   // 4. Запустить интерфейс
  initScreens(savedScreen);

  // 5. Отрисовать все рецепты на Главной (читает из IndexedDB)
  await renderAllRecipes();
}

if (document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

// ═══ Логика кнопки «Случайный рецепт» 🎲 ═══
const btnRandomRecipe = document.getElementById('btnRandomRecipe');

if (btnRandomRecipe) {
  btnRandomRecipe.addEventListener('click', async () => {
    console.log('--- Кубик нажат! ---'); // Проверка, что клик сработал
    
    try {
      const recipes = await Storage.getAllRecipes();
      console.log('Загружено рецептов из базы:', recipes.length); // Проверка, что база отвечает

      if (!recipes || recipes.length === 0) {
        if (typeof showToastMsg === 'function') {
          showToastMsg('В копилке пока нет рецептов');
        } else {
          alert('В копилке пока нет рецептов');
        }
        return;
      }

      const randomIndex = Math.floor(Math.random() * recipes.length);
      const randomRecipe = recipes[randomIndex];
      console.log('Выбран рецепт:', randomRecipe.name); // Проверка, какой рецепт выпал

      if (typeof openRecipeCard === 'function') {
        openRecipeCard(randomRecipe.id);
      } else {
        console.error('ОШИБКА: функция openRecipeCard не найдена!');
      }
    } catch (err) {
      console.error('ОШИБКА при работе кубика:', err);
    }
  });
} else {
  console.warn('ОШИБКА: Кнопка с id="btnRandomRecipe" не найдена в HTML!');
}