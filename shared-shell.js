// Shared app-shell mechanism: sticky header with a hamburger button that
// opens a nav-drawer (scrim + slide-out list of .nav-link items), and
// single-section-at-a-time content switching by data-section / #hash,
// matching data-section on .nav-link to id="section-<name>" on a
// .workspace-section. This is the exact mechanism cases/DFAPTI-BB-2026-00001/
// dfapti/app.js uses; every other stage page reuses it via this file
// instead of re-implementing it.
(function (global) {
  "use strict";

  function initShell(options) {
    options = options || {};
    var sections = options.sections || [];
    var defaultSection = options.defaultSection || (sections[0] || null);
    var onShow = options.onShow || function () {};

    function showSection(name, opts) {
      opts = opts || {};
      if (sections.indexOf(name) === -1) name = defaultSection;
      document.querySelectorAll(".workspace-section").forEach(function (section) {
        section.hidden = section.id !== "section-" + name;
      });
      document.querySelectorAll(".nav-link[data-section]").forEach(function (link) {
        link.classList.toggle("active", link.dataset.section === name);
      });
      closeDrawer();
      var hash = "#" + name;
      try {
        if (opts.replace) history.replaceState(null, "", hash);
        else history.pushState(null, "", hash);
      } catch (e) { /* ignore */ }
      if (!opts.silent) window.scrollTo(0, 0);
      onShow(name);
    }

    function openDrawer() {
      var drawer = document.getElementById("nav-drawer");
      var scrim = document.getElementById("nav-scrim");
      var toggle = document.getElementById("menu-toggle");
      if (drawer) drawer.hidden = false;
      if (scrim) scrim.hidden = false;
      if (toggle) toggle.setAttribute("aria-expanded", "true");
    }

    function closeDrawer() {
      var drawer = document.getElementById("nav-drawer");
      var scrim = document.getElementById("nav-scrim");
      var toggle = document.getElementById("menu-toggle");
      if (drawer) drawer.hidden = true;
      if (scrim) scrim.hidden = true;
      if (toggle) toggle.setAttribute("aria-expanded", "false");
    }

    function parseHash() {
      var raw = (window.location.hash || "").replace("#", "");
      return sections.indexOf(raw) !== -1 ? raw : defaultSection;
    }

    var menuToggle = document.getElementById("menu-toggle");
    if (menuToggle) {
      menuToggle.addEventListener("click", function () {
        var drawer = document.getElementById("nav-drawer");
        var isOpen = drawer && !drawer.hidden;
        if (isOpen) closeDrawer(); else openDrawer();
      });
    }
    var scrimEl = document.getElementById("nav-scrim");
    if (scrimEl) scrimEl.addEventListener("click", closeDrawer);

    document.querySelectorAll('.nav-link[data-section]').forEach(function (link) {
      link.addEventListener("click", function () {
        showSection(link.dataset.section);
      });
    });

    window.addEventListener("popstate", function () {
      showSection(parseHash(), { replace: true, silent: true });
    });

    if (sections.length) {
      showSection(parseHash(), { replace: true, silent: true });
    }

    return { showSection: showSection, openDrawer: openDrawer, closeDrawer: closeDrawer };
  }

  global.MayhemShell = { init: initShell };
})(window);
