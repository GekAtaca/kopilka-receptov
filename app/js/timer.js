// ═══════════════════════════════════════════════════
// timer.js — логика таймеров и колесиков выбора времени
// ═══════════════════════════════════════════════════

const modalTimerList = document.getElementById('modalTimerList');
const modalTimerNew  = document.getElementById('modalTimerNew');
const timerListEl    = document.getElementById('timerList');
const timerAlert     = document.getElementById('timerAlert');

let tnCurrentRecipeId = null;
let tnWheelValues = { hours: 0, mins: 5, secs: 0 };

// ─── 1. Копирование темы для модалок ───
function applyThemeToModals() {
  document.querySelectorAll('#modalTimerList .modal-box, #modalTimerNew .modal-box').forEach(box => {
    ['style','palette','theme','shadow'].forEach(key => {
      const attr = 'data-' + key;
      const val = document.body.getAttribute(attr);
      if (val) box.setAttribute(attr, val);
      else box.removeAttribute(attr);
    });
  });
}

// ─── 2. Инициализация колесиков (Wheel Picker) ───
function initWheel(el, maxVal, type) {
  let itemsHtml = '';
  for (let i = 0; i <= maxVal; i++) {
    itemsHtml += `<div class="tn-wheel-item" data-val="${i}">${String(i).padStart(2, '0')}</div>`;
  }
  
  // Три копии подряд для бесконечной прокрутки
  el.innerHTML = itemsHtml + itemsHtml + itemsHtml;
  
  // Присваиваем индекс каждому элементу для клика
  const items = el.querySelectorAll('.tn-wheel-item');
  items.forEach((item, idx) => item.dataset.idx = idx);
  
  const itemHeight = 30;
  const totalItems = maxVal + 1;
  const singleHeight = totalItems * itemHeight;

  // Начальная прокрутка ровно на среднюю секцию
  const startVal = type === 'hours' ? 0 : (type === 'mins' ? 5 : 0);
  
  // Обновляем значения
  if (type === 'hours') tnWheelValues.hours = startVal;
  if (type === 'mins')  tnWheelValues.mins  = startVal;
  if (type === 'secs')  tnWheelValues.secs  = startVal;

  // Устанавливаем скролл без анимации (мгновенно)
  setTimeout(() => {
    el.scrollTop = singleHeight + startVal * itemHeight;
    updateActiveWheelItem(el);
  }, 50);

  // Прокрутка колесом мыши ровно на 1 шаг
  el.addEventListener('wheel', (e) => {
    e.preventDefault();
    const direction = e.deltaY > 0 ? 1 : -1;
    const currentIndex = Math.round(el.scrollTop / itemHeight);
    let targetIndex = currentIndex + direction;
    
    el.scrollTo({ top: targetIndex * itemHeight, behavior: 'smooth' });
  }, { passive: false });

  // Клик по числу
  el.addEventListener('click', (e) => {
    const item = e.target.closest('.tn-wheel-item');
    if (!item) return;
    const idx = parseInt(item.dataset.idx, 10);
    el.scrollTo({ top: idx * itemHeight, behavior: 'smooth' });
  });

  // Отслеживаем скролл (для свайпов)
  el.addEventListener('scroll', () => {
    // Телепортация при выходе за пределы средней секции
    if (el.scrollTop < singleHeight - itemHeight * 2) {
        el.scrollTop += singleHeight;
    } else if (el.scrollTop >= singleHeight * 2 - itemHeight * 2) {
        el.scrollTop -= singleHeight;
    }

    requestAnimationFrame(() => updateActiveWheelItem(el));
  });
}

function updateActiveWheelItem(el) {
  const itemHeight = 30;
  // Берем индекс, который ровно по центру (высота 150, центр 75, но так как padding 60, центрируем по скроллу)
  const index = Math.round(el.scrollTop / itemHeight);
  const items = el.querySelectorAll('.tn-wheel-item');
  
  if (!items[index]) return;

  // Снимаем класс со старого
  const currentActive = el.querySelector('.tn-wheel-item.active');
  if (currentActive) currentActive.classList.remove('active');
  
  // Вешаем новый
  items[index].classList.add('active');
  
  // Обновляем значения
  const val = parseInt(items[index].dataset.val, 10);
  if (el.id === 'tnHours') tnWheelValues.hours = val;
  if (el.id === 'tnMins')  tnWheelValues.mins  = val;
  if (el.id === 'tnSecs')  tnWheelValues.secs  = val;
}

// ─── 3. Открытие модалки списка таймеров ───
async function openTimerList(recipeId) {
  tnCurrentRecipeId = recipeId;
  applyThemeToModals();
  await renderTimerList();
  modalTimerList.style.display = 'flex';
}

async function renderTimerList() {
  const timers = await Storage.getTimersForRecipe(tnCurrentRecipeId);
  const now = Date.now();
  
  if (timers.length === 0) {
    timerListEl.innerHTML = `<div class="timer-empty">Нет активных таймеров</div>`;
    return;
  }

  timerListEl.innerHTML = timers.map(t => {
    const left = Math.max(0, t.endsAt - now);
    const h = Math.floor(left / 3600000);
    const m = Math.floor((left % 3600000) / 60000);
    const s = Math.floor((left % 60000) / 1000);
    const timeStr = h > 0 
      ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    
    const stepStr = t.step ? `Шаг ${t.step}` : 'Без привязки';
    
    return `
      <div class="timer-item">
        <div class="timer-item-info">
          <div class="timer-item-step">${stepStr}</div>
          <div class="timer-item-time">${timeStr} осталось</div>
        </div>
        <button type="button" class="timer-item-del" data-id="${t.id}">✕</button>
      </div>
    `;
  }).join('');
}

// ─── 4. Логика запуска нового таймера ───
async function startNewTimer() {
  const totalSecs = tnWheelValues.hours * 3600 + tnWheelValues.mins * 60 + tnWheelValues.secs;
  
  if (totalSecs === 0) {
    if (typeof showToast === 'function') showToast('Выберите время');
    return;
  }

  const stepDropdown = document.querySelector('[data-field="timer-step"]');
  const selectedStep = stepDropdown ? stepDropdown.dataset.val : '';
  const soundEnabled = document.getElementById('timerSoundToggle').checked;

  const timer = {
    recipeId: tnCurrentRecipeId,
    step: selectedStep || null,
    endsAt: Date.now() + totalSecs * 1000,
    sound: soundEnabled
  };

  await Storage.saveTimer(timer);
  
  // Закрываем модалку нового таймера, возвращаемся к списку
  modalTimerNew.style.display = 'none';
  await renderTimerList();
}

// ─── 5. Звук (Web Audio API) ───
let audioCtx = null;
let beepInterval = null;
let beepTimeout = null;

function playBeep() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  
  const play = (delay) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.type = 'sine'; // Мягкая синусоида
    osc.frequency.value = 660; // Нота Ми (мягче, чем 880)
    
    const t = audioCtx.currentTime + delay;
    
    // Плавное нарастание и затухание (без щелчков)
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.3, t + 0.05);
    gain.gain.setValueAtTime(0.3, t + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
    
    osc.start(t);
    osc.stop(t + 0.35);
  };
  
  play(0);   // Первый бип
  play(0.3); // Второй бип
}

function startAlarmSound() {
  stopAlarmSound(); // на всякий случай
  playBeep();
  beepInterval = setInterval(playBeep, 2000);
  // Автостоп через 30 секунд
  beepTimeout = setTimeout(stopAlarmSound, 30000);
}

function stopAlarmSound() {
  if (beepInterval) clearInterval(beepInterval);
  if (beepTimeout) clearTimeout(beepTimeout);
  beepInterval = null;
  beepTimeout = null;
}

// ─── 6. Уведомление ───
let activeAlertTimer = null;

function showTimerAlert(timer) {
  activeAlertTimer = timer;
  const recipeName = currentRecipeObj && currentRecipeObj.id === timer.recipeId 
    ? currentRecipeObj.name 
    : 'Рецепт'; // Если карточка закрыта, имя не знаем, но можно потом подтянуть
  
  const stepStr = timer.step ? `к шагу ${timer.step}` : 'без привязки к шагу';
  document.getElementById('timerAlertTitle').textContent = '⏱ Таймер сработал';
  document.getElementById('timerAlertText').textContent = `В рецепте «${recipeName}» ${stepStr} закончился таймер.`;
  
  timerAlert.style.display = 'flex';
  applyThemeToModals();
  
  // Копируем стили на уведомление
  ['style','palette','theme'].forEach(key => {
    const attr = 'data-' + key;
    const val = document.body.getAttribute(attr);
    if (val) timerAlert.setAttribute(attr, val);
    else timerAlert.removeAttribute(attr);
  });

  if (timer.sound) startAlarmSound();
}

// ─── 7. Фоновый тик каждую секунду ───
setInterval(async () => {
  // 1. Обновляем список в модалке, если она открыта
  if (modalTimerList.style.display === 'flex') {
    await renderTimerList();
  }

  // 2. Проверяем, не истекли ли таймеры
  const expired = await Storage.getExpiredTimers();
  if (expired.length > 0) {
    // Берем первый истекший, удаляем из БД и показываем
    const t = expired[0];
    await Storage.deleteTimer(t.id);
    
    // Обновляем список, если открыт
    if (modalTimerList.style.display === 'flex') await renderTimerList();
    
    // Показываем уведомление (если уже висит другое, просто заменим)
    showTimerAlert(t);
  }
}, 1000);

// ─── 8. Обработчики событий интерфейса ───
document.getElementById('timerAddBtn').addEventListener('click', () => {
  modalTimerNew.style.display = 'flex';
  
  // Сброс колесиков (центр средней секции, без анимации)
  const hEl = document.getElementById('tnHours');
  const mEl = document.getElementById('tnMins');
  const sEl = document.getElementById('tnSecs');
  
  hEl.style.scrollBehavior = 'auto';
  mEl.style.scrollBehavior = 'auto';
  sEl.style.scrollBehavior = 'auto';
  
  hEl.scrollTop = (24 * 30) + 0;
  mEl.scrollTop = (60 * 30) + (5 * 30);
  sEl.scrollTop = (60 * 30) + 0;
  
  // Принудительно обновляем активные элементы
  updateActiveWheelItem(hEl);
  updateActiveWheelItem(mEl);
  updateActiveWheelItem(sEl);
  
  tnWheelValues = { hours: 0, mins: 5, secs: 0 };
  
  // Возвращаем плавность
  setTimeout(() => {
    hEl.style.scrollBehavior = '';
    mEl.style.scrollBehavior = '';
    sEl.style.scrollBehavior = '';
  }, 100);
  
  // Сброс дропдауна
  const dd = document.querySelector('[data-field="timer-step"]');
  if (dd) {
    dd.dataset.val = '';
    dd.querySelector('.me-dd-label').textContent = 'Без привязки';
    dd.querySelectorAll('.me-dropdown-item').forEach(item => item.classList.remove('active'));
    dd.querySelector('.me-dropdown-item[data-val=""]').classList.add('active');
  }
  
  // Заполняем шаги рецепта
  const stepMenu = document.getElementById('timerStepMenu');
  stepMenu.innerHTML = `<div class="me-dropdown-item active" data-val="">Без привязки</div>`;
  if (currentRecipeObj && currentRecipeObj.steps) {
    currentRecipeObj.steps.forEach((s, i) => {
      stepMenu.innerHTML += `<div class="me-dropdown-item" data-val="${i+1}">Шаг ${i+1}</div>`;
    });
  }
});

// Закрытие модалок
document.getElementById('timerListClose').addEventListener('click', () => modalTimerList.style.display = 'none');
document.getElementById('timerNewClose').addEventListener('click', () => modalTimerNew.style.display = 'none');

// Удаление таймера из списка
timerListEl.addEventListener('click', async (e) => {
  if (e.target.classList.contains('timer-item-del')) {
    const id = e.target.dataset.id;
    await Storage.deleteTimer(id);
    await renderTimerList();
  }
});

// Кнопка Запустить
document.getElementById('timerStartBtn').addEventListener('click', startNewTimer);

// Дропдаун шагов
document.getElementById('timerStepMenu').addEventListener('click', (e) => {
  if (e.target.classList.contains('me-dropdown-item')) {
    const val = e.target.dataset.val;
    const dd = document.querySelector('[data-field="timer-step"]');
    dd.dataset.val = val;
    dd.querySelector('.me-dd-label').textContent = e.target.textContent;
    dd.querySelectorAll('.me-dropdown-item').forEach(i => i.classList.remove('active'));
    e.target.classList.add('active');
    dd.classList.remove('open');
  }
});

// Уведомление: Остановить звук
document.getElementById('timerAlertStop').addEventListener('click', () => {
  stopAlarmSound();
  document.getElementById('timerAlertStop').style.display = 'none'; // прячем кнопку
});

// Уведомление: Закрыть
document.getElementById('timerAlertClose').addEventListener('click', () => {
  stopAlarmSound();
  timerAlert.style.display = 'none';
  document.getElementById('timerAlertStop').style.display = ''; // возвращаем кнопку для следующего раза
});

// Уведомление: Переход к рецепту
document.getElementById('timerAlertBody').addEventListener('click', () => {
  if (activeAlertTimer) {
    stopAlarmSound();
    timerAlert.style.display = 'none';
    document.getElementById('timerAlertStop').style.display = '';
    
    if (typeof closeRecipeCard === 'function') closeRecipeCard();
    if (typeof openRecipeCard === 'function') openRecipeCard(activeAlertTimer.recipeId);
    
    activeAlertTimer = null;
  }
});

// Инициализация колесиков при загрузке
initWheel(document.getElementById('tnHours'), 23, 'hours');
initWheel(document.getElementById('tnMins'), 59, 'mins');
initWheel(document.getElementById('tnSecs'), 59, 'secs');