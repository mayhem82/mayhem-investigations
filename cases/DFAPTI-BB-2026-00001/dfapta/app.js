(function () {
  "use strict";

  var el = MayhemDOM.el, badge = MayhemDOM.badge, idTag = MayhemDOM.idTag, kv = MayhemDOM.kv,
      emptyState = MayhemDOM.emptyState, recordCard = MayhemDOM.recordCard, tagList = MayhemDOM.tagList,
      setFilterable = MayhemDOM.setFilterable, fetchJSON = MayhemDOM.fetchJSON;

  function evidenceLink(id) {
    var a = el("a", { class: "tag-chip-link tag-chip", href: "../dfapti/index.html#evidence/" + id }, [id]);
    return a;
  }

  function renderOverview(d) {
    var target = document.getElementById("overview-content");
    target.innerHTML = "";
    var card = el("div", { class: "card stack" }, [
      kv("Status", badge(d.status)),
      kv("Cycle", d.cycle),
      kv("Analysis Commenced", d.analysis_commenced),
      kv("Analysing", el("a", { href: "../dfapti/index.html" }, [d.dfapti_case_id])),
      kv("Evidence Basis", d.evidence_basis_note),
      kv("Paths", d.counts.analysis_paths),
      kv("Determinations", d.counts.analytical_determinations),
      kv("Evidence Anchors Referenced", d.counts.evidence_anchors_referenced),
    ]);
    target.appendChild(card);
  }

  function renderVerification(va) {
    var target = document.getElementById("verification-content");
    target.innerHTML = "";
    if (!va) {
      target.appendChild(emptyState("No external material reconciled this cycle."));
      return;
    }
    target.appendChild(el("p", {}, [va.summary]));
    (va.outcomes || []).forEach(function (o, i) {
      target.appendChild(recordCard(
        "RUN0064-" + i,
        o.proposed_claim,
        null,
        [
          kv("Finding", o.finding),
          kv("Action Taken", o.action),
        ]
      ));
    });
  }

  function renderPaths(paths) {
    var container = document.getElementById("paths-list");
    document.getElementById("paths-count").textContent = paths.length + " path(s)";
    container.innerHTML = "";
    paths.forEach(function (p) {
      var body = [];
      p.analysis.forEach(function (t) { body.push(el("p", {}, [t])); });
      if (p.determinations && p.determinations.length) {
        body.push(kv("Determinations", el("ul", {}, p.determinations.map(function (d) {
          return el("li", {}, [el("strong", {}, [d[0]]), " — " + d[1]]);
        }))));
      }
      if (p.mechanisms && p.mechanisms.length) {
        body.push(kv("Named Patterns Considered", el("ul", {}, p.mechanisms.map(function (m) {
          return el("li", {}, [el("strong", {}, [m[0]]), " — ", badge(m[1]), el("div", {}, [m[2]])]);
        }))));
      }
      body.push(kv("Evidence Anchors", tagList(p.anchors, evidenceLink)));
      body.push(kv("Boundary", p.boundary));
      container.appendChild(recordCard(p.id, el("span", {}, [idTag(p.id), " — " + p.title]), null, body));
    });
  }

  function renderCPO(list) {
    var container = document.getElementById("cpo-list");
    document.getElementById("cpo-count").textContent = list.length + " observation(s)";
    container.innerHTML = "";
    list.forEach(function (c) {
      container.appendChild(recordCard(
        c.id,
        el("span", {}, [idTag(c.id), " — " + c.title]),
        null,
        [kv("Analysis", c.analysis), kv("Anchors", typeof c.anchors === "string" ? c.anchors : c.anchors.join(", "))]
      ));
    });
  }

  function renderContradictions(list) {
    var container = document.getElementById("contradictions-list");
    document.getElementById("contradictions-count").textContent = list.length + " item(s)";
    container.innerHTML = "";
    list.forEach(function (c) {
      container.appendChild(recordCard(
        c.id,
        el("span", {}, [idTag(c.id), " — " + c.issue]),
        null,
        [
          kv("Status", badge(c.status)),
          kv("Analysis", c.analysis),
          kv("Anchors", tagList(c.anchors, evidenceLink)),
        ]
      ));
    });
  }

  function renderDisclosure(list) {
    var target = document.getElementById("disclosure-list");
    target.innerHTML = "";
    list.forEach(function (r) {
      target.appendChild(recordCard(r.id, el("span", {}, [idTag(r.id), " — " + r.title]), null, [kv("Request", r.request)]));
    });
  }

  function renderOverreach(list) {
    var target = document.getElementById("overreach-list");
    target.innerHTML = "";
    var card = el("div", { class: "card" }, [el("ul", {}, list.map(function (o) { return el("li", {}, [o]); }))]);
    target.appendChild(card);
  }

  function main() {
    fetchJSON("analysis.json").then(function (d) {
      document.title = "MAYHEM - DFAPTA - " + d.dfapti_case_id;
      renderOverview(d);
      renderVerification(d.verification_addendum);
      renderPaths(d.paths);
      renderCPO(d.cross_path_observations);
      renderContradictions(d.contradictions_preserved);
      renderDisclosure(d.disclosure_requests);
      renderOverreach(d.overreach_controls);

      setFilterable("paths-list", function (node) { return node.textContent; });

      document.getElementById("footer-loaded").textContent = "Loaded " + new Date().toLocaleString();

      MayhemShell.init({
        sections: ["overview", "verification", "paths", "cpo", "contradictions", "disclosure", "overreach"],
        defaultSection: "overview",
      });
    }).catch(function (err) {
      var box = document.getElementById("load-error");
      box.hidden = false;
      box.textContent = "Failed to load analysis.json: " + err.message;
    });
  }

  document.addEventListener("DOMContentLoaded", main);
})();
