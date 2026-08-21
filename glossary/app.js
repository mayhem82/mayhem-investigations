(function () {
  "use strict";

  var el = MayhemDOM.el, kv = MayhemDOM.kv, recordCard = MayhemDOM.recordCard,
      slug = MayhemDOM.slug, fetchJSON = MayhemDOM.fetchJSON;

  function renderSource(sourceStr) {
    if (!sourceStr) return el("div", { class: "glossary-source" }, ["-"]);
    var parts = sourceStr.split(/\s*;\s*/);
    var wrap = el("div", { class: "stack" });
    parts.forEach(function (part) {
      var m = part.match(/https?:\/\/\S+/);
      if (m) {
        var url = m[0].replace(/[)\].,]+$/, "");
        var prefix = part.slice(0, part.indexOf(url));
        wrap.appendChild(el("div", { class: "glossary-source" }, [
          prefix, el("a", { href: url, target: "_blank", rel: "noopener" }, [url]),
        ]));
      } else if (part) {
        wrap.appendChild(el("div", { class: "glossary-source" }, [part]));
      }
    });
    return wrap;
  }

  function catBadge(category) {
    return el("span", { class: "cat-badge cat-" + category }, [category]);
  }

  function renderOverview(d) {
    var target = document.getElementById("overview-content");
    target.innerHTML = "";

    target.appendChild(el("div", { class: "card stack" }, [
      kv("Snapshot", d.snapshot.label + " (" + d.snapshot.id + ")"),
      kv("Date frozen", d.snapshot.dateFrozen),
      kv("Scope", d.snapshot.scope),
      kv("Method", d.snapshot.method),
      kv("Status", d.snapshot.status),
    ]));

    target.appendChild(el("div", { class: "section-subtitle" }, ["Classification rules"]));
    target.appendChild(el("div", { class: "card stack" },
      d.classificationRules.map(function (r) {
        return el("div", {}, [el("strong", {}, [r.tag]), ": " + r.meaning]);
      })
    ));

    target.appendChild(el("div", { class: "section-subtitle" }, ["Research deltas by snapshot"]));
    d.researchDeltas.slice().reverse().forEach(function (delta) {
      target.appendChild(recordCard(
        slug(delta.snapshot),
        el("span", {}, [delta.snapshot + " — " + delta.date]),
        delta.items.length + " item(s)",
        [el("ul", {}, delta.items.map(function (i) { return el("li", {}, [i]); }))]
      ));
    });

    target.appendChild(el("div", { class: "section-subtitle" }, ["Preserved snapshot files"]));
    target.appendChild(el("div", { class: "card stack" }, [
      el("div", {}, [el("a", { href: "preserved/KSC-Master-Glossary-Snapshot-002-2026-08-20.docx" }, ["Snapshot 002 (.docx, 20 Aug 2026)"])]),
      el("div", {}, [el("a", { href: "preserved/KSC-Master-Glossary-Snapshot-003-2026-08-21.docx" }, ["Snapshot 003 (.docx, 21 Aug 2026)"])]),
      el("div", {}, [el("a", { href: "preserved/KSC-Master-Glossary-Snapshot-004-2026-08-21.docx" }, ["Snapshot 004 (.docx, 21 Aug 2026) — current"])]),
      el("div", { class: "record-sub" }, ["More snapshots will be added as further research sweeps arrive; each is kept alongside the ones before it rather than overwritten."]),
    ]));
  }

  function renderGlossary(d) {
    var list = d.glossary;
    document.getElementById("glossary-count").textContent = list.length + " term(s)";

    var nav = document.getElementById("glossary-letter-nav");
    nav.innerHTML = "";
    var letters = [];
    list.forEach(function (e) { if (letters.indexOf(e.letter) === -1) letters.push(e.letter); });
    letters.forEach(function (L) {
      nav.appendChild(el("a", { href: "#glossary-letter-" + L }, [L]));
    });

    var container = document.getElementById("glossary-list");
    container.innerHTML = "";
    var currentLetter = null;
    list.forEach(function (e) {
      if (e.letter !== currentLetter) {
        currentLetter = e.letter;
        container.appendChild(el("div", {
          class: "letter-heading", id: "glossary-letter-" + currentLetter, "data-heading": "1",
        }, [currentLetter]));
      }
      var card = recordCard(
        "term-" + slug(e.term),
        el("span", {}, [el("strong", {}, [e.term]), " ", catBadge(e.category)]),
        e.status,
        [
          el("div", {}, [e.description]),
          kv("Source", renderSource(e.source)),
        ]
      );
      card.setAttribute("data-search", (e.term + " " + e.description + " " + e.status).toLowerCase());
      container.appendChild(card);
    });

    var input = document.querySelector('.filter-input[data-filter-target="glossary-list"]');
    input.addEventListener("input", function () {
      var q = input.value.trim().toLowerCase();
      var lastVisibleHeading = null;
      var anyUnderHeading = false;
      var headings = [];
      Array.prototype.forEach.call(container.children, function (child) {
        if (child.dataset.heading) {
          if (lastVisibleHeading) lastVisibleHeading.hidden = !anyUnderHeading;
          lastVisibleHeading = child;
          anyUnderHeading = false;
        } else {
          var text = child.getAttribute("data-search") || "";
          var match = q.length === 0 || text.indexOf(q) !== -1;
          child.hidden = !match;
          if (match) anyUnderHeading = true;
        }
      });
      if (lastVisibleHeading) lastVisibleHeading.hidden = !anyUnderHeading;
    });
  }

  function renderReferenceSection(section) {
    if (section.type === "terms") {
      var body = [];
      section.items.forEach(function (item) {
        body.push(recordCard(
          slug(section.title + "-" + item.term),
          el("span", {}, [el("strong", {}, [item.term])]),
          item.status || null,
          [
            el("div", {}, [item.description]),
            item.source ? kv("Source", renderSource(item.source)) : null,
          ].filter(Boolean)
        ));
      });
      return el("div", { class: "stack" }, [el("div", { class: "record-sub" }, [section.title])].concat(body));
    }
    // prose
    var listEl = el("ul", {}, section.items.map(function (i) { return el("li", {}, [i]); }));
    var children = [listEl];
    if (section.note) children.push(el("div", { class: "caveat" }, [section.note]));
    return el("div", { class: "card" }, [el("h3", {}, [section.title])].concat(children));
  }

  function renderReference(d) {
    var target = document.getElementById("reference-content");
    target.innerHTML = "";
    d.referenceSections.forEach(function (section) {
      target.appendChild(renderReferenceSection(section));
    });
  }

  function main() {
    fetchJSON("data.json").then(function (d) {
      document.title = "MAYHEM - " + d.title;
      renderOverview(d);
      renderGlossary(d);
      renderReference(d);
      document.getElementById("footer-loaded").textContent = "Loaded " + new Date().toLocaleString();
      MayhemShell.init({ sections: ["overview", "glossary", "reference"], defaultSection: "overview" });
    }).catch(function (err) {
      var box = document.getElementById("load-error");
      box.hidden = false;
      box.textContent = "Failed to load data.json: " + err.message;
    });
  }

  document.addEventListener("DOMContentLoaded", main);
})();
