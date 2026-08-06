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

  function renderPattern(p) {
    var threads = (p.threads_involved || []).join(", ");
    return (
      '<div class="card">' +
      "<h3>" + esc(p.id) + " — " + esc(p.title) + "</h3>" +
      '<p class="doc-subtitle">Threads: ' + esc(threads) + "</p>" +
      "<p>" + esc(p.description) + "</p>" +
      '<p class="doc-subtitle"><strong>Basis:</strong> ' + esc(p.basis) + "</p>" +
      "</div>"
    );
  }

  function main() {
    fetchJSON("patterns.json").then(function (d) {
      document.getElementById("basis-note").textContent = d.basis_note;
      document.getElementById("patterns").innerHTML = d.patterns.map(renderPattern).join("\n");
      document.getElementById("not-claimed").innerHTML = d.not_claimed.map(function (t) {
        return "<li>" + esc(t) + "</li>";
      }).join("\n");
    }).catch(function (err) {
      document.getElementById("basis-note").textContent = "Failed to load: " + err.message;
    });
  }

  document.addEventListener("DOMContentLoaded", main);
})();
