/* ============================================================
   BRIIX — бургер и панель меню
   ------------------------------------------------------------
   Общий для всех 8 страниц: лендинг (RU/EN), инвест-доки, финмодель
   и презентация. О содержимом страниц ничего не знает — ему нужны
   только .burger и .nav. Логика вынесена из landing.js, потому что
   внутренние страницы landing.js не грузят (issue #5, п. 2).
   ============================================================ */
(function () {
  'use strict';

  var burger = document.querySelector('.burger');
  var nav = document.querySelector('.nav');
  if (!burger || !nav) return;

  if (!burger.hasAttribute('aria-expanded')) {
    burger.setAttribute('aria-expanded', 'false');
  }
  if (nav.id && !burger.hasAttribute('aria-controls')) {
    burger.setAttribute('aria-controls', nav.id);
  }

  function isOpen() {
    return nav.classList.contains('open');
  }

  function openMenu() {
    nav.classList.add('open');
    burger.setAttribute('aria-expanded', 'true');
    var first = nav.querySelector('a, button');
    /* preventScroll: фокус не должен дёргать страницу под липкой шапкой */
    if (first) first.focus({ preventScroll: true });
  }

  function closeMenu(restoreFocus) {
    if (!isOpen()) return;
    nav.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    if (restoreFocus) burger.focus({ preventScroll: true });
  }

  burger.addEventListener('click', function () {
    if (isOpen()) closeMenu(true);
    else openMenu();
  });

  /* Пункт меню или кнопка в панели — переход, панель закрывается */
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a, button')) closeMenu(false);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu(true);
  });

  /* На лендинге бургер исчезает на ≥1280px — панель не должна оставаться
     открытой после ресайза. На внутренних страницах бургер виден всегда,
     поэтому условие именно «бургер скрыт», а не «ширина больше N». */
  var timer = null;
  window.addEventListener('resize', function () {
    clearTimeout(timer);
    timer = setTimeout(function () {
      if (isOpen() && getComputedStyle(burger).display === 'none') closeMenu(false);
    }, 120);
  });
})();
