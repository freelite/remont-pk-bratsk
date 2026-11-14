const WORKER_URL = 'https://tg-form-bratsk.prof3662.workers.dev/';

(() => {
  'use strict';
  const services = Array.isArray(window.PRICE_DATA) ? window.PRICE_DATA : [];
  const grid = document.querySelector('#service-grid');
  const tabs = document.querySelector('#category-tabs');
  const search = document.querySelector('#price-search');
  const count = document.querySelector('#results-count');
  const empty = document.querySelector('#empty-state');
  const categories = ['Все', ...new Set(services.map(item => item.category))];
  let activeCategory = 'Все';

  const categoryStyles = {
    'Диагностика': { icon: 'scan-search', tone: 'blue' },
    'Чистка от пыли': { icon: 'fan', tone: 'cyan' },
    'Windows': { icon: 'app-window', tone: 'violet' },
    'Комплектующие': { icon: 'memory-stick', tone: 'amber' },
    'Дополнительно': { icon: 'sparkles', tone: 'green' }
  };
  const styleFor = category => categoryStyles[category] || { icon: 'wrench', tone: 'blue' };
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const renderTabs = () => {
    tabs.innerHTML = categories.map(category => `<button class="tab-button${category === activeCategory ? ' active' : ''}" type="button" role="tab" aria-selected="${category === activeCategory}" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>`).join('');
  };
  const visibleServices = () => {
    const query = search.value.trim().toLocaleLowerCase('ru');
    return services.filter(item => (activeCategory === 'Все' || item.category === activeCategory) && `${item.title} ${item.description} ${item.category}`.toLocaleLowerCase('ru').includes(query));
  };
  const renderServices = () => {
    const filtered = visibleServices();
    grid.innerHTML = filtered.map(item => {
      const style = styleFor(item.category);
      return `<article class="service-card tone-${style.tone}"><div class="service-card-top"><span class="service-icon"><i class="icon icon-${style.icon}" aria-hidden="true"></i></span><span class="service-category">${escapeHtml(item.category)}</span></div><h3>${escapeHtml(item.title)}</h3>${item.description ? `<p class="service-desc">${escapeHtml(item.description)}</p>` : ''}<div class="service-card-bottom"><span class="service-price">${escapeHtml(item.price)}</span><button class="order-button" type="button" data-order-id="${escapeHtml(item.id)}">Заказать <i class="icon icon-arrow-up-right" aria-hidden="true"></i></button></div></article>`;
    }).join('');
    count.textContent = `Найдено услуг: ${filtered.length}`;
    empty.hidden = filtered.length > 0;
  };
  renderTabs();
  renderServices();
  tabs.addEventListener('click', event => {
    const button = event.target.closest('[data-category]');
    if (!button) return;
    activeCategory = button.dataset.category;
    renderTabs();
    renderServices();
  });
  search.addEventListener('input', renderServices);
  document.addEventListener('keydown', event => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      search.focus();
    }
    if (event.key === 'Escape') closeModal();
  });

  const modal = document.querySelector('#order-modal');
  const modalForm = document.querySelector('#modal-form');
  let previousFocus = null;
  function openModal(service) {
    previousFocus = document.activeElement;
    modalForm.elements.service.value = `${service.title} — ${service.price}`;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    window.setTimeout(() => modalForm.elements.name.focus(), 60);
  }
  function closeModal() {
    if (!modal.classList.contains('is-open')) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    previousFocus?.focus();
  }
  document.querySelector('[data-open-about-modal]')?.addEventListener('click', event => {
    event.preventDefault();
    openModal({ title: 'Вопрос мастеру', price: '' });
    modalForm.elements.service.value = 'Вопрос мастеру';
  });

  grid.addEventListener('click', event => {
    const button = event.target.closest('[data-order-id]');
    if (!button) return;
    const service = services.find(item => item.id === button.dataset.orderId);
    if (service) openModal(service);
  });
  modal.addEventListener('click', event => { if (event.target.closest('[data-close-modal]')) closeModal(); });

  const phoneDigits = value => value.replace(/\D/g, '').replace(/^8/, '7').slice(0, 11);
  const maskPhone = value => {
    const digits = phoneDigits(value);
    if (!digits) return '';
    const normalized = digits.startsWith('7') ? digits : `7${digits}`;
    const d = normalized.slice(1);
    let result = '+7';
    if (d.length) result += ` (${d.slice(0, 3)}`;
    if (d.length >= 3) result += ')';
    if (d.length > 3) result += ` ${d.slice(3, 6)}`;
    if (d.length > 6) result += `-${d.slice(6, 8)}`;
    if (d.length > 8) result += `-${d.slice(8, 10)}`;
    return result;
  };
  document.querySelectorAll('input[type="tel"]').forEach(input => {
    input.addEventListener('input', () => {
      input.value = maskPhone(input.value);
      input.classList.remove('invalid');
      input.setCustomValidity('');
    });
  });
  const toast = document.querySelector('#toast');
  let toastTimer;
  const showToast = (message, type = 'success') => {
    toast.querySelector('span').textContent = message;
    toast.style.background = type === 'success' ? '#166534' : '#991b1b';
    toast.style.color = '#fff';
    toast.style.border = `1px solid ${type === 'success' ? '#22c55e' : '#ef4444'}`;
    toast.style.boxShadow = `0 12px 32px ${type === 'success' ? 'rgba(34,197,94,.28)' : 'rgba(239,68,68,.28)'}`;
    const icon = toast.querySelector('i');
    icon.className = `icon ${type === 'success' ? 'icon-circle-check' : 'icon-circle-alert'}`;
    toast.classList.add('show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('show'), 6000);
  };
  const validForm = form => {
    const name = form.elements.name;
    const phone = form.elements.phone;
    name.setCustomValidity(name.value.trim().length >= 2 ? '' : 'Введите имя (не менее 2 символов).');
    const hasEnoughDigits = phoneDigits(phone.value).length >= 10;
    phone.setCustomValidity(hasEnoughDigits ? '' : 'Введите номер телефона не менее чем из 10 цифр.');
    form.querySelectorAll('input[required]').forEach(input => input.classList.toggle('invalid', !input.checkValidity()));
    if (!form.checkValidity()) {
      form.reportValidity();
      return false;
    }
    return true;
  };
  document.querySelectorAll('.contact-form').forEach(form => {
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (!validForm(form)) {
        if (phoneDigits(form.elements.phone.value).length < 10) {
          showToast('Проверьте номер телефона: нужно не менее 10 цифр.', 'error');
        }
        return;
      }
      const submitButton = form.querySelector('button[type="submit"]');
      const originalButtonHtml = submitButton.innerHTML;
      submitButton.disabled = true;
      submitButton.textContent = 'Отправка...';
      try {
        const fields = form.elements;
        const lines = [
          '🛠 <b>Новая заявка с сайта</b>',
          `👤 Имя: ${escapeHtml(fields.name.value.trim())}`,
          `📞 Телефон: <code>${escapeHtml(fields.phone.value.trim())}</code>`
        ];
        if (fields.service?.value.trim()) lines.push(`🔧 Услуга: ${escapeHtml(fields.service.value.trim())}`);
        if (fields.comment?.value.trim()) lines.push(`💬 Комментарий: ${escapeHtml(fields.comment.value.trim())}`);
        lines.push(`📍 Источник: ${form === modalForm ? 'Модальное окно' : 'Форма внизу страницы'}`);
        const messageText = lines.join('\n');
        const response = await fetch(WORKER_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: messageText })
        });
        if (!response.ok) throw new Error('Worker request failed');
        form.reset();
        form.querySelectorAll('.invalid').forEach(input => input.classList.remove('invalid'));
        if (form === modalForm) closeModal();
        showToast('Заявка принята! Дмитрий свяжется с вами в ближайшее время', 'success');
      } catch (error) {
        showToast('Не удалось отправить заявку. Позвоните напрямую по телефону из шапки сайта.', 'error');
      } finally {
        submitButton.innerHTML = originalButtonHtml;
        submitButton.disabled = false;
      }
    });
  });

  const serviceSelect = document.querySelector('#contact-form select[name="service"]');
  serviceSelect.insertAdjacentHTML('beforeend', services.map(item => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.title)} — ${escapeHtml(item.price)}</option>`).join(''));
  document.querySelector('#current-year').textContent = new Date().getFullYear();

  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.main-nav');
  menuButton.addEventListener('click', () => {
    const expanded = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!expanded));
    nav.classList.toggle('is-open', !expanded);
  });
  nav.addEventListener('click', event => {
    if (event.target.closest('a')) {
      nav.classList.remove('is-open');
      menuButton.setAttribute('aria-expanded', 'false');
    }
  });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }), { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
  } else {
    document.querySelectorAll('.reveal').forEach(element => element.classList.add('is-visible'));
  }
})();
