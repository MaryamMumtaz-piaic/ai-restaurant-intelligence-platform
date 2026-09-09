/*
 * /saved page logic: saved-grid + recently-viewed rendering.
 * Depends on window.ARI from main.js (shared renderRestaurantCard, localStorage helpers).
 */
(function () {
  "use strict";

  function renderGrid(gridEl, ids, emptyStateId) {
    if (!gridEl) return;
    var emptyState = emptyStateId && document.getElementById(emptyStateId);
    gridEl.innerHTML = "";

    if (!ids || !ids.length) {
      if (emptyState) emptyState.classList.remove("hidden");
      return;
    }
    if (emptyState) emptyState.classList.add("hidden");

    Promise.all(
      ids.map(function (id) {
        return window.ARI.apiFetch("/api/restaurants/" + id).catch(function (err) {
          console.error("ARI saved.js failed to load restaurant", id, err);
          return null;
        });
      })
    ).then(function (restaurants) {
      var valid = restaurants.filter(Boolean);
      if (!valid.length) {
        if (emptyState) emptyState.classList.remove("hidden");
        return;
      }
      var frag = document.createDocumentFragment();
      valid.forEach(function (restaurant) {
        var card = window.ARI.renderRestaurantCard(restaurant);
        if (card) frag.appendChild(card);
      });
      gridEl.appendChild(frag);
      window.ARI.wireSaveButtons(gridEl);
      window.ARI.wireShareButtons(gridEl);

      if (gridEl.id === "saved-grid") {
        gridEl.querySelectorAll('[data-action="save"]').forEach(function (btn) {
          btn.addEventListener("click", function () {
            var card = btn.closest("article");
            setTimeout(function () {
              var stillSaved = window.ARI.lsGet("ari_saved_restaurants", []);
              var id = btn.dataset.id;
              if (card && Array.isArray(stillSaved) && stillSaved.indexOf(id) === -1) {
                card.remove();
                if (!gridEl.children.length) {
                  var emptyState = document.getElementById("saved-empty");
                  if (emptyState) emptyState.classList.remove("hidden");
                }
              }
            }, 0);
          });
        });
      }

      if (restaurants.some(function (r) { return r === null; })) {
        window.ARI.showToast("Some saved restaurants could not be loaded.", { variant: "error" });
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    try {
      if (!window.ARI) return;

      var loading = document.getElementById("saved-loading");
      if (loading) loading.classList.add("hidden");

      var savedGrid = document.getElementById("saved-grid");
      if (savedGrid) {
        var savedIds = window.ARI.lsGet("ari_saved_restaurants", []);
        renderGrid(savedGrid, Array.isArray(savedIds) ? savedIds : [], "saved-empty");
      }

      var recentGrid = document.getElementById("recently-viewed-grid");
      if (recentGrid) {
        var recentIds = window.ARI.lsGet("ari_recently_viewed", []);
        renderGrid(recentGrid, Array.isArray(recentIds) ? recentIds : [], "recently-viewed-empty");
      }
    } catch (err) {
      console.error("ARI saved.js init failed", err);
    }
  });
})();
