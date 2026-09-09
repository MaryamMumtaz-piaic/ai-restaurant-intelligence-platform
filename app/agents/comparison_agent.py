"""Comparison agent (task.md #21): compares 2-3 restaurants with grounded scores."""
from app.models.ai_request import CompareResponse, DiscoverRequest
from app.models.restaurant import RestaurantWithMenu
from app.services import openai_service
from app.utils.scoring import score_restaurant


def compare(restaurants: list[RestaurantWithMenu], prefs: DiscoverRequest | None = None) -> CompareResponse:
    effective_prefs = prefs or DiscoverRequest()
    base_scores = {r.id: score_restaurant(r, effective_prefs) for r in restaurants}
    result = openai_service.compare_restaurants(restaurants, prefs, base_scores)
    return CompareResponse(
        rows=result.get("rows", []),
        verdict=result.get("verdict", ""),
        reasoning=result.get("reasoning", ""),
    )
