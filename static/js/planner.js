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

  function qsa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

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

  function runLoadingSteps(onComplete) {
    var delay = 350;
    STEP_IDS.forEach(function (id, index) {
      window.setTimeout(function () {
        var el = document.getElementById(id);
        if (!el) return;
        qsa(".step--active").forEach(function (activeEl) {
          activeEl.classList.remove("step--active");
        });
        el.classList.add("step--active");
        if (index > 0) {
          var prevEl = document.getElementById(STEP_IDS[index - 1]);
          if (prevEl) {
            prevEl.classList.remove("step--active");
            prevEl.classList.add("step--done");
          }
        }
        if (index === STEP_IDS.length - 1 && typeof onComplete === "function") {
          window.setTimeout(function () {
            el.classList.remove("step--active");
            el.classList.add("step--done");
            onComplete();
          }, delay);
        }
      }, delay * index);
    });
  }

  function renderResults(plan) {
    var resultsPanel = document.getElementById("planner-results");
    if (!resultsPanel || !plan) return;
    resultsPanel.hidden = false;

    var setText = function (selector, text) {
      var el = resultsPanel.querySelector(selector);
      if (el) el.textContent = text;
    };

    setText("[data-plan-restaurant]", plan.restaurant_name || "");
    setText("[data-plan-occasion]", plan.occasion || "");
    setText(
      "[data-plan-budget]",
      plan.budget_per_person !== undefined && plan.budget_per_person !== null
        ? String(plan.budget_per_person)
        : ""
    );
    setText(
      "[data-plan-total]",
      plan.estimated_total !== undefined
        ? plan.estimated_total + " " + (plan.currency || "")
        : ""
    );
    setText("[data-plan-explanation]", plan.explanation || "");

    var coursesEl = resultsPanel.querySelector("[data-plan-courses]");
    if (coursesEl) {
      coursesEl.innerHTML = "";
      (plan.courses || []).forEach(function (course) {
        var li = document.createElement("li");
        li.textContent =
          (course.course ? course.course + ": " : "") +
          (course.item_name || "") +
          (course.price !== undefined ? " — " + course.price : "");
        coursesEl.appendChild(li);
      });
    }

    var backupEl = resultsPanel.querySelector("[data-plan-backup]");
    if (backupEl) {
      if (plan.backup_restaurant_id) {
        backupEl.hidden = false;
        backupEl.textContent = "Backup option available.";
        backupEl.dataset.restaurantId = plan.backup_restaurant_id;
      } else {
        backupEl.hidden = true;
      }
    }
  }

  function showPlannerError(message) {
    if (window.ARI) window.ARI.showToast(message || "Could not build a dining plan.", { variant: "error" });
    var resultsPanel = document.getElementById("planner-results");
    if (resultsPanel) {
      var errorEl = resultsPanel.querySelector("[data-plan-error]");
      if (errorEl) {
        errorEl.textContent = message || "Could not build a dining plan.";
        errorEl.hidden = false;
      }
    }
  }

  function buildPlanFromRestaurant(restaurantId, values) {
    return window.ARI.apiFetch("/api/ai/dining-plan", {
      method: "POST",
      body: {
        restaurant_id: restaurantId,
        party_size: Number(values.party_size) || 2,
        budget_per_person: values.budget ? Number(values.budget) : undefined,
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
          budget_per_person: values.budget ? Number(values.budget) : undefined,
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
        return buildPlanFromRestaurant(matches[0].restaurant_id, values);
      });
  }

  document.addEventListener("DOMContentLoaded", function () {
    try {
      if (!window.ARI) return;
      var form = document.getElementById("planner-form");
      var params = new URLSearchParams(window.location.search);
      var restaurantIdParam = params.get("restaurant_id");

      if (!form) return;

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var values = getFormValues(form);

        window.ARI.updatePreferences({
          cuisine: toArray(values.cuisine),
          diet: toArray(values.diet),
          budget: values.budget,
          occasion: values.occasion,
        });

        var resultsPanel = document.getElementById("planner-results");
        if (resultsPanel) {
          resultsPanel.hidden = true;
          var errorEl = resultsPanel.querySelector("[data-plan-error]");
          if (errorEl) errorEl.hidden = true;
        }

        var planPromise = restaurantIdParam
          ? buildPlanFromRestaurant(restaurantIdParam, values)
          : discoverThenPlan(values);

        runLoadingSteps(function () {
          planPromise
            .then(function (plan) {
              renderResults(plan);
            })
            .catch(function (err) {
              console.error("ARI planner.js submit failed", err);
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
