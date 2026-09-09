# AI Restaurant Intelligence Platform

A premium, AI-powered dining intelligence platform that helps you answer one question: **"Where should I eat, and why is this the best option for me?"**

Instead of a keyword-matched restaurant directory, this platform runs a small pipeline of specialized AI agents — discovery, intelligence, menu analysis, dietary compatibility, comparison, and dining-plan generation — coordinated by an orchestrator, to reason about your budget, diet, occasion, and taste, and produce an explainable recommendation.

Built as a single-server Python application: **FastAPI + Jinja2 + Tailwind CSS + vanilla JavaScript**, backed by **OpenAI `gpt-4.1-mini`**, with a fictional 35-restaurant dataset stored as JSON.

## Features

- **Natural-language dining search** — "Find me a quiet halal restaurant for a family dinner under PKR 5,000 near Clifton" gets parsed into cuisine, diet, budget, occasion, atmosphere, and location.
- **Restaurant discovery with local-first filtering** — the dataset is filtered and scored in plain Python before anything is sent to the model, so AI calls stay small, fast, and cheap.
- **Restaurant Intelligence Agent** — per-restaurant match scoring (cuisine, budget, diet, occasion, atmosphere), strengths, concerns, and a plain-language summary.
- **Menu Analysis Agent** — "What should I order?" style Q&A plus one-click menu filters (best value, high protein, vegetarian, spicy, under-budget, best for sharing, best dessert).
- **Dietary Compatibility Agent** — evaluates menu items against your dietary requirements with cautious confidence labels (never claims guaranteed allergy safety).
- **Restaurant Comparison Agent** — compare up to 3 restaurants side by side with a plain-language AI verdict.
- **Dining Plan Agent** — a complete ordered plan (starter/main/side/dessert), estimated cost, and a backup restaurant.
- **Save, recently viewed, and session preferences** — all via `localStorage`, no login required.
- **Transparent scoring model** — match percentages are computed from a configurable weighted formula (`app/utils/scoring.py`), not invented by the model.

## Tech stack

| Layer | Technology |
|---|---|
| Backend | Python, FastAPI, Uvicorn, Pydantic |
| Templates | Jinja2 |
| Frontend | HTML, Tailwind CSS (CDN), vanilla JavaScript — no framework, no build step |
| AI | OpenAI Python SDK, `gpt-4.1-mini` |
| Storage | JSON files (`app/data/`), no database |

## Getting started

```bash
git clone https://github.com/MaryamMumtaz-piaic/ai-restaurant-intelligence-platform.git
cd ai-restaurant-intelligence-platform

python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS/Linux

pip install -r requirements.txt

copy .env.example .env          # Windows
# cp .env.example .env          # macOS/Linux
# then set OPENAI_API_KEY in .env

uvicorn app.main:app --reload --port 8000
```

Open **http://localhost:8000**.

> The app works even without a valid `OPENAI_API_KEY` — every AI feature has a deterministic local fallback, so the product is fully demoable offline.

## Project structure

```
app/
  main.py, templating.py, config.py
  routes/       pages.py, restaurants.py, ai.py, feedback.py
  agents/       orchestrator.py + one file per specialized agent
  services/     openai_service.py, restaurant_service.py, json_store.py
  models/       restaurant.py, ai_request.py, feedback.py, menu.py
  data/         restaurants.json, menu_items.json, cuisines.json, categories.json, feedback.json, contacts.json
  utils/        scoring.py, validation.py, helpers.py
templates/      Jinja2 templates (base.html + one per page)
static/         css/styles.css, js/*.js, images/
```

See `AGENTS.md` for the full agent architecture and `CLAUDE.md` for engineering conventions.

## API overview

```
GET  /                          GET  /discover                 GET  /restaurant/{slug}
GET  /planner                   GET  /saved                     GET  /cuisine/{slug}
GET  /about                     GET  /faq                       GET  /contact

GET  /api/restaurants           GET  /api/restaurants/{id}      GET  /api/search
GET  /api/cuisines              GET  /api/categories            GET  /api/menu/{restaurant_id}

POST /api/ai/discover           POST /api/ai/analyze-restaurant POST /api/ai/analyze-menu
POST /api/ai/check-diet         POST /api/ai/compare            POST /api/ai/dining-plan
POST /api/ai/restaurant-chat    POST /api/feedback              POST /api/contact
```

## Important notes

- All restaurants, menus, and reviews are **fictional demo data** — no real-world restaurant facts, live reservations, or availability are represented.
- Dietary and allergy guidance is **informational only**; always verify ingredients and preparation directly with the restaurant.
- No login/signup — personalization is session/local-storage based only.

## License

MIT — see [LICENSE](LICENSE).

## Author

**Maryam Mumtaz** — Full Stack Developer & AI Engineer
[Portfolio](https://maryam-piaic.vercel.app) · [LinkedIn](https://www.linkedin.com/in/maryammumtaz-) · [GitHub](https://github.com/MaryamMumtaz-piaic)
