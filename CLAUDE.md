# CLAUDE.md

Project-specific guidance for Claude Code (or any AI coding assistant) working in this repository. See also `AGENTS.md` for the AI agent pipeline architecture.

## What this project is

A production-quality, single-server AI dining intelligence platform: FastAPI + Jinja2 + Tailwind CSS (CDN) + vanilla JavaScript on the frontend, OpenAI `gpt-4.1-mini` on the backend for reasoning, JSON files as the persistence layer. There is no build step, no database, no authentication, and no separate frontend server — FastAPI serves everything.

Full original product spec lives in `task.md` at the repo root. Treat it as the source of truth for scope and behavior; this file only covers engineering conventions.

## Running the app

```bash
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
cp .env.example .env          # then set OPENAI_API_KEY
uvicorn app.main:app --reload --port 8000
```

Visit `http://localhost:8000`. The app works even without a valid `OPENAI_API_KEY` — every AI function has a deterministic local fallback, so features remain demoable offline.

## Hard technology constraints (do not change without explicit product sign-off)

- Backend: Python, FastAPI, Uvicorn, Pydantic, OpenAI Python SDK, Jinja2.
- Frontend: HTML, Tailwind CSS, vanilla JavaScript only — no React/Vue/Angular/Node frontend, no bundler.
- AI model: `gpt-4.1-mini` exactly, defined once in `app/config.py` as `OPENAI_MODEL`.
- Storage: JSON files under `app/data/`, accessed only through `app/services/json_store.py`. No PostgreSQL/MongoDB/Redis.
- No authentication/login. Session-level personalization uses browser `localStorage` only.

## Project structure

```
app/
  main.py            FastAPI app, static mount, router includes, 404 handler
  templating.py       shared Jinja2Templates instance
  config.py           env-driven settings (OPENAI_API_KEY, OPENAI_MODEL, DEBUG)
  routes/             pages.py (HTML), restaurants.py + ai.py + feedback.py (JSON API)
  agents/             one file per specialized AI agent + orchestrator.py
  services/           openai_service.py (all OpenAI calls), restaurant_service.py (data queries), json_store.py
  models/             Pydantic schemas: restaurant.py, ai_request.py, feedback.py, menu.py
  data/               *.json fictional dataset (restaurants, menu_items, cuisines, categories, feedback, contacts)
  utils/              scoring.py (transparent weighted match scoring), validation.py, helpers.py
templates/            Jinja2 templates, all extend base.html
static/css/styles.css design system (custom properties + component classes layered on Tailwind CDN)
static/js/            page-scoped vanilla JS files plus main.js shared helpers
```

## Conventions to preserve

- **Never call the OpenAI SDK outside `app/services/openai_service.py`.** Agents call that service; routes call agents only through `app/agents/orchestrator.py`.
- **Never send the full restaurant dataset to the model.** Always filter locally first (`restaurant_service.local_candidate_filter`) and cap AI-analyzed candidates to a small number.
- **Every OpenAI call must validate its JSON output against a Pydantic model**, retry once on failure, then fall back to a deterministic local result. Never propagate raw model output, stack traces, or API errors to the client.
- **Match percentages come from `app/utils/scoring.py`**, not from unconstrained model output — the AI may refine language/reasoning around a score but should not invent disconnected numbers.
- **Dietary/allergy responses are always cautious** (`Likely Compatible` / `Needs Verification` / `Not Suitable` / `Unknown`) and always carry the informational-only disclaimer.
- **No fabricated real-time data**: no live reservations/availability, no real restaurant facts, no real customer identities. All dataset content is clearly fictional demo data.
- **Every interactive UI element must be wired to a real behavior** — no decorative-only buttons. See `task.md` #69.
- Keep route handlers thin: validation and orchestration belong in `services`/`agents`, not in `app/routes/*.py`.
- Match the existing design system in `static/css/styles.css` and the DOM `data-*` hook conventions already used in `templates/` and `static/js/` before introducing new patterns.

## Code style

- No comments explaining what code obviously does; comment only non-obvious constraints (e.g., why a fallback path exists).
- Don't add speculative abstractions, feature flags, or config for hypothetical future requirements.
- Prefer editing existing files over creating new ones; keep the structure above rather than inventing parallel structures.
