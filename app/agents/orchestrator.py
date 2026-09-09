"""AI agent orchestrator (task.md #23): coordinates the minimum agents per workflow.

Each `run_*` function resolves restaurant id(s) via `restaurant_service` first
and raises `ValueError` if a lookup fails, so route handlers can convert that
into a 404 without ever operating on `None`.
"""
from app.agents import (
    comparison_agent,
    dietary_agent,
    dining_plan_agent,
    menu_analysis_agent,
    restaurant_discovery_agent,
    restaurant_intelligence_agent,
)
from app.models.ai_request import (
    CompareResponse,
    DietCheckResponse,
    DiningPlanResponse,
    DiscoverRequest,
    DiscoverResponse,
    RestaurantChatResponse,
    RestaurantMatch,
)
from app.models.restaurant import RestaurantWithMenu
from app.services import openai_service, restaurant_service

TOP_N_FOR_INTELLIGENCE = 5


def _require_restaurant(restaurant_id: str) -> RestaurantWithMenu:
    restaurant = restaurant_service.get_restaurant_by_id(restaurant_id)
    if restaurant is None:
        raise ValueError(f"Restaurant not found: {restaurant_id}")
    return restaurant


def run_discovery(prefs: DiscoverRequest) -> DiscoverResponse:
    candidates, intent = restaurant_discovery_agent.discover_restaurants(prefs)
    top_candidates = candidates[:TOP_N_FOR_INTELLIGENCE]

    matches: list[RestaurantMatch] = [
        restaurant_intelligence_agent.analyze(candidate, prefs) for candidate in top_candidates
    ]
    matches.sort(key=lambda m: m.overall_match, reverse=True)

    warnings = []
    if not candidates:
        warnings.append("No restaurants matched your criteria closely; showing best-effort results.")

    confidence = "High Confidence" if matches and matches[0].overall_match >= 75 else (
        "Medium Confidence" if matches else "Needs Verification"
    )

    return DiscoverResponse(
        intent=intent or _empty_intent(prefs),
        matches=matches,
        reasoning=_discovery_reasoning(matches),
        confidence=confidence,
        warnings=warnings,
    )


def _empty_intent(prefs: DiscoverRequest):
    from app.models.ai_request import DiningIntent
    return DiningIntent(
        cuisine=prefs.cuisine,
        diet=prefs.diet,
        budget_per_person=prefs.budget_per_person,
        occasion=prefs.occasion,
        atmosphere=prefs.atmosphere,
        location=prefs.area or prefs.city,
        party_size=prefs.party_size,
        raw_query=prefs.query or "",
    )


def _discovery_reasoning(matches: list[RestaurantMatch]) -> str:
    if not matches:
        return "No strong matches were found for the given preferences."
    top = matches[0]
    return f"Top match scored {top.overall_match}% based on cuisine, budget, diet, occasion, and atmosphere fit."


def run_restaurant_analysis(restaurant_id: str, prefs: DiscoverRequest | None) -> RestaurantMatch:
    restaurant = _require_restaurant(restaurant_id)
    effective_prefs = prefs or DiscoverRequest()
    return restaurant_intelligence_agent.analyze(restaurant, effective_prefs)


def run_menu_analysis(restaurant_id: str, question: str | None = None, filter_tag: str | None = None,
                       prefs: DiscoverRequest | None = None):
    restaurant = _require_restaurant(restaurant_id)
    return menu_analysis_agent.analyze_menu(restaurant, question, filter_tag, prefs)


def run_dietary_check(restaurant_id: str, diet: list[str], custom_restriction: str | None = None) -> DietCheckResponse:
    restaurant = _require_restaurant(restaurant_id)
    return dietary_agent.check_compatibility(restaurant, diet, custom_restriction)


def run_comparison(restaurant_ids: list[str], prefs: DiscoverRequest | None = None) -> CompareResponse:
    restaurants = [_require_restaurant(rid) for rid in restaurant_ids]
    return comparison_agent.compare(restaurants, prefs)


def run_dining_plan(restaurant_id: str, party_size: int = 2, budget_per_person: float | None = None,
                     diet: list[str] | None = None, occasion: str | None = None) -> DiningPlanResponse:
    restaurant = _require_restaurant(restaurant_id)
    return dining_plan_agent.build_plan(restaurant, party_size, budget_per_person, diet or [], occasion)


def run_restaurant_chat(restaurant_id: str, question: str, history: list[dict]) -> RestaurantChatResponse:
    restaurant = _require_restaurant(restaurant_id)
    answer = openai_service.answer_restaurant_question(restaurant, question, history)
    return RestaurantChatResponse(answer=answer, confidence="Medium Confidence")
