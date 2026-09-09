"""Restaurant intelligence agent (task.md #18): scores + AI reasoning for one restaurant."""
from app.models.ai_request import DiscoverRequest, RestaurantMatch
from app.models.restaurant import RestaurantWithMenu
from app.services import openai_service
from app.utils.scoring import score_restaurant


def analyze(restaurant: RestaurantWithMenu, prefs: DiscoverRequest) -> RestaurantMatch:
    base_score = score_restaurant(restaurant, prefs)
    return openai_service.analyze_restaurant(restaurant, prefs, base_score)
