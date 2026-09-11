/*
 * /planner page logic: multi-step form, loading-steps UI, dining-plan results.
 * Depends on window.ARI from main.js.
 */
(function () {
  "use strict";

  var STEP_IDS = [
    "step-preferences",
    "step-filtering",
    "step-menu",
    "step-dietary",
    "step-comparing",
    "step-building",
  ];

  function getFormValues(form) {
    var data = new FormData(form);
    var values = {};
    for (var pair of data.entries()) {
      var key = pair[0];
      var value = pair[1];
      if (values[key] !== undefined) {
        if (Array.isArray(values[key])) values[key].push(value);
        else values[key] = [values[key], value];
      } else {
        values[key] = value;
      }
    }
    return values;
  }

  function toArray(value) {
    if (value === undefined || value === null || value === "") return [];
    return Array.isArray(value) ? value : [value];
  }

  function resetLoadingSteps() {
    STEP_IDS.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.classList.remove("step--active", "step--done");
        el.setAttribute("data-state", "pending");
      }
    });
  }

  function runLoadingSteps(onComplete) {
    var delay = 350;
    STEP_IDS.forEach(function (id, index) {
      window.setTimeout(function () {
        var el = document.getElementById(id);
        if (!el) return;
        el.setAttribute("data-state", "active");
        if (index > 0) {
          var prevEl = document.getElementById(STEP_IDS[index - 1]);
          if (prevEl) prevEl.setAttribute("data-state", "done");
        }
        if (index === STEP_IDS.length - 1 && typeof onComplete === "function") {
          window.setTimeout(function () {
            el.setAttribute("data-state", "done");
            onComplete();
          }, delay);
        }
      }, delay * index);
    });
  }

  function renderResults(plan) {
    var resultsPanel = document.getElementById("planner-results");
    if (!resultsPanel || !plan) return;
    resultsPanel.classList.remove("hidden");

    var nameEl = document.getElementById("result-restaurant-name");
    if (nameEl) nameEl.textContent = plan.restaurant_name || "";

    var occasionEl = document.getElementById("result-occasion");
    if (occasionEl) occasionEl.textContent = plan.occasion || "Not specified";

    var badge = document.getElementById("result-match-badge");
    if (badge) {
      var valueEl = badge.querySelector(".match-badge__value");
      if (plan.overall_match !== undefined && plan.overall_match !== null) {
        badge.style.setProperty("--pct", plan.overall_match);
        if (valueEl) valueEl.textContent = plan.overall_match + "%";
      } else if (valueEl) {
        valueEl.textContent = "—";
      }
    }

    var explanationEl = document.getElementById("result-explanation");
    if (explanationEl) explanationEl.textContent = plan.explanation || "";

    var coursesEl = document.getElementById("result-courses");
    if (coursesEl) {
      coursesEl.innerHTML = "";
      (plan.courses || []).forEach(function (course) {
        var li = document.createElement("li");
        li.className = "menu-item-row";
        var left = document.createElement("div");
        left.className = "min-w-0";
        var p = document.createElement("p");
        p.className = "font-semibold";
        p.textContent = (course.course ? course.course + " — " : "") + (course.item_name || "");
        left.appendChild(p);
        var priceSpan = document.createElement("span");
        priceSpan.className = "menu-item-price";
        priceSpan.textContent = course.price !== undefined ? (plan.currency || "") + " " + course.price : "";
        li.appendChild(left);
        li.appendChild(priceSpan);
        coursesEl.appendChild(li);
      });
    }

    var totalEl = document.getElementById("result-total");
    if (totalEl) {
      totalEl.textContent =
        plan.estimated_total !== undefined ? (plan.currency || "") + " " + plan.estimated_total : "";
    }

    var backupWrap = document.getElementById("result-backup");
    var backupLink = document.getElementById("result-backup-link");
    if (backupWrap && backupLink) {
      if (plan.backup_restaurant_id && plan._backup) {
        backupWrap.classList.remove("hidden");
        backupLink.textContent = plan._backup.name || "View backup option";
        backupLink.href = "/restaurant/" + plan._backup.slug;
      } else {
        backupWrap.classList.add("hidden");
      }
    }

    var viewLink = document.getElementById("result-view-link");
    if (viewLink) viewLink.href = plan._restaurant_slug ? "/restaurant/" + plan._restaurant_slug : "#";
  }

  function attachRestaurantDetails(plan) {
    if (!window.ARI || !plan) return Promise.resolve(plan);
    return window.ARI
      .apiFetch("/api/restaurants/" + plan.restaurant_id)
      .catch(function () {
        return null;
      })
      .then(function (restaurant) {
        plan._restaurant_slug = restaurant ? restaurant.slug : null;
        if (!plan.backup_restaurant_id) return plan;
        return window.ARI
          .apiFetch("/api/restaurants/" + plan.backup_restaurant_id)
          .catch(function () {
            return null;
          })
          .then(function (backup) {
            plan._backup = backup;
            return plan;
          });
      });
  }

  function showPlannerError(message) {
    if (window.ARI) window.ARI.showToast(message || "Could not build a dining plan.", { variant: "error" });
    var errorEl = document.getElementById("planner-error");
    if (errorEl) errorEl.classList.remove("hidden");
    var placeholderEl = document.getElementById("planner-placeholder");
    if (placeholderEl) placeholderEl.classList.add("hidden");
  }

  function buildPlanFromRestaurant(restaurantId, values) {
    return window.ARI.apiFetch("/api/ai/dining-plan", {
      method: "POST",
      body: {
        restaurant_id: restaurantId,
        party_size: Number(values.party_size) || 2,
        budget_per_person: values.budget_per_person ? Number(values.budget_per_person) : undefined,
        diet: toArray(values.diet),
        occasion: values.occasion || undefined,
      },
    });
  }

  function discoverThenPlan(values) {
    return window.ARI
      .apiFetch("/api/ai/discover", {
        method: "POST",
        body: {
          query: values.query || undefined,
          cuisine: toArray(values.cuisine),
          diet: toArray(values.diet),
          budget_per_person: values.budget_per_person ? Number(values.budget_per_person) : undefined,
          occasion: values.occasion || undefined,
          atmosphere: toArray(values.atmosphere),
          city: values.city || undefined,
          area: values.area || undefined,
          party_size: values.party_size ? Number(values.party_size) : undefined,
        },
      })
      .then(function (discoverResult) {
        var matches = discoverResult.matches || [];
        if (!matches.length) {
          throw { message: "No matching restaurants found for these preferences." };
        }
        return buildPlanFromRestaurant(matches[0].restaurant_id, values).then(function (plan) {
          plan.overall_match = matches[0].overall_match;
          return plan;
        });
      });
  }

  document.addEventListener("DOMContentLoaded", function () {
    try {
      if (!window.ARI) return;
      var form = document.getElementById("planner-form");
      var params = new URLSearchParams(window.location.search);
      var restaurantIdParam = params.get("restaurant_id");

      if (!form) return;

      var budgetPresetEl = document.getElementById("planner-budget");
      var budgetCustomEl = document.getElementById("planner-budget-custom");
      function syncBudgetField() {
        if (!budgetPresetEl || !budgetCustomEl) return;
        if (budgetPresetEl.value === "custom") {
          budgetCustomEl.classList.remove("hidden");
        } else {
          budgetCustomEl.classList.add("hidden");
          budgetCustomEl.value = budgetPresetEl.value;
        }
      }
      if (budgetPresetEl) {
        budgetPresetEl.addEventListener("change", syncBudgetField);
        syncBudgetField();
      }

      var loadingPanel = document.getElementById("planner-loading");
      var placeholderPanel = document.getElementById("planner-placeholder");
      var errorPanel = document.getElementById("planner-error");
      var resultsPanel = document.getElementById("planner-results");

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var values = getFormValues(form);

        window.ARI.updatePreferences({
          cuisine: toArray(values.cuisine),
          diet: toArray(values.diet),
          budget: values.budget_per_person,
          occasion: values.occasion,
        });

        if (resultsPanel) resultsPanel.classList.add("hidden");
        if (errorPanel) errorPanel.classList.add("hidden");
        if (placeholderPanel) placeholderPanel.classList.add("hidden");
        resetLoadingSteps();
        if (loadingPanel) loadingPanel.classList.remove("hidden");

        var planPromise = restaurantIdParam
          ? buildPlanFromRestaurant(restaurantIdParam, values)
          : discoverThenPlan(values);

        runLoadingSteps(function () {
          planPromise
            .then(attachRestaurantDetails)
            .then(function (plan) {
              if (loadingPanel) loadingPanel.classList.add("hidden");
              renderResults(plan);
            })
            .catch(function (err) {
              console.error("ARI planner.js submit failed", err);
              if (loadingPanel) loadingPanel.classList.add("hidden");
              showPlannerError(err && err.message);
            });
        });
      });

      if (restaurantIdParam) {
        var partySizeField = form.elements.namedItem("party_size");
        if (partySizeField && !partySizeField.value) partySizeField.value = "2";
      }
    } catch (err) {
      console.error("ARI planner.js init failed", err);
    }
  });
})();
