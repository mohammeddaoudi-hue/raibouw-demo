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


  /* ---- werkwijze: de bolletjes volgen de scroll ---- */
  var stappen = Array.prototype.slice.call(document.querySelectorAll('.rb-stap'));
  var werkwijze = document.querySelector('.rb-werkwijze');
  if (stappen.length && werkwijze) {
    if (rustig) {
      stappen.forEach(function (e) { e.classList.add('is-aan'); });
    } else {
      var wacht = false;
      var meet = function () {
        var r = werkwijze.getBoundingClientRect();
        var vh = window.innerHeight || 800;
        var begin = vh * 0.82;          // eerste bolletje kleurt zodra de sectie hier komt
        var eind = vh * 0.34;           // laatste bolletje kleurt hier
        var loop = (begin - r.top) / (begin - eind + r.height * 0.55);
        var p = Math.max(0, Math.min(1, loop));
        var n = Math.ceil(p * stappen.length);
        stappen.forEach(function (e, i) { e.classList.toggle('is-aan', i < n); });
      };
      var tik = function () {
        if (wacht) return;
        wacht = true;
        requestAnimationFrame(function () { wacht = false; meet(); });
      };
      window.addEventListener('scroll', tik, { passive: true });
      window.addEventListener('resize', tik);
      meet();
    }
  }


  /* ---- doorlopende banden: lopen vanzelf, en je kan ze zelf verslepen ---- */
  Array.prototype.forEach.call(document.querySelectorAll('.rb-loop'), function (loop) {
    var spoor = loop.querySelector('.rb-loop__spoor');
    if (!spoor) return;
    var merken = loop.classList.contains('rb-loop--merken');
    var snelheid = merken ? 0.28 : 0.42;
    var pauze = false, positie = 0, sleept = false, startX = 0, startPos = 0;

    var helft = function () { return spoor.scrollWidth / 2; };
    var wikkel = function () {
      var h = helft();
      if (!h) return;
      if (loop.scrollLeft >= h) loop.scrollLeft -= h;
      else if (loop.scrollLeft <= 0) loop.scrollLeft += h;
      positie = loop.scrollLeft;
    };

    var stap = function () {
      if (!pauze && !rustig && !sleept && loop.scrollWidth > loop.clientWidth) {
        positie += snelheid;
        loop.scrollLeft = positie;
        wikkel();
      }
      requestAnimationFrame(stap);
    };

    loop.addEventListener('pointerenter', function () { pauze = true; });
    loop.addEventListener('pointerleave', function () { pauze = false; positie = loop.scrollLeft; });

    loop.addEventListener('pointerdown', function (e) {
      sleept = true; startX = e.clientX; startPos = loop.scrollLeft;
      loop.classList.add('is-sleept');
      try { loop.setPointerCapture(e.pointerId); } catch (x) { /* oude browser */ }
    });
    loop.addEventListener('pointermove', function (e) {
      if (!sleept) return;
      loop.scrollLeft = startPos - (e.clientX - startX);
      wikkel();
      e.preventDefault();
    });
    var losLaten = function (e) {
      if (!sleept) return;
      sleept = false;
      loop.classList.remove('is-sleept');
      positie = loop.scrollLeft;
      try { loop.releasePointerCapture(e.pointerId); } catch (x) { /* al los */ }
    };
    loop.addEventListener('pointerup', losLaten);
    loop.addEventListener('pointercancel', losLaten);

    var rust;
    loop.addEventListener('scroll', function () {
      if (sleept) return;
      clearTimeout(rust);
      rust = setTimeout(function () { positie = loop.scrollLeft; wikkel(); }, 120);
    }, { passive: true });

    // een klik op een tegel mag niet afgaan na een sleepbeweging
    loop.addEventListener('click', function (e) {
      if (Math.abs(loop.scrollLeft - startPos) > 6) { e.preventDefault(); }
    }, true);

    requestAnimationFrame(stap);
    loop.__band = { loop: loop, spoor: spoor, wikkel: wikkel, zetPositie: function (x) { positie = x; } };
  });

  Array.prototype.forEach.call(document.querySelectorAll('[data-band]'), function (k) {
    k.addEventListener('click', function () {
      var loop = document.querySelector('.rb-real .rb-loop');
      if (!loop || !loop.__band) return;
      var tegel = loop.querySelector('.rb-tegel');
      var stapje = tegel ? tegel.getBoundingClientRect().width + 18 : 300;
      var heen = k.dataset.band === 'vorige' ? -1 : 1;
      loop.__band.wikkel();
      loop.scrollBy({ left: heen * stapje, behavior: 'smooth' });
      setTimeout(function () { loop.__band.zetPositie(loop.scrollLeft); loop.__band.wikkel(); }, 520);
    });
  });

  /* ---- mobiel menu ---- */
  var knop = document.querySelector('.rb-menuknop');
  var menu = document.getElementById('rb-mobielmenu');
  if (knop && menu) {
    knop.addEventListener('click', function () {
      var open = !menu.classList.contains('is-open');
      menu.hidden = false;
      requestAnimationFrame(function () { menu.classList.toggle('is-open', open); if (!open) menu.hidden = true; });
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
      var vak = paar.querySelector('.rb-schuif__vak');
      if (!bereik || !voor || !lijn || !vak) return;

      var zet = function (x) {
        x = Math.max(0, Math.min(100, x));
        bereik.value = x;
        voor.style.clipPath = 'inset(0 ' + (100 - x) + '% 0 0)';
        lijn.style.left = x + '%';
      };
      var uitPunt = function (e) {
        var r = vak.getBoundingClientRect();
        if (!r.width) return Number(bereik.value);
        return ((e.clientX - r.left) / r.width) * 100;
      };

      var sleept = false;
      vak.addEventListener('pointerdown', function (e) {
        sleept = true;
        try { vak.setPointerCapture(e.pointerId); } catch (x) { /* oude browser */ }
        zet(uitPunt(e));
        e.preventDefault();
      });
      vak.addEventListener('pointermove', function (e) {
        if (!sleept) return;
        zet(uitPunt(e));
        e.preventDefault();
      });
      var los = function (e) {
        if (!sleept) return;
        sleept = false;
        try { vak.releasePointerCapture(e.pointerId); } catch (x) { /* al los */ }
      };
      vak.addEventListener('pointerup', los);
      vak.addEventListener('pointercancel', los);
      vak.addEventListener('lostpointercapture', function () { sleept = false; });

      // het bereikveld blijft bestaan voor bediening met het toetsenbord
      bereik.addEventListener('input', function () { zet(Number(bereik.value)); });
      bereik.addEventListener('change', function () { zet(Number(bereik.value)); });
      zet(50);
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

  /* ---- reviewspoor: loopt oneindig rond ---- */
  var spoor = document.querySelector('.rb-revspoor');
  if (spoor) {
    var helft = function () { return spoor.scrollWidth / 2; };
    var stapBreedte = function () {
      var kaarten = spoor.querySelectorAll('.rb-rev');
      if (kaarten.length > 1) return kaarten[1].offsetLeft - kaarten[0].offsetLeft;
      return kaarten.length ? kaarten[0].getBoundingClientRect().width : 340;
    };
    var wikkel = function () {
      var h = helft();
      if (!h) return;
      var snap = spoor.style.scrollSnapType;
      spoor.style.scrollSnapType = 'none';
      if (spoor.scrollLeft >= h) spoor.scrollLeft -= h;
      else if (spoor.scrollLeft <= 0) spoor.scrollLeft += h;
      spoor.style.scrollSnapType = snap;
    };

    // starten in de eerste helft, zodat er naar beide kanten ruimte is
    var klaarzetten = function () { if (spoor.scrollLeft === 0) { spoor.scrollLeft = 0; } };
    klaarzetten();

    var rust;
    spoor.addEventListener('scroll', function () {
      clearTimeout(rust);
      rust = setTimeout(wikkel, 140);
    }, { passive: true });

    Array.prototype.forEach.call(document.querySelectorAll('[data-rev]'), function (k) {
      k.addEventListener('click', function () {
        var stap = stapBreedte();
        var h = helft();
        var heen = k.dataset.rev === 'vorige' ? -1 : 1;
        // vóór het schuiven omwikkelen, dan is er altijd spoor over
        if (h) {
          var snap = spoor.style.scrollSnapType;
          spoor.style.scrollSnapType = 'none';
          if (heen > 0 && spoor.scrollLeft + stap > h - 2) spoor.scrollLeft -= h;
          if (heen < 0 && spoor.scrollLeft - stap < 2) spoor.scrollLeft += h;
          spoor.style.scrollSnapType = snap;
        }
        spoor.scrollBy({ left: heen * stap, behavior: 'smooth' });
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
