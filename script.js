/* ==========================================================================
   Signature Setup & Co: shared behaviour
   Mirrors the interactions in landing.component.ts: a nav that frosts on
   scroll, a hamburger pane, and scroll-triggered reveals. Adds a lightbox
   for the service-page image grids.
   ========================================================================== */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Navigation: frost on scroll ---------- */
  var navbar = document.querySelector('.navbar');
  var navLinks = document.querySelector('.nav-links');
  var hamburger = document.querySelector('.hamburger');

  function syncNav() {
    if (!navbar) return;
    var menuOpen = navLinks && navLinks.classList.contains('open');
    navbar.classList.toggle('scrolled', window.scrollY > 30 || menuOpen);
  }

  window.addEventListener('scroll', syncNav, { passive: true });
  syncNav();

  /* ---------- Service menu: hover on desktop, tap to expand on mobile ----------
     The panel's top padding bridges the gap to the nav item, and a short close
     delay covers any diagonal cursor travel, so the menu never snaps shut
     while you are reaching for it. */
  var DESKTOP = '(min-width: 1181px)';
  var CLOSE_DELAY = 220;
  var menuItems = Array.prototype.slice.call(document.querySelectorAll('.nav-item.has-menu'));

  function isDesktop() { return window.matchMedia(DESKTOP).matches; }

  function closeMenu(item) {
    item.classList.remove('open');
    var toggle = item.querySelector('.nav-toggle');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  }

  function closeAllMenus(except) {
    menuItems.forEach(function (item) {
      if (item !== except) closeMenu(item);
    });
  }

  menuItems.forEach(function (item) {
    var toggle = item.querySelector('.nav-toggle');
    var timer = null;

    function open() {
      window.clearTimeout(timer);
      closeAllMenus(item);
      item.classList.add('open');
      if (toggle) toggle.setAttribute('aria-expanded', 'true');
    }

    function scheduleClose() {
      window.clearTimeout(timer);
      timer = window.setTimeout(function () { closeMenu(item); }, CLOSE_DELAY);
    }

    item.addEventListener('mouseenter', function () { if (isDesktop()) open(); });
    item.addEventListener('mouseleave', function () { if (isDesktop()) scheduleClose(); });

    // Keyboard: opening on focus lets Tab walk straight into the panel
    item.addEventListener('focusin', function () { if (isDesktop()) open(); });
    item.addEventListener('focusout', function (event) {
      if (isDesktop() && !item.contains(event.relatedTarget)) closeMenu(item);
    });

    if (toggle) {
      toggle.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        window.clearTimeout(timer);
        if (item.classList.contains('open')) {
          closeMenu(item);
        } else {
          open();
        }
      });
    }
  });

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    var open = document.querySelector('.nav-item.has-menu.open');
    if (!open) return;
    closeAllMenus();
    var parent = open.querySelector('.nav-parent-row a');
    if (parent) parent.focus();
  });

  // Clicking away closes an open panel
  document.addEventListener('click', function (event) {
    if (!event.target.closest || !event.target.closest('.nav-item.has-menu')) closeAllMenus();
  });

  // Crossing the breakpoint leaves stale state behind otherwise
  window.matchMedia(DESKTOP).addEventListener('change', function () { closeAllMenus(); });

  if (hamburger && navLinks) {
    function closeNav() {
      if (!navLinks.classList.contains('open')) return;
      navLinks.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      closeAllMenus();
      syncNav();
    }

    hamburger.addEventListener('click', function () {
      var open = navLinks.classList.toggle('open');
      hamburger.classList.toggle('open', open);
      hamburger.setAttribute('aria-expanded', String(open));
      if (!open) closeAllMenus();
      syncNav();
    });

    // Close the pane after tapping a link (the chevron is a button, so it is
    // not caught here and can expand its submenu in place)
    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeNav);
    });

    // Tapping anywhere off the pane closes it. The hamburger lives inside
    // .navbar, so this never fights its own toggle.
    document.addEventListener('click', function (event) {
      if (!event.target.closest || !event.target.closest('.navbar')) closeNav();
    });

    // Escape closes the pane too, matching the submenu behaviour above
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeNav();
    });
  }

  /* ---------- Back to top (phones only) ----------
     Injected rather than added to five templates. Hidden above 768px by CSS. */
  var toTop = document.createElement('button');
  toTop.className = 'to-top';
  toTop.type = 'button';
  toTop.setAttribute('aria-label', 'Back to top');
  toTop.innerHTML =
    '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<polyline points="3 7.5 7 3.5 11 7.5"/><line x1="7" y1="3.5" x2="7" y2="11"/></svg>';
  document.body.appendChild(toTop);

  var TOP_SHOW_AT = 600;
  var topTicking = false;

  function syncToTop() {
    toTop.classList.toggle('visible', window.scrollY > TOP_SHOW_AT);
    topTicking = false;
  }

  window.addEventListener('scroll', function () {
    if (topTicking) return;
    topTicking = true;
    window.requestAnimationFrame(syncToTop);
  }, { passive: true });

  syncToTop();

  toTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  /* ---------- Mark the current page in the nav ---------- */
  var here = window.location.pathname.split('/').pop() || 'index.html';
  var currentSelector = '.nav-home, .nav-parent-row a, .footer-nav a';
  document.querySelectorAll(currentSelector).forEach(function (link) {
    var target = (link.getAttribute('href') || '').split('#')[0].split('/').pop();
    if (target && target === here && !link.classList.contains('nav-cta')) {
      link.classList.add('is-current');
      link.setAttribute('aria-current', 'page');
    }
  });

  /* ---------- Scroll reveals ---------- */
  var fadeEls = document.querySelectorAll('.fade-el');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    fadeEls.forEach(function (el) { el.classList.add('visible'); });
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    fadeEls.forEach(function (el) { observer.observe(el); });
  }

  /* ---------- Smooth in-page anchors ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      var id = link.getAttribute('href');
      if (!id || id === '#') return;
      var target = document.querySelector(id);
      if (!target) return;
      event.preventDefault();
      var top = target.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: top, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  });

  /* ---------- Enquiry list ----------
     Products are added to a running list, the floating bar shows the count,
     and the enquiry form is pre-filled with the selection so a browse turns
     into a specific enquiry without the visitor retyping anything. */
  var itemButtons = Array.prototype.slice.call(document.querySelectorAll('[data-item]'));
  var itemsField = document.getElementById('enquiryItems');
  var summaryList = document.getElementById('enquiryItemsList');
  var summaryCount = document.getElementById('enquiryItemsCount');

  if (itemButtons.length || itemsField) {
    var STORE = 'ssc-enquiry-v1';

    // Persisted, so a list built on the stationery page survives the jump to
    // florals or planning. Falls back to memory if storage is unavailable.
    var picked = (function () {
      try {
        var raw = window.localStorage.getItem(STORE);
        var parsed = raw ? JSON.parse(raw) : [];
        return Object.prototype.toString.call(parsed) === '[object Array]' ? parsed : [];
      } catch (e) {
        return [];
      }
    })();

    function save() {
      try {
        window.localStorage.setItem(STORE, JSON.stringify(picked));
      } catch (e) { /* private mode: stays in memory for this page */ }
    }

    var bar = document.createElement('div');
    bar.className = 'enquiry-bar';
    bar.innerHTML =
      '<button class="enquiry-bar-count" type="button" aria-expanded="false">' +
      '<span class="label"></span><span class="chev" aria-hidden="true">&#9662;</span></button>' +
      '<a class="enquiry-bar-go" href="#enquire">Enquire</a>';

    var panel = document.createElement('div');
    panel.className = 'enquiry-panel';
    panel.innerHTML =
      '<div class="enquiry-panel-head"><p>Your enquiry</p>' +
      '<button class="enquiry-panel-clear" type="button">Clear all</button></div>' +
      '<ul class="enquiry-panel-list"></ul>' +
      '<div class="enquiry-panel-foot"><a class="enquiry-bar-go" href="#enquire">Send enquiry</a></div>';

    document.body.appendChild(panel);
    document.body.appendChild(bar);

    var labelEl = bar.querySelector('.label');
    var countBtn = bar.querySelector('.enquiry-bar-count');
    var listEl = panel.querySelector('.enquiry-panel-list');

    function closePanel() {
      panel.classList.remove('open');
      countBtn.setAttribute('aria-expanded', 'false');
    }

    // One row of the list. Built for both the floating panel and the summary
    // in the form, so the two readings of the selection cannot drift apart.
    function buildRow(entry, i) {
      var split = entry.indexOf(': ');
      var group = split === -1 ? '' : entry.slice(0, split);
      var name = split === -1 ? entry : entry.slice(split + 2);

      var li = document.createElement('li');
      var txt = document.createElement('span');
      txt.className = 'txt';
      if (group) {
        var g = document.createElement('span');
        g.className = 'grp';
        g.textContent = group;
        txt.appendChild(g);
      }
      var nm = document.createElement('span');
      nm.className = 'nm';
      nm.textContent = name;
      txt.appendChild(nm);

      var rm = document.createElement('button');
      rm.type = 'button';
      rm.className = 'enquiry-remove';
      rm.innerHTML = '&#10005;';
      rm.setAttribute('aria-label', 'Remove ' + name);
      rm.addEventListener('click', function () {
        picked.splice(i, 1);
        save();
        render();
      });

      li.appendChild(txt);
      li.appendChild(rm);
      return li;
    }

    function fill(target, entries) {
      target.innerHTML = '';
      entries.forEach(function (entry, i) { target.appendChild(buildRow(entry, i)); });
    }

    function render() {
      var n = picked.length;
      var count = n === 1 ? '1 item' : n + ' items';
      bar.classList.toggle('visible', n > 0);
      if (!n) closePanel();
      labelEl.textContent = count;

      // Numbered, so the emailed selection reads as a list rather than a blob
      if (itemsField) {
        itemsField.value = picked.map(function (entry, i) {
          return (i + 1) + '. ' + entry;
        }).join('\n');
      }

      fill(listEl, picked);

      // The same list again at the point of sending, so the visitor can see
      // exactly what goes with the enquiry and drop anything they changed
      // their mind about without hunting back up the page.
      if (summaryList) {
        if (n) {
          fill(summaryList, picked);
        } else {
          var empty = document.createElement('li');
          empty.className = 'is-empty';
          empty.textContent =
            'Nothing added yet. Browse the collection and tap “Add to enquiry” on anything you like.';
          summaryList.innerHTML = '';
          summaryList.appendChild(empty);
        }
      }

      if (summaryCount) summaryCount.textContent = n ? count : '';

      // Buttons on THIS page reflect the shared list
      itemButtons.forEach(function (button) {
        var on = picked.indexOf(button.getAttribute('data-item')) !== -1;
        button.classList.toggle('is-added', on);
        button.textContent = on ? 'Added' : 'Add to enquiry';
        button.setAttribute('aria-pressed', String(on));
      });
    }

    itemButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        var name = button.getAttribute('data-item');
        var at = picked.indexOf(name);
        if (at === -1) { picked.push(name); } else { picked.splice(at, 1); }
        save();
        render();
      });
    });

    countBtn.addEventListener('click', function () {
      var open = panel.classList.toggle('open');
      countBtn.setAttribute('aria-expanded', String(open));
    });

    panel.querySelector('.enquiry-panel-clear').addEventListener('click', function () {
      picked = [];
      save();
      render();
    });

    // While the enquiry bar is up it owns the bottom of the screen, so the
    // back-to-top button rides inside it, to the right of Enquire, rather
    // than floating over it. It moves back out when the bar goes away.
    if (window.MutationObserver) {
      var placeToTop = function () {
        if (!toTop) return;
        if (bar.classList.contains('visible')) {
          if (toTop.parentNode !== bar) bar.appendChild(toTop);
          toTop.classList.add('to-top--in-bar');
        } else {
          if (toTop.parentNode !== document.body) document.body.appendChild(toTop);
          toTop.classList.remove('to-top--in-bar');
        }
      };
      new window.MutationObserver(placeToTop).observe(bar, {
        attributes: true, attributeFilter: ['class']
      });
      placeToTop();
    }

    Array.prototype.forEach.call(document.querySelectorAll('.enquiry-bar-go'), function (link) {
      link.addEventListener('click', function (event) {
        var target = document.getElementById('enquire');
        closePanel();
        if (!target) return;   // no form here, let it navigate
        event.preventDefault();
        window.scrollTo({
          top: target.getBoundingClientRect().top + window.scrollY - 80,
          behavior: reduceMotion ? 'auto' : 'smooth'
        });
      });
    });

    document.addEventListener('click', function (event) {
      if (!panel.classList.contains('open')) return;
      if (panel.contains(event.target) || bar.contains(event.target)) return;
      closePanel();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closePanel();
    });

    // Another tab changed the list
    window.addEventListener('storage', function (event) {
      if (event.key !== STORE) return;
      try { picked = JSON.parse(event.newValue) || []; } catch (e) { picked = []; }
      render();
    });

    window.sscClearEnquiry = function () { picked = []; save(); render(); };

    render();
  }

  /* ---------- Lightbox for the gallery grids ---------- */
  var galleryItems = Array.prototype.slice.call(
    document.querySelectorAll('.gallery-item, .product-media'));

  if (galleryItems.length) {
    var lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', 'Enlarged image');
    lightbox.innerHTML =
      '<button class="lightbox-close" type="button" aria-label="Close">&#10005;</button>' +
      '<button class="lightbox-nav lightbox-prev" type="button" aria-label="Previous image">&#8249;</button>' +
      '<img alt="">' +
      '<button class="lightbox-nav lightbox-next" type="button" aria-label="Next image">&#8250;</button>' +
      '<p class="lightbox-caption"></p>';
    document.body.appendChild(lightbox);

    var lbImage = lightbox.querySelector('img');
    var lbCaption = lightbox.querySelector('.lightbox-caption');
    var index = 0;
    var lastFocused = null;

    function show(i) {
      index = (i + galleryItems.length) % galleryItems.length;
      var source = galleryItems[index].querySelector('img');
      if (!source) return;
      lbImage.src = source.currentSrc || source.src;
      lbImage.alt = source.alt || '';
      lbCaption.textContent = source.alt || '';
    }

    function open(i) {
      lastFocused = document.activeElement;
      show(i);
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
      lightbox.querySelector('.lightbox-close').focus();
    }

    function close() {
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
      lbImage.removeAttribute('src');
      if (lastFocused) lastFocused.focus();
    }

    galleryItems.forEach(function (item, i) {
      item.addEventListener('click', function () { open(i); });
    });

    lightbox.querySelector('.lightbox-close').addEventListener('click', close);
    lightbox.querySelector('.lightbox-prev').addEventListener('click', function () { show(index - 1); });
    lightbox.querySelector('.lightbox-next').addEventListener('click', function () { show(index + 1); });

    lightbox.addEventListener('click', function (event) {
      if (event.target === lightbox) close();
    });

    document.addEventListener('keydown', function (event) {
      if (!lightbox.classList.contains('open')) return;
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowLeft') show(index - 1);
      if (event.key === 'ArrowRight') show(index + 1);
    });
  }

  /* ---------- Enquiry form (Formspree, no page navigation) ---------- */
  var form = document.getElementById('enquiryForm');

  if (form) {
    var status = document.getElementById('formStatus');
    var submit = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (status) status.textContent = 'Sending…';
      if (submit) submit.disabled = true;

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      })
        .then(function (response) {
          if (!response.ok) throw new Error('Request failed');
          form.reset();
          // the selection has been sent, so it should not follow them around
          if (typeof window.sscClearEnquiry === 'function') window.sscClearEnquiry();
          if (status) status.textContent = 'Thank you. Your enquiry is on its way and we will be in touch shortly.';
        })
        .catch(function () {
          if (status) {
            status.textContent = 'Something went wrong. Please email ssc.signaturesigns@gmail.com and we will pick it up from there.';
          }
        })
        .then(function () {
          if (submit) submit.disabled = false;
        });
    });
  }
})();
