/* ============================================================
   BRIIX — theme toggle (light / dark)
   Начальное значение ставит инлайновый скрипт в <head> (без мигания).
   Здесь — только переключение и синхронизация кнопок.
   ============================================================ */
(function () {
  'use strict';

  var KEY = 'briix-theme';

  function current() {
    return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
  }

  function syncButtons(theme) {
    document.querySelectorAll('.theme-toggle').forEach(function (btn) {
      btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    });
    document.documentElement.classList.toggle('is-dark', theme === 'dark');
  }

  function apply(theme, save) {
    document.documentElement.dataset.theme = theme;
    if (save) {
      try { localStorage.setItem(KEY, theme); } catch (e) {}
    }
    syncButtons(theme);
  }

  document.querySelectorAll('.theme-toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
      apply(current() === 'dark' ? 'light' : 'dark', true);
    });
  });

  syncButtons(current());

  /* Реакция на системную смену, пока пользователь не выбрал тему сам */
  try {
    if (!localStorage.getItem(KEY) && window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
        if (!localStorage.getItem(KEY)) apply(e.matches ? 'dark' : 'light', false);
      });
    }
  } catch (e) {}
})();
