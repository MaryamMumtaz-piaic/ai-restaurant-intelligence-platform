"""JSON API routes for restaurant data (read-only, no AI)."""
from typing import Optional

from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse

from app.models.restaurant import Restaurant, RestaurantWithMenu
from app.services import restaurant_service

router = APIRouter(prefix="/api")


@router.get("/restaurants", response_model=list[Restaurant])
async def list_restaurants(
    cuisine: list[str] = Query(default=[]),
    diet: list[str] = Query(default=[]),
    price_level: list[str] = Query(default=[]),
    occasion: Optional[str] = None,
    atmosphere: list[str] = Query(default=[]),
    city: Optional[str] = None,
    area: Optional[str] = None,
    min_rating: Optional[float] = None,
    meal_type: Optional[str] = None,
    features: list[str] = Query(default=[]),
    sort_by: Optional[str] = None,
    q: Optional[str] = None,
):
    restaurants = restaurant_service.search_restaurants(q) if q else None
    filtered = restaurant_service.filter_restaurants(
        restaurants=restaurants,
        cuisine=cuisine or None,
        diet=diet or None,
        price_level=price_level or None,
        occasion=occasion,
        atmosphere=atmosphere or None,
        city=city,
        area=area,
        min_rating=min_rating,
        meal_type=meal_type,
        features=features or None,
    )
    if sort_by:
        filtered = restaurant_service.sort_restaurants(filtered, sort_by)
    return filtered


@router.get("/restaurants/{restaurant_id}")
async def get_restaurant(restaurant_id: str):
    restaurant = restaurant_service.get_restaurant_by_id(restaurant_id)
    if restaurant is None:
        return JSONResponse(status_code=404, content={"detail": "Restaurant not found"})
    return restaurant


@router.get("/search", response_model=list[Restaurant])
async def search(q: str = ""):
    return restaurant_service.search_restaurants(q)


@router.get("/cuisines")
async def cuisines():
    return restaurant_service.get_cuisines()


@router.get("/categories")
async def categories():
    return restaurant_service.get_categories()


@router.get("/menu/{restaurant_id}")
async def menu(restaurant_id: str):
    restaurant = restaurant_service.get_restaurant_by_id(restaurant_id)
    if restaurant is None:
        return JSONResponse(status_code=404, content={"detail": "Restaurant not found"})
    return restaurant_service.get_menu_for_restaurant(restaurant_id)
