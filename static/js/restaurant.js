/*
 * /restaurant/{slug} page logic: AI insights, menu filters, chat, save/share/feedback.
 * Depends on window.ARI from main.js.
 */
(function () {
  "use strict";

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }
  function qsa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function getRestaurantId() {
    var detail = document.getElementById("restaurant-detail");
    if (detail && detail.dataset.restaurantId) return detail.dataset.restaurantId;
    if (document.body && document.body.dataset.restaurantId) {
      return document.body.dataset.restaurantId;
    }
    var anyEl = document.querySelector("[data-restaurant-id]");
    return anyEl ? anyEl.dataset.restaurantId : null;
  }

  // -----------------------------------------------------------------
  // AI insights panel
  // -----------------------------------------------------------------
  function loadInsights(restaurantId) {
    var panel = document.getElementById("ai-insights-panel");
    if (!panel || !restaurantId || !window.ARI) return;

    panel.classList.add("is-loading");
    panel.setAttribute("aria-busy", "true");

    window.ARI
      .apiFetch("/api/ai/analyze-restaurant", {
        method: "POST",
        body: { restaurant_id: restaurantId },
      })
      .then(function (match) {
        renderInsights(panel, match);
      })
      .catch(function (err) {
        console.error("ARI restaurant.js loadInsights failed", err);
        panel.innerHTML = "";
        var errorEl = document.createElement("p");
        errorEl.className = "ai-insights-error";
        errorEl.textContent =
          (err && err.message) || "Could not load AI insights right now.";
        panel.appendChild(errorEl);
        window.ARI.showToast(errorEl.textContent, { variant: "error" });
      })
      .finally(function () {
        panel.classList.remove("is-loading");
        panel.setAttribute("aria-busy", "false");
      });
  }

  function renderInsights(panel, match) {
    panel.innerHTML = "";
    if (!match) return;

    var summary = document.createElement("p");
    summary.className = "ai-insights-summary";
    summary.textContent = match.summary || "";
    panel.appendChild(summary);

    var matchEl = document.createElement("p");
    matchEl.className = "ai-insights-match";
    if (match.overall_match !== undefined && match.overall_match !== null) {
      matchEl.textContent = "Match: " + match.overall_match + "%";
    }
    panel.appendChild(matchEl);

    if (Array.isArray(match.strengths) && match.strengths.length) {
      var strengthsList = document.createElement("ul");
      strengthsList.className = "ai-insights-strengths";
      match.strengths.forEach(function (s) {
        var li = document.createElement("li");
        li.textContent = s;
        strengthsList.appendChild(li);
      });
      panel.appendChild(strengthsList);
    }

    if (Array.isArray(match.concerns) && match.concerns.length) {
      var concernsList = document.createElement("ul");
      concernsList.className = "ai-insights-concerns";
      match.concerns.forEach(function (c) {
        var li = document.createElement("li");
        li.textContent = c;
        concernsList.appendChild(li);
      });
      panel.appendChild(concernsList);
    }
  }

  // -----------------------------------------------------------------
  // Menu filters: instant client-side filter + optional AI explanation
  // -----------------------------------------------------------------
  function matchesFilter(itemEl, filterTag, medianPrice) {
    var tags = (itemEl.dataset.dietary || itemEl.dataset.dietaryTags || "")
      .toLowerCase()
      .split(/[,\s]+/)
      .filter(Boolean);
    var price = parseFloat(itemEl.dataset.price || "");
    var spice = (itemEl.dataset.spice || "").toLowerCase();
    var category = (itemEl.dataset.category || "").toLowerCase();
    var popular = itemEl.dataset.popular === "true";
    var recommended = itemEl.dataset.recommended === "true";

    switch (filterTag) {
      case "vegetarian":
        return tags.indexOf("vegetarian") !== -1 || tags.indexOf("vegan") !== -1;
      case "high_protein":
        return tags.indexOf("high_protein") !== -1 || tags.indexOf("high-protein") !== -1;
      case "spicy":
        return spice === "spicy" || spice === "hot" || tags.indexOf("spicy") !== -1;
      case "sharing":
        return category.indexOf("starter") !== -1 || category.indexOf("side") !== -1;
      case "dessert":
        return category.indexOf("dessert") !== -1;
      case "under_2000":
        return !isNaN(price) && price > 0 && price < 2000;
      case "best_value":
        return (popular || recommended) && !isNaN(price) && !isNaN(medianPrice) && price <= medianPrice;
      default:
        return true;
    }
  }

  function applyMenuFilter(filterTag) {
    var items = qsa("[data-menu-item]");
    if (!items.length) return;
    var prices = items
      .map(function (el) {
        return parseFloat(el.dataset.price || "");
      })
      .filter(function (p) {
        return !isNaN(p);
      })
      .sort(function (a, b) {
        return a - b;
      });
    var medianPrice = prices.length ? prices[Math.floor(prices.length / 2)] : NaN;
    var visibleCount = 0;
    items.forEach(function (itemEl) {
      var show = !filterTag || filterTag === "all" || matchesFilter(itemEl, filterTag, medianPrice);
      itemEl.hidden = !show;
      if (show) visibleCount += 1;
    });
    var emptyState = document.getElementById("menu-empty-state");
    if (emptyState) emptyState.classList.toggle("hidden", visibleCount !== 0);
  }

  function loadMenuFilterExplanation(restaurantId, filterTag) {
    var explanationPanel = document.getElementById("menu-filter-explanation");
    if (!explanationPanel || !window.ARI || !restaurantId) return;
    explanationPanel.textContent = "Thinking...";
    window.ARI
      .apiFetch("/api/ai/analyze-menu", {
        method: "POST",
        body: { restaurant_id: restaurantId, filter_tag: filterTag },
      })
      .then(function (data) {
        explanationPanel.textContent = data.answer || "";
      })
      .catch(function (err) {
        console.error("ARI restaurant.js menu filter AI explanation failed", err);
        explanationPanel.textContent = "";
      });
  }

  function initMenuFilters(restaurantId) {
    var buttons = qsa("[data-menu-filter]");
    if (!buttons.length) return;
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var filterTag = btn.getAttribute("data-menu-filter");
        buttons.forEach(function (b) {
          b.classList.toggle("is-active", b === btn);
        });
        applyMenuFilter(filterTag);
        loadMenuFilterExplanation(restaurantId, filterTag);
      });
    });
  }

  // -----------------------------------------------------------------
  // Chat panel
  // -----------------------------------------------------------------
  function initChatPanel(restaurantId) {
    var panel = document.getElementById("restaurant-chat-panel");
    if (!panel || !window.ARI) return;

    var messageList =
      panel.querySelector("[data-chat-messages]") || panel.querySelector(".chat-messages");
    var input = panel.querySelector("input, textarea");
    var sendBtn = panel.querySelector('[data-action="chat-send"], button[type="submit"]');
    var form = panel.querySelector("form");
    var history = [];

    function appendMessage(role, content) {
      if (!messageList) return;
      var msgEl = document.createElement("div");
      msgEl.className = "chat-message chat-message--" + role;
      msgEl.textContent = content;
      messageList.appendChild(msgEl);
      messageList.scrollTop = messageList.scrollHeight;
    }

    function sendQuestion(question) {
      if (!question || !restaurantId) return;
      appendMessage("user", question);
      history.push({ role: "user", content: question });
      if (input) input.value = "";

      appendMessage("assistant", "Thinking...");
      var placeholder = messageList ? messageList.lastElementChild : null;

      window.ARI
        .apiFetch("/api/ai/restaurant-chat", {
          method: "POST",
          body: { restaurant_id: restaurantId, question: question, history: history },
        })
        .then(function (data) {
          var answer = data.answer || "Sorry, I don't have an answer for that.";
          if (placeholder) placeholder.textContent = answer;
          else appendMessage("assistant", answer);
          history.push({ role: "assistant", content: answer });
        })
        .catch(function (err) {
          console.error("ARI restaurant.js chat failed", err);
          var message = (err && err.message) || "Could not reach the assistant.";
          if (placeholder) placeholder.textContent = message;
          window.ARI.showToast(message, { variant: "error" });
        });
    }

    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        sendQuestion(input ? input.value.trim() : "");
      });
    } else if (sendBtn) {
      sendBtn.addEventListener("click", function () {
        sendQuestion(input ? input.value.trim() : "");
      });
    }

    if (input && !form) {
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          sendQuestion(input.value.trim());
        }
      });
    }

    qsa("[data-example-question]", panel).forEach(function (chip) {
      chip.addEventListener("click", function () {
        sendQuestion(chip.getAttribute("data-example-question") || chip.textContent.trim());
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    try {
      if (!window.ARI) return;
      var restaurantId = getRestaurantId();

      if (restaurantId) {
        window.ARI.recordRecentlyViewed(restaurantId);
      }

      loadInsights(restaurantId);
      initMenuFilters(restaurantId);
      initChatPanel(restaurantId);

      window.ARI.wireSaveButtons(document);
      window.ARI.wireShareButtons(document);
      window.ARI.wireFeedbackButtons(document, "restaurant", restaurantId);
    } catch (err) {
      console.error("ARI restaurant.js init failed", err);
    }
  });
})();
