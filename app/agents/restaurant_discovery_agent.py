"""Discovery agent: intent extraction + local candidate filtering (task.md #17).

Never sends the full dataset to OpenAI (task.md #55/#67) — intent extraction
operates only on the raw query text, and candidate retrieval is delegated to
`restaurant_service.local_candidate_filter`, which does cost-controlled local
filtering before any deeper AI reasoning happens.
"""
from app.models.ai_request import DiningIntent, DiscoverRequest
from app.models.restaurant import RestaurantWithMenu
from app.services import openai_service, restaurant_service


def discover_restaurants(prefs: DiscoverRequest) -> tuple[list[RestaurantWithMenu], DiningIntent | None]:
    intent: DiningIntent | None = None

    if prefs.query:
        intent = openai_service.extract_dining_intent(prefs.query)
        prefs = _merge_intent_into_prefs(prefs, intent)

    candidates = restaurant_service.local_candidate_filter(prefs)
    return candidates, intent


def _merge_intent_into_prefs(prefs: DiscoverRequest, intent: DiningIntent) -> DiscoverRequest:
    merged = prefs.model_copy(deep=True)
    if not merged.cuisine:
        merged.cuisine = intent.cuisine
    if not merged.diet:
        merged.diet = intent.diet
    if merged.budget_per_person is None:
        merged.budget_per_person = intent.budget_per_person
    if not merged.occasion:
        merged.occasion = intent.occasion
    if not merged.atmosphere:
        merged.atmosphere = intent.atmosphere
    if not merged.area and intent.location:
        merged.area = intent.location
    if not merged.party_size:
        merged.party_size = intent.party_size
    return merged
