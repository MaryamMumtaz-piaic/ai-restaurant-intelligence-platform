# AGENTS.md

This document describes the multi-agent AI architecture behind the AI Restaurant Intelligence Platform, for contributors and AI coding assistants working in this repository.

## Overview

The platform does not send raw user queries straight to a single LLM call. Instead, it runs a small pipeline of specialized agents, each responsible for one stage of reasoning, coordinated by an orchestrator. This keeps prompts small and focused, keeps OpenAI usage cheap and predictable, and makes every recommendation explainable in terms of concrete inputs rather than an opaque model output.

```
User Intent
     |
Preference Extraction        (extract_dining_intent, only when a free-text query is given)
     v
Restaurant Discovery Agent   (local filtering + scoring, never sends the full dataset to the model)
     v
Restaurant Intelligence Agent  (per-candidate match analysis, top ~5 candidates only)
     v
Menu Analysis Agent          (on demand, per restaurant)
     v
Dietary Compatibility Agent  (on demand, per restaurant)
     v
Comparison Agent             (on demand, 2-3 selected restaurants)
     v
Dining Plan Agent            (on demand, builds an ordered plan with cost estimate)
     v
Final Recommendation
```

The orchestrator (`app/agents/orchestrator.py`) is the only module that composes agents together. Routes never call `openai_service` or individual agents directly except through the orchestrator, and agents never call the OpenAI SDK directly except through `app/services/openai_service.py`.

## Agents

| File | Responsibility |
|---|---|
| `app/agents/restaurant_discovery_agent.py` | Interprets dining intent, applies local hard/soft filters via `restaurant_service.local_candidate_filter`, and returns a bounded candidate list (max ~10) before any AI ranking happens. |
| `app/agents/restaurant_intelligence_agent.py` | Produces a `RestaurantMatch`: per-dimension match percentages, strengths, concerns, and a human-readable summary, grounded in the deterministic scoring model. |
| `app/agents/menu_analysis_agent.py` | Answers "what should I order" style questions and powers Menu Intelligence quick filters (best value, high protein, vegetarian, spicy, etc.). |
| `app/agents/dietary_agent.py` | Evaluates menu items against a user's dietary requirements with cautious confidence labels (Likely Compatible / Needs Verification / Not Suitable / Unknown) — never claims guaranteed allergy safety. |
| `app/agents/comparison_agent.py` | Compares 2-3 restaurants across cuisine, budget, diet, atmosphere, occasion, menu variety, value, and overall match, with a plain-language verdict. |
| `app/agents/dining_plan_agent.py` | Builds a complete ordered dining plan (courses, estimated total, explanation) plus a backup restaurant suggestion. |
| `app/agents/orchestrator.py` | Wires the above into per-endpoint workflows, using the minimum number of agents required for each request. |

## Scoring model

`app/utils/scoring.py` defines a transparent, configurable weighted scoring model (cuisine 20%, budget 20%, diet 20%, occasion 15%, atmosphere 10%, rating 10%, menu fit 5%). This is computed in plain Python, not invented by the model. AI-generated match percentages are grounded in and kept close to these computed scores — the model may adjust slightly for qualitative signal but cannot output arbitrary numbers disconnected from the scoring function. Adjust `WEIGHTS` in that file to change ranking behavior globally.

## OpenAI usage rules

- Model is fixed to `gpt-4.1-mini` via `OPENAI_MODEL` in `app/config.py`. Do not change this without an explicit product decision.
- All OpenAI calls are centralized in `app/services/openai_service.py`. No other module should import the `openai` package directly.
- Every call requests strict JSON output and validates it against a Pydantic model. On invalid JSON, the service retries once with a stricter instruction; on repeated failure it falls back to a deterministic, locally computed result so the app degrades gracefully instead of crashing or hanging.
- If `OPENAI_API_KEY` is unset, every agent function still returns a sensible deterministic result via the local fallback path — the app is fully demoable without a live API key.
- Cost control is a hard requirement: never send the entire restaurant/menu dataset to the model. Always filter locally first (see `restaurant_service.local_candidate_filter`) and cap candidates sent to the model to a small number (~5-10).

## Safety rules baked into every agent

- No unsupported claims about allergies, food safety, medical conditions, religious certification, restaurant licensing, or real-time availability.
- Dietary/allergy responses always carry a disclaimer that AI assessment is informational only and ingredients must be verified directly with the restaurant.
- No fabricated real-world facts, reviews, or reservations — all restaurant and menu data in this repository is fictional demo data, and this is stated in the About/FAQ pages.

## Extending the agent pipeline

When adding a new agent:
1. Add or reuse a Pydantic request/response model in `app/models/ai_request.py`.
2. Add the raw OpenAI call (with retry + local fallback) to `app/services/openai_service.py`.
3. Add a thin agent wrapper in `app/agents/` that composes the service call with any local data lookups.
4. Add a workflow function to `app/agents/orchestrator.py` — do not call the new agent directly from a route.
5. Add the route in the appropriate `app/routes/*.py` file, wrapping orchestrator calls in try/except per the existing error-handling convention (ValueError -> 404, other exceptions -> logged and generic 500).
