/*
 * Standalone comparison widget: works against #comparison-root if present on
 * any page. No-op elsewhere. Reads/writes localStorage "ari_compare_list"
 * (array of restaurant id strings), lets the user remove entries, and calls
 * /api/ai/compare to render a table + verdict.
 */
(function () {
  "use strict";

  function getCompareList() {
    var list = window.ARI ? window.ARI.lsGet("ari_compare_list", []) : [];
    return Array.isArray(list) ? list : [];
  }

  function setCompareList(list) {
    if (window.ARI) window.ARI.lsSet("ari_compare_list", list);
  }

  function removeFromCompare(id, root) {
    var list = getCompareList().filter(function (existing) {
      return String(existing) !== String(id);
    });
    setCompareList(list);
    render(root);
  }

  function renderPicker(root, list) {
    var picker = root.querySelector("[data-compare-picker]");
    if (!picker) return;
    picker.innerHTML = "";
    if (!list.length) {
      var empty = document.createElement("p");
      empty.className = "comparison-empty";
      empty.textContent = "Add up to 3 restaurants to compare using the compare button on a restaurant card.";
      picker.appendChild(empty);
      return;
    }
    var ul = document.createElement("ul");
    ul.className = "comparison-picker-list";
    list.forEach(function (id) {
      var li = document.createElement("li");
      li.textContent = "Restaurant #" + id + " ";
      var removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.textContent = "Remove";
      removeBtn.addEventListener("click", function () {
        removeFromCompare(id, root);
      });
      li.appendChild(removeBtn);
      ul.appendChild(li);
    });
    picker.appendChild(ul);
  }

  function renderTable(root, rows) {
    var tableWrap = root.querySelector("[data-compare-table]");
    if (!tableWrap) return;
    tableWrap.innerHTML = "";
    if (!rows || !rows.length) return;

    var table = document.createElement("table");
    table.className = "comparison-table";

    var thead = document.createElement("thead");
    var headRow = document.createElement("tr");
    ["Restaurant", "Overall Match", "Budget Fit", "Diet Fit", "Atmosphere Fit", "Rating", "Value"].forEach(
      function (label) {
        var th = document.createElement("th");
        th.textContent = label;
        headRow.appendChild(th);
      }
    );
    thead.appendChild(headRow);
    table.appendChild(thead);

    var tbody = document.createElement("tbody");
    rows.forEach(function (row) {
      var tr = document.createElement("tr");
      [
        row.restaurant_id,
        row.overall_match,
        row.budget_fit,
        row.diet_fit,
        row.atmosphere_fit,
        row.rating,
        row.value,
      ].forEach(function (value) {
        var td = document.createElement("td");
        td.textContent = value === undefined || value === null ? "" : String(value);
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    tableWrap.appendChild(table);
  }

  function renderVerdict(root, verdict, reasoning) {
    var verdictEl = root.querySelector("[data-compare-verdict]");
    if (verdictEl) verdictEl.textContent = verdict || "";
    var reasoningEl = root.querySelector("[data-compare-reasoning]");
    if (reasoningEl) reasoningEl.textContent = reasoning || "";
  }

  function render(root) {
    var list = getCompareList();
    renderPicker(root, list);

    var tableWrap = root.querySelector("[data-compare-table]");
    var verdictEl = root.querySelector("[data-compare-verdict]");
    if (tableWrap) tableWrap.innerHTML = "";
    if (verdictEl) verdictEl.textContent = "";

    if (list.length < 2 || !window.ARI) return;

    window.ARI
      .apiFetch("/api/ai/compare", { method: "POST", body: { restaurant_ids: list } })
      .then(function (data) {
        renderTable(root, data.rows);
        renderVerdict(root, data.verdict, data.reasoning);
      })
      .catch(function (err) {
        console.error("ARI comparison.js compare failed", err);
        window.ARI.showToast((err && err.message) || "Could not compare restaurants.", {
          variant: "error",
        });
      });
  }

  document.addEventListener("DOMContentLoaded", function () {
    try {
      var root = document.getElementById("comparison-root");
      if (!root) return;
      render(root);

      var clearBtn = root.querySelector("[data-compare-clear]");
      if (clearBtn) {
        clearBtn.addEventListener("click", function () {
          setCompareList([]);
          render(root);
        });
      }
    } catch (err) {
      console.error("ARI comparison.js init failed", err);
    }
  });
})();
