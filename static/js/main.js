/*
 * ARI shared runtime: loaded first (classic <script>, no bundler/modules).
 * Exposes window.ARI = { ...helpers } for discover.js / restaurant.js / planner.js /
 * saved.js / comparison.js to consume. Keep this file dependency-free.
 */
(function () {
  "use strict";

  var ARI = window.ARI || {};

  // ---------------------------------------------------------------------
  // localStorage helpers (safe get/set JSON)
  // ---------------------------------------------------------------------
  function lsGet(key, fallback) {
    try {
      var raw = window.localStorage.getItem(key);
      if (raw === null || raw === undefined) return fallback;
      return JSON.parse(raw);
    } catch (err) {
      console.error("ARI.lsGet failed for key", key, err);
      return fallback;
    }
  }

  function lsSet(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.error("ARI.lsSet failed for key", key, err);
      return false;
    }
  }

  // ---------------------------------------------------------------------
  // Anonymous id (stable per browser, used for feedback)
  // ---------------------------------------------------------------------
  function anonymousId() {
    var KEY = "ari_anonymous_id";
    var existing = null;
    try {
      existing = window.localStorage.getItem(KEY);
    } catch (err) {
      existing = null;
    }
    if (existing) return existing;
    var id =
      "anon-" +
      Date.now().toString(36) +
      "-" +
      Math.random().toString(36).slice(2, 10);
    try {
      window.localStorage.setItem(KEY, id);
    } catch (err) {
      console.error("ARI.anonymousId: unable to persist id", err);
    }
    return id;
  }

  // ---------------------------------------------------------------------
  // Toast system
  // ---------------------------------------------------------------------
  function showToast(message, opts) {
    opts = opts || {};
    var container = document.getElementById("toast-container");
    if (!container) {
      console.warn("ARI.showToast: #toast-container missing, message:", message);
      return;
    }
    var toast = document.createElement("div");
    toast.className = "toast" + (opts.variant ? " toast--" + opts.variant : "");
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");

    var text = document.createElement("span");
    text.className = "toast__message";
    text.textContent = message;
    toast.appendChild(text);

    var closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "toast__close";
    closeBtn.setAttribute("aria-label", "Dismiss notification");
    closeBtn.textContent = "×";
    closeBtn.addEventListener("click", function () {
      removeToast(toast);
    });
    toast.appendChild(closeBtn);

    container.appendChild(toast);

    var timeoutId = window.setTimeout(function () {
      removeToast(toast);
    }, opts.duration || 3000);
    toast.dataset.timeoutId = String(timeoutId);
  }

  function removeToast(toast) {
    if (!toast || !toast.parentNode) return;
    var timeoutId = toast.dataset.timeoutId;
    if (timeoutId) window.clearTimeout(Number(timeoutId));
    toast.parentNode.removeChild(toast);
  }

  // ---------------------------------------------------------------------
  // apiFetch wrapper: JSON in/out, normalized error { message }
  // ---------------------------------------------------------------------
  function apiFetch(url, options) {
    options = options || {};
    var fetchOpts = {
      method: options.method || "GET",
      headers: Object.assign(
        { Accept: "application/json" },
        options.body ? { "Content-Type": "application/json" } : {},
        options.headers || {}
      ),
    };
    if (options.body !== undefined) {
      fetchOpts.body =
        typeof options.body === "string" ? options.body : JSON.stringify(options.body);
    }

    return fetch(url, fetchOpts)
      .catch(function () {
        throw { message: "Network error. Please check your connection and try again." };
      })
      .then(function (response) {
        var isJson = (response.headers.get("content-type") || "").indexOf(
          "application/json"
        ) !== -1;
        return (isJson ? response.json().catch(function () { return {}; }) : response.text())
          .then(function (data) {
            if (!response.ok) {
              var message =
                (data && typeof data === "object" && data.detail) ||
                "Something went wrong (" + response.status + ").";
              throw { message: message, status: response.status, data: data };
            }
            return data;
          });
      });
  }

  // ---------------------------------------------------------------------
  // Recently viewed / saved list helpers (used across pages)
  // ---------------------------------------------------------------------
  function dedupUnshiftCap(list, id, cap) {
    var next = [id].concat(list.filter(function (existing) { return existing !== id; }));
    return next.slice(0, cap);
  }

  function isSaved(id) {
    var saved = lsGet("ari_saved_restaurants", []);
    return Array.isArray(saved) && saved.indexOf(id) !== -1;
  }

  function toggleSaved(id) {
    var saved = lsGet("ari_saved_restaurants", []);
    if (!Array.isArray(saved)) saved = [];
    var idx = saved.indexOf(id);
    var nowSaved;
    if (idx === -1) {
      saved.push(id);
      nowSaved = true;
    } else {
      saved.splice(idx, 1);
      nowSaved = false;
    }
    lsSet("ari_saved_restaurants", saved);
    showToast(nowSaved ? "Restaurant saved" : "Restaurant removed");
    return nowSaved;
  }

  function recordRecentlyViewed(id) {
    if (!id) return;
    var list = lsGet("ari_recently_viewed", []);
    if (!Array.isArray(list)) list = [];
    lsSet("ari_recently_viewed", dedupUnshiftCap(list, id, 12));
  }

  function updatePreferences(partial) {
    var prefs = lsGet("ari_preferences", {});
    if (!prefs || typeof prefs !== "object") prefs = {};
    Object.assign(prefs, partial);
    lsSet("ari_preferences", prefs);
    return prefs;
  }

  // ---------------------------------------------------------------------
  // Save button wiring: any [data-action="save"] element with data-id
  // ---------------------------------------------------------------------
  function applySavedState(btn, id) {
    if (!btn) return;
    var saved = isSaved(id);
    btn.classList.toggle("is-saved", saved);
    btn.setAttribute("aria-pressed", saved ? "true" : "false");
    var label = btn.querySelector("[data-save-label]") || btn;
    if (label && label.dataset && label.dataset.saveLabel !== undefined) {
      label.textContent = saved ? "Saved" : "Save";
    } else if (!btn.querySelector("[data-save-label]")) {
      // No dedicated label node: only touch textContent if button has no other children (icons etc.)
      if (btn.children.length === 0) {
        btn.textContent = saved ? "Saved" : "Save";
      }
    }
  }

  function wireSaveButtons(root) {
    var scope = root || document;
    var buttons = scope.querySelectorAll('[data-action="save"]');
    buttons.forEach(function (btn) {
      var id = btn.dataset.id || btn.getAttribute("data-restaurant-id");
      if (id) applySavedState(btn, id);
      if (btn.dataset.ariWired === "1") return;
      btn.dataset.ariWired = "1";
      btn.addEventListener("click", function () {
        var targetId = btn.dataset.id || btn.getAttribute("data-restaurant-id");
        if (!targetId) {
          console.error("ARI save button missing data-id");
          return;
        }
        toggleSaved(targetId);
        applySavedState(btn, targetId);
      });
    });
  }

  // ---------------------------------------------------------------------
  // Share button wiring: any [data-action="share"] element
  // ---------------------------------------------------------------------
  function wireShareButtons(root) {
    var scope = root || document;
    var buttons = scope.querySelectorAll('[data-action="share"]');
    buttons.forEach(function (btn) {
      if (btn.dataset.ariWired === "1") return;
      btn.dataset.ariWired = "1";
      btn.addEventListener("click", function () {
        var url = window.location.href;
        var title = document.title || "AI Restaurant Intelligence Platform";
        if (navigator.share) {
          navigator.share({ title: title, url: url }).catch(function () {
            /* user cancelled share sheet; not an error */
          });
          return;
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard
            .writeText(url)
            .then(function () {
              showToast("Link copied.");
            })
            .catch(function () {
              showToast("Unable to copy link.", { variant: "error" });
            });
        } else {
          showToast("Unable to share on this browser.", { variant: "error" });
        }
      });
    });
  }

  // ---------------------------------------------------------------------
  // Feedback thumbs wiring: [data-action="feedback"][data-value="up|down"]
  // ---------------------------------------------------------------------
  function wireFeedbackButtons(root, context, referenceId) {
    var scope = root || document;
    var buttons = scope.querySelectorAll('[data-action="feedback"]');
    buttons.forEach(function (btn) {
      if (btn.dataset.ariWired === "1") return;
      btn.dataset.ariWired = "1";
      btn.addEventListener("click", function () {
        var useful = btn.getAttribute("data-value") === "up";
        var ctx = btn.getAttribute("data-context") || context || "general";
        var refId = btn.getAttribute("data-reference-id") || referenceId;
        apiFetch("/api/feedback", {
          method: "POST",
          body: {
            context: ctx,
            reference_id: refId,
            useful: useful,
            anonymous_id: anonymousId(),
          },
        })
          .then(function () {
            showToast("Thanks for your feedback!");
          })
          .catch(function (err) {
            showToast((err && err.message) || "Could not send feedback.", { variant: "error" });
          });
      });
    });
  }

  // ---------------------------------------------------------------------
  // Shared restaurant card renderer (used by discover.js, saved.js)
  // Populates a clone of #restaurant-card-template if present, otherwise
  // builds a minimal fallback card so the page never renders nothing.
  // ---------------------------------------------------------------------
  function renderRestaurantCard(restaurant) {
    if (!restaurant) return null;
    var template =
      document.getElementById("restaurant-card-template") ||
      document.getElementById("saved-card-template");
    var node;

    if (template && template.content) {
      node = template.content.firstElementChild
        ? template.content.firstElementChild.cloneNode(true)
        : document.createElement("div");
    } else {
      node = document.createElement("article");
    }

    var name = restaurant.name || "Unnamed restaurant";
    var slug = restaurant.slug || restaurant.id;
    var q = node.querySelector ? node.querySelector.bind(node) : function () { return null; };

    var nameTextEl = q(".card-name") || q(".name-link");
    if (nameTextEl) nameTextEl.textContent = name;
    else if (!template) node.appendChild(Object.assign(document.createElement("h3"), { textContent: name }));

    var cuisineEl = q(".card-cuisine") || q(".cuisine-label");
    if (cuisineEl) {
      cuisineEl.textContent = Array.isArray(restaurant.cuisine)
        ? restaurant.cuisine.join(", ")
        : restaurant.cuisine || "";
    }

    var descEl = q(".card-description") || q(".description-text");
    if (descEl) descEl.textContent = restaurant.description || "";

    var ratingValueEl = q(".rating-value");
    var ratingEl = q(".card-rating");
    if (ratingValueEl) {
      ratingValueEl.textContent =
        restaurant.rating !== undefined && restaurant.rating !== null ? String(restaurant.rating) : "";
    } else if (ratingEl) {
      ratingEl.textContent =
        restaurant.rating !== undefined && restaurant.rating !== null ? "★ " + restaurant.rating : "";
    }

    var priceLevelChip = q(".price-level-chip");
    if (priceLevelChip) priceLevelChip.textContent = restaurant.price_level || "";
    var costEl = q(".cost-text") || q(".card-price");
    if (costEl) {
      var cost = restaurant.average_cost_per_person;
      costEl.textContent =
        cost !== undefined && cost !== null
          ? (restaurant.currency || "") + " " + cost + "/person"
          : restaurant.price_level || "";
    }

    var areaEl = q(".card-area") || q(".area-text");
    if (areaEl) areaEl.textContent = restaurant.area || restaurant.city || "";

    var tagsEl = q(".card-tags") || q(".tags-container");
    if (tagsEl) {
      var tags = []
        .concat(restaurant.dietary_options || restaurant.diet || [])
        .concat(restaurant.occasions || restaurant.occasion || [])
        .concat(restaurant.ambience || restaurant.atmosphere || []);
      tagsEl.textContent = tags.filter(Boolean).slice(0, 4).join(" · ");
    }

    var matchChip = q(".match-chip");
    if (matchChip && restaurant.overall_match !== undefined && restaurant.overall_match !== null) {
      matchChip.textContent = restaurant.overall_match + "% Match";
      matchChip.classList.remove("hidden");
    }

    var placeholderArt = q(".placeholder-art");
    if (placeholderArt) {
      var primaryCuisine = Array.isArray(restaurant.cuisine) ? restaurant.cuisine[0] : restaurant.cuisine;
      if (primaryCuisine) placeholderArt.setAttribute("data-cuisine", String(primaryCuisine).toLowerCase());
    }
    var placeholderMark = q(".placeholder-mark");
    if (placeholderMark) placeholderMark.textContent = name.charAt(0);

    var cardImageEl = q(".card-image");
    if (cardImageEl && restaurant.image) {
      cardImageEl.onerror = function () {
        cardImageEl.classList.add("hidden");
      };
      cardImageEl.alt = name;
      cardImageEl.src = restaurant.image;
      cardImageEl.classList.remove("hidden");
    }

    [q(".card-link"), q(".name-link"), q(".view-link")].forEach(function (linkEl) {
      if (linkEl && slug) linkEl.setAttribute("href", "/restaurant/" + slug);
    });

    var saveBtn = q(".card-save-btn") || q(".save-btn") || q('[data-action="save"]');
    if (saveBtn && restaurant.id !== undefined) {
      saveBtn.setAttribute("data-action", "save");
      saveBtn.dataset.id = String(restaurant.id);
    }

    var compareCheckbox = q(".compare-checkbox") || q('[data-action="compare-toggle"]');
    if (compareCheckbox && restaurant.id !== undefined) {
      compareCheckbox.dataset.id = String(restaurant.id);
    }
    var compareBtn = q('[data-action="compare-add"]');
    if (compareBtn && restaurant.id !== undefined) {
      compareBtn.dataset.id = String(restaurant.id);
    }

    if (node.nodeType === 1) node.dataset.restaurantId = String(restaurant.id);

    return node;
  }

  // ---------------------------------------------------------------------
  // Navbar scroll effect + mobile menu toggle + global search
  // ---------------------------------------------------------------------
  function initNavbar() {
    var navbar = document.getElementById("site-navbar");
    if (navbar) {
      var applyScrollClass = function () {
        navbar.classList.toggle("navbar--scrolled", window.scrollY > 8);
      };
      applyScrollClass();
      window.addEventListener("scroll", applyScrollClass, { passive: true });
    }

    var toggle = document.getElementById("mobile-menu-toggle");
    var menu = document.getElementById("mobile-menu");
    if (toggle && menu) {
      toggle.addEventListener("click", function () {
        var isOpen = menu.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      });
    }

    var globalSearchInput = document.getElementById("global-search-input");
    if (globalSearchInput) {
      var navigateToDiscover = function () {
        var q = globalSearchInput.value.trim();
        window.location.href = "/discover" + (q ? "?q=" + encodeURIComponent(q) : "");
      };
      var form = globalSearchInput.closest("form");
      if (form) {
        form.addEventListener("submit", function (e) {
          e.preventDefault();
          navigateToDiscover();
        });
      } else {
        globalSearchInput.addEventListener("keydown", function (e) {
          if (e.key === "Enter") {
            e.preventDefault();
            navigateToDiscover();
          }
        });
      }
    }
  }

  // ---------------------------------------------------------------------
  // Smart search input on index.html (id="smart-search-input")
  // ---------------------------------------------------------------------
  function initSmartSearch() {
    var input = document.getElementById("smart-search-input");
    if (!input) return;
    var navigateToDiscover = function () {
      var q = input.value.trim();
      window.location.href = "/discover" + (q ? "?q=" + encodeURIComponent(q) : "");
    };
    var form = input.closest("form");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        navigateToDiscover();
      });
    } else {
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          navigateToDiscover();
        }
      });
    }
  }

  // ---------------------------------------------------------------------
  // Index page: popular / trending sections
  // ---------------------------------------------------------------------
  function initHomeSections() {
    var sections = [
      { attr: "popular", sortBy: "highest_rated" },
      { attr: "trending", sortBy: "most_popular" },
    ];

    sections.forEach(function (section) {
      var wrapper = document.querySelector('[data-section="' + section.attr + '"]');
      if (!wrapper) return;
      var grid =
        wrapper.querySelector(".grid") ||
        wrapper.querySelector("[data-grid]") ||
        wrapper;

      apiFetch("/api/restaurants?sort_by=" + encodeURIComponent(section.sortBy))
        .then(function (data) {
          var items = Array.isArray(data) ? data : data.results || data.restaurants || [];
          items = items.slice(0, 8);
          if (!items.length) return;
          var frag = document.createDocumentFragment();
          items.forEach(function (restaurant) {
            var card = renderRestaurantCard(restaurant);
            if (card) frag.appendChild(card);
          });
          grid.innerHTML = "";
          grid.appendChild(frag);
          wireSaveButtons(grid);
          wireShareButtons(grid);
        })
        .catch(function (err) {
          console.error("ARI.initHomeSections failed for", section.attr, err);
          showToast("Could not load " + section.attr + " restaurants.", { variant: "error" });
        });
    });
  }

  Object.assign(ARI, {
    lsGet: lsGet,
    lsSet: lsSet,
    anonymousId: anonymousId,
    showToast: showToast,
    apiFetch: apiFetch,
    isSaved: isSaved,
    toggleSaved: toggleSaved,
    recordRecentlyViewed: recordRecentlyViewed,
    updatePreferences: updatePreferences,
    wireSaveButtons: wireSaveButtons,
    wireShareButtons: wireShareButtons,
    wireFeedbackButtons: wireFeedbackButtons,
    renderRestaurantCard: renderRestaurantCard,
    dedupUnshiftCap: dedupUnshiftCap,
  });

  window.ARI = ARI;

  // ---------------------------------------------------------------------
  // Contact form (contact.html)
  // ---------------------------------------------------------------------
  function initContactForm() {
    var form = document.getElementById("contact-form");
    if (!form) return;

    var errorEl = form.querySelector("[data-contact-error]");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (errorEl) {
        errorEl.textContent = "";
        errorEl.hidden = true;
      }

      var data = new FormData(form);
      var payload = {
        name: data.get("name") || "",
        email: data.get("email") || "",
        subject: data.get("subject") || "",
        message: data.get("message") || "",
      };

      var submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      apiFetch("/api/contact", { method: "POST", body: payload })
        .then(function () {
          var confirmation = document.createElement("p");
          confirmation.className = "contact-confirmation";
          confirmation.textContent = "Message received.";
          confirmation.setAttribute("role", "status");
          if (form.parentNode) {
            form.parentNode.replaceChild(confirmation, form);
          }
        })
        .catch(function (err) {
          var message = (err && err.message) || "Could not send your message. Please try again.";
          if (errorEl) {
            errorEl.textContent = message;
            errorEl.hidden = false;
          } else {
            showToast(message, { variant: "error" });
          }
        })
        .finally(function () {
          if (submitBtn) submitBtn.disabled = false;
        });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    try {
      initNavbar();
      initSmartSearch();
      initHomeSections();
      initContactForm();
      wireSaveButtons(document);
      wireShareButtons(document);
    } catch (err) {
      console.error("ARI main.js init failed", err);
    }
  });
})();
