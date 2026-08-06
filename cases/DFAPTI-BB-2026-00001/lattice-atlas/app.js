(function () {
  "use strict";

  var el = MayhemDOM.el, kv = MayhemDOM.kv, recordCard = MayhemDOM.recordCard,
      idTag = MayhemDOM.idTag, fetchJSON = MayhemDOM.fetchJSON;

  function renderOverview(d) {
    var target = document.getElementById("overview-content");
    target.innerHTML = "";
    target.appendChild(el("div", { class: "card stack" }, [
      kv("Cycle", d.cycle),
      kv("Generated", d.generated),
      kv("Basis", d.basis_note),
      kv("Analysing", el("a", { href: "../dfapti/index.html" }, [d.dfapti_case_id])),
    ]));
  }

  function renderPatterns(list) {
    var container = document.getElementById("patterns-list");
    document.getElementById("patterns-count").textContent = list.length + " pattern(s)";
    container.innerHTML = "";
    list.forEach(function (p) {
      container.appendChild(recordCard(
        p.id,
        el("span", {}, [idTag(p.id), " — " + p.title]),
        "Threads: " + (p.threads_involved || []).join(", "),
        [kv("Description", p.description), kv("Basis", p.basis)]
      ));
    });
  }

  function renderNotClaimed(list) {
    var target = document.getElementById("not-claimed-list");
    target.innerHTML = "";
    target.appendChild(el("div", { class: "card" }, [el("ul", {}, list.map(function (t) { return el("li", {}, [t]); }))]));
  }

  function main() {
    fetchJSON("patterns.json").then(function (d) {
      document.title = "MAYHEM - Lattice Atlas - " + d.dfapti_case_id;
      renderOverview(d);
      renderPatterns(d.patterns);
      renderNotClaimed(d.not_claimed);
      document.getElementById("footer-loaded").textContent = "Loaded " + new Date().toLocaleString();
      MayhemShell.init({ sections: ["overview", "patterns", "not-claimed"], defaultSection: "overview" });
    }).catch(function (err) {
      var box = document.getElementById("load-error");
      box.hidden = false;
      box.textContent = "Failed to load patterns.json: " + err.message;
    });
  }

  document.addEventListener("DOMContentLoaded", main);
})();
