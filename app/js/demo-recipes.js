// ═══════════════════════════════════════════════════
// demo-recipes.js — 9 демо-рецептов.
// Живут в памяти. Позже (шаг 34) переедут в IndexedDB.
//
// Что важно знать про эти объекты:
//   • productId: null — ссылки на базу продуктов пока нет.
//     Появится в шаге 36, тогда пройдёмся и проставим.
//   • photos: [] — картинки в HTML были фоны, не фото блюд.
//     Настоящие фото добавим позже через редактор.
//   • time — одно число (минуты). Этапы времени появятся позже.
//   • kbzhuSnapshot — снимок старых цифр из HTML.
//     Когда появится расчёт из ингредиентов — заменим на живой.
//   • versions: [] — альтернативных версий пока нет.
//     currentVersion: 1 — это первая (и пока единственная) версия.
// ═══════════════════════════════════════════════════

const CREATED = 1758000000000; // условная дата создания для всех демо

const demoRecipes = [
  {
    id: 'recipe-001',
    name: 'Овсянка с ягодами',
    meal: 'breakfast',
    source: 'Мои',
    complexity: null,
    photos: [],
    tags: ['сладкое', 'быстро', 'ПП', 'с ягодами'],
    note: 'Брать молоко 3.2%, не 2.5% — с ним вкуснее.',
    ingredients: [
      { productId: null, name: 'Овсянка', amount: 60, unit: 'г' },
      { productId: null, name: 'Молоко 3.2%', amount: 200, unit: 'мл' },
      { productId: null, name: 'Ягоды', amount: 50, unit: 'г' },
      { productId: null, name: 'Мёд', amount: 1, unit: 'ч. л.' },
      { productId: null, name: 'Банан', amount: 0.5, unit: 'шт.' }
    ],
    portions: 1,
    time: 10,
    steps: [
      'Вскипятить молоко в кастрюле.',
      'Всыпать овсянку, варить 5 минут, помешивая.',
      'Переложить в миску, добавить мёд.',
      'Сверху выложить ягоды и нарезанный банан.'
    ],
    device: 'Сковорода',
    kbzhuSnapshot: { kcal: 292, protein: 10.9, fat: 13.2, carbs: 31.2 },
    versions: [],
    currentVersion: 1,
    createdAt: CREATED,
    updatedAt: CREATED
  },
  {
    id: 'recipe-002',
    name: 'Сырники со сгущёнкой',
    meal: 'breakfast',
    source: 'Мои',
    complexity: null,
    photos: [],
    tags: ['сладкое', 'творожное', 'утро'],
    note: '',
    ingredients: [
      { productId: null, name: 'Творог 5%', amount: 200, unit: 'г' },
      { productId: null, name: 'Яйцо', amount: 1, unit: 'шт.' },
      { productId: null, name: 'Мука', amount: 2, unit: 'ст. л.' }
    ],
    portions: 1,
    time: 25,
    steps: [
      'Творог растереть с яйцом до однородности.',
      'Добавить муку, замесить мягкое тесто.',
      'Сформировать сырники мокрыми руками.',
      'Обжарить на разогретой сковороде по 3 минуты с каждой стороны.',
      'Подать со сгущёнкой.'
    ],
    device: 'Сковорода',
    kbzhuSnapshot: { kcal: 340, protein: 18, fat: 12, carbs: 42 },
    versions: [],
    currentVersion: 1,
    createdAt: CREATED,
    updatedAt: CREATED
  },
  {
    id: 'recipe-003',
    name: 'Омлет с овощами',
    meal: 'breakfast',
    source: 'Мои',
    complexity: null,
    photos: [],
    tags: ['быстро', 'белковое', 'ПП'],
    note: '',
    ingredients: [
      { productId: null, name: 'Яйца', amount: 3, unit: 'шт.' },
      { productId: null, name: 'Помидор', amount: 1, unit: 'шт.' },
      { productId: null, name: 'Перец', amount: 0.5, unit: 'шт.' }
    ],
    portions: 1,
    time: 10,
    steps: [
      'Взбить яйца с щепоткой соли.',
      'Помидор и перец нарезать кубиками.',
      'Обжарить овощи на сковороде 2 минуты.',
      'Залить яйцами, накрыть крышкой, готовить 5 минут на слабом огне.'
    ],
    device: null,
    kbzhuSnapshot: { kcal: 210, protein: 15, fat: 14, carbs: 5 },
    versions: [],
    currentVersion: 1,
    createdAt: CREATED,
    updatedAt: CREATED
  },
  {
    id: 'recipe-004',
    name: 'Паста с курицей',
    meal: 'lunch',
    source: 'Мои',
    complexity: null,
    photos: [],
    tags: ['сытное', 'итальянское', 'для семьи'],
    note: 'Курицу сначала обжарить до золотистой.',
    ingredients: [
      { productId: null, name: 'Паста', amount: 200, unit: 'г' },
      { productId: null, name: 'Куриное филе', amount: 300, unit: 'г' },
      { productId: null, name: 'Сливки 20%', amount: 150, unit: 'мл' },
      { productId: null, name: 'Пармезан', amount: 30, unit: 'г' }
    ],
    portions: 2,
    time: 30,
    steps: [
      'Отварить пасту до аль денте.',
      'Куриное филе нарезать, обжарить до золотистой корочки.',
      'Влить сливки, тушить 5 минут.',
      'Соединить с пастой, посыпать тёртым пармезаном.'
    ],
    device: 'Сковорода',
    kbzhuSnapshot: { kcal: 480, protein: 32, fat: 14, carbs: 55 },
    versions: [],
    currentVersion: 1,
    createdAt: CREATED,
    updatedAt: CREATED
  },
  {
    id: 'recipe-005',
    name: 'Суп-пюре из тыквы',
    meal: 'lunch',
    source: 'Мои',
    complexity: null,
    photos: [],
    tags: ['согревающее', 'осеннее', 'ПП'],
    note: '',
    ingredients: [
      { productId: null, name: 'Тыква', amount: 600, unit: 'г' },
      { productId: null, name: 'Лук', amount: 1, unit: 'шт.' },
      { productId: null, name: 'Сливки', amount: 100, unit: 'мл' }
    ],
    portions: 3,
    time: 40,
    steps: [
      'Тыкву нарезать кубиками, лук — полукольцами.',
      'Обжарить лук до прозрачности.',
      'Добавить тыкву, залить водой, варить 20 минут.',
      'Пюрировать блендером.',
      'Влить сливки, довести до кипения, посолить.'
    ],
    device: null,
    kbzhuSnapshot: { kcal: 160, protein: 4, fat: 8, carbs: 18 },
    versions: [],
    currentVersion: 1,
    createdAt: CREATED,
    updatedAt: CREATED
  },
  {
    id: 'recipe-006',
    name: 'Запечённая рыба с овощами',
    meal: 'dinner',
    source: 'Мои',
    complexity: null,
    photos: [],
    tags: ['лёгкое', 'ПП', 'белковое'],
    note: 'Запекать 20 мин при 180°C, потом 5 мин под грилем.',
    ingredients: [
      { productId: null, name: 'Филе рыбы', amount: 400, unit: 'г' },
      { productId: null, name: 'Кабачок', amount: 1, unit: 'шт.' },
      { productId: null, name: 'Перец болгарский', amount: 1, unit: 'шт.' },
      { productId: null, name: 'Лимон', amount: 0.5, unit: 'шт.' }
    ],
    portions: 2,
    time: 35,
    steps: [
      'Разогреть духовку до 180°C.',
      'Рыбу нарезать порционно, посолить, сбрызнуть лимоном.',
      'Кабачок и перец нарезать, выложить на противень.',
      'Сверху положить рыбу.',
      'Запекать 20 минут, затем 5 минут под грилем.'
    ],
    device: 'Духовка',
    kbzhuSnapshot: { kcal: 280, protein: 28, fat: 12, carbs: 14 },
    versions: [],
    currentVersion: 1,
    createdAt: CREATED,
    updatedAt: CREATED
  },
  {
    id: 'recipe-007',
    name: 'Куриное филе в сливках',
    meal: 'dinner',
    source: 'Мои',
    complexity: null,
    photos: [],
    tags: ['сытное', 'быстро', 'для семьи'],
    note: '',
    ingredients: [
      { productId: null, name: 'Куриное филе', amount: 400, unit: 'г' },
      { productId: null, name: 'Сливки 20%', amount: 150, unit: 'мл' },
      { productId: null, name: 'Чеснок', amount: 2, unit: 'зуб.' }
    ],
    portions: 2,
    time: 25,
    steps: [
      'Филе нарезать крупными кусками.',
      'Обжарить до румяной корочки.',
      'Добавить измельчённый чеснок, жарить 1 минуту.',
      'Влить сливки, тушить 10 минут под крышкой.',
      'Посолить, поперчить по вкусу.'
    ],
    device: null,
    kbzhuSnapshot: { kcal: 360, protein: 34, fat: 18, carbs: 12 },
    versions: [],
    currentVersion: 1,
    createdAt: CREATED,
    updatedAt: CREATED
  },
  {
    id: 'recipe-008',
    name: 'Творог с мёдом и орехами',
    meal: 'snack',
    source: 'Мои',
    complexity: null,
    photos: [],
    tags: ['белковое', 'быстро', 'ПП'],
    note: '',
    ingredients: [
      { productId: null, name: 'Творог 5%', amount: 150, unit: 'г' },
      { productId: null, name: 'Мёд', amount: 1, unit: 'ст. л.' },
      { productId: null, name: 'Грецкие орехи', amount: 20, unit: 'г' }
    ],
    portions: 1,
    time: 3,
    steps: [
      'Творог выложить в миску.',
      'Добавить мёд, перемешать.',
      'Орехи порубить, посыпать сверху.'
    ],
    device: 'Без готовки',
    kbzhuSnapshot: { kcal: 220, protein: 20, fat: 8, carbs: 16 },
    versions: [],
    currentVersion: 1,
    createdAt: CREATED,
    updatedAt: CREATED
  },
  {
    id: 'recipe-009',
    name: 'Смузи с бананом и шпинатом',
    meal: 'snack',
    source: 'Мои',
    complexity: null,
    photos: [],
    tags: ['лёгкое', 'витаминное', 'быстро'],
    note: '',
    ingredients: [
      { productId: null, name: 'Банан', amount: 1, unit: 'шт.' },
      { productId: null, name: 'Шпинат', amount: 30, unit: 'г' },
      { productId: null, name: 'Молоко', amount: 150, unit: 'мл' }
    ],
    portions: 1,
    time: 5,
    steps: [
      'Банан очистить, нарезать кусочками.',
      'В блендер положить банан, шпинат и молоко.',
      'Взбить до однородности.',
      'Подавать сразу.'
    ],
    device: null,
    kbzhuSnapshot: { kcal: 150, protein: 4, fat: 2, carbs: 30 },
    versions: [],
    currentVersion: 1,
    createdAt: CREATED,
    updatedAt: CREATED
  }
];