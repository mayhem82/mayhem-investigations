(function () {
  "use strict";

  var el = MayhemDOM.el, kv = MayhemDOM.kv, recordCard = MayhemDOM.recordCard,
      idTag = MayhemDOM.idTag, tagList = MayhemDOM.tagList, fetchJSON = MayhemDOM.fetchJSON;

  function renderOverview(d) {
    var target = document.getElementById("overview-content");
    target.innerHTML = "";
    target.appendChild(el("div", { class: "card stack" }, [
      kv("Generated", d.generated),
      kv("Basis", d.basis_note),
      kv("Catalogue reference", el("span", {}, [d.catalogue_reference + " — ", el("a", { href: "../../../yield-catalogue/index.html" }, ["Full catalogue"])])),
      kv("Assessing", el("a", { href: "../dfapti/index.html" }, [d.dfapti_case_id])),
    ]));
  }

  function functionCard(f) {
    return recordCard(
      "function-" + f.no,
      el("span", {}, [idTag("YIELD-FN-" + f.no), " — " + f.name]),
      f.status,
      [
        kv("Catalogue definition", f.definition),
        kv("Assessment for this case", f.match_note),
        kv("Anchors", tagList(f.anchors)),
      ]
    );
  }

  function toolCard(t) {
    return recordCard(
      "tool-" + MayhemDOM.slug(t.name),
      el("span", {}, [t.name]),
      t.status,
      [
        kv("Catalogue definition", t.definition),
        kv("Assessment for this case", t.match_note),
        kv("Anchors", tagList(t.anchors)),
      ]
    );
  }

  function renderFunctions(list) {
    var container = document.getElementById("functions-list");
    document.getElementById("functions-count").textContent = list.length + " of 11 assessed";
    container.innerHTML = "";
    list.forEach(function (f) { container.appendChild(functionCard(f)); });
  }

  function renderTools(list) {
    var container = document.getElementById("tools-list");
    document.getElementById("tools-count").textContent = list.length + " of 19 assessed";
    container.innerHTML = "";
    list.forEach(function (t) { container.appendChild(toolCard(t)); });
  }

  function renderNotClaimed(list) {
    var target = document.getElementById("not-claimed-list");
    target.innerHTML = "";
    target.appendChild(el("div", { class: "card" }, [el("ul", {}, list.map(function (t) { return el("li", {}, [t]); }))]));
  }

  function main() {
    fetchJSON("data.json").then(function (d) {
      document.title = "MAYHEM - Yield Gate - " + d.dfapti_case_id;
      renderOverview(d);
      renderFunctions(d.functions);
      renderTools(d.citizen_tools);
      renderNotClaimed(d.not_claimed);
      document.getElementById("footer-loaded").textContent = "Loaded " + new Date().toLocaleString();
      MayhemShell.init({ sections: ["overview", "functions", "tools", "not-claimed"], defaultSection: "overview" });
    }).catch(function (err) {
      var box = document.getElementById("load-error");
      box.hidden = false;
      box.textContent = "Failed to load data.json: " + err.message;
    });
  }

  document.addEventListener("DOMContentLoaded", main);
})();
