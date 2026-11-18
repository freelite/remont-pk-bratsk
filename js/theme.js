(() => {
  const root = document.documentElement;
  const toggle = document.querySelector('.theme-toggle');
  const saved = localStorage.getItem('technoservice-theme');
  if (saved === 'light' || saved === 'dark') root.dataset.theme = saved;
  const updateButton = () => {
    const light = root.dataset.theme === 'light';
    const icon = toggle?.querySelector('use');
    if (icon) icon.setAttribute('href', `#icon-${light ? 'moon' : 'sun'}`);
    toggle?.setAttribute('aria-label', light ? 'Включить тёмную тему' : 'Включить светлую тему');
    toggle?.setAttribute('title', light ? 'Включить тёмную тему' : 'Включить светлую тему');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', light ? '#f4f7fc' : '#0f172a');
  };
  updateButton();
  toggle?.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('technoservice-theme', root.dataset.theme);
    updateButton();
  });
})();
