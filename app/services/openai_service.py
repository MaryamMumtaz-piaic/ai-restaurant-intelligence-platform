"""Centralized OpenAI communication layer (task.md #54).

All calls to the OpenAI SDK live here. Routes and agents must never import
`openai` directly. Every public function is fail-safe: on a missing API key,
an API error, or invalid/unvalidated JSON output (after one strict retry),
it falls back to a deterministic, locally computed result instead of raising
or leaking raw model output/stack traces to the caller (task.md #24, #51).
"""
import json

from app.config import OPENAI_API_KEY, OPENAI_MODEL
from app.models.ai_request import DiningIntent, DiscoverRequest, RestaurantMatch
from app.models.restaurant import RestaurantWithMenu

_client = None


def _get_client():
    """Lazily construct the SDK client only when a key is actually present."""
    global _client
    if not OPENAI_API_KEY:
        return None
    if _client is None:
        from openai import OpenAI
        _client = OpenAI(api_key=OPENAI_API_KEY)
    return _client


def _chat_json(system_prompt: str, user_prompt: str, max_tokens: int = 700) -> dict | None:
    """Call the model requesting strict JSON, retrying once on failure.

    Returns the parsed dict, or None if no key is configured or both
    attempts fail (network error, malformed JSON, etc). Never raises.
    """
    client = _get_client()
    if client is None:
        return None

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]

    for attempt in range(2):
        try:
            if attempt == 1:
                messages = messages + [
                    {
                        "role": "user",
                        "content": (
                            "Your previous response was not valid JSON matching the "
                            "required shape. Return ONLY valid JSON, no markdown, no "
                            "commentary, no code fences."
                        ),
                    }
                ]
            response = client.chat.completions.create(
                model=OPENAI_MODEL,
                messages=messages,
                response_format={"type": "json_object"},
                temperature=0.4,
                max_tokens=max_tokens,
            )
            content = response.choices[0].message.content
            return json.loads(content)
        except Exception:
            continue
    return None


def _menu_brief(restaurant: RestaurantWithMenu, limit: int = 25) -> list[dict]:
    """Compact menu representation to keep prompts small (task.md #67)."""
    items = restaurant.menu[:limit]
    return [
        {
            "id": m.id,
            "name": m.name,
            "category": m.category,
            "price": m.price,
            "dietary_tags": m.dietary_tags,
            "spice_level": m.spice_level,
            "ingredients": m.ingredients,
            "popular": m.popular,
        }
        for m in items
    ]


def _restaurant_brief(restaurant: RestaurantWithMenu) -> dict:
    return {
        "id": restaurant.id,
        "name": restaurant.name,
        "cuisine": restaurant.cuisine,
        "city": restaurant.city,
        "area": restaurant.area,
        "price_level": restaurant.price_level,
        "average_cost_per_person": restaurant.average_cost_per_person,
        "rating": restaurant.rating,
        "review_themes": restaurant.review_themes,
        "ambience": restaurant.ambience,
        "dietary_options": restaurant.dietary_options,
        "meal_types": restaurant.meal_types,
        "occasions": restaurant.occasions,
        "features": restaurant.features,
    }


SAFETY_NOTE = (
    "Never claim guaranteed allergy safety, certified religious compliance, "
    "medical suitability, real-time availability, or licensing status. Base "
    "dietary/allergy reasoning only on listed ingredients/tags and always "
    "note that the restaurant should be contacted to verify."
)


def extract_dining_intent(query: str) -> DiningIntent:
    system_prompt = (
        "You extract structured dining intent from a user's natural-language "
        "restaurant search query. Respond with ONLY a JSON object with keys: "
        "cuisine (list of strings), diet (list of strings), budget_per_person "
        "(number or null), occasion (string or null), atmosphere (list of "
        "strings), location (string or null), meal_type (string or null), "
        "party_size (integer or null). Use empty lists/nulls for anything not "
        "mentioned. Do not invent details not implied by the query."
    )
    data = _chat_json(system_prompt, f"Query: {query}", max_tokens=300)
    if data is not None:
        try:
            data["raw_query"] = query
            return DiningIntent.model_validate(data)
        except Exception:
            pass
    return DiningIntent(raw_query=query)


def analyze_restaurant(restaurant: RestaurantWithMenu, prefs: DiscoverRequest, base_score: dict) -> RestaurantMatch:
    system_prompt = (
        "You are a restaurant-matching analyst. You are given a restaurant profile, "
        "a diner's preferences, and pre-computed transparent match scores "
        "(0-100) from a deterministic scoring engine. Write qualitative reasoning "
        "(strengths, concerns, summary) that is CONSISTENT with those scores. You "
        "may nudge each *_match number by at most 5 points from the given base "
        "score if qualitative signals clearly justify it, but never invent wildly "
        "different numbers. " + SAFETY_NOTE + " Respond with ONLY a JSON object with "
        "keys: overall_match, cuisine_match, budget_match, occasion_match, "
        "diet_match, atmosphere_match (all integers 0-100), strengths (list of short "
        "strings), concerns (list of short strings), summary (1-3 sentences)."
    )
    user_prompt = json.dumps({
        "restaurant": _restaurant_brief(restaurant),
        "menu_sample": _menu_brief(restaurant, limit=10),
        "preferences": prefs.model_dump(),
        "base_score": base_score,
    })
    data = _chat_json(system_prompt, user_prompt, max_tokens=500)
    if data is not None:
        try:
            data["restaurant_id"] = restaurant.id
            for key in ("overall_match", "cuisine_match", "budget_match", "occasion_match",
                        "diet_match", "atmosphere_match"):
                base_val = base_score.get(key)
                if key in data and base_val is not None and abs(data[key] - base_val) > 20:
                    data[key] = base_val
            return RestaurantMatch.model_validate(data)
        except Exception:
            pass
    return RestaurantMatch(
        restaurant_id=restaurant.id,
        overall_match=base_score.get("overall_match", 50),
        cuisine_match=base_score.get("cuisine_match", 50),
        budget_match=base_score.get("budget_match", 50),
        occasion_match=base_score.get("occasion_match", 50),
        diet_match=base_score.get("diet_match", 50),
        atmosphere_match=base_score.get("atmosphere_match", 50),
        strengths=[],
        concerns=[],
        summary=f"{restaurant.name} scored based on your preferences using our local matching engine.",
    )


def analyze_menu(restaurant: RestaurantWithMenu, question: str | None, filter_tag: str | None,
                  prefs: DiscoverRequest | None) -> dict:
    system_prompt = (
        "You analyze a restaurant's menu for a diner. Identify standout items and, "
        "if asked, answer their question (what to order, best value, dishes that "
        "pair well, etc). " + SAFETY_NOTE + " Respond with ONLY a JSON object with "
        "keys: highlights (list of objects with item_id and reason, referencing only "
        "item ids from the provided menu), answer (string, empty if no question/filter "
        "was given)."
    )
    user_prompt = json.dumps({
        "restaurant_name": restaurant.name,
        "menu": _menu_brief(restaurant, limit=40),
        "question": question,
        "filter_tag": filter_tag,
        "preferences": prefs.model_dump() if prefs else None,
    })
    data = _chat_json(system_prompt, user_prompt, max_tokens=700)
    valid_ids = {m.id for m in restaurant.menu}
    if data is not None:
        try:
            highlights = [
                h for h in data.get("highlights", [])
                if isinstance(h, dict) and h.get("item_id") in valid_ids
            ]
            return {"highlights": highlights, "answer": str(data.get("answer", ""))}
        except Exception:
            pass
    fallback_items = [m for m in restaurant.menu if m.popular or m.recommended][:5]
    return {
        "highlights": [
            {"item_id": m.id, "reason": "Popular pick at this restaurant."} for m in fallback_items
        ],
        "answer": "" if not (question or filter_tag) else (
            "We couldn't reach the AI menu analyst right now, so here are the "
            "restaurant's popular items instead."
        ),
    }


def evaluate_dietary_compatibility(restaurant: RestaurantWithMenu, diet: list[str],
                                    custom_restriction: str | None) -> list[dict]:
    system_prompt = (
        "You assess menu items against a diner's dietary restrictions using ONLY "
        "the listed ingredients and dietary_tags. " + SAFETY_NOTE + " For each menu "
        "item choose a status: 'Likely Compatible', 'Needs Verification', "
        "'Not Suitable', or 'Unknown' (use Unknown when ingredients are unclear). "
        "Respond with ONLY a JSON object with key assessments: a list of objects "
        "with item_id, status, reason (1 sentence, cautious, mentioning verification "
        "when relevant)."
    )
    user_prompt = json.dumps({
        "restaurant_name": restaurant.name,
        "menu": _menu_brief(restaurant, limit=40),
        "diet": diet,
        "custom_restriction": custom_restriction,
    })
    data = _chat_json(system_prompt, user_prompt, max_tokens=900)
    valid_ids = {m.id for m in restaurant.menu}
    if data is not None:
        try:
            assessments = [
                a for a in data.get("assessments", [])
                if isinstance(a, dict) and a.get("item_id") in valid_ids
                and a.get("status") in ("Likely Compatible", "Needs Verification", "Not Suitable", "Unknown")
            ]
            if assessments:
                return assessments
        except Exception:
            pass
    return _local_diet_fallback(restaurant, diet, custom_restriction)


def _local_diet_fallback(restaurant: RestaurantWithMenu, diet: list[str], custom_restriction: str | None) -> list[dict]:
    wanted = {d.lower() for d in diet}
    results = []
    for item in restaurant.menu:
        tags = {t.lower() for t in item.dietary_tags}
        if not wanted:
            status, reason = "Unknown", "No dietary preference specified to compare against."
        elif wanted & tags:
            status, reason = (
                "Needs Verification",
                "Menu tags suggest a match, but preparation should be confirmed with the restaurant.",
            )
        else:
            status, reason = (
                "Needs Verification",
                "Could not confirm compatibility from listed information; please verify with the restaurant.",
            )
        results.append({"item_id": item.id, "status": status, "reason": reason})
    return results


def compare_restaurants(restaurants: list[RestaurantWithMenu], prefs: DiscoverRequest | None,
                         base_scores: dict[str, dict]) -> dict:
    system_prompt = (
        "You compare a small set of restaurants for a diner across cuisine, "
        "budget, dietary compatibility, atmosphere, occasion fit, menu variety, "
        "value, location, and overall match. You are given pre-computed "
        "transparent base scores per restaurant; keep overall_match consistent "
        "with them (adjust by at most 5 points). " + SAFETY_NOTE + " Respond with "
        "ONLY a JSON object with keys: rows (list of objects with restaurant_id, "
        "overall_match [int], budget_fit [bool], diet_fit [bool or null], "
        "atmosphere_fit [bool], rating [number], value ['High'|'Medium'|'Low']), "
        "verdict (1 sentence naming the best pick), reasoning (2-4 sentences "
        "explaining WHY, referencing specific tradeoffs, not just 'X is better')."
    )
    user_prompt = json.dumps({
        "restaurants": [_restaurant_brief(r) for r in restaurants],
        "preferences": prefs.model_dump() if prefs else None,
        "base_scores": base_scores,
    })
    data = _chat_json(system_prompt, user_prompt, max_tokens=900)
    valid_ids = {r.id for r in restaurants}
    if data is not None:
        try:
            rows = [row for row in data.get("rows", []) if isinstance(row, dict) and row.get("restaurant_id") in valid_ids]
            if rows and data.get("verdict") and data.get("reasoning"):
                for row in rows:
                    base = base_scores.get(row["restaurant_id"], {})
                    base_overall = base.get("overall_match")
                    if base_overall is not None and abs(row.get("overall_match", base_overall) - base_overall) > 20:
                        row["overall_match"] = base_overall
                return {"rows": rows, "verdict": str(data["verdict"]), "reasoning": str(data["reasoning"])}
        except Exception:
            pass
    return _local_compare_fallback(restaurants, prefs, base_scores)


def _local_compare_fallback(restaurants: list[RestaurantWithMenu], prefs: DiscoverRequest | None,
                             base_scores: dict[str, dict]) -> dict:
    rows = []
    for r in restaurants:
        base = base_scores.get(r.id, {})
        budget_fit = True
        if prefs and prefs.budget_per_person:
            budget_fit = r.average_cost_per_person <= prefs.budget_per_person
        diet_fit = None
        if prefs and prefs.diet:
            wanted = {d.lower() for d in prefs.diet}
            diet_fit = bool(wanted & {d.lower() for d in r.dietary_options})
        atmosphere_fit = True
        if prefs and prefs.atmosphere:
            wanted_a = {a.lower() for a in prefs.atmosphere}
            atmosphere_fit = bool(wanted_a & {a.lower() for a in r.ambience})
        overall = base.get("overall_match", round(r.rating / 5 * 100))
        value = "High" if overall >= 80 else "Medium" if overall >= 55 else "Low"
        rows.append({
            "restaurant_id": r.id,
            "overall_match": overall,
            "budget_fit": budget_fit,
            "diet_fit": diet_fit,
            "atmosphere_fit": atmosphere_fit,
            "rating": r.rating,
            "value": value,
        })
    best = max(rows, key=lambda row: row["overall_match"]) if rows else None
    best_name = next((r.name for r in restaurants if r.id == best["restaurant_id"]), "") if best else ""
    return {
        "rows": rows,
        "verdict": f"{best_name} is the strongest overall match based on local scoring." if best else "No clear winner.",
        "reasoning": (
            "AI comparison was unavailable, so this ranking uses our transparent "
            "local scoring engine based on cuisine, budget, diet, occasion, and "
            "atmosphere fit."
        ),
    }


def generate_dining_plan(restaurant: RestaurantWithMenu, party_size: int, budget_per_person: float | None,
                          diet: list[str], occasion: str | None) -> dict:
    system_prompt = (
        "You build a realistic dining plan (starter/main/side/dessert selections) "
        "from a restaurant's actual menu for a party of diners. Respect the budget "
        "per person if given (estimated_total / party_size should not greatly "
        "exceed it) and prefer items matching the diet list when possible. "
        + SAFETY_NOTE + " Respond with ONLY a JSON object with keys: courses (list "
        "of objects with course ['Starter'|'Main'|'Side'|'Dessert'], item_name, "
        "price - using real menu item names and prices only), estimated_total "
        "(number), explanation (1-3 sentences on why this plan works)."
    )
    user_prompt = json.dumps({
        "restaurant_name": restaurant.name,
        "menu": _menu_brief(restaurant, limit=40),
        "party_size": party_size,
        "budget_per_person": budget_per_person,
        "diet": diet,
        "occasion": occasion,
    })
    data = _chat_json(system_prompt, user_prompt, max_tokens=700)
    valid_names = {m.name: m.price for m in restaurant.menu}
    if data is not None:
        try:
            courses = []
            for c in data.get("courses", []):
                if isinstance(c, dict) and c.get("item_name") in valid_names:
                    courses.append({
                        "course": c.get("course", "Main"),
                        "item_name": c["item_name"],
                        "price": valid_names[c["item_name"]],
                    })
            if courses:
                total = sum(c["price"] for c in courses)
                return {
                    "courses": courses,
                    "estimated_total": total,
                    "explanation": str(data.get("explanation", "")) or "A balanced selection from the menu for your occasion.",
                }
        except Exception:
            pass
    return _local_plan_fallback(restaurant, party_size, budget_per_person, diet)


def _local_plan_fallback(restaurant: RestaurantWithMenu, party_size: int, budget_per_person: float | None,
                          diet: list[str]) -> dict:
    wanted = {d.lower() for d in diet}

    def matches_diet(item):
        if not wanted or "no restrictions" in wanted:
            return True
        return bool(wanted & {t.lower() for t in item.dietary_tags})

    def cheapest(category):
        candidates = [m for m in restaurant.menu if m.category == category and matches_diet(m)]
        if not candidates:
            candidates = [m for m in restaurant.menu if m.category == category]
        return min(candidates, key=lambda m: m.price) if candidates else None

    course_map = {"Starter": "Starter", "Main": "Main Course", "Dessert": "Dessert"}
    courses = []
    for course_label, category in course_map.items():
        item = cheapest(category)
        if item:
            courses.append({"course": course_label, "item_name": item.name, "price": item.price})

    total = sum(c["price"] for c in courses)
    budget_total = budget_per_person * party_size if budget_per_person else None
    if budget_total and total > budget_total and courses:
        courses = sorted(courses, key=lambda c: c["price"])[:2]
        total = sum(c["price"] for c in courses)

    return {
        "courses": courses,
        "estimated_total": total,
        "explanation": (
            "AI planning was unavailable, so this plan picks the most affordable "
            "options per course from the menu that fit your dietary preferences."
        ),
    }


def answer_restaurant_question(restaurant: RestaurantWithMenu, question: str, history: list[dict]) -> str:
    system_prompt = (
        "You are a helpful assistant answering questions about one specific "
        "restaurant, using only the provided restaurant and menu data. If asked "
        "about something not covered by the data (real-time availability, "
        "reservations, certifications, allergy guarantees), say so and suggest "
        "contacting the restaurant directly. " + SAFETY_NOTE + " Respond with ONLY "
        "a JSON object with a single key 'answer' containing your reply as a string."
    )
    trimmed_history = history[-6:] if history else []
    user_prompt = json.dumps({
        "restaurant": _restaurant_brief(restaurant),
        "menu": _menu_brief(restaurant, limit=30),
        "history": trimmed_history,
        "question": question,
    })
    data = _chat_json(system_prompt, user_prompt, max_tokens=500)
    if data is not None:
        try:
            answer = data.get("answer")
            if isinstance(answer, str) and answer.strip():
                return answer
        except Exception:
            pass
    return (
        f"I couldn't reach the AI assistant right now. For specific questions about "
        f"{restaurant.name}, please contact the restaurant directly at {restaurant.address}."
    )
