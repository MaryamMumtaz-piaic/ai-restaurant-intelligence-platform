"""Pydantic models for restaurants and menu items."""
from typing import Optional
from pydantic import BaseModel, Field


class OpeningHours(BaseModel):
    monday: str = "12:00 PM - 11:00 PM"
    tuesday: str = "12:00 PM - 11:00 PM"
    wednesday: str = "12:00 PM - 11:00 PM"
    thursday: str = "12:00 PM - 11:00 PM"
    friday: str = "12:00 PM - 11:59 PM"
    saturday: str = "12:00 PM - 11:59 PM"
    sunday: str = "12:00 PM - 11:00 PM"


class MenuItem(BaseModel):
    id: str
    restaurant_id: str
    name: str
    category: str  # Starter, Main Course, Dessert, Drink, Side
    description: str
    price: float
    currency: str = "PKR"
    dietary_tags: list[str] = Field(default_factory=list)
    spice_level: str = "None"  # None, Mild, Medium, Hot
    ingredients: list[str] = Field(default_factory=list)
    popular: bool = False
    recommended: bool = False


class Restaurant(BaseModel):
    id: str
    name: str
    slug: str
    description: str
    cuisine: list[str]
    region: str
    city: str
    area: str
    address: str
    price_level: str  # Budget, Moderate, Premium, Luxury
    average_cost_per_person: float
    currency: str = "PKR"
    rating: float = 4.5
    review_count: int = 0
    review_themes: list[str] = Field(default_factory=list)
    ambience: list[str] = Field(default_factory=list)
    dietary_options: list[str] = Field(default_factory=list)
    meal_types: list[str] = Field(default_factory=list)
    occasions: list[str] = Field(default_factory=list)
    opening_hours: OpeningHours = Field(default_factory=OpeningHours)
    features: list[str] = Field(default_factory=list)
    image: str = ""


class RestaurantWithMenu(Restaurant):
    menu: list[MenuItem] = Field(default_factory=list)
