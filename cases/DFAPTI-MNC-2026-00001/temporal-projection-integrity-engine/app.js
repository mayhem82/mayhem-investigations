(function () {
  "use strict";

  var el = MayhemDOM.el, badge = MayhemDOM.badge, kv = MayhemDOM.kv,
      recordCard = MayhemDOM.recordCard, idTag = MayhemDOM.idTag, fetchJSON = MayhemDOM.fetchJSON;

  function renderOverview(d) {
    var target = document.getElementById("overview-content");
    target.innerHTML = "";
    target.appendChild(el("div", { class: "card stack" }, [
      kv("Cycle", d.cycle),
      kv("Generated", d.generated),
      kv("Purpose", d.purpose_note),
      kv("Analysing", el("a", { href: "../dfapti/index.html" }, [d.dfapti_case_id])),
    ]));
  }

  function renderAssessments(list) {
    var container = document.getElementById("assessments-list");
    document.getElementById("assessments-count").textContent = list.length + " assessment(s)";
    container.innerHTML = "";
    list.forEach(function (a) {
      container.appendChild(recordCard(
        a.id,
        el("span", {}, [idTag(a.id), " — ", badge(a.confidence)]),
        a.statement,
        [
          kv("Basis", a.basis),
          kv("On This Confidence Label", a.confidence_note),
          kv("Would Revise This", a.would_revise_this),
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
    fetchJSON("assessments.json").then(function (d) {
      document.title = "MAYHEM - Temporal Projection Integrity Engine - " + d.dfapti_case_id;
      renderOverview(d);
      renderAssessments(d.assessments);
      renderNotClaimed(d.not_claimed);
      document.getElementById("footer-loaded").textContent = "Loaded " + new Date().toLocaleString();
      MayhemShell.init({ sections: ["overview", "assessments", "not-claimed"], defaultSection: "overview" });
    }).catch(function (err) {
      var box = document.getElementById("load-error");
      box.hidden = false;
      box.textContent = "Failed to load assessments.json: " + err.message;
    });
  }

  document.addEventListener("DOMContentLoaded", main);
})();
