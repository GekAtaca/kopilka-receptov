// ═══════════════════════════════════════════════════
// tags-base.js — базовые теги. Живут в коде, не в IndexedDB.
// ID: btag-NNN. Пользователь их удалить не может.
//
// 16 групп по карте (раздел 11).
// Набор минимальный — расширим позже, когда будем
// реально пользоваться модалкой «Теги рецепта».
// ═══════════════════════════════════════════════════

const BASE_TAGS = [
  // ─── Вкус ───
  { id: 'btag-001', name: 'сладкое',      group: 'vkus' },
  { id: 'btag-002', name: 'солёное',      group: 'vkus' },
  { id: 'btag-003', name: 'острое',       group: 'vkus' },
  { id: 'btag-004', name: 'кислое',       group: 'vkus' },
  { id: 'btag-005', name: 'пряное',       group: 'vkus' },

  // ─── Настроение ───
  { id: 'btag-006', name: 'сытное',       group: 'nastroenie' },
  { id: 'btag-007', name: 'лёгкое',       group: 'nastroenie' },
  { id: 'btag-008', name: 'согревающее',  group: 'nastroenie' },
  { id: 'btag-009', name: 'освежающее',   group: 'nastroenie' },

  // ─── Диета ───
  { id: 'btag-010', name: 'ПП',                group: 'dieta' },
  { id: 'btag-011', name: 'безглютеновое',     group: 'dieta' },
  { id: 'btag-012', name: 'вегетарианское',    group: 'dieta' },
  { id: 'btag-013', name: 'безлактозное',      group: 'dieta' },

  // ─── Способ готовки ───
  { id: 'btag-014', name: 'в аэрогриле',  group: 'sposob' },
  { id: 'btag-015', name: 'в духовке',    group: 'sposob' },
  { id: 'btag-016', name: 'без готовки',  group: 'sposob' },
  { id: 'btag-017', name: 'на пару',      group: 'sposob' },

  // ─── Сложность ───
  { id: 'btag-018', name: 'простое',      group: 'slozhnost' },
  { id: 'btag-019', name: 'среднее',      group: 'slozhnost' },
  { id: 'btag-020', name: 'сложное',      group: 'slozhnost' },

  // ─── Повод ───
  { id: 'btag-021', name: 'на праздник',  group: 'povod' },
  { id: 'btag-022', name: 'для гостей',   group: 'povod' },
  { id: 'btag-023', name: 'на каждый день', group: 'povod' },

  // ─── Сезон ───
  { id: 'btag-024', name: 'летнее',       group: 'sezon' },
  { id: 'btag-025', name: 'осеннее',      group: 'sezon' },
  { id: 'btag-026', name: 'зимнее',       group: 'sezon' },
  { id: 'btag-027', name: 'весеннее',     group: 'sezon' },
  { id: 'btag-028', name: 'новогоднее',   group: 'sezon' },

  // ─── Кухня ───
  { id: 'btag-029', name: 'итальянское',  group: 'kuhnya' },
  { id: 'btag-030', name: 'азиатское',    group: 'kuhnya' },
  { id: 'btag-031', name: 'русское',      group: 'kuhnya' },
  { id: 'btag-032', name: 'французское',  group: 'kuhnya' },

  // ─── Текстура ───
  { id: 'btag-033', name: 'хрустящее',    group: 'tekstura' },
  { id: 'btag-034', name: 'кремовое',     group: 'tekstura' },
  { id: 'btag-035', name: 'нежное',       group: 'tekstura' },
  { id: 'btag-036', name: 'плотное',      group: 'tekstura' },

  // ─── Температура ───
  { id: 'btag-037', name: 'горячее',      group: 'temperatura' },
  { id: 'btag-038', name: 'холодное',     group: 'temperatura' },
  { id: 'btag-039', name: 'тёплое',       group: 'temperatura' },

  // ─── Порция ───
  { id: 'btag-040', name: 'на одного',    group: 'portsiya' },
  { id: 'btag-041', name: 'для семьи',    group: 'portsiya' },
  { id: 'btag-042', name: 'на большую компанию', group: 'portsiya' },

  // ─── Кому ───
  { id: 'btag-043', name: 'для детей',    group: 'komu' },
  { id: 'btag-044', name: 'для взрослых', group: 'komu' },

  // ─── Время суток ───
  { id: 'btag-045', name: 'утреннее',     group: 'vremya' },
  { id: 'btag-046', name: 'дневное',      group: 'vremya' },
  { id: 'btag-047', name: 'вечернее',     group: 'vremya' },

  // ─── Стиль питания ───
  { id: 'btag-048', name: 'раздельное',           group: 'stil' },
  { id: 'btag-049', name: 'интервальное',         group: 'stil' },
  { id: 'btag-050', name: 'низкоуглеводное',      group: 'stil' },

  // ─── Полезность ───
  { id: 'btag-051', name: 'много белка',      group: 'poleznost' },
  { id: 'btag-052', name: 'без сахара',       group: 'poleznost' },
  { id: 'btag-053', name: 'с овощами',        group: 'poleznost' },
  { id: 'btag-054', name: 'низкокалорийное',  group: 'poleznost' },

  // ─── Особенность ───
  { id: 'btag-055', name: 'быстро',       group: 'osobennost' },
  { id: 'btag-056', name: 'из простых',   group: 'osobennost' },
  { id: 'btag-057', name: 'бюджетное',    group: 'osobennost' },
  { id: 'btag-058', name: 'из остатков',  group: 'osobennost' }
];