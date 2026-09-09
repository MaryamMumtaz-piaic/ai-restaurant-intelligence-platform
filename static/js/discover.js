/*
 * /discover page logic. Depends on window.ARI from main.js (loaded first).
 * No-ops safely if the discover DOM hooks are absent (e.g. included globally).
 */
(function () {
  "use strict";

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }
  function qsa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function readFilters() {
    var groups = ["cuisine", "diet", "price_level", "occasion", "atmosphere", "meal_type", "features"];
    var filters = {};
    groups.forEach(function (group) {
      var controls = qsa('[data-filter="' + group + '"]');
      if (!controls.length) return;
      var values = [];
      controls.forEach(function (el) {
        if (el.tagName === "SELECT") {
          qsa("option:checked", el).forEach(function (opt) {
            if (opt.value) values.push(opt.value);
          });
        } else if (el.type === "checkbox" || el.type === "radio") {
          if (el.checked && el.value) values.push(el.value);
        } else if (el.value) {
          values.push(el.value);
        }
      });
      if (values.length) filters[group] = values;
    });
    return filters;
  }

  function buildQueryString(filters, extra) {
    var params = new URLSearchParams();
    Object.keys(filters).forEach(function (key) {
      filters[key].forEach(function (value) {
        params.append(key, value);
      });
    });
    Object.keys(extra || {}).forEach(function (key) {
      if (extra[key] !== undefined && extra[key] !== null && extra[key] !== "") {
        params.append(key, extra[key]);
      }
    });
    return params.toString();
  }

  function setLoading(grid, isLoading) {
    if (!grid) return;
    grid.setAttribute("aria-busy", isLoading ? "true" : "false");
    grid.classList.toggle("is-loading", isLoading);
    var skeleton = document.getElementById("results-loading");
    var resultsCount = document.getElementById("results-count");
    if (isLoading) {
      if (skeleton) skeleton.classList.remove("hidden");
      grid.classList.add("hidden");
      if (resultsCount) resultsCount.textContent = "Loading restaurants…";
    } else if (skeleton) {
      skeleton.classList.add("hidden");
    }
  }

  function toggleEmptyState(show) {
    var emptyState = document.getElementById("results-empty") || document.getElementById("empty-state");
    if (emptyState) emptyState.classList.toggle("hidden", !show);
  }

  function toggleErrorState(show) {
    var errorState = document.getElementById("results-error");
    if (errorState) errorState.classList.toggle("hidden", !show);
  }

  function updateResultsCount(count) {
    var resultsCount = document.getElementById("results-count");
    if (!resultsCount) return;
    resultsCount.textContent =
      count === 0 ? "No restaurants found" : count === 1 ? "1 restaurant found" : count + " restaurants found";
  }

  function renderResults(grid, items) {
    if (!grid) return;
    toggleErrorState(false);
    grid.innerHTML = "";
    if (!items || !items.length) {
      grid.classList.add("hidden");
      toggleEmptyState(true);
      updateResultsCount(0);
      return;
    }
    toggleEmptyState(false);
    grid.classList.remove("hidden");
    updateResultsCount(items.length);
    var frag = document.createDocumentFragment();
    items.forEach(function (restaurant) {
      var card = window.ARI && window.ARI.renderRestaurantCard(restaurant);
      if (card) frag.appendChild(card);
    });
    grid.appendChild(frag);
    if (window.ARI) {
      window.ARI.wireSaveButtons(grid);
      window.ARI.wireShareButtons(grid);
    }
    wireCompareButtons(grid);
    syncCompareBar();
  }

  function getCompareList() {
    if (!window.ARI) return [];
    var list = window.ARI.lsGet("ari_compare_list", []);
    return Array.isArray(list) ? list : [];
  }

  function setCompareList(list) {
    if (window.ARI) window.ARI.lsSet("ari_compare_list", list);
  }

  function syncCompareBar() {
    var bar = document.getElementById("compare-bar");
    var countEl = document.getElementById("compare-count");
    var openBtn = document.getElementById("compare-open-btn");
    var list = getCompareList();
    if (countEl) countEl.textContent = String(list.length);
    if (openBtn) openBtn.disabled = list.length < 2;
    if (bar) bar.classList.toggle("hidden", list.length === 0);
    qsa(".compare-checkbox").forEach(function (cb) {
      cb.checked = list.indexOf(cb.dataset.id) !== -1;
    });
  }

  function wireCompareButtons(root) {
    qsa('[data-action="compare-toggle"]', root).forEach(function (cb) {
      if (cb.dataset.ariWired === "1") return;
      cb.dataset.ariWired = "1";
      cb.addEventListener("change", function () {
        var id = cb.dataset.id;
        if (!id) return;
        var list = getCompareList();
        if (cb.checked) {
          if (list.length >= 3) {
            cb.checked = false;
            window.ARI && window.ARI.showToast("You can compare up to 3 restaurants.", { variant: "error" });
            return;
          }
          if (list.indexOf(id) === -1) list.push(id);
        } else {
          list = list.filter(function (existing) {
            return existing !== id;
          });
        }
        setCompareList(list);
        syncCompareBar();
      });
    });
    qsa('[data-action="compare-add"]', root).forEach(function (btn) {
      if (btn.dataset.ariWired === "1") return;
      btn.dataset.ariWired = "1";
      btn.addEventListener("click", function () {
        var id = btn.dataset.id;
        if (!id) return;
        var list = getCompareList();
        if (list.indexOf(id) !== -1) {
          window.ARI && window.ARI.showToast("Already added to comparison.");
          return;
        }
        if (list.length >= 3) {
          window.ARI && window.ARI.showToast("You can compare up to 3 restaurants.", { variant: "error" });
          return;
        }
        list.push(id);
        setCompareList(list);
        syncCompareBar();
        window.ARI && window.ARI.showToast("Added to comparison (" + list.length + "/3).");
      });
    });
  }

  function runComparison() {
    var list = getCompareList();
    var modal = document.getElementById("comparison-modal");
    var loading = document.getElementById("comparison-loading");
    var content = document.getElementById("comparison-content");
    var errorEl = document.getElementById("comparison-error");
    var tbody = document.getElementById("comparison-table-body");
    var verdictEl = document.getElementById("comparison-verdict");
    if (!modal || list.length < 2 || !window.ARI) return;

    modal.classList.remove("hidden");
    if (loading) loading.classList.remove("hidden");
    if (content) content.classList.add("hidden");
    if (errorEl) errorEl.classList.add("hidden");

    Promise.all(
      list.map(function (id) {
        return window.ARI.apiFetch("/api/restaurants/" + id).catch(function () {
          return null;
        });
      })
    )
      .then(function (restaurants) {
        var byId = {};
        restaurants.filter(Boolean).forEach(function (r) {
          byId[r.id] = r;
        });
        return window.ARI
          .apiFetch("/api/ai/compare", { method: "POST", body: { restaurant_ids: list } })
          .then(function (result) {
            renderComparison(result, byId, tbody, verdictEl);
            if (loading) loading.classList.add("hidden");
            if (content) content.classList.remove("hidden");
          });
      })
      .catch(function (err) {
        console.error("ARI comparison failed", err);
        if (loading) loading.classList.add("hidden");
        if (errorEl) errorEl.classList.remove("hidden");
      });
  }

  function renderComparison(result, byId, tbody, verdictEl) {
    if (!tbody) return;
    var rows = result.rows || [];
    var names = rows.map(function (row) {
      return (byId[row.restaurant_id] && byId[row.restaurant_id].name) || row.restaurant_id;
    });
    var dims = [
      { label: "Overall Match", get: function (r) { return r.overall_match + "%"; } },
      { label: "Budget Fit", get: function (r) { return r.budget_fit ? "✓" : "✕"; } },
      { label: "Diet Fit", get: function (r) { return r.diet_fit === true ? "✓" : r.diet_fit === false ? "✕" : "?"; } },
      { label: "Atmosphere Fit", get: function (r) { return r.atmosphere_fit ? "✓" : "✕"; } },
      { label: "Rating", get: function (r) { return r.rating; } },
      { label: "Value", get: function (r) { return r.value; } },
    ];
    var theadRow = tbody.parentElement && tbody.parentElement.querySelector("thead tr");
    if (theadRow) {
      theadRow.innerHTML = '<th class="py-3 pr-4 font-display text-base">Dimension</th>' +
        names.map(function (n) { return '<th class="py-3 pr-4 font-display text-base">' + escapeHtml(n) + "</th>"; }).join("");
    }
    tbody.innerHTML = dims
      .map(function (dim) {
        var cells = rows.map(function (row) {
          return '<td class="py-2 pr-4">' + escapeHtml(String(dim.get(row))) + "</td>";
        }).join("");
        return '<tr class="border-b border-hairline"><td class="py-2 pr-4 font-medium">' + dim.label + "</td>" + cells + "</tr>";
      })
      .join("");
    if (verdictEl) verdictEl.textContent = result.verdict + (result.reasoning ? " " + result.reasoning : "");
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function wireCompareBar() {
    var clearBtn = document.getElementById("compare-clear-btn");
    var openBtn = document.getElementById("compare-open-btn");
    var modal = document.getElementById("comparison-modal");
    var closeBtn = document.getElementById("comparison-modal-close");
    var backdrop = document.getElementById("comparison-modal-backdrop");
    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        setCompareList([]);
        syncCompareBar();
      });
    }
    if (openBtn) openBtn.addEventListener("click", runComparison);
    function closeModal() {
      if (modal) modal.classList.add("hidden");
    }
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    if (backdrop) backdrop.addEventListener("click", closeModal);
    syncCompareBar();
  }

  function runDefaultSearch(grid, sortSelect) {
    var panel = document.getElementById("ai-discover-panel");
    if (panel) panel.classList.add("hidden");
    setLoading(grid, true);
    var filters = readFilters();
    var extra = { sort_by: (sortSelect && sortSelect.value) || "best_match" };
    var query = buildQueryString(filters, extra);
    return window.ARI
      .apiFetch("/api/restaurants" + (query ? "?" + query : ""))
      .then(function (data) {
        var items = Array.isArray(data) ? data : data.results || data.restaurants || [];
        renderResults(grid, items);
      })
      .catch(function (err) {
        console.error("ARI.discover runDefaultSearch failed", err);
        window.ARI.showToast((err && err.message) || "Could not load restaurants.", {
          variant: "error",
        });
        toggleEmptyState(false);
        toggleErrorState(true);
      })
      .finally(function () {
        setLoading(grid, false);
      });
  }

  function showAiReasoning(data) {
    var panel = document.getElementById("ai-discover-panel");
    var reasoningEl = document.getElementById("ai-discover-reasoning");
    var warningsEl = document.getElementById("ai-discover-warnings");
    if (!panel) return;
    if (reasoningEl) reasoningEl.textContent = data.reasoning || "";
    if (warningsEl) {
      warningsEl.innerHTML = "";
      (data.warnings || []).forEach(function (w) {
        var li = document.createElement("li");
        li.textContent = w;
        warningsEl.appendChild(li);
      });
    }
    panel.classList.toggle("hidden", !data.reasoning && !(data.warnings || []).length);
  }

  function runAiDiscover(grid, query) {
    setLoading(grid, true);
    var filters = readFilters();
    var payload = {
      query: query || undefined,
      cuisine: filters.cuisine || [],
      diet: filters.diet || [],
      occasion: (filters.occasion && filters.occasion[0]) || undefined,
      atmosphere: filters.atmosphere || [],
    };
    return window.ARI
      .apiFetch("/api/ai/discover", { method: "POST", body: payload })
      .then(function (data) {
        showAiReasoning(data);
        var matches = data.matches || [];
        if (!matches.length) {
          renderResults(grid, []);
          return;
        }
        var matchById = {};
        matches.forEach(function (m) {
          matchById[m.restaurant_id] = m;
        });
        var ids = matches.map(function (m) {
          return m.restaurant_id;
        });
        return Promise.all(
          ids.map(function (id) {
            return window.ARI.apiFetch("/api/restaurants/" + id).catch(function () {
              return null;
            });
          })
        ).then(function (restaurants) {
          var merged = restaurants.filter(Boolean).map(function (r) {
            var match = matchById[r.id];
            return match ? Object.assign({}, r, { overall_match: match.overall_match }) : r;
          });
          renderResults(grid, merged);
        });
      })
      .catch(function (err) {
        console.error("ARI.discover runAiDiscover failed", err);
        window.ARI.showToast((err && err.message) || "AI search failed. Showing default results.", {
          variant: "error",
        });
        return runDefaultSearch(grid, document.getElementById("sort-select"));
      })
      .finally(function () {
        setLoading(grid, false);
      });
  }

  document.addEventListener("DOMContentLoaded", function () {
    try {
      var grid = document.getElementById("results-grid");
      if (!grid || !window.ARI) return;

      wireCompareBar();

      var sortSelect = document.getElementById("sort-select");
      var params = new URLSearchParams(window.location.search);
      var initialQuery = params.get("q");

      var refresh = function () {
        var q = new URLSearchParams(window.location.search).get("q");
        if (q) {
          runAiDiscover(grid, q);
        } else {
          runDefaultSearch(grid, sortSelect);
        }
      };

      qsa('[data-filter]').forEach(function (el) {
        el.addEventListener("change", function () {
          var filters = readFilters();
          window.ARI.updatePreferences(filters);
          refresh();
        });
      });

      if (sortSelect) {
        sortSelect.addEventListener("change", function () {
          if (!new URLSearchParams(window.location.search).get("q")) {
            runDefaultSearch(grid, sortSelect);
          }
        });
      }

      var retryBtn = document.getElementById("results-error-retry");
      if (retryBtn) retryBtn.addEventListener("click", refresh);

      var resetBtn = document.getElementById("results-empty-reset");
      if (resetBtn) {
        resetBtn.addEventListener("click", function () {
          qsa("[data-filter]").forEach(function (el) {
            if (el.tagName === "SELECT") el.selectedIndex = -1;
            else el.checked = false;
          });
          var url = new URL(window.location.href);
          url.searchParams.delete("q");
          window.history.replaceState({}, "", url.pathname);
          runDefaultSearch(grid, sortSelect);
        });
      }

      if (initialQuery) {
        runAiDiscover(grid, initialQuery);
      } else {
        runDefaultSearch(grid, sortSelect);
      }
    } catch (err) {
      console.error("ARI discover.js init failed", err);
    }
  });
})();
