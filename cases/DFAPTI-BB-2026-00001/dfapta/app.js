(function () {
  "use strict";

  function esc(s) {
    return String(s).replace(/[&<>]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c];
    });
  }

  function fetchJSON(path) {
    return fetch(path, { cache: "no-store" }).then(function (res) {
      if (!res.ok) throw new Error("Failed to load " + path + ": " + res.status);
      return res.json();
    });
  }

  function renderMeta(d) {
    document.getElementById("meta").innerHTML =
      '<div class="status-line">' +
      '<span class="badge ' + d.status.toLowerCase() + '">' + esc(d.status) + "</span>" +
      '<span class="badge">Cycle ' + esc(d.cycle) + "</span>" +
      '<span class="badge">' + esc(d.counts.analysis_paths) + " paths</span>" +
      '<span class="badge">' + esc(d.counts.analytical_determinations) + " determinations</span>" +
      "</div>" +
      "<p>" + esc(d.evidence_basis_note) + "</p>" +
      '<p>Commenced ' + esc(d.analysis_commenced) + " · analysing <a href=\"../dfapti/index.html\">" + esc(d.dfapti_case_id) + "</a></p>";
  }

  function renderVerification(va) {
    if (!va) {
      document.getElementById("verification").innerHTML = "<p>No external material reconciled this cycle.</p>";
      return;
    }
    var rows = (va.outcomes || []).map(function (o) {
      return "<tr><td>" + esc(o.proposed_claim) + "</td><td>" + esc(o.finding) + "</td><td>" + esc(o.action) + "</td></tr>";
    }).join("");
    document.getElementById("verification").innerHTML =
      "<p>" + esc(va.summary) + "</p>" +
      "<table><thead><tr><th>Proposed claim</th><th>What was found</th><th>Action taken</th></tr></thead><tbody>" +
      rows + "</tbody></table>";
  }

  function renderPath(p) {
    var det = (p.determinations || []).map(function (d) {
      return "<li><strong>" + esc(d[0]) + "</strong> — " + esc(d[1]) + "</li>";
    }).join("");
    var mech = (p.mechanisms || []).map(function (m) {
      return "<li><strong>" + esc(m[0]) + "</strong> — <span class=\"badge\">" + esc(m[1]) + "</span><br>" + esc(m[2]) + "</li>";
    }).join("");
    var analysis = (p.analysis || []).map(function (t) { return "<p>" + esc(t) + "</p>"; }).join("");
    var anchors = (p.anchors || []).map(function (a) {
      return '<a href="../dfapti/index.html#evidence/' + esc(a) + '">' + esc(a) + "</a>";
    }).join(", ");
    return (
      '<div class="card">' +
      "<h3>" + esc(p.id) + " — " + esc(p.title) + "</h3>" +
      analysis +
      (det ? "<p><strong>Determinations</strong></p><ul>" + det + "</ul>" : "") +
      (mech ? "<p><strong>Named patterns considered</strong></p><ul>" + mech + "</ul>" : "") +
      (anchors ? '<p class="doc-subtitle">Evidence anchors: ' + anchors + "</p>" : "") +
      '<div class="caveat"><strong>Boundary:</strong> ' + esc(p.boundary) + "</div>" +
      "</div>"
    );
  }

  function renderContradiction(c) {
    var resolved = /^(RESOLVED|NOT ESTABLISHED|PARTIALLY RESOLVED)/.test(c.status);
    var cls = c.status === "OPEN" ? "open" : resolved ? "resolved" : "partial";
    return (
      '<div class="card">' +
      "<h3>" + esc(c.id) + " — " + esc(c.issue) + "</h3>" +
      '<div class="status-line"><span class="badge ' + cls + '">' + esc(c.status) + "</span></div>" +
      "<p>" + esc(c.analysis) + "</p>" +
      '<p class="doc-subtitle">Anchors: ' + esc(Array.isArray(c.anchors) ? c.anchors.join(", ") : c.anchors) + "</p>" +
      "</div>"
    );
  }

  function main() {
    fetchJSON("analysis.json").then(function (d) {
      document.title = d.analysis_id + " — DFAPTA";
      renderMeta(d);
      renderVerification(d.verification_addendum);
      document.getElementById("paths").innerHTML = d.paths.map(renderPath).join("\n");
      document.getElementById("cpo").innerHTML = d.cross_path_observations.map(function (c) {
        return "<li><strong>" + esc(c.title) + "</strong> — " + esc(c.analysis) + "</li>";
      }).join("\n");
      document.getElementById("contradictions").innerHTML = d.contradictions_preserved.map(renderContradiction).join("\n");
      document.getElementById("disclosure").innerHTML = d.disclosure_requests.map(function (r) {
        return "<li><strong>" + esc(r.title) + "</strong> — " + esc(r.request) + "</li>";
      }).join("\n");
      document.getElementById("overreach").innerHTML = d.overreach_controls.map(function (o) {
        return "<li>" + esc(o) + "</li>";
      }).join("\n");
    }).catch(function (err) {
      document.getElementById("meta").innerHTML = '<p class="caveat">Failed to load analysis: ' + esc(err.message) + "</p>";
    });
  }

  document.addEventListener("DOMContentLoaded", main);
})();
