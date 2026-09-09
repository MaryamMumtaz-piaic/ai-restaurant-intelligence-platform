"""Pydantic request/response models for AI agent endpoints."""
from typing import Optional
from pydantic import BaseModel, Field


class DiningIntent(BaseModel):
    """Structured output of natural-language intent extraction."""
    cuisine: list[str] = Field(default_factory=list)
    diet: list[str] = Field(default_factory=list)
    budget_per_person: Optional[float] = None
    occasion: Optional[str] = None
    atmosphere: list[str] = Field(default_factory=list)
    location: Optional[str] = None
    meal_type: Optional[str] = None
    party_size: Optional[int] = None
    raw_query: str = ""


class DiscoverRequest(BaseModel):
    query: Optional[str] = None
    cuisine: list[str] = Field(default_factory=list)
    diet: list[str] = Field(default_factory=list)
    budget_per_person: Optional[float] = None
    occasion: Optional[str] = None
    atmosphere: list[str] = Field(default_factory=list)
    city: Optional[str] = None
    area: Optional[str] = None
    party_size: Optional[int] = None


class RestaurantMatch(BaseModel):
    restaurant_id: str
    overall_match: int
    cuisine_match: int
    budget_match: int
    occasion_match: int
    diet_match: int
    atmosphere_match: int
    strengths: list[str] = Field(default_factory=list)
    concerns: list[str] = Field(default_factory=list)
    summary: str = ""


class DiscoverResponse(BaseModel):
    intent: DiningIntent
    matches: list[RestaurantMatch]
    reasoning: str = ""
    confidence: str = "Medium Confidence"
    warnings: list[str] = Field(default_factory=list)


class AnalyzeRestaurantRequest(BaseModel):
    restaurant_id: str
    preferences: Optional[DiscoverRequest] = None


class AnalyzeMenuRequest(BaseModel):
    restaurant_id: str
    question: Optional[str] = None
    filter_tag: Optional[str] = None  # best_value, high_protein, vegetarian, spicy, etc.
    preferences: Optional[DiscoverRequest] = None


class MenuInsight(BaseModel):
    item_id: str
    reason: str


class AnalyzeMenuResponse(BaseModel):
    restaurant_id: str
    highlights: list[MenuInsight] = Field(default_factory=list)
    answer: str = ""
    confidence: str = "Medium Confidence"


class DietCheckRequest(BaseModel):
    restaurant_id: str
    diet: list[str] = Field(default_factory=list)
    custom_restriction: Optional[str] = None


class DietAssessment(BaseModel):
    item_id: str
    status: str  # Likely Compatible, Needs Verification, Not Suitable, Unknown
    reason: str


class DietCheckResponse(BaseModel):
    restaurant_id: str
    assessments: list[DietAssessment]
    disclaimer: str = (
        "AI assessment is informational only. Always confirm ingredients and "
        "preparation directly with the restaurant for serious allergies or "
        "dietary restrictions."
    )


class CompareRequest(BaseModel):
    restaurant_ids: list[str] = Field(min_length=2, max_length=3)
    preferences: Optional[DiscoverRequest] = None


class ComparisonRow(BaseModel):
    restaurant_id: str
    overall_match: int
    budget_fit: bool
    diet_fit: Optional[bool] = None
    atmosphere_fit: bool
    rating: float
    value: str  # High, Medium, Low


class CompareResponse(BaseModel):
    rows: list[ComparisonRow]
    verdict: str
    reasoning: str


class DiningPlanRequest(BaseModel):
    restaurant_id: str
    party_size: int = 2
    budget_per_person: Optional[float] = None
    diet: list[str] = Field(default_factory=list)
    occasion: Optional[str] = None


class PlanCourse(BaseModel):
    course: str  # Starter, Main, Side, Dessert
    item_name: str
    price: float


class DiningPlanResponse(BaseModel):
    restaurant_id: str
    restaurant_name: str
    occasion: Optional[str] = None
    budget_per_person: Optional[float] = None
    courses: list[PlanCourse]
    estimated_total: float
    currency: str = "PKR"
    explanation: str
    backup_restaurant_id: Optional[str] = None


class ChatMessage(BaseModel):
    role: str
    content: str


class RestaurantChatRequest(BaseModel):
    restaurant_id: str
    question: str
    history: list[ChatMessage] = Field(default_factory=list)


class RestaurantChatResponse(BaseModel):
    answer: str
    confidence: str = "Medium Confidence"
