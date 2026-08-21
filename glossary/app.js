(function () {
  "use strict";
  // Progressive enhancement only. All glossary content is already present
  // in the static HTML (see build.js) - this script just adds live
  // filtering on top. If it fails to load or run, every term is still
  // visible and readable.

  function main() {
    var input = document.getElementById("glossary-filter");
    var list = document.getElementById("glossary-list");
    if (!input || !list) return;

    input.addEventListener("input", function () {
      var q = input.value.trim().toLowerCase();
      var currentHeading = null;
      var headingHasVisibleChild = false;

      Array.prototype.forEach.call(list.children, function (child) {
        if (child.classList.contains("letter-heading")) {
          if (currentHeading) currentHeading.classList.toggle("js-hidden", !headingHasVisibleChild);
          currentHeading = child;
          headingHasVisibleChild = false;
        } else {
          var text = child.getAttribute("data-search") || "";
          var match = q.length === 0 || text.indexOf(q) !== -1;
          child.classList.toggle("js-hidden", !match);
          if (match) headingHasVisibleChild = true;
        }
      });
      if (currentHeading) currentHeading.classList.toggle("js-hidden", !headingHasVisibleChild);
    });
  }

  document.addEventListener("DOMContentLoaded", main);
})();
