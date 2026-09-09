"""Server-rendered Jinja2 page routes."""
from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse

from app.templating import templates
from app.services import restaurant_service

router = APIRouter(include_in_schema=False)


@router.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse(
        "index.html",
        {
            "request": request,
            "page_title": "AI Restaurant Intelligence | Find Somewhere Worth Eating",
            "meta_description": (
                "AI-powered restaurant discovery that understands your taste, "
                "budget, diet, occasion, and what you actually want."
            ),
            "canonical_path": "/",
            "cuisines": restaurant_service.get_cuisines(),
            "categories": restaurant_service.get_categories(),
        },
    )


@router.get("/discover", response_class=HTMLResponse)
async def discover(request: Request):
    return templates.TemplateResponse(
        "discover.html",
        {
            "request": request,
            "page_title": "Discover Restaurants | AI Restaurant Intelligence",
            "meta_description": "Browse and filter restaurants by cuisine, diet, budget, occasion, and atmosphere.",
            "canonical_path": "/discover",
            "cuisines": restaurant_service.get_cuisines(),
            "categories": restaurant_service.get_categories(),
        },
    )


@router.get("/restaurant/{slug}", response_class=HTMLResponse)
async def restaurant_detail(request: Request, slug: str):
    restaurant = restaurant_service.get_restaurant_by_slug(slug)
    if restaurant is None:
        return templates.TemplateResponse(
            "404.html",
            {
                "request": request,
                "page_title": "Restaurant Not Found | AI Restaurant Intelligence",
                "meta_description": "The restaurant you are looking for could not be found.",
                "canonical_path": f"/restaurant/{slug}",
            },
            status_code=404,
        )

    related = []
    if restaurant.cuisine:
        wanted = {c.lower() for c in restaurant.cuisine}
        for other in restaurant_service.get_all_restaurants():
            if other.id == restaurant.id:
                continue
            if wanted & {c.lower() for c in other.cuisine}:
                related.append(other)
            if len(related) >= 4:
                break

    return templates.TemplateResponse(
        "restaurant.html",
        {
            "request": request,
            "page_title": f"{restaurant.name} | AI Restaurant Intelligence",
            "meta_description": restaurant.description[:160] if restaurant.description else f"Details, menu, and AI insights for {restaurant.name}.",
            "canonical_path": f"/restaurant/{restaurant.slug}",
            "restaurant": restaurant,
            "related": related,
        },
    )


@router.get("/planner", response_class=HTMLResponse)
async def planner(request: Request):
    return templates.TemplateResponse(
        "planner.html",
        {
            "request": request,
            "page_title": "AI Dining Planner | AI Restaurant Intelligence",
            "meta_description": "Let AI build a full dining plan tailored to your party size, budget, diet, and occasion.",
            "canonical_path": "/planner",
        },
    )


@router.get("/saved", response_class=HTMLResponse)
async def saved(request: Request):
    return templates.TemplateResponse(
        "saved.html",
        {
            "request": request,
            "page_title": "Saved Restaurants | AI Restaurant Intelligence",
            "meta_description": "Your saved and recently viewed restaurants in one place.",
            "canonical_path": "/saved",
        },
    )


@router.get("/cuisine/{slug}", response_class=HTMLResponse)
async def cuisine(request: Request, slug: str):
    cuisines = restaurant_service.get_cuisines()
    match = next(
        (c for c in cuisines if str(c.get("slug", "")).lower() == slug.lower()
         or str(c.get("name", "")).lower().replace(" ", "-") == slug.lower()),
        None,
    )
    if match is None:
        return templates.TemplateResponse(
            "404.html",
            {
                "request": request,
                "page_title": "Cuisine Not Found | AI Restaurant Intelligence",
                "meta_description": "The cuisine you are looking for could not be found.",
                "canonical_path": f"/cuisine/{slug}",
            },
            status_code=404,
        )

    cuisine_name = match.get("name", slug)
    restaurants = restaurant_service.filter_restaurants(cuisine=[cuisine_name])

    return templates.TemplateResponse(
        "cuisine.html",
        {
            "request": request,
            "page_title": f"{cuisine_name} Restaurants | AI Restaurant Intelligence",
            "meta_description": f"Explore the best {cuisine_name} restaurants matched to your taste, budget, and occasion.",
            "canonical_path": f"/cuisine/{slug}",
            "cuisine": match,
            "restaurants": restaurants,
        },
    )


@router.get("/about", response_class=HTMLResponse)
async def about(request: Request):
    return templates.TemplateResponse(
        "about.html",
        {
            "request": request,
            "page_title": "About | AI Restaurant Intelligence",
            "meta_description": "Learn how AI Restaurant Intelligence helps you find somewhere worth eating.",
            "canonical_path": "/about",
        },
    )


@router.get("/faq", response_class=HTMLResponse)
async def faq(request: Request):
    return templates.TemplateResponse(
        "faq.html",
        {
            "request": request,
            "page_title": "FAQ | AI Restaurant Intelligence",
            "meta_description": "Frequently asked questions about AI Restaurant Intelligence.",
            "canonical_path": "/faq",
        },
    )


@router.get("/contact", response_class=HTMLResponse)
async def contact(request: Request):
    return templates.TemplateResponse(
        "contact.html",
        {
            "request": request,
            "page_title": "Contact | AI Restaurant Intelligence",
            "meta_description": "Get in touch with the AI Restaurant Intelligence team.",
            "canonical_path": "/contact",
        },
    )
