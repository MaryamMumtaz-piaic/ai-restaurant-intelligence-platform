"""Menu analysis agent (task.md #19)."""
from app.models.ai_request import AnalyzeMenuResponse, DiscoverRequest
from app.models.restaurant import RestaurantWithMenu
from app.services import openai_service


def analyze_menu(restaurant: RestaurantWithMenu, question: str | None = None,
                  filter_tag: str | None = None, prefs: DiscoverRequest | None = None) -> AnalyzeMenuResponse:
    result = openai_service.analyze_menu(restaurant, question, filter_tag, prefs)
    return AnalyzeMenuResponse(
        restaurant_id=restaurant.id,
        highlights=result.get("highlights", []),
        answer=result.get("answer", ""),
        confidence="Medium Confidence" if (question or filter_tag) else "High Confidence",
    )
