/* ============================================================
   BRIIX — burger menu (общая логика для всех страниц)
   Раньше жила только в landing.js, поэтому на presentation,
   investors и fin-model меню не работало.
   Управляется классами, не element.hidden: у .nav и .deck-menu
   есть собственный display, и [hidden] его не перебил бы.
   ============================================================ */
(function () {
  'use strict';

  document.querySelectorAll('.burger[aria-controls]').forEach(function (burger) {
    var menu = document.getElementById(burger.getAttribute('aria-controls'));
    if (!menu) return;

    function setOpen(open) {
      menu.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    burger.addEventListener('click', function (e) {
      e.stopPropagation();
      setOpen(!menu.classList.contains('open'));
    });

    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });

    document.addEventListener('click', function (e) {
      if (!menu.classList.contains('open')) return;
      if (menu.contains(e.target) || burger.contains(e.target)) return;
      setOpen(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || !menu.classList.contains('open')) return;
      setOpen(false);
      burger.focus();
    });
  });
}());
