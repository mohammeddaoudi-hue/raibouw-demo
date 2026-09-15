/* Rai Bouw — voorbeeldsite. Menu, voor-en-na-schuif, reviewspoor, formulier. */
(function () {
  'use strict';

  /* ---- blokken laten verschijnen bij het scrollen ---- */
  var blokken = Array.prototype.slice.call(document.querySelectorAll('.rb-op'));
  var rustig = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!blokken.length) { /* niets te doen */ }
  else if (rustig || !('IntersectionObserver' in window)) {
    blokken.forEach(function (e) { e.classList.add('is-zichtbaar'); });
  } else {
    // alles wat al in beeld staat meteen tonen, de rest volgt bij het scrollen
    var kijker = new IntersectionObserver(function (rijen) {
      rijen.forEach(function (r) {
        if (!r.isIntersecting) return;
        var el = r.target;
        var buren = el.parentElement ? Array.prototype.slice.call(el.parentElement.children).filter(function (k) { return k.classList.contains('rb-op'); }) : [];
        var plek = buren.indexOf(el);
        el.style.transitionDelay = (plek > 0 ? Math.min(plek, 5) * 70 : 0) + 'ms';
        el.classList.add('is-zichtbaar');
        kijker.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    blokken.forEach(function (e) {
      if (e.getBoundingClientRect().top < window.innerHeight * 0.92) e.classList.add('is-zichtbaar');
      else kijker.observe(e);
    });
  }


  /* ---- hero: doorlopend door de afgewerkte projecten ---- */
  var hero = document.querySelector('.rb-hero');
  if (hero) {
    var dias = Array.prototype.slice.call(hero.querySelectorAll('.rb-dia'));
    var tikken = Array.prototype.slice.call(hero.querySelectorAll('.rb-hero__tik'));
    var nu = 0, klok = null;
    var toonDia = function (i) {
      nu = (i + dias.length) % dias.length;
      dias.forEach(function (d, n) { d.classList.toggle('is-aan', n === nu); if (n === nu) { var im = d.querySelector('img'); if (im) im.loading = 'eager'; } });
      tikken.forEach(function (d, n) { d.classList.toggle('is-aan', n === nu); });
      var volg = dias[(nu + 1) % dias.length];
      if (volg) { var im2 = volg.querySelector('img'); if (im2) im2.loading = 'eager'; }
    };
    var start = function () { if (!rustig && dias.length > 1) { stop(); klok = setInterval(function () { toonDia(nu + 1); }, 6000); } };
    var stop = function () { if (klok) { clearInterval(klok); klok = null; } };
    hero.addEventListener('click', function (e) {
      var k = e.target.closest('button');
      if (!k || !k.dataset.dia) return;
      toonDia(k.dataset.dia === 'vorige' ? nu - 1 : nu + 1);
      start();
    });
    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
    start();
  }

  /* ---- mobiel menu ---- */
  var knop = document.querySelector('.rb-menuknop');
  var menu = document.getElementById('rb-mobielmenu');
  if (knop && menu) {
    knop.addEventListener('click', function () {
      var open = menu.classList.toggle('is-open');
      menu.hidden = !open;
      knop.setAttribute('aria-expanded', open ? 'true' : 'false');
      knop.setAttribute('aria-label', open ? 'Menu sluiten' : 'Menu openen');
    });
    menu.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        menu.classList.remove('is-open');
        menu.hidden = true;
        knop.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---- voor en na ---- */
  var schuif = document.querySelector('.rb-schuif');
  if (schuif) {
    var paren = Array.prototype.slice.call(schuif.querySelectorAll('.rb-schuif__paar'));
    var stippen = Array.prototype.slice.call(schuif.querySelectorAll('.rb-stip'));
    var huidig = 0;

    paren.forEach(function (paar) {
      var bereik = paar.querySelector('.rb-schuif__bereik');
      var voor = paar.querySelector('.rb-schuif__voor');
      var lijn = paar.querySelector('.rb-schuif__lijn');
      if (!bereik || !voor || !lijn) return;
      var zet = function () {
        var x = Number(bereik.value);
        voor.style.clipPath = 'inset(0 ' + (100 - x) + '% 0 0)';
        lijn.style.left = x + '%';
      };
      bereik.addEventListener('input', zet);
      bereik.addEventListener('change', zet);
      zet();
    });

    var toon = function (i) {
      huidig = (i + paren.length) % paren.length;
      paren.forEach(function (p, n) {
        p.hidden = n !== huidig;
        p.classList.toggle('is-aan', n === huidig);
      });
      stippen.forEach(function (s, n) { s.classList.toggle('is-aan', n === huidig); });
    };

    schuif.addEventListener('click', function (e) {
      var k = e.target.closest('button');
      if (!k) return;
      if (k.dataset.schuif === 'vorige') toon(huidig - 1);
      else if (k.dataset.schuif === 'volgende') toon(huidig + 1);
      else if (k.dataset.naar !== undefined) toon(Number(k.dataset.naar));
    });
  }

  /* ---- reviewspoor ---- */
  var spoor = document.querySelector('.rb-revspoor');
  var revknoppen = document.querySelectorAll('[data-rev]');
  if (spoor && revknoppen.length) {
    Array.prototype.forEach.call(revknoppen, function (k) {
      k.addEventListener('click', function () {
        var kaart = spoor.querySelector('.rb-rev');
        var stap = kaart ? kaart.getBoundingClientRect().width + 22 : 320;
        spoor.scrollBy({ left: k.dataset.rev === 'vorige' ? -stap : stap, behavior: 'smooth' });
      });
    });
  }

  /* ---- formulier: dit is een voorbeeldsite en verstuurt niets ---- */
  var form = document.querySelector('.rb-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bedankt = form.querySelector('.rb-form__bedankt');
      if (bedankt) bedankt.hidden = false;
    });
  }
})();
