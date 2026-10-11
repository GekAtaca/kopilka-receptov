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

  // ═══════════════════════════════════════════════════
  // Демо-рецепты — 9 штук.
  // Заливаются в IndexedDB один раз при первом запуске.
  // ═══════════════════════════════════════════════════
  const demoRecipesOLD = [
    {
      id: "recipe-001", name: "Овсянка с ягодами", meal: "breakfast",
      source: "Мои", complexity: null, photos: [],
      tags: ["сладкое","быстро","ПП","с ягодами"],
      note: "Брать молоко 3.2%, не 2.5% — с ним вкуснее.",
      ingredients: [
        { productId: null, name: "Овсянка", amount: 60, unit: "г" },
        { productId: null, name: "Молоко 3.2%", amount: 200, unit: "мл" },
        { productId: null, name: "Ягоды", amount: 50, unit: "г" },
        { productId: null, name: "Мёд", amount: 1, unit: "ч. л." },
        { productId: null, name: "Банан", amount: 0.5, unit: "шт." }
      ],
      portions: 1, time: 10,
      steps: [
        "Вскипятить молоко в кастрюле.",
        "Всыпать овсянку, варить 5 минут, помешивая.",
        "Переложить в миску, добавить мёд.",
        "Сверху выложить ягоды и нарезанный банан."
      ],
      device: "Сковорода",
      kbzhuSnapshot: { kcal: 292, protein: 10.9, fat: 13.2, carbs: 31.2 },
      versions: [], currentVersion: 1,
      createdAt: 1758000000000, updatedAt: 1758000000000
    },
    {
      id: "recipe-002", name: "Сырники со сгущёнкой", meal: "breakfast",
      source: "Мои", complexity: null, photos: [],
      tags: ["сладкое","творожное","утро"], note: "",
      ingredients: [
        { productId: null, name: "Творог 5%", amount: 200, unit: "г" },
        { productId: null, name: "Яйцо", amount: 1, unit: "шт." },
        { productId: null, name: "Мука", amount: 2, unit: "ст. л." }
      ],
      portions: 1, time: 25,
      steps: [
        "Творог растереть с яйцом до однородности.",
        "Добавить муку, замесить мягкое тесто.",
        "Сформировать сырники мокрыми руками.",
        "Обжарить на разогретой сковороде по 3 минуты с каждой стороны.",
        "Подать со сгущёнкой."
      ],
      device: "Сковорода",
      kbzhuSnapshot: { kcal: 340, protein: 18, fat: 12, carbs: 42 },
      versions: [], currentVersion: 1,
      createdAt: 1758000000000, updatedAt: 1758000000000
    },
    {
      id: "recipe-003", name: "Омлет с овощами", meal: "breakfast",
      source: "Мои", complexity: null, photos: [],
      tags: ["быстро","белковое","ПП"], note: "",
      ingredients: [
        { productId: null, name: "Яйца", amount: 3, unit: "шт." },
        { productId: null, name: "Помидор", amount: 1, unit: "шт." },
        { productId: null, name: "Перец", amount: 0.5, unit: "шт." }
      ],
      portions: 1, time: 10,
      steps: [
        "Взбить яйца с щепоткой соли.",
        "Помидор и перец нарезать кубиками.",
        "Обжарить овощи на сковороде 2 минуты.",
        "Залить яйцами, накрыть крышкой, готовить 5 минут на слабом огне."
      ],
      device: null,
      kbzhuSnapshot: { kcal: 210, protein: 15, fat: 14, carbs: 5 },
      versions: [], currentVersion: 1,
      createdAt: 1758000000000, updatedAt: 1758000000000
    },
    {
      id: "recipe-004", name: "Паста с курицей", meal: "lunch",
      source: "Мои", complexity: null, photos: [],
      tags: ["сытное","итальянское","для семьи"],
      note: "Курицу сначала обжарить до золотистой.",
      ingredients: [
        { productId: null, name: "Паста", amount: 200, unit: "г" },
        { productId: null, name: "Куриное филе", amount: 300, unit: "г" },
        { productId: null, name: "Сливки 20%", amount: 150, unit: "мл" },
        { productId: null, name: "Пармезан", amount: 30, unit: "г" }
      ],
      portions: 2, time: 30,
      steps: [
        "Отварить пасту до аль денте.",
        "Куриное филе нарезать, обжарить до золотистой корочки.",
        "Влить сливки, тушить 5 минут.",
        "Соединить с пастой, посыпать тёртым пармезаном."
      ],
      device: "Сковорода",
      kbzhuSnapshot: { kcal: 480, protein: 32, fat: 14, carbs: 55 },
      versions: [], currentVersion: 1,
      createdAt: 1758000000000, updatedAt: 1758000000000
    },
    {
      id: "recipe-005", name: "Суп-пюре из тыквы", meal: "lunch",
      source: "Мои", complexity: null, photos: [],
      tags: ["согревающее","осеннее","ПП"], note: "",
      ingredients: [
        { productId: null, name: "Тыква", amount: 600, unit: "г" },
        { productId: null, name: "Лук", amount: 1, unit: "шт." },
        { productId: null, name: "Сливки", amount: 100, unit: "мл" }
      ],
      portions: 3, time: 40,
      steps: [
        "Тыкву нарезать кубиками, лук — полукольцами.",
        "Обжарить лук до прозрачности.",
        "Добавить тыкву, залить водой, варить 20 минут.",
        "Пюрировать блендером.",
        "Влить сливки, довести до кипения, посолить."
      ],
      device: null,
      kbzhuSnapshot: { kcal: 160, protein: 4, fat: 8, carbs: 18 },
      versions: [], currentVersion: 1,
      createdAt: 1758000000000, updatedAt: 1758000000000
    },
    {
      id: "recipe-006", name: "Запечённая рыба с овощами", meal: "dinner",
      source: "Мои", complexity: null, photos: [],
      tags: ["лёгкое","ПП","белковое"],
      note: "Запекать 20 мин при 180°C, потом 5 мин под грилем.",
      ingredients: [
        { productId: null, name: "Филе рыбы", amount: 400, unit: "г" },
        { productId: null, name: "Кабачок", amount: 1, unit: "шт." },
        { productId: null, name: "Перец болгарский", amount: 1, unit: "шт." },
        { productId: null, name: "Лимон", amount: 0.5, unit: "шт." }
      ],
      portions: 2, time: 35,
      steps: [
        "Разогреть духовку до 180°C.",
        "Рыбу нарезать порционно, посолить, сбрызнуть лимоном.",
        "Кабачок и перец нарезать, выложить на противень.",
        "Сверху положить рыбу.",
        "Запекать 20 минут, затем 5 минут под грилем."
      ],
      device: "Духовка",
      kbzhuSnapshot: { kcal: 280, protein: 28, fat: 12, carbs: 14 },
      versions: [], currentVersion: 1,
      createdAt: 1758000000000, updatedAt: 1758000000000
    },
    {
      id: "recipe-007", name: "Куриное филе в сливках", meal: "dinner",
      source: "Мои", complexity: null, photos: [],
      tags: ["сытное","быстро","для семьи"], note: "",
      ingredients: [
        { productId: null, name: "Куриное филе", amount: 400, unit: "г" },
        { productId: null, name: "Сливки 20%", amount: 150, unit: "мл" },
        { productId: null, name: "Чеснок", amount: 2, unit: "зуб." }
      ],
      portions: 2, time: 25,
      steps: [
        "Филе нарезать крупными кусками.",
        "Обжарить до румяной корочки.",
        "Добавить измельчённый чеснок, жарить 1 минуту.",
        "Влить сливки, тушить 10 минут под крышкой.",
        "Посолить, поперчить по вкусу."
      ],
      device: null,
      kbzhuSnapshot: { kcal: 360, protein: 34, fat: 18, carbs: 12 },
      versions: [], currentVersion: 1,
      createdAt: 1758000000000, updatedAt: 1758000000000
    },
    {
      id: "recipe-008", name: "Творог с мёдом и орехами", meal: "snack",
      source: "Мои", complexity: null, photos: [],
      tags: ["белковое","быстро","ПП"], note: "",
      ingredients: [
        { productId: null, name: "Творог 5%", amount: 150, unit: "г" },
        { productId: null, name: "Мёд", amount: 1, unit: "ст. л." },
        { productId: null, name: "Грецкие орехи", amount: 20, unit: "г" }
      ],
      portions: 1, time: 3,
      steps: [
        "Творог выложить в миску.",
        "Добавить мёд, перемешать.",
        "Орехи порубить, посыпать сверху."
      ],
      device: "Без готовки",
      kbzhuSnapshot: { kcal: 220, protein: 20, fat: 8, carbs: 16 },
      versions: [], currentVersion: 1,
      createdAt: 1758000000000, updatedAt: 1758000000000
    },
    {
      id: "recipe-009", name: "Смузи с бананом и шпинатом", meal: "snack",
      source: "Мои", complexity: null, photos: [],
      tags: ["лёгкое","витаминное","быстро"], note: "",
      ingredients: [
        { productId: null, name: "Банан", amount: 1, unit: "шт." },
        { productId: null, name: "Шпинат", amount: 30, unit: "г" },
        { productId: null, name: "Молоко", amount: 150, unit: "мл" }
      ],
      portions: 1, time: 5,
      steps: [
        "Банан очистить, нарезать кусочками.",
        "В блендер положить банан, шпинат и молоко.",
        "Взбить до однородности.",
        "Подавать сразу."
      ],
      device: null,
      kbzhuSnapshot: { kcal: 150, protein: 4, fat: 2, carbs: 30 },
      versions: [], currentVersion: 1,
      createdAt: 1758000000000, updatedAt: 1758000000000
    }
  ];

  // ═══════════════════════════════════════════════════
  // Демо-рецепты — 9 штук.
  // Заливаются в IndexedDB один раз при первом запуске.
  // ═══════════════════════════════════════════════════
  const demoRecipes = [
  {
    "id": "recipe-001",
    "name": "Овсянка с ягодами",
    "meal": "breakfast",
    "source": "Мои",
    "complexity": null,
    "photos": [],
    "tags": ["сладкое","быстро","ПП","с ягодами"],
    "note": "Брать молоко 3.2%, не 2.5% — с ним вкуснее.",
    "ingredients": [
      { "productId": null, "name": "Овсянка", "amount": 60, "unit": "г" },
      { "productId": null, "name": "Молоко 3.2%", "amount": 200, "unit": "мл" },
      { "productId": null, "name": "Ягоды", "amount": 50, "unit": "г" },
      { "productId": null, "name": "Мёд", "amount": 1, "unit": "ч. л." },
      { "productId": null, "name": "Банан", "amount": 0.5, "unit": "шт." }
    ],
    "portions": 1,
    "time": 10,
    "steps": [
      "Вскипятить молоко в кастрюле.",
      "Всыпать овсянку, варить 5 минут, помешивая.",
      "Переложить в миску, добавить мёд.",
      "Сверху выложить ягоды и нарезанный банан."
    ],
    "device": "Сковорода",
    "kbzhuSnapshot": { "kcal": 292, "protein": 10.9, "fat": 13.2, "carbs": 31.2 },
    "versions": [],
    "currentVersion": 1,
    "createdAt": 1758000000000,
    "updatedAt": 1758000000000
  },
  {
    "id": "recipe-002",
    "name": "Сырники со сгущёнкой",
    "meal": "breakfast",
    "source": "Мои",
    "complexity": null,
    "photos": [],
    "tags": ["сладкое","творожное","утро"],
    "note": "",
    "ingredients": [
      { "productId": null, "name": "Творог 5%", "amount": 200, "unit": "г" },
      { "productId": null, "name": "Яйцо", "amount": 1, "unit": "шт." },
      { "productId": null, "name": "Мука", "amount": 2, "unit": "ст. л." }
    ],
    "portions": 1,
    "time": 25,
    "steps": [
      "Творог растереть с яйцом до однородности.",
      "Добавить муку, замесить мягкое тесто.",
      "Сформировать сырники мокрыми руками.",
      "Обжарить на разогретой сковороде по 3 минуты с каждой стороны.",
      "Подать со сгущёнкой."
    ],
    "device": "Сковорода",
    "kbzhuSnapshot": { "kcal": 340, "protein": 18, "fat": 12, "carbs": 42 },
    "versions": [],
    "currentVersion": 1,
    "createdAt": 1758000000000,
    "updatedAt": 1758000000000
  },
  {
    "id": "recipe-003",
    "name": "Омлет с овощами",
    "meal": "breakfast",
    "source": "Мои",
    "complexity": null,
    "photos": [],
    "tags": ["быстро","белковое","ПП"],
    "note": "",
    "ingredients": [
      { "productId": null, "name": "Яйца", "amount": 3, "unit": "шт." },
      { "productId": null, "name": "Помидор", "amount": 1, "unit": "шт." },
      { "productId": null, "name": "Перец", "amount": 0.5, "unit": "шт." }
    ],
    "portions": 1,
    "time": 10,
    "steps": [
      "Взбить яйца с щепоткой соли.",
      "Помидор и перец нарезать кубиками.",
      "Обжарить овощи на сковороде 2 минуты.",
      "Залить яйцами, накрыть крышкой, готовить 5 минут на слабом огне."
    ],
    "device": null,
    "kbzhuSnapshot": { "kcal": 210, "protein": 15, "fat": 14, "carbs": 5 },
    "versions": [],
    "currentVersion": 1,
    "createdAt": 1758000000000,
    "updatedAt": 1758000000000
  },
  {
    "id": "recipe-004",
    "name": "Паста с курицей",
    "meal": "lunch",
    "source": "Мои",
    "complexity": null,
    "photos": [],
    "tags": ["сытное","итальянское","для семьи"],
    "note": "Курицу сначала обжарить до золотистой.",
    "ingredients": [
      { "productId": null, "name": "Паста", "amount": 200, "unit": "г" },
      { "productId": null, "name": "Куриное филе", "amount": 300, "unit": "г" },
      { "productId": null, "name": "Сливки 20%", "amount": 150, "unit": "мл" },
      { "productId": null, "name": "Пармезан", "amount": 30, "unit": "г" }
    ],
    "portions": 2,
    "time": 30,
    "steps": [
      "Отварить пасту до аль денте.",
      "Куриное филе нарезать, обжарить до золотистой корочки.",
      "Влить сливки, тушить 5 минут.",
      "Соединить с пастой, посыпать тёртым пармезаном."
    ],
    "device": "Сковорода",
    "kbzhuSnapshot": { "kcal": 480, "protein": 32, "fat": 14, "carbs": 55 },
    "versions": [],
    "currentVersion": 1,
    "createdAt": 1758000000000,
    "updatedAt": 1758000000000
  },
  {
    "id": "recipe-005",
    "name": "Суп-пюре из тыквы",
    "meal": "lunch",
    "source": "Мои",
    "complexity": null,
    "photos": [],
    "tags": ["согревающее","осеннее","ПП"],
    "note": "",
    "ingredients": [
      { "productId": null, "name": "Тыква", "amount": 600, "unit": "г" },
      { "productId": null, "name": "Лук", "amount": 1, "unit": "шт." },
      { "productId": null, "name": "Сливки", "amount": 100, "unit": "мл" }
    ],
    "portions": 3,
    "time": 40,
    "steps": [
      "Тыкву нарезать кубиками, лук — полукольцами.",
      "Обжарить лук до прозрачности.",
      "Добавить тыкву, залить водой, варить 20 минут.",
      "Пюрировать блендером.",
      "Влить сливки, довести до кипения, посолить."
    ],
    "device": null,
    "kbzhuSnapshot": { "kcal": 160, "protein": 4, "fat": 8, "carbs": 18 },
    "versions": [],
    "currentVersion": 1,
    "createdAt": 1758000000000,
    "updatedAt": 1758000000000
  },
  {
    "id": "recipe-006",
    "name": "Запечённая рыба с овощами",
    "meal": "dinner",
    "source": "Мои",
    "complexity": null,
    "photos": [],
    "tags": ["лёгкое","ПП","белковое"],
    "note": "Запекать 20 мин при 180°C, потом 5 мин под грилем.",
    "ingredients": [
      { "productId": null, "name": "Филе рыбы", "amount": 400, "unit": "г" },
      { "productId": null, "name": "Кабачок", "amount": 1, "unit": "шт." },
      { "productId": null, "name": "Перец болгарский", "amount": 1, "unit": "шт." },
      { "productId": null, "name": "Лимон", "amount": 0.5, "unit": "шт." }
    ],
    "portions": 2,
    "time": 35,
    "steps": [
      "Разогреть духовку до 180°C.",
      "Рыбу нарезать порционно, посолить, сбрызнуть лимоном.",
      "Кабачок и перец нарезать, выложить на противень.",
      "Сверху положить рыбу.",
      "Запекать 20 минут, затем 5 минут под грилем."
    ],
    "device": "Духовка",
    "kbzhuSnapshot": { "kcal": 280, "protein": 28, "fat": 12, "carbs": 14 },
    "versions": [],
    "currentVersion": 1,
    "createdAt": 1758000000000,
    "updatedAt": 1758000000000
  },
  {
    "id": "recipe-007",
    "name": "Куриное филе в сливках",
    "meal": "dinner",
    "source": "Мои",
    "complexity": null,
    "photos": [],
    "tags": ["сытное","быстро","для семьи"],
    "note": "",
    "ingredients": [
      { "productId": null, "name": "Куриное филе", "amount": 400, "unit": "г" },
      { "productId": null, "name": "Сливки 20%", "amount": 150, "unit": "мл" },
      { "productId": null, "name": "Чеснок", "amount": 2, "unit": "зуб." }
    ],
    "portions": 2,
    "time": 25,
    "steps": [
      "Филе нарезать крупными кусками.",
      "Обжарить до румяной корочки.",
      "Добавить измельчённый чеснок, жарить 1 минуту.",
      "Влить сливки, тушить 10 минут под крышкой.",
      "Посолить, поперчить по вкусу."
    ],
    "device": null,
    "kbzhuSnapshot": { "kcal": 360, "protein": 34, "fat": 18, "carbs": 12 },
    "versions": [],
    "currentVersion": 1,
    "createdAt": 1758000000000,
    "updatedAt": 1758000000000
  },
  {
    "id": "recipe-008",
    "name": "Творог с мёдом и орехами",
    "meal": "snack",
    "source": "Мои",
    "complexity": null,
    "photos": [],
    "tags": ["белковое","быстро","ПП"],
    "note": "",
    "ingredients": [
      { "productId": null, "name": "Творог 5%", "amount": 150, "unit": "г" },
      { "productId": null, "name": "Мёд", "amount": 1, "unit": "ст. л." },
      { "productId": null, "name": "Грецкие орехи", "amount": 20, "unit": "г" }
    ],
    "portions": 1,
    "time": 3,
    "steps": [
      "Творог выложить в миску.",
      "Добавить мёд, перемешать.",
      "Орехи порубить, посыпать сверху."
    ],
    "device": "Без готовки",
    "kbzhuSnapshot": { "kcal": 220, "protein": 20, "fat": 8, "carbs": 16 },
    "versions": [],
    "currentVersion": 1,
    "createdAt": 1758000000000,
    "updatedAt": 1758000000000
  },
  {
    "id": "recipe-009",
    "name": "Смузи с бананом и шпинатом",
    "meal": "snack",
    "source": "Мои",
    "complexity": null,
    "photos": [],
    "tags": ["лёгкое","витаминное","быстро"],
    "note": "",
    "ingredients": [
      { "productId": null, "name": "Банан", "amount": 1, "unit": "шт." },
      { "productId": null, "name": "Шпинат", "amount": 30, "unit": "г" },
      { "productId": null, "name": "Молоко", "amount": 150, "unit": "мл" }
    ],
    "portions": 1,
    "time": 5,
    "steps": [
      "Банан очистить, нарезать кусочками.",
      "В блендер положить банан, шпинат и молоко.",
      "Взбить до однородности.",
      "Подавать сразу."
    ],
    "device": null,
    "kbzhuSnapshot": { "kcal": 150, "protein": 4, "fat": 2, "carbs": 30 },
    "versions": [],
    "currentVersion": 1,
    "createdAt": 1758000000000,
    "updatedAt": 1758000000000
  }
  ];

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
    // ═══════════════════════════════════════════════════
  // Засев демо-рецептов (один раз при первом запуске)
  // ═══════════════════════════════════════════════════

  async function seedDemoRecipes(){
    if (!available) return;
    const done = await getSetting('demoSeeded');
    if (done) return;
    if (typeof demoRecipes === 'undefined' || !Array.isArray(demoRecipes)) return;
    if (!demoRecipes.length) return;

    await new Promise((resolve, reject) => {
      const t = db.transaction('recipes', 'readwrite');
      const store = t.objectStore('recipes');
      for (const r of demoRecipes){
        store.put(r);
      }
      t.oncomplete = () => resolve();
      t.onerror    = () => reject(t.error);
      t.onabort    = () => reject(t.error);
    });

    await saveSetting('demoSeeded', true);
  }

   // ═══════════════════════════════════════════════════
  // Рецепты
  // ═══════════════════════════════════════════════════

  async function getAllRecipes(){
    if (!available) return [];
    return await reqPromise(tx('recipes','readonly').getAll());
  }

  async function getRecipe(id){
    if (!available || !id) return null;
    return await reqPromise(tx('recipes','readonly').get(id));
  }

  async function saveRecipe(recipe){
    if (!available || !recipe) return null;
    const now = Date.now();
    const r = { ...recipe };
    if (!r.id) r.id = await nextRecipeId();
    if (!r.createdAt) r.createdAt = now;
    r.updatedAt = now;
    await reqPromise(tx('recipes','readwrite').put(r));
    return r;
  }

  async function deleteRecipe(id){
    if (!available || !id) return;
    await reqPromise(tx('recipes','readwrite').delete(id));
  }

  // Внутренняя: следующий свободный recipe-NNN
  async function nextRecipeId(){
    const all = await getAllRecipes();
    let max = 0;
    for (const r of all){
      const m = /^recipe-(\d+)$/.exec(r.id || '');
      if (m){
        const n = parseInt(m[1], 10);
        if (n > max) max = n;
      }
    }
    return 'recipe-' + String(max + 1).padStart(3, '0');
  }

  // Статистика (для «О программе»)
  // ═══════════════════════════════════════════════════

    // ═══════════════════════════════════════════════════
  // Отметки (❤ 👨🍳 🔖 📅)
  // ═══════════════════════════════════════════════════
  //
  // Ключ записи: type:recipeId[:extra]
  //   favorite:recipe-001
  //   cooked:recipe-004
  //   want:recipe-002
  //   plan:recipe-006:family
  //   plan:recipe-006:child
  //
  // Один рецепт может быть в нескольких вкладках плана —
  // это разные записи (разный extra).

  async function addMark(type, recipeId, extra){
    if (!available || !type || !recipeId) return null;
    const id = type + ':' + recipeId + (extra ? ':' + extra : '');
    const mark = {
      id,
      type,
      recipeId,
      extra: extra || null,
      at: Date.now()
    };
    await reqPromise(tx('marks','readwrite').put(mark));
    return mark;
  }

  async function removeMark(type, recipeId, extra){
    if (!available || !type || !recipeId) return;
    if (extra !== undefined && extra !== null){
      const id = type + ':' + recipeId + ':' + extra;
      await reqPromise(tx('marks','readwrite').delete(id));
      return;
    }
    // Без extra — удаляем все записи этого типа и рецепта
    const all = await reqPromise(tx('marks','readonly').getAll());
    for (const m of all){
      if (m.type === type && m.recipeId === recipeId){
        await reqPromise(tx('marks','readwrite').delete(m.id));
      }
    }
  }

  async function getMarks(type){
    if (!available || !type) return [];
    const all = await reqPromise(tx('marks','readonly').getAll());
    return all.filter(m => m.type === type);
  }

  async function isMarked(type, recipeId){
    if (!available || !type || !recipeId) return false;
    const all = await reqPromise(tx('marks','readonly').getAll());
    return all.some(m => m.type === type && m.recipeId === recipeId);
  }

  async function getAllMarks(){
    if (!available) return { favorite: [], cooked: [], want: [], plan: [] };
    const all = await reqPromise(tx('marks','readonly').getAll());
    return {
      favorite: all.filter(m => m.type === 'favorite'),
      cooked:   all.filter(m => m.type === 'cooked'),
      want:     all.filter(m => m.type === 'want'),
      plan:     all.filter(m => m.type === 'plan')
    };
  }

  async function clearMarks(type){
    if (!available) return;
    if (type){
      const all = await reqPromise(tx('marks','readonly').getAll());
      for (const m of all){
        if (m.type === type){
          await reqPromise(tx('marks','readwrite').delete(m.id));
        }
      }
      return;
    }
    await reqPromise(tx('marks','readwrite').clear());
  }

    // ═══════════════════════════════════════════════════
  // Теги. Свои — в settings (ключ 'tags').
  // Базовые — в tags-base.js, в коде.
  // ID: свои tag-NNN, базовые btag-NNN.
  // ═══════════════════════════════════════════════════

  async function getAllTags(){
    if (!available) return [];
    const v = await getSetting('tags');
    return Array.isArray(v) ? v : [];
  }

  async function saveTag(tag){
    if (!available || !tag || !tag.name) return null;
    const all = await getAllTags();
    const t = { ...tag };
    if (!t.id) t.id = nextTagIdFrom(all);
    if (!t.at) t.at = Date.now();
    const idx = all.findIndex(x => x.id === t.id);
    if (idx >= 0) all[idx] = t;
    else all.push(t);
    await saveSetting('tags', all);
    return t;
  }

  async function deleteTag(id){
    if (!available || !id) return;
    const all = await getAllTags();
    await saveSetting('tags', all.filter(t => t.id !== id));
  }

  function nextTagIdFrom(all){
    let max = 0;
    for (const t of all){
      const m = /^tag-(\d+)$/.exec(t.id || '');
      if (m){
        const n = parseInt(m[1], 10);
        if (n > max) max = n;
      }
    }
    return 'tag-' + String(max + 1).padStart(3, '0');
  }

  // Свои + базовые одним списком. Базовые — из tags-base.js.
  async function getAllTagsMerged(){
    const own = await getAllTags();
    const base = (typeof BASE_TAGS !== 'undefined' && Array.isArray(BASE_TAGS)) ? BASE_TAGS : [];
    return [...own, ...base];
  }

  
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
    seedDemoRecipes,
    getStats,

    // ── настройки ──
    getSetting,
    saveSetting,
    deleteSetting,

     // ── рецепты ──
    saveRecipe,
    getRecipe,
    getAllRecipes,
    deleteRecipe,
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
    addMark,
    removeMark,
    getMarks,
    isMarked,
    getAllMarks,
    clearMarks,

    // ── таймеры ──
    saveTimer:                stub('saveTimer'),
    getTimers:                stub('getTimers', []),
    updateTimer:              stub('updateTimer'),
    deleteTimer:              stub('deleteTimer'),
    getActiveTimers:          stub('getActiveTimers', []),
    getTimersForRecipe:       stub('getTimersForRecipe', []),

     // ── теги ──
    saveTag,
    getAllTags,
    deleteTag,
    getAllTagsMerged,

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