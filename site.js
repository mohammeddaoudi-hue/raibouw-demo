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
    var perSeconde = merken ? 26 : 38;      // pixels per seconde
    var pauze = false, sleept = false, startX = 0, startPos = 0;
    var positie = 0, vorigeTijd = 0;

    var helft = function () { return spoor.scrollWidth / 2; };

    // de float-positie is de waarheid. De browser rondt scrollLeft af, dus we lezen
    // hem tijdens het automatisch lopen nooit terug.
    var schrijf = function () {
      var h = helft();
      if (h > 0) {
        while (positie >= h) positie -= h;
        while (positie < 0) positie += h;
      }
      loop.scrollLeft = positie;
    };

    // na een eigen scroll of sleep de float weer gelijkzetten met wat de browser toont
    var synchroniseer = function () {
      var h = helft();
      positie = loop.scrollLeft;
      if (h > 0) {
        if (positie >= h) { positie -= h; loop.scrollLeft = positie; }
        else if (positie <= 0) { positie += h; loop.scrollLeft = positie; }
      }
    };

    var stap = function (tijd) {
      if (!vorigeTijd) vorigeTijd = tijd;
      var verschil = Math.min(tijd - vorigeTijd, 100) / 1000;
      vorigeTijd = tijd;
      if (!pauze && !rustig && !sleept && spoor.scrollWidth > loop.clientWidth) {
        positie += perSeconde * verschil;
        schrijf();
      }
      requestAnimationFrame(stap);
    };

    // alleen een muis pauzeert bij aanwijzen. Op een telefoon komt er na een tik
    // geen pointerleave, dan zou de band voorgoed blijven stilstaan.
    loop.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') pauze = true; });
    loop.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') { pauze = false; synchroniseer(); } });

    loop.addEventListener('pointerdown', function (e) {
      sleept = true; startX = e.clientX; startPos = loop.scrollLeft;
      loop.classList.add('is-sleept');
      try { loop.setPointerCapture(e.pointerId); } catch (x) { /* oude browser */ }
    });
    loop.addEventListener('pointermove', function (e) {
      if (!sleept) return;
      loop.scrollLeft = startPos - (e.clientX - startX);
      e.preventDefault();
    });
    var losLaten = function (e) {
      if (!sleept) return;
      sleept = false;
      loop.classList.remove('is-sleept');
      synchroniseer();
      if (e && e.pointerType !== 'mouse') pauze = false;
      try { loop.releasePointerCapture(e.pointerId); } catch (x) { /* al los */ }
    };
    loop.addEventListener('pointerup', losLaten);
    loop.addEventListener('pointercancel', losLaten);
    window.addEventListener('pointerup', function (e) { if (e.pointerType !== 'mouse') { sleept = false; pauze = false; } });
    document.addEventListener('visibilitychange', function () { if (!document.hidden) { vorigeTijd = 0; pauze = false; synchroniseer(); } });

    var rust;
    loop.addEventListener('scroll', function () {
      if (sleept || !pauze) return;   // tijdens het automatisch lopen niets terugleren
      clearTimeout(rust);
      rust = setTimeout(synchroniseer, 120);
    }, { passive: true });

    // een klik op een tegel mag niet afgaan na een sleepbeweging
    loop.addEventListener('click', function (e) {
      if (sleept || Math.abs(loop.scrollLeft - startPos) > 6) e.preventDefault();
    }, true);

    requestAnimationFrame(stap);
    loop.__band = {
      loop: loop, spoor: spoor,
      synchroniseer: synchroniseer,
      pauzeer: function (aan) { pauze = aan; if (!aan) vorigeTijd = 0; },
      stand: function () { return { pauze: pauze, sleept: sleept, positie: Math.round(positie), rustig: rustig }; },
    };
  });

  Array.prototype.forEach.call(document.querySelectorAll('[data-band]'), function (k) {
    k.addEventListener('click', function () {
      var loop = document.querySelector('.rb-real .rb-loop');
      if (!loop || !loop.__band) return;
      var tegel = loop.querySelector('.rb-tegel');
      var stapje = tegel ? tegel.getBoundingClientRect().width + 18 : 300;
      var heen = k.dataset.band === 'vorige' ? -1 : 1;
      // de automatische beweging even stilleggen, anders schrijft die de sprong meteen terug
      loop.__band.pauzeer(true);
      loop.__band.synchroniseer();
      loop.scrollBy({ left: heen * stapje, behavior: 'smooth' });
      setTimeout(function () {
        loop.__band.synchroniseer();
        loop.__band.pauzeer(false);
      }, 620);
    });
  });


  /* ---- zwevende belknop: verschijnt voorbij de hero ---- */
  var belKnop = document.querySelector('.rb-belzweef');
  if (belKnop) {
    var grens = function () {
      var hero = document.querySelector('.rb-hero') || document.querySelector('.rb-paginakop');
      return hero ? hero.offsetTop + hero.offsetHeight * 0.7 : 500;
    };
    var bezig = false;
    var kijk = function () {
      if (bezig) return;
      bezig = true;
      requestAnimationFrame(function () {
        bezig = false;
        belKnop.classList.toggle('is-zichtbaar', window.scrollY > grens());
      });
    };
    window.addEventListener('scroll', kijk, { passive: true });
    window.addEventListener('resize', kijk);
    kijk();
  }

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
