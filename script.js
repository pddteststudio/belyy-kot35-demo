/* «Белый кот» — independent, privacy-respecting website concept.
   No analytics, no remote submission, no fabricated pricing. */
(() => {
  'use strict';
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const state = {
    city: 'Вологда',
    nextId: 2,
    carpets: [{ id: 1, length: '3', width: '2', qty: '1', pile: 'Обычный' }],
    furniture: 'Диван',
    photoUrl: null,
    photoName: ''
  };

  let toastTimeout;
  function toast(text) {
    const el = $('#toast');
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => el.classList.remove('show'), 3400);
  }
  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const temp = document.createElement('textarea');
        temp.value = text;
        temp.style.position = 'fixed';
        temp.style.opacity = '0';
        temp.style.pointerEvents = 'none';
        document.body.append(temp);
        temp.select();
        const ok = document.execCommand('copy');
        temp.remove();
        if (!ok) throw new Error('Clipboard unavailable');
      }
      toast('Запрос скопирован. Его можно отправить компании в VK.');
    } catch (_) {
      toast('Не удалось скопировать. Откройте сайт через HTTPS или localhost.');
    }
  }

  // Menu and global city preference. Nothing stored on a remote server.
  const cityTrigger = $('#city-trigger');
  const cityMenu = $('#city-menu');
  function closeCityMenu() {
    cityMenu.hidden = true;
    cityTrigger.setAttribute('aria-expanded', 'false');
  }
  function setCity(city) {
    if (!['Вологда', 'Череповец'].includes(city)) return;
    state.city = city;
    $$('[data-city]').forEach(el => el.textContent = city);
    $('#calc-city').value = city;
    $$('[data-city-choice]').forEach(el => {
      el.classList.toggle('active', el.dataset.cityChoice === city);
      if (el.hasAttribute('aria-pressed')) el.setAttribute('aria-pressed', String(el.dataset.cityChoice === city));
    });
    closeCityMenu();
  }
  cityTrigger.addEventListener('click', () => {
    cityMenu.hidden = !cityMenu.hidden;
    cityTrigger.setAttribute('aria-expanded', String(!cityMenu.hidden));
  });
  $$('[data-city-choice]').forEach(button => button.addEventListener('click', () => setCity(button.dataset.cityChoice)));
  $('#calc-city').addEventListener('change', event => setCity(event.target.value));
  document.addEventListener('click', event => {
    if (!cityMenu.hidden && !cityMenu.contains(event.target) && !cityTrigger.contains(event.target)) closeCityMenu();
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeCityMenu(); });

  const mobileToggle = $('#menu-toggle');
  const mobileNav = $('#mobile-nav');
  mobileToggle.addEventListener('click', () => {
    const shouldShow = mobileNav.hidden;
    mobileNav.hidden = !shouldShow;
    mobileToggle.setAttribute('aria-expanded', String(shouldShow));
  });
  $$('#mobile-nav a').forEach(link => link.addEventListener('click', () => {
    mobileNav.hidden = true;
    mobileToggle.setAttribute('aria-expanded', 'false');
  }));

  // Multi-carpet calculation. Each entry can have different dimensions, pile and quantity.
  const carpetList = $('#carpet-list');
  const num = raw => raw !== '' && raw !== null && raw !== undefined ? Number(raw) : NaN;
  const areaFor = c => num(c.length) * num(c.width) * num(c.qty);
  const fmt = value => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(value);
  function carpetError(c) {
    if (!(num(c.length) >= 0.2 && num(c.length) <= 20)) return 'Длина должна быть от 0,2 до 20 м.';
    if (!(num(c.width) >= 0.2 && num(c.width) <= 20)) return 'Ширина должна быть от 0,2 до 20 м.';
    if (!(Number.isInteger(num(c.qty)) && num(c.qty) >= 1 && num(c.qty) <= 10)) return 'Количество ковров должно быть от 1 до 10.';
    if (areaFor(c) > 500) return 'Уточните размеры: площадь одной позиции не должна превышать 500 м².';
    return '';
  }
  const escapeAttribute = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
  function renderCarpets() {
    carpetList.innerHTML = state.carpets.map((c, index) => `
      <div class="carpet-item" data-carpet-id="${c.id}">
        <div class="carpet-item-top"><span class="carpet-title"><span class="carpet-indicator"><svg class="ui-icon" aria-hidden="true"><use href="#ico-blanket"/></svg></span> Ковёр ${index + 1}</span>
          ${state.carpets.length > 1 ? `<button type="button" class="remove-carpet" data-remove-carpet="${c.id}" aria-label="Удалить ковёр ${index + 1}"><svg class="ui-icon"><use href="#ico-close"/></svg></button>` : ''}
        </div>
        <div class="carpet-fields">
          <div class="carpet-field"><label for="carpet-l-${c.id}">Длина, м</label><input id="carpet-l-${c.id}" type="number" step="0.1" min="0.2" max="20" inputmode="decimal" data-carpet-field="length" value="${escapeAttribute(c.length)}" aria-label="Длина ковра ${index + 1} в метрах"/></div>
          <div class="carpet-field"><label for="carpet-w-${c.id}">Ширина, м</label><input id="carpet-w-${c.id}" type="number" step="0.1" min="0.2" max="20" inputmode="decimal" data-carpet-field="width" value="${escapeAttribute(c.width)}" aria-label="Ширина ковра ${index + 1} в метрах"/></div>
          <div class="carpet-field"><label for="carpet-q-${c.id}">Кол-во, шт.</label><input id="carpet-q-${c.id}" type="number" step="1" min="1" max="10" data-carpet-field="qty" value="${escapeAttribute(c.qty)}" aria-label="Количество ковров вида ${index + 1}"/></div>
        </div>
        <div class="carpet-item-foot"><span>Тип ворса</span><span><select data-carpet-field="pile" aria-label="Тип ворса ковра ${index + 1}" style="border:none;background:transparent;min-height:auto;width:auto;padding:0 22px 0 0;font-size:11px;font-weight:800;color:#3d776a;"><option ${c.pile === 'Короткий' ? 'selected' : ''}>Короткий</option><option ${c.pile === 'Обычный' ? 'selected' : ''}>Обычный</option><option ${c.pile === 'Длинный' ? 'selected' : ''}>Длинный</option><option ${c.pile === 'Не знаю' ? 'selected' : ''}>Не знаю</option></select></span></div>
        <div class="carpet-item-foot"><span>Площадь позиции</span><span data-item-area="${c.id}">${carpetError(c) ? '—' : fmt(areaFor(c)) + ' м²'}</span></div>
      </div>`).join('');
    const add = $('#add-carpet');
    add.disabled = state.carpets.length >= 8;
    add.title = add.disabled ? 'Максимум восемь позиций' : '';
    updateTotal();
  }
  function updateTotal() {
    let quantity = 0, area = 0, firstError = '';
    for (const c of state.carpets) {
      const error = carpetError(c);
      if (error && !firstError) firstError = error;
      if (!error) {
        quantity += num(c.qty);
        area += areaFor(c);
      }
      const areaElement = $(`[data-item-area="${c.id}"]`);
      if (areaElement) areaElement.textContent = error ? '—' : `${fmt(areaFor(c))} м²`;
    }
    $('#total-area').textContent = firstError ? '—' : `${fmt(area)} м²`;
    $('#total-qty').textContent = firstError ? '—' : `${quantity} шт.`;
    const errorEl = $('#calc-error');
    errorEl.hidden = !firstError;
    errorEl.textContent = firstError;
    $('#copy-carpet').disabled = !!firstError;
  }
  carpetList.addEventListener('input', event => {
    const field = event.target.dataset.carpetField;
    if (!field) return;
    const item = event.target.closest('[data-carpet-id]');
    const carpet = state.carpets.find(c => c.id === Number(item?.dataset.carpetId));
    if (!carpet) return;
    carpet[field] = event.target.value;
    updateTotal();
  });
  carpetList.addEventListener('change', event => {
    const field = event.target.dataset.carpetField;
    if (!field) return;
    const item = event.target.closest('[data-carpet-id]');
    const carpet = state.carpets.find(c => c.id === Number(item?.dataset.carpetId));
    if (!carpet) return;
    carpet[field] = event.target.value;
    updateTotal();
  });
  carpetList.addEventListener('click', event => {
    const button = event.target.closest('[data-remove-carpet]');
    if (!button || state.carpets.length === 1) return;
    state.carpets = state.carpets.filter(c => c.id !== Number(button.dataset.removeCarpet));
    renderCarpets();
  });
  $('#add-carpet').addEventListener('click', () => {
    if (state.carpets.length >= 8) return;
    state.carpets.push({ id: state.nextId++, length: '2', width: '1.5', qty: '1', pile: 'Обычный' });
    renderCarpets();
    $(`#carpet-l-${state.carpets[state.carpets.length - 1].id}`)?.focus();
  });
  $('#copy-carpet').addEventListener('click', () => {
    if (state.carpets.some(carpetError)) return;
    const rows = state.carpets.map((c, idx) => `Ковёр ${idx + 1}: ${c.length} × ${c.width} м, ${c.qty} шт., ворс: ${c.pile}, площадь: ${fmt(areaFor(c))} м²`);
    const total = state.carpets.reduce((sum, c) => sum + areaFor(c), 0);
    const count = state.carpets.reduce((sum, c) => sum + Number(c.qty), 0);
    const text = `Здравствуйте! Хочу уточнить стоимость стирки ковров в «Белом коте».\nГород: ${state.city}\n\n${rows.join('\n')}\n\nВсего: ${count} шт., ${fmt(total)} м².\nЗагрязнения: ${$('#carpet-problem').value}.\nЗабор и доставка: ${$('#pickup').checked ? 'нужны' : 'не нужны'}.\n\nПодскажите ориентировочную стоимость, сроки и условия. Спасибо!`;
    copyText(text);
  });
  renderCarpets();

  // Honest illustrative split-view, NOT actual customer photographs.
  const range = $('#compare-range');
  const frame = $('#compare-frame');
  const updateSplit = () => frame.style.setProperty('--split', `${range.value}%`);
  range.addEventListener('input', updateSplit);
  updateSplit();
  $$('[data-example]').forEach(button => button.addEventListener('click', () => {
    $$('[data-example]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
    frame.dataset.example = button.dataset.example;
  }));

  // Furniture request and local photo preview.
  $$('[data-furniture]').forEach(button => button.addEventListener('click', () => {
    state.furniture = button.dataset.furniture;
    $$('[data-furniture]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
  }));
  const fileInput = $('#furniture-photo');
  function clearPhoto() {
    fileInput.value = '';
    if (state.photoUrl) URL.revokeObjectURL(state.photoUrl);
    state.photoUrl = null;
    state.photoName = '';
    $('#photo-preview').hidden = true;
    $('#photo-img').removeAttribute('src');
    $('#photo-label').innerHTML = '<strong>Добавить фотографию</strong><small>Только локальный предпросмотр. Фото не загружается на сервер.</small>';
  }
  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (!file) { clearPhoto(); return; }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      clearPhoto(); toast('Поддерживаются JPG, PNG или WebP.'); return;
    }
    if (file.size > 8 * 1024 * 1024) {
      clearPhoto(); toast('Для предпросмотра выберите фото до 8 МБ.'); return;
    }
    if (state.photoUrl) URL.revokeObjectURL(state.photoUrl);
    state.photoUrl = URL.createObjectURL(file);
    state.photoName = file.name;
    $('#photo-img').src = state.photoUrl;
    $('#photo-preview').hidden = false;
    $('#photo-label').replaceChildren();
    const strong = document.createElement('strong'); strong.textContent = file.name;
    const small = document.createElement('small'); small.textContent = 'Фото показано локально. Для отправки приложите его в VK самостоятельно.';
    $('#photo-label').append(strong, small);
  });
  $('#photo-remove').addEventListener('click', clearPhoto);
  $('#copy-furniture').addEventListener('click', () => {
    const comment = $('#furniture-comment').value.trim();
    const text = `Здравствуйте! Хочу уточнить возможность и стоимость химчистки мебели в «Белом коте».\nГород: ${state.city}\nИзделие: ${state.furniture}\nЗагрязнения: ${$('#furniture-problem').value}\n${comment ? `Комментарий: ${comment}\n` : ''}${state.photoName ? 'Есть фотография изделия, могу прислать её отдельно.\n' : ''}\nПодскажите условия, ориентировочную цену и возможность выезда. Спасибо!`;
    copyText(text);
  });
  window.addEventListener('pagehide', () => { if (state.photoUrl) URL.revokeObjectURL(state.photoUrl); });

  // Progressive enhancements and gentle on-scroll appearances.
  const toReveal = $$('.reveal');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px 60px 0px' });
    toReveal.forEach(el => observer.observe(el));
  } else {
    toReveal.forEach(el => el.classList.add('is-visible'));
  }
})();
