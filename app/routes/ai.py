"""AI-powered API routes. Delegates all reasoning to app.agents.orchestrator."""
import logging

from fastapi import APIRouter, HTTPException

from app.agents import orchestrator
from app.models.ai_request import (
    AnalyzeMenuRequest,
    AnalyzeMenuResponse,
    AnalyzeRestaurantRequest,
    CompareRequest,
    CompareResponse,
    DietCheckRequest,
    DietCheckResponse,
    DiningPlanRequest,
    DiningPlanResponse,
    DiscoverRequest,
    DiscoverResponse,
    RestaurantChatRequest,
    RestaurantChatResponse,
    RestaurantMatch,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/ai")

GENERIC_ERROR = "We couldn't complete your dining analysis right now. Please try again."


@router.post("/discover", response_model=DiscoverResponse)
async def discover(payload: DiscoverRequest):
    try:
        return orchestrator.run_discovery(payload)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception:
        logger.exception("run_discovery failed")
        raise HTTPException(status_code=500, detail=GENERIC_ERROR)


@router.post("/analyze-restaurant", response_model=RestaurantMatch)
async def analyze_restaurant(payload: AnalyzeRestaurantRequest):
    try:
        return orchestrator.run_restaurant_analysis(payload.restaurant_id, payload.preferences)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception:
        logger.exception("run_restaurant_analysis failed")
        raise HTTPException(status_code=500, detail=GENERIC_ERROR)


@router.post("/analyze-menu", response_model=AnalyzeMenuResponse)
async def analyze_menu(payload: AnalyzeMenuRequest):
    try:
        return orchestrator.run_menu_analysis(
            payload.restaurant_id,
            question=payload.question,
            filter_tag=payload.filter_tag,
            prefs=payload.preferences,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception:
        logger.exception("run_menu_analysis failed")
        raise HTTPException(status_code=500, detail=GENERIC_ERROR)


@router.post("/check-diet", response_model=DietCheckResponse)
async def check_diet(payload: DietCheckRequest):
    try:
        return orchestrator.run_dietary_check(
            payload.restaurant_id, payload.diet, custom_restriction=payload.custom_restriction
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception:
        logger.exception("run_dietary_check failed")
        raise HTTPException(status_code=500, detail=GENERIC_ERROR)


@router.post("/compare", response_model=CompareResponse)
async def compare(payload: CompareRequest):
    try:
        return orchestrator.run_comparison(payload.restaurant_ids, prefs=payload.preferences)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception:
        logger.exception("run_comparison failed")
        raise HTTPException(status_code=500, detail=GENERIC_ERROR)


@router.post("/dining-plan", response_model=DiningPlanResponse)
async def dining_plan(payload: DiningPlanRequest):
    try:
        return orchestrator.run_dining_plan(
            payload.restaurant_id,
            payload.party_size,
            payload.budget_per_person,
            payload.diet,
            payload.occasion,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception:
        logger.exception("run_dining_plan failed")
        raise HTTPException(status_code=500, detail=GENERIC_ERROR)


@router.post("/restaurant-chat", response_model=RestaurantChatResponse)
async def restaurant_chat(payload: RestaurantChatRequest):
    try:
        history = [h.model_dump() for h in payload.history]
        return orchestrator.run_restaurant_chat(payload.restaurant_id, payload.question, history)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception:
        logger.exception("run_restaurant_chat failed")
        raise HTTPException(status_code=500, detail=GENERIC_ERROR)
