"""Transparent, configurable recommendation scoring model (see task.md #42).

Weights sum to 100 and are intentionally editable in code rather than
learned or invented ad hoc by the AI.
"""
from app.models.restaurant import Restaurant
from app.models.ai_request import DiscoverRequest

WEIGHTS = {
    "cuisine": 20,
    "budget": 20,
    "diet": 20,
    "occasion": 15,
    "atmosphere": 10,
    "rating": 10,
    "menu_fit": 5,
}


def _cuisine_score(restaurant: Restaurant, prefs: DiscoverRequest) -> float:
    if not prefs.cuisine:
        return 0.7
    wanted = {c.lower() for c in prefs.cuisine}
    have = {c.lower() for c in restaurant.cuisine}
    return 1.0 if wanted & have else 0.0


def _budget_score(restaurant: Restaurant, prefs: DiscoverRequest) -> float:
    if not prefs.budget_per_person:
        return 0.7
    cost = restaurant.average_cost_per_person
    budget = prefs.budget_per_person
    if cost <= budget:
        return 1.0
    overage = (cost - budget) / budget
    return max(0.0, 1.0 - overage)


def _diet_score(restaurant: Restaurant, prefs: DiscoverRequest) -> float:
    if not prefs.diet or "No restrictions" in prefs.diet:
        return 0.7
    wanted = {d.lower() for d in prefs.diet}
    have = {d.lower() for d in restaurant.dietary_options}
    if not wanted:
        return 0.7
    matched = len(wanted & have)
    return matched / len(wanted)


def _occasion_score(restaurant: Restaurant, prefs: DiscoverRequest) -> float:
    if not prefs.occasion:
        return 0.7
    return 1.0 if prefs.occasion.lower() in {o.lower() for o in restaurant.occasions} else 0.2


def _atmosphere_score(restaurant: Restaurant, prefs: DiscoverRequest) -> float:
    if not prefs.atmosphere:
        return 0.7
    wanted = {a.lower() for a in prefs.atmosphere}
    have = {a.lower() for a in restaurant.ambience}
    if not wanted:
        return 0.7
    matched = len(wanted & have)
    return matched / len(wanted)


def _rating_score(restaurant: Restaurant) -> float:
    return min(1.0, restaurant.rating / 5.0)


def score_restaurant(restaurant: Restaurant, prefs: DiscoverRequest, menu_fit: float = 0.7) -> dict:
    """Returns per-dimension percentages (0-100) and a weighted overall_match."""
    dims = {
        "cuisine": _cuisine_score(restaurant, prefs),
        "budget": _budget_score(restaurant, prefs),
        "diet": _diet_score(restaurant, prefs),
        "occasion": _occasion_score(restaurant, prefs),
        "atmosphere": _atmosphere_score(restaurant, prefs),
        "rating": _rating_score(restaurant),
        "menu_fit": menu_fit,
    }
    overall = sum(dims[k] * WEIGHTS[k] for k in WEIGHTS) / sum(WEIGHTS.values())
    return {
        "overall_match": round(overall * 100),
        "cuisine_match": round(dims["cuisine"] * 100),
        "budget_match": round(dims["budget"] * 100),
        "occasion_match": round(dims["occasion"] * 100),
        "diet_match": round(dims["diet"] * 100),
        "atmosphere_match": round(dims["atmosphere"] * 100),
        "menu_fit_match": round(dims["menu_fit"] * 100),
    }
