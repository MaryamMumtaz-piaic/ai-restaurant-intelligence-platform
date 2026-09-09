"""Dietary compatibility agent (task.md #20). Always cautious, never guarantees safety."""
from app.models.ai_request import DietCheckResponse
from app.models.restaurant import RestaurantWithMenu
from app.services import openai_service


def check_compatibility(restaurant: RestaurantWithMenu, diet: list[str],
                         custom_restriction: str | None = None) -> DietCheckResponse:
    assessments = openai_service.evaluate_dietary_compatibility(restaurant, diet, custom_restriction)
    return DietCheckResponse(restaurant_id=restaurant.id, assessments=assessments)
