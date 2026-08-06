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

  var CONF_CLASS = {
    "Well-supported": "resolved",
    "Reasonably supported": "partial",
    "Reasonably supported for the specific method (web search); no basis for confidence about other methods": "partial",
    "Weakly supported": "open"
  };

  function renderAssessment(a) {
    var cls = CONF_CLASS[a.confidence] || "partial";
    return (
      '<div class="card">' +
      "<h3>" + esc(a.id) + "</h3>" +
      '<div class="status-line"><span class="badge ' + cls + '">' + esc(a.confidence) + "</span></div>" +
      "<p>" + esc(a.statement) + "</p>" +
      "<p><strong>Basis:</strong> " + esc(a.basis) + "</p>" +
      "<p><strong>On this confidence label:</strong> " + esc(a.confidence_note) + "</p>" +
      '<div class="caveat"><strong>Would revise this:</strong> ' + esc(a.would_revise_this) + "</div>" +
      "</div>"
    );
  }

  function main() {
    fetchJSON("assessments.json").then(function (d) {
      document.getElementById("purpose-note").textContent = d.purpose_note;
      document.getElementById("assessments").innerHTML = d.assessments.map(renderAssessment).join("\n");
      document.getElementById("not-claimed").innerHTML = d.not_claimed.map(function (t) {
        return "<li>" + esc(t) + "</li>";
      }).join("\n");
    }).catch(function (err) {
      document.getElementById("purpose-note").textContent = "Failed to load: " + err.message;
    });
  }

  document.addEventListener("DOMContentLoaded", main);
})();
