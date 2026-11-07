// ==========================================================================
// Theme Controller (Apple Light / Dark Mode)
// Reference: .AI/DESIGN.md
// ==========================================================================

(function() {
  const THEME_KEY = 'refyrd_theme';

  function getPreferredTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    updateToggleButtons(theme);
  }

  function updateToggleButtons(theme) {
    const buttons = document.querySelectorAll('#theme-toggle, .nav-theme-btn');
    const isDark = theme === 'dark';
    buttons.forEach(btn => {
      const textSpan = btn.querySelector('#theme-text');
      const iconSpan = btn.querySelector('#theme-icon');
      if (textSpan) {
        textSpan.textContent = isDark ? 'Light' : 'Dark';
      }
      if (iconSpan) {
        iconSpan.textContent = isDark ? '☼' : '◐';
      }
      if (!textSpan && !iconSpan) {
        btn.textContent = isDark ? '☼ Light' : '◐ Dark';
      }
      btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
    });
  }

  // Initial apply immediately
  const initial = getPreferredTheme();
  document.documentElement.setAttribute('data-theme', initial);

  document.addEventListener('DOMContentLoaded', () => {
    updateToggleButtons(document.documentElement.getAttribute('data-theme') || initial);

    document.addEventListener('click', (e) => {
      const btn = e.target.closest('#theme-toggle, .nav-theme-btn');
      if (!btn) return;
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
    });
  });

  // Export helper for window if needed
  window.RefyrdTheme = {
    get: getPreferredTheme,
    set: applyTheme
  };
})();
