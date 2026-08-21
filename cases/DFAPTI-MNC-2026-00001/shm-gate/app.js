(function () {
  "use strict";

  var el = MayhemDOM.el, kv = MayhemDOM.kv, recordCard = MayhemDOM.recordCard,
      idTag = MayhemDOM.idTag, tagList = MayhemDOM.tagList, fetchJSON = MayhemDOM.fetchJSON;

  function renderOverview(d) {
    var target = document.getElementById("overview-content");
    target.innerHTML = "";
    target.appendChild(el("div", { class: "card stack" }, [
      kv("Cycle", d.cycle),
      kv("Generated", d.generated),
      kv("Basis", d.basis_note),
      kv("Catalogue reference", d.catalogue_reference),
      kv("Position in chain", d.position_in_chain),
      kv("Analysing", el("a", { href: "../dfapti/index.html" }, [d.dfapti_case_id])),
    ]));
    if (d.root_finding) renderRootFinding(d.root_finding);
  }

  function renderRootFinding(rf) {
    var target = document.getElementById("overview-content");
    var roleRows = (rf.roles || []).map(function (r) {
      return el("div", { class: "kv-row" }, [
        el("div", { class: "kv-label" }, [r.role_label]),
        el("div", { class: "kv-value" }, [
          idTag("SHM-" + r.mechanism_no), " — " + r.role_note,
        ]),
      ]);
    });
    target.appendChild(el("div", { class: "section-subtitle" }, [rf.title]));
    target.appendChild(el("div", { class: "card stack" }, [
      el("p", {}, [rf.statement]),
    ].concat(roleRows)));
  }

  function mechanismCard(idPrefix, m) {
    return recordCard(
      idPrefix + "-" + m.mechanism_no,
      el("span", {}, [idTag("SHM-" + m.mechanism_no), " — " + m.name]),
      m.status,
      [
        kv("Catalogue definition", m.definition),
        kv("Match in this case", m.match_note),
        kv("DFAPTA paths", tagList(m.paths, function (id) {
          return el("a", { class: "tag-chip-link", href: "../dfapta/index.html" }, [id]);
        })),
        kv("Evidence anchors", tagList(m.anchors)),
      ]
    );
  }

  function renderApplied(list) {
    var container = document.getElementById("applied-list");
    document.getElementById("applied-count").textContent = list.length + " mechanism(s)";
    container.innerHTML = "";
    list.forEach(function (m) { container.appendChild(mechanismCard("applied", m)); });
  }

  function renderRisk(list) {
    var container = document.getElementById("risk-list");
    container.innerHTML = "";
    if (!list.length) { container.appendChild(MayhemDOM.emptyState("None flagged this cycle.")); return; }
    list.forEach(function (m) { container.appendChild(mechanismCard("risk", m)); });
  }

  function renderCandidates(list) {
    var container = document.getElementById("candidates-list");
    container.innerHTML = "";
    if (!list.length) { container.appendChild(MayhemDOM.emptyState("None surfaced this cycle.")); return; }
    list.forEach(function (c) {
      container.appendChild(recordCard(
        "candidate-" + MayhemDOM.slug(c.working_name),
        el("span", {}, ["Candidate — " + c.working_name]),
        null,
        [
          kv("Finding from this case", c.definition_from_case),
          kv("Note", c.note),
          kv("DFAPTA paths", tagList(c.paths, function (id) {
            return el("a", { class: "tag-chip-link", href: "../dfapta/index.html" }, [id]);
          })),
          kv("Evidence anchors", tagList(c.anchors)),
        ]
      ));
    });
  }

  function renderNotClaimed(list) {
    var target = document.getElementById("not-claimed-list");
    target.innerHTML = "";
    target.appendChild(el("div", { class: "card" }, [el("ul", {}, list.map(function (t) { return el("li", {}, [t]); }))]));
  }

  function main() {
    fetchJSON("data.json").then(function (d) {
      document.title = "MAYHEM - SHM Gate - " + d.dfapti_case_id;
      renderOverview(d);
      renderApplied(d.applied);
      renderRisk(d.risk_provisional);
      renderCandidates(d.candidate_new_mechanisms);
      renderNotClaimed(d.not_claimed);
      document.getElementById("footer-loaded").textContent = "Loaded " + new Date().toLocaleString();
      MayhemShell.init({ sections: ["overview", "applied", "risk", "candidates", "not-claimed"], defaultSection: "overview" });
    }).catch(function (err) {
      var box = document.getElementById("load-error");
      box.hidden = false;
      box.textContent = "Failed to load data.json: " + err.message;
    });
  }

  document.addEventListener("DOMContentLoaded", main);
})();
