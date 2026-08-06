// Shared DOM-building helpers, extracted from
// cases/DFAPTI-BB-2026-00001/dfapti/app.js so every stage page builds the
// same record cards, badges, and key-value rows instead of inventing its
// own markup. Include this before a page's own app.js.
(function (global) {
  "use strict";

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    attrs = attrs || {};
    for (var key in attrs) {
      if (!Object.prototype.hasOwnProperty.call(attrs, key)) continue;
      if (key === "class") node.className = attrs[key];
      else if (key === "html") node.innerHTML = attrs[key];
      else node.setAttribute(key, attrs[key]);
    }
    (children || []).forEach(function (child) {
      if (child === null || child === undefined) return;
      node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
    });
    return node;
  }

  function slug(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  function badge(value) {
    if (!value) return el("span", { class: "badge" }, ["-"]);
    return el("span", { class: "badge badge-" + slug(value) }, [value]);
  }

  function idTag(value) {
    return el("span", { class: "id-tag" }, [value]);
  }

  function kv(label, valueNode) {
    var value = (valueNode instanceof Node)
      ? valueNode
      : el("div", { class: "kv-value" }, [String(valueNode === null || valueNode === undefined || valueNode === "" ? "-" : valueNode)]);
    return el("div", { class: "kv-row" }, [
      el("div", { class: "kv-label" }, [label]),
      value,
    ]);
  }

  function emptyState(message) {
    return el("div", { class: "empty-state" }, [message]);
  }

  function recordCard(recordId, titleNode, subtitle, bodyRows) {
    var summary = el("summary", {}, [
      el("div", { class: "record-title" }, [titleNode]),
      subtitle ? el("div", { class: "record-sub" }, [subtitle]) : null,
    ]);
    var body = el("div", { class: "record-body" }, bodyRows);
    var attrs = { class: "record" };
    if (recordId) attrs.id = "record-" + recordId;
    return el("details", attrs, [summary, body]);
  }

  // linkBuilder(id) -> an <a> or <button> element, or null to render a
  // plain (non-interactive) chip. Optional - omit for a plain tag list.
  function tagList(ids, linkBuilder) {
    if (!ids || !ids.length) return el("span", { class: "kv-value" }, ["None"]);
    var wrap = el("div", { class: "tag-list" });
    ids.forEach(function (id) {
      var link = linkBuilder ? linkBuilder(id) : null;
      wrap.appendChild(link || el("span", { class: "tag-chip" }, [id]));
    });
    return wrap;
  }

  function setFilterable(containerId, getSearchText) {
    var input = document.querySelector('.filter-input[data-filter-target="' + containerId + '"]');
    if (!input) return;
    input.addEventListener("input", function () {
      var q = input.value.trim().toLowerCase();
      var container = document.getElementById(containerId);
      Array.prototype.forEach.call(container.children, function (child) {
        var text = getSearchText(child).toLowerCase();
        child.hidden = q.length > 0 && text.indexOf(q) === -1;
      });
    });
  }

  function fetchJSON(path) {
    return fetch(path, { cache: "no-store" }).then(function (res) {
      if (!res.ok) throw new Error("Failed to load " + path + ": " + res.status);
      return res.json();
    });
  }

  global.MayhemDOM = {
    el: el, slug: slug, badge: badge, idTag: idTag, kv: kv,
    emptyState: emptyState, recordCard: recordCard, tagList: tagList,
    setFilterable: setFilterable, fetchJSON: fetchJSON,
  };
})(window);
