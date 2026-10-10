// ═══════════════════════════════════════════════════
// storage.js — единая точка входа в IndexedDB.
// Загружается первым, до shared.js.
// Снаружи работаем только через объект Storage.
// ═══════════════════════════════════════════════════

(function(){

  const DB_NAME = 'kopilka';
  const DB_VERSION = 1;
  const STORES = [
    'recipes','products','pantry','shopping',
    'plan','marks','timers','settings','photos'
  ];

  let db = null;
  let available = false;

  // ─── Открыть базу (создать, если нет) ───
  function openDB(){
    return new Promise((resolve, reject) => {
      if (!window.indexedDB){
        reject(new Error('IndexedDB не поддерживается'));
        return;
      }
      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = (e) => {
        const d = e.target.result;
        STORES.forEach(name => {
          if (!d.objectStoreNames.contains(name)){
            if (name === 'settings'){
              d.createObjectStore(name, { keyPath: 'key' });
            } else {
              d.createObjectStore(name, { keyPath: 'id' });
            }
          }
        });
      };

      req.onsuccess = (e) => resolve(e.target.result);
      req.onerror   = (e) => reject(e.target.error);
    });
  }

  // ─── Взять хранилище в транзакции ───
  function tx(storeName, mode){
    return db.transaction(storeName, mode).objectStore(storeName);
  }

  // ─── Обёртка Promise вокруг IDBRequest ───
  function reqPromise(request){
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror   = () => reject(request.error);
    });
  }

  // ═══════════════════════════════════════════════════
  // Инициализация
  // ═══════════════════════════════════════════════════

  async function init(){
    if (db) return;
    try {
      db = await openDB();
      available = true;
    } catch(e){
      console.warn('[storage] IndexedDB недоступна. Фолбэк на localStorage.', e);
      available = false;
    }
    if (available){
      await migrateFromLocalStorage();
    }
  }

  // ═══════════════════════════════════════════════════
  // Универсальное хранилище настроек
  // ═══════════════════════════════════════════════════

  async function getSetting(key){
    if (!available){
      try { return JSON.parse(localStorage.getItem(key)); }
      catch(e){ return null; }
    }
    const r = await reqPromise(tx('settings','readonly').get(key));
    return r ? r.value : null;
  }

  async function saveSetting(key, value){
    if (!available){
      try { localStorage.setItem(key, JSON.stringify(value)); } catch(e){}
      return;
    }
    await reqPromise(tx('settings','readwrite').put({ key, value }));
  }

  async function deleteSetting(key){
    if (!available){
      try { localStorage.removeItem(key); } catch(e){}
      return;
    }
    await reqPromise(tx('settings','readwrite').delete(key));
  }

  // ═══════════════════════════════════════════════════
  // Миграция из localStorage (один раз)
  // ═══════════════════════════════════════════════════

  async function migrateFromLocalStorage(){
    const done = await getSetting('migratedFromLocalStorage');
    if (done) return;

    // Список ключей, которые переезжают в IndexedDB.
    // Что не JSON.parse (activeScreen, designShadowTab) — сохраняем строкой.
    const RAW_KEYS  = ['activeScreen','designShadowTab'];
    const JSON_KEYS = ['design','bgSettings','designSectionsCollapsed'];

    for (const k of RAW_KEYS){
      try {
        const v = localStorage.getItem(k);
        if (v !== null) await saveSetting(k, v);
      } catch(e){}
    }
    for (const k of JSON_KEYS){
      try {
        const v = localStorage.getItem(k);
        if (v !== null) await saveSetting(k, JSON.parse(v));
      } catch(e){}
    }

    await saveSetting('migratedFromLocalStorage', true);

    // Чистим старые ключи, чтобы не было путаницы
    [...RAW_KEYS, ...JSON_KEYS].forEach(k => {
      try { localStorage.removeItem(k); } catch(e){}
    });
  }

  // ═══════════════════════════════════════════════════
  // Статистика (для «О программе»)
  // ═══════════════════════════════════════════════════

  async function getStats(){
    if (!available) return { recipes: 0, products: 0 };
    const recipes  = await reqPromise(tx('recipes','readonly').count());
    const products = await reqPromise(tx('products','readonly').count());
    return { recipes, products };
  }

  // ═══════════════════════════════════════════════════
  // Заглушки — появятся в следующих слоях
  // ═══════════════════════════════════════════════════

  function stub(name, empty){
    return async function(){
      console.warn('[storage] ' + name + '() пока не реализована');
      return empty;
    };
  }

  // ═══════════════════════════════════════════════════
  // Публичное API
  // ═══════════════════════════════════════════════════

  window.Storage = {
    // ── ядро ──
    init,
    getStats,

    // ── настройки ──
    getSetting,
    saveSetting,
    deleteSetting,

    // ── рецепты ──
    saveRecipe:               stub('saveRecipe'),
    getRecipe:                stub('getRecipe'),
    getAllRecipes:            stub('getAllRecipes', []),
    deleteRecipe:             stub('deleteRecipe'),
    duplicateRecipe:          stub('duplicateRecipe'),
    getRecipesByTag:          stub('getRecipesByTag', []),
    getRecipesByMeal:         stub('getRecipesByMeal', []),
    getRecipesBySource:       stub('getRecipesBySource', []),
    searchRecipes:            stub('searchRecipes', []),
    getRecipesCanCook:        stub('getRecipesCanCook', []),
    deleteRecipesBySource:    stub('deleteRecipesBySource'),

    // ── продукты ──
    saveProduct:              stub('saveProduct'),
    getProduct:               stub('getProduct'),
    getAllProducts:           stub('getAllProducts', []),
    deleteProduct:            stub('deleteProduct'),
    searchProducts:           stub('searchProducts', []),
    getProductsByGroup:       stub('getProductsByGroup', []),
    getProductsByBrand:       stub('getProductsByBrand', []),
    getOverriddenProducts:    stub('getOverriddenProducts', []),
    getUsedProducts:          stub('getUsedProducts', []),

    // ── кладовая / план / корзина ──
    savePantryItem:           stub('savePantryItem'),
    getPantry:                stub('getPantry', []),
    deletePantryItem:         stub('deletePantryItem'),
    savePlanItem:             stub('savePlanItem'),
    getPlan:                  stub('getPlan', []),
    deletePlanItem:           stub('deletePlanItem'),
    getPlanByTab:             stub('getPlanByTab', []),
    clearPlan:                stub('clearPlan'),
    saveShoppingItem:         stub('saveShoppingItem'),
    getShopping:              stub('getShopping', []),
    deleteShoppingItem:       stub('deleteShoppingItem'),
    clearShopping:            stub('clearShopping'),

    // ── отметки ──
    addMark:                  stub('addMark'),
    removeMark:               stub('removeMark'),
    getMarks:                 stub('getMarks', []),
    isMarked:                 stub('isMarked', false),
    getAllMarks:              stub('getAllMarks', {}),
    clearMarks:               stub('clearMarks'),

    // ── таймеры ──
    saveTimer:                stub('saveTimer'),
    getTimers:                stub('getTimers', []),
    updateTimer:              stub('updateTimer'),
    deleteTimer:              stub('deleteTimer'),
    getActiveTimers:          stub('getActiveTimers', []),
    getTimersForRecipe:       stub('getTimersForRecipe', []),

    // ── теги ──
    saveTag:                  stub('saveTag'),
    getAllTags:               stub('getAllTags', []),
    deleteTag:                stub('deleteTag'),

    // ── фото ──
    savePhoto:                stub('savePhoto'),
    getPhoto:                 stub('getPhoto'),
    deletePhoto:              stub('deletePhoto'),

    // ── экспорт / импорт ──
    exportAll:                stub('exportAll'),
    importAll:                stub('importAll'),
    exportRecipes:            stub('exportRecipes'),
    exportProducts:           stub('exportProducts'),
    importRecipes:            stub('importRecipes'),
    importProducts:           stub('importProducts'),
    getLastBackupDate:        stub('getLastBackupDate'),
    setLastBackupDate:        stub('setLastBackupDate'),

    // ── опасное ──
    clearAll:                 stub('clearAll')
  };

})();