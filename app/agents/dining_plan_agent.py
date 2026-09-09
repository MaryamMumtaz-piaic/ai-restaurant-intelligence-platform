"""Dining plan agent (task.md #22): builds a course-by-course plan plus a cheap local backup pick."""
from app.models.ai_request import DiningPlanResponse, DiscoverRequest
from app.models.restaurant import RestaurantWithMenu
from app.services import openai_service, restaurant_service


def build_plan(restaurant: RestaurantWithMenu, party_size: int = 2, budget_per_person: float | None = None,
               diet: list[str] | None = None, occasion: str | None = None) -> DiningPlanResponse:
    diet = diet or []
    plan = openai_service.generate_dining_plan(restaurant, party_size, budget_per_person, diet, occasion)

    backup_id = _pick_backup(restaurant, budget_per_person, diet, occasion)

    return DiningPlanResponse(
        restaurant_id=restaurant.id,
        restaurant_name=restaurant.name,
        occasion=occasion,
        budget_per_person=budget_per_person,
        courses=plan.get("courses", []),
        estimated_total=plan.get("estimated_total", 0.0),
        currency=restaurant.currency,
        explanation=plan.get("explanation", ""),
        backup_restaurant_id=backup_id,
    )


def _pick_backup(restaurant: RestaurantWithMenu, budget_per_person: float | None, diet: list[str],
                  occasion: str | None) -> str | None:
    prefs = DiscoverRequest(
        cuisine=restaurant.cuisine,
        diet=diet,
        budget_per_person=budget_per_person,
        occasion=occasion,
        city=restaurant.city,
        area=restaurant.area,
    )
    try:
        candidates = restaurant_service.local_candidate_filter(prefs)
    except Exception:
        return None
    for candidate in candidates:
        if candidate.id != restaurant.id:
            return candidate.id
    return None
