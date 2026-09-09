"""Loading and querying logic for the restaurant/menu dataset (app/data/*.json)."""
from typing import Optional

from app.models.restaurant import Restaurant, RestaurantWithMenu, MenuItem
from app.services.json_store import read_json
from app.utils.scoring import score_restaurant


def _load_restaurants_raw() -> list[dict]:
    return read_json("restaurants.json", default=[])


def _load_menu_items_raw() -> list[dict]:
    return read_json("menu_items.json", default=[])


def get_all_restaurants() -> list[RestaurantWithMenu]:
    restaurants = _load_restaurants_raw()
    menu_items = _load_menu_items_raw()
    menus_by_restaurant: dict[str, list[dict]] = {}
    for item in menu_items:
        menus_by_restaurant.setdefault(item["restaurant_id"], []).append(item)

    result = []
    for r in restaurants:
        menu = [MenuItem(**m) for m in menus_by_restaurant.get(r["id"], [])]
        result.append(RestaurantWithMenu(**r, menu=menu))
    return result


def get_restaurant_by_id(restaurant_id: str) -> Optional[RestaurantWithMenu]:
    for r in get_all_restaurants():
        if r.id == restaurant_id:
            return r
    return None


def get_restaurant_by_slug(slug: str) -> Optional[RestaurantWithMenu]:
    for r in get_all_restaurants():
        if r.slug == slug:
            return r
    return None


def get_menu_for_restaurant(restaurant_id: str) -> list[MenuItem]:
    menu_items = _load_menu_items_raw()
    return [MenuItem(**m) for m in menu_items if m["restaurant_id"] == restaurant_id]


def get_cuisines() -> list[dict]:
    return read_json("cuisines.json", default=[])


def get_categories() -> list[dict]:
    return read_json("categories.json", default=[])


def search_restaurants(query: str) -> list[Restaurant]:
    if not query:
        return [Restaurant(**r.model_dump(exclude={"menu"})) for r in get_all_restaurants()]

    q = query.lower().strip()
    matches = []
    for r in get_all_restaurants():
        haystacks = [
            r.name,
            r.description,
            r.area,
            r.city,
            *r.cuisine,
            *r.dietary_options,
            *r.features,
        ]
        if any(q in str(h).lower() for h in haystacks):
            matches.append(Restaurant(**r.model_dump(exclude={"menu"})))
    return matches


def filter_restaurants(
    restaurants: Optional[list[Restaurant]] = None,
    cuisine: Optional[list[str]] = None,
    diet: Optional[list[str]] = None,
    price_level: Optional[list[str]] = None,
    occasion: Optional[str] = None,
    atmosphere: Optional[list[str]] = None,
    city: Optional[str] = None,
    area: Optional[str] = None,
    min_rating: Optional[float] = None,
    meal_type: Optional[str] = None,
    features: Optional[list[str]] = None,
) -> list[Restaurant]:
    if restaurants is None:
        restaurants = [Restaurant(**r.model_dump(exclude={"menu"})) for r in get_all_restaurants()]

    def matches(r: Restaurant) -> bool:
        if cuisine:
            wanted = {c.lower() for c in cuisine}
            have = {c.lower() for c in r.cuisine}
            if not (wanted & have):
                return False
        if diet:
            wanted = {d.lower() for d in diet}
            have = {d.lower() for d in r.dietary_options}
            if not (wanted & have):
                return False
        if price_level:
            wanted = {p.lower() for p in price_level}
            if r.price_level.lower() not in wanted:
                return False
        if occasion:
            if occasion.lower() not in {o.lower() for o in r.occasions}:
                return False
        if atmosphere:
            wanted = {a.lower() for a in atmosphere}
            have = {a.lower() for a in r.ambience}
            if not (wanted & have):
                return False
        if city:
            if r.city.lower() != city.lower():
                return False
        if area:
            if r.area.lower() != area.lower():
                return False
        if min_rating is not None:
            if r.rating < min_rating:
                return False
        if meal_type:
            if meal_type.lower() not in {m.lower() for m in r.meal_types}:
                return False
        if features:
            wanted = {f.lower() for f in features}
            have = {f.lower() for f in r.features}
            if not (wanted & have):
                return False
        return True

    return [r for r in restaurants if matches(r)]


def sort_restaurants(restaurants: list[Restaurant], sort_by: str) -> list[Restaurant]:
    if sort_by == "highest_rated":
        return sorted(restaurants, key=lambda r: r.rating, reverse=True)
    if sort_by == "lowest_price":
        return sorted(restaurants, key=lambda r: r.average_cost_per_person)
    if sort_by == "highest_value":
        return sorted(
            restaurants,
            key=lambda r: (r.rating / r.average_cost_per_person) if r.average_cost_per_person else 0,
            reverse=True,
        )
    if sort_by == "most_popular":
        return sorted(restaurants, key=lambda r: r.review_count, reverse=True)
    if sort_by == "newest":
        return sorted(restaurants, key=lambda r: r.id, reverse=True)
    # best_match: caller has already ranked (e.g. via scoring), no-op
    return restaurants


def local_candidate_filter(prefs) -> list[RestaurantWithMenu]:
    """Cheap local filtering + scoring performed before any AI call.

    Applies soft filters first; if they eliminate everything, constraints are
    progressively relaxed (weakest first) rather than returning an empty list.
    """
    all_restaurants = get_all_restaurants()

    cuisine = getattr(prefs, "cuisine", None) or None
    diet = getattr(prefs, "diet", None) or None
    budget = getattr(prefs, "budget_per_person", None)
    occasion = getattr(prefs, "occasion", None)
    atmosphere = getattr(prefs, "atmosphere", None) or None
    city = getattr(prefs, "city", None)
    area = getattr(prefs, "area", None)

    def apply_filters(use_cuisine, use_diet, use_budget, use_occasion, use_atmosphere, use_city, use_area):
        candidates = list(all_restaurants)
        if use_city and city:
            candidates = [r for r in candidates if r.city.lower() == city.lower()]
        if use_area and area:
            candidates = [r for r in candidates if r.area.lower() == area.lower()]
        if use_cuisine and cuisine:
            wanted = {c.lower() for c in cuisine}
            candidates = [r for r in candidates if wanted & {c.lower() for c in r.cuisine}]
        if use_diet and diet:
            wanted = {d.lower() for d in diet}
            candidates = [r for r in candidates if wanted & {d.lower() for d in r.dietary_options}]
        if use_occasion and occasion:
            candidates = [r for r in candidates if occasion.lower() in {o.lower() for o in r.occasions}]
        if use_atmosphere and atmosphere:
            wanted = {a.lower() for a in atmosphere}
            candidates = [r for r in candidates if wanted & {a.lower() for a in r.ambience}]
        if use_budget and budget:
            candidates = [r for r in candidates if r.average_cost_per_person <= budget * 1.3]
        return candidates

    # Weakest constraint dropped first when relaxing.
    relax_order = ["area", "atmosphere", "occasion", "budget", "diet", "cuisine", "city"]
    flags = {
        "cuisine": True,
        "diet": True,
        "budget": True,
        "occasion": True,
        "atmosphere": True,
        "city": True,
        "area": True,
    }

    candidates = apply_filters(**{f"use_{k}": v for k, v in flags.items()})
    for constraint in relax_order:
        if candidates:
            break
        flags[constraint] = False
        candidates = apply_filters(**{f"use_{k}": v for k, v in flags.items()})

    if not candidates:
        candidates = list(all_restaurants)

    scored = []
    for r in candidates:
        base = Restaurant(**r.model_dump(exclude={"menu"}))
        score = score_restaurant(base, prefs)
        scored.append((score["overall_match"], r))

    scored.sort(key=lambda pair: pair[0], reverse=True)
    return [r for _, r in scored[:10]]
