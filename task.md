# CLAUDE CODE MASTER PROMPT

# Build a Complete AI Restaurant Intelligence Platform

You are a **senior full-stack engineer, AI agent architect, product designer, UI/UX designer, and Python backend engineer**.

Build a **complete, polished, production-quality restaurant intelligence web application** called:

# **AI Restaurant Intelligence Agent**

This is NOT a basic restaurant directory.

This is NOT a simple restaurant search application.

This is NOT a generic AI chatbot.

This is NOT an MVP.

Build a sophisticated **AI-powered dining intelligence platform** where autonomous AI agents understand user preferences, discover restaurants, analyze menus, evaluate dietary compatibility, compare dining options, and create personalized dining plans.

The product should feel like a real premium consumer technology product that could eventually be publicly launched.

---

# 1. CORE CONCEPT

The platform helps users answer:

> **"Where should I eat, and why is this the best option for me?"**

Instead of simply showing restaurants, the platform creates an intelligent dining decision system.

The main experience:

```text
User
 ↓
Dining Intent
 ↓
Location
 ↓
Cuisine Preferences
 ↓
Budget
 ↓
Dietary Requirements
 ↓
Dining Occasion
 ↓
Time / Availability
 ↓
Restaurant Discovery Agent
 ↓
Restaurant Intelligence Agent
 ↓
Menu Analysis Agent
 ↓
Dietary Compatibility Agent
 ↓
Comparison / Ranking Agent
 ↓
Dining Recommendation
 ↓
Personalized Dining Plan
```

The user should never feel like they are simply chatting with an AI.

The product should feel like an intelligent **restaurant discovery, menu intelligence, and dining decision platform**.

---

# 2. REQUIRED TECHNOLOGY

Use exactly:

## Backend

* Python
* FastAPI
* Uvicorn
* Pydantic
* OpenAI Python SDK
* Jinja2

## Frontend

* HTML
* Tailwind CSS
* Vanilla JavaScript

## AI Model

Use:

```text
OpenAI GPT-4.1-mini
```

Do not replace this with another model.

The OpenAI API key must remain server-side.

Do NOT use:

* React
* Next.js
* Vue
* Angular
* Node.js frontend
* separate frontend server
* PostgreSQL
* MongoDB
* Redis
* unnecessary microservices
* unnecessary infrastructure

FastAPI must serve the complete website.

Run with:

```bash
uvicorn app.main:app --reload --port 8000
```

Website:

```text
http://localhost:8000
```

---

# 3. IMPORTANT EXISTING STYLES FILE

There may be an existing styles file in the project.

Before changing the UI:

1. Inspect the existing styles file.
2. Understand its variables, utilities, components, spacing, typography, and design system.
3. Reuse compatible styles where appropriate.
4. Do not blindly delete useful existing styles.
5. Refactor only where necessary.
6. Keep the styling maintainable.

If the existing styles file is empty or insufficient, create a professional styling system.

---

# 4. PRODUCT POSITIONING

The product should sit between:

```text
Premium restaurant discovery
+
AI personal dining concierge
+
Menu intelligence
+
Dietary-aware recommendation engine
+
Restaurant comparison platform
```

The platform should answer questions such as:

```text
"Find me a good Pakistani restaurant nearby."

"Where can I have a halal dinner under PKR 5,000?"

"I want a quiet restaurant for a date."

"Find vegetarian-friendly restaurants with good desserts."

"Which of these three restaurants is best for my requirements?"

"What should I order here?"

"Build me a complete dinner plan."
```

The system should reason about the user's requirements instead of simply matching keywords.

---

# 5. DESIGN DIRECTION

Create a premium, modern, editorial dining experience.

Design language:

* sophisticated
* premium
* elegant
* warm
* modern
* editorial
* food-focused
* clean
* highly visual
* light theme

The UI should feel like:

```text
Premium restaurant guide
+
Modern AI product
+
Luxury dining magazine
+
Intelligent recommendation platform
```

Do NOT create:

* generic AI dashboard
* chatbot-looking interface
* excessive cards
* excessive gradients
* dark cyberpunk UI
* excessive glassmorphism
* generic SaaS template
* admin-panel appearance

The product should feel designed specifically for **dining discovery**.

---

# 6. COLOR SYSTEM

Use a sophisticated light palette.

Base:

* warm white
* ivory
* cream
* soft beige
* subtle neutral gray

Accent:

* deep olive
* sophisticated green
* muted terracotta
* warm amber
* subtle burgundy accents where appropriate

Use colors carefully.

Avoid neon colors.

Avoid excessive color usage.

Typography should create strong hierarchy.

---

# 7. TYPOGRAPHY

Use an editorial typography system.

Headings:

* expressive
* premium
* confident

Body:

* highly readable
* comfortable line height
* clean spacing

Use:

```text
Large editorial hero heading
Strong section headings
Clear labels
Readable restaurant information
Comfortable menu typography
```

Do not make everything bold.

---

# 8. RESPONSIVE DESIGN

The application must be fully responsive.

Support:

```text
Large Desktop
Desktop
Laptop
Tablet
Mobile
```

Do not simply shrink desktop layouts.

Create intentional mobile experiences.

The restaurant discovery experience must work beautifully on mobile.

Menu analysis and dining recommendations must remain easy to use while users are physically at a restaurant.

---

# 9. GLOBAL NAVBAR

Create a premium navigation system.

Desktop:

```text
Logo
Discover
Restaurants
Explore Cuisines
Dining Planner
Saved

Search

[Find My Restaurant]
```

Mobile:

```text
Logo
Menu
```

Mobile menu should include all important navigation.

Navbar should have a subtle border/shadow on scroll.

---

# 10. HOME PAGE

Create a complete homepage.

Sections:

```text
Navbar
Hero
Smart Restaurant Search
Popular Near You
Explore Cuisines
AI Dining Planner
Trending Restaurants
Dining Occasions
How It Works
Featured Menus
CTA
Footer
```

---

# 11. HERO SECTION

The hero should immediately explain the product.

Example:

```text
Find somewhere
worth eating.

AI-powered restaurant discovery
that understands your taste, budget,
diet, occasion, and what you actually want.

[Find My Restaurant]

[Explore Restaurants]
```

Include an elegant restaurant/food visual composition.

Do not depend on remote image URLs for core functionality.

If assets are unavailable, use graceful local placeholders that do not look broken.

---

# 12. SMART DINING SEARCH

Create a prominent intelligent search interface.

Example:

```text
What are you looking for?

"Quiet Pakistani restaurant for dinner under PKR 4,000"
```

Support natural-language intent.

The system should extract:

```text
Cuisine
Budget
Diet
Location
Occasion
Time
Atmosphere
Meal
Preferences
```

Example:

```text
User Input:

"Find me a quiet halal restaurant for a family dinner
under PKR 5,000 near Clifton."
```

The system should interpret:

```text
Cuisine:
Any

Diet:
Halal

Occasion:
Family Dinner

Budget:
PKR 5,000

Atmosphere:
Quiet

Location:
Clifton
```

---

# 13. DINING PREFERENCES

Allow users to explicitly configure preferences.

### Cuisine

```text
Pakistani
Indian
Chinese
Japanese
Korean
Thai
Italian
Mexican
Turkish
Middle Eastern
Mediterranean
American
French
Other
```

### Diet

```text
No restrictions
Halal
Vegetarian
Vegan
Gluten-free
Dairy-free
Nut-free
Low-carb
High-protein
Custom
```

Never make medical claims.

For allergies and serious dietary restrictions, clearly state that users must independently verify ingredients with the restaurant.

---

# 14. BUDGET

Allow:

```text
Budget per person
Total budget
Currency
```

Presets:

```text
Budget
Moderate
Premium
Luxury
```

Also support:

```text
Custom
```

Examples:

```text
PKR 2,000 / person
PKR 5,000 / person
PKR 10,000 / person
```

---

# 15. DINING OCCASION

Provide:

```text
Casual Meal
Family Dinner
Date Night
Business Dinner
Birthday
Celebration
Solo Dining
Brunch
Quick Lunch
Late Night
Friends Gathering
```

The recommendation engine should use occasion as a ranking factor.

---

# 16. ATMOSPHERE

Allow:

```text
Quiet
Romantic
Family-friendly
Casual
Luxury
Outdoor
Cozy
Modern
Traditional
Lively
Work-friendly
```

---

# 17. RESTAURANT DISCOVERY AGENT

Create:

```text
app/agents/restaurant_discovery_agent.py
```

Responsibilities:

* interpret dining intent
* identify suitable restaurant candidates
* apply hard constraints
* rank relevant restaurants
* prepare candidates for deeper analysis

The agent should NOT blindly send every restaurant to OpenAI.

First perform local filtering.

Then use AI to rank or reason over relevant candidates.

---

# 18. RESTAURANT INTELLIGENCE AGENT

Create:

```text
app/agents/restaurant_intelligence_agent.py
```

Responsibilities:

* analyze restaurant metadata
* understand cuisine identity
* evaluate atmosphere
* identify strengths
* identify weaknesses
* summarize dining experience
* determine suitability for occasion

Example output:

```json
{
  "restaurant_id": "",
  "overall_match": 92,
  "cuisine_match": 95,
  "budget_match": 88,
  "occasion_match": 94,
  "diet_match": 100,
  "atmosphere_match": 91,
  "strengths": [],
  "concerns": [],
  "summary": ""
}
```

---

# 19. MENU ANALYSIS AGENT

Create:

```text
app/agents/menu_analysis_agent.py
```

The agent analyzes restaurant menus.

It should identify:

```text
Starters
Main Courses
Desserts
Drinks
Vegetarian Options
Vegan Options
Halal Options
Spicy Dishes
Popular Items
Budget-Friendly Items
Premium Items
```

It should also answer:

```text
What should I order?

What is suitable for my preferences?

What is the best value?

What dishes work well together?
```

---

# 20. DIETARY COMPATIBILITY AGENT

Create:

```text
app/agents/dietary_agent.py
```

The agent evaluates menu items against user requirements.

For example:

```text
User:
Halal + Nut Allergy

Menu Item:
Chicken Tikka

Assessment:
Potentially suitable

Reason:
No obvious nut ingredient in the listed ingredients,
but restaurant preparation must be independently verified.
```

Never claim guaranteed allergy safety.

Use clear confidence indicators:

```text
Likely Compatible
Needs Verification
Not Suitable
Unknown
```

---

# 21. RESTAURANT COMPARISON AGENT

Create:

```text
app/agents/comparison_agent.py
```

The agent should compare selected restaurants.

Example:

```text
Restaurant A
Match: 91%

Restaurant B
Match: 87%

Restaurant C
Match: 79%
```

Comparison dimensions:

```text
Cuisine
Budget
Dietary Compatibility
Atmosphere
Occasion
Menu Variety
Value
Location
Overall Match
```

Provide a clear explanation.

Do not simply say:

```text
Restaurant A is better.
```

Explain:

```text
Restaurant A wins because it fits your budget better,
has stronger halal-friendly options, and better matches
your quiet dinner preference.
```

---

# 22. DINING PLAN AGENT

Create:

```text
app/agents/dining_plan_agent.py
```

The agent creates a complete dining plan.

Example:

```text
YOUR DINNER PLAN

Restaurant:
Lahore Social

Occasion:
Family Dinner

Budget:
PKR 5,000

Recommended Order:

Starter
Chicken Wings

Main
Chicken Karahi
Garlic Naan

Side
Fresh Salad

Dessert
Kheer

Estimated Total:
PKR 4,650

Why this works:
Balanced portions, within budget,
and suitable for a family-style meal.
```

---

# 23. AI AGENT ORCHESTRATOR

Create:

```text
app/agents/orchestrator.py
```

The orchestrator should coordinate the agent workflow.

Architecture:

```text
User Intent
     ↓
Preference Extraction
     ↓
Restaurant Discovery Agent
     ↓
Local Candidate Filtering
     ↓
Restaurant Intelligence Agent
     ↓
Menu Analysis Agent
     ↓
Dietary Compatibility Agent
     ↓
Comparison Agent
     ↓
Dining Plan Agent
     ↓
Final Recommendation
```

Do not make every request call every agent.

Use the minimum necessary agents for each workflow.

---

# 24. STRUCTURED AI OUTPUT

All AI agents must return structured JSON.

Do not depend on free-form text parsing.

Use Pydantic models to validate outputs.

Example:

```json
{
  "recommendations": [],
  "reasoning": "",
  "confidence": 0,
  "warnings": []
}
```

If the AI returns invalid JSON:

```text
Validate
 ↓
Retry safely
 ↓
Fallback
```

Never expose raw model output.

---

# 25. RESTAURANT DATASET

Create at least:

```text
30+ realistic fictional restaurant records
```

Cover multiple cuisines.

Example cuisines:

```text
Pakistani
Indian
Chinese
Japanese
Korean
Thai
Italian
Mexican
Turkish
Middle Eastern
Mediterranean
American
French
```

Each restaurant should include:

```json
{
  "id": "",
  "name": "",
  "slug": "",
  "description": "",
  "cuisine": [],
  "region": "",
  "city": "",
  "area": "",
  "address": "",
  "price_level": "",
  "average_cost_per_person": 0,
  "currency": "",
  "rating": 4.8,
  "review_count": 0,
  "ambience": [],
  "dietary_options": [],
  "meal_types": [],
  "occasions": [],
  "opening_hours": {},
  "menu": [],
  "features": [],
  "image": ""
}
```

Use realistic fictional data.

Do not present fictional information as verified real-world facts.

---

# 26. MENU DATA

Each restaurant should have realistic menu records.

Example:

```json
{
  "id": "",
  "name": "",
  "category": "",
  "description": "",
  "price": 0,
  "currency": "",
  "dietary_tags": [],
  "spice_level": "",
  "ingredients": [],
  "popular": false,
  "recommended": false
}
```

Include:

```text
20+ menu items
```

across representative restaurants.

---

# 27. DISCOVER PAGE

Create:

```text
/discover
```

This should be a major product page.

Sections:

```text
Discover Restaurants
Smart Search
Filters
Restaurant Grid
Popular Near You
Trending
Cuisine Collections
Dining Occasions
```

---

# 28. RESTAURANT CARDS

Each card should contain:

```text
Restaurant Image
Cuisine
Restaurant Name
Short Description
Rating
Price Level
Average Cost
Distance / Area
Atmosphere
Dietary Tags
Save
```

Example:

```text
Saffron House

Pakistani · Family Dining

★★★★★ 4.8

PKR 2,500 avg/person

Halal · Family-friendly · Traditional

[View Restaurant]
```

Do not overload cards with unnecessary information.

---

# 29. FILTERS

Support:

```text
Cuisine
Location
Price
Diet
Occasion
Atmosphere
Rating
Meal Type
Features
```

Filters must actually work.

Do not create fake UI controls.

---

# 30. SORTING

Allow:

```text
Best Match
Highest Rated
Lowest Price
Highest Value
Most Popular
Newest
```

---

# 31. SEARCH

Implement global restaurant search.

Examples:

```text
Pakistani restaurant
quiet dinner
halal food
date night
cheap Italian
family restaurant
best dessert
```

Search should work against the local dataset.

Natural-language search should extract intent where appropriate.

---

# 32. RESTAURANT DETAIL PAGE

Create:

```text
/restaurant/{slug}
```

The page should include:

```text
Hero Image
Restaurant Name
Cuisine
Rating
Price Level
Location
Description
Atmosphere
Features
Dietary Information
Menu
Popular Dishes
AI Insights
Reviews Summary
Opening Hours
```

Primary actions:

```text
[Ask AI About This Restaurant]
[Build Dining Plan]
[Save]
[Share]
```

---

# 33. AI RESTAURANT INSIGHTS

Each restaurant should have an AI-powered section:

```text
AI INSIGHT

Why this restaurant may work for you:

✓ Strong match for your budget
✓ Good family dining atmosphere
✓ Multiple halal-friendly options
✓ Popular main courses

Things to consider:

• Peak hours may be busy
• Some menu items require dietary verification
```

Do not fabricate verified reviews or facts.

Clearly distinguish:

```text
Dataset Information
AI Interpretation
User-provided Information
```

---

# 34. MENU INTELLIGENCE

Restaurant pages should allow users to explore the menu intelligently.

Example:

```text
What should I order?

[Best Value]
[High Protein]
[Vegetarian]
[Spicy]
[Under PKR 2,000]
[Best for Sharing]
[Best Dessert]
```

These should actually filter or trigger AI analysis.

---

# 35. ASK AI ABOUT RESTAURANT

Create an AI interaction panel.

Example:

```text
Ask about this restaurant...

"What's best for two people?"
"Which dishes are mild?"
"What can I order under PKR 3,000?"
"Build a dinner for four."
```

The interface should feel like an intelligent restaurant concierge, not a generic chatbot.

Use contextual restaurant and menu data.

---

# 36. DINING PLANNER

Create:

```text
/planner
```

The planner should ask:

```text
Where?
What cuisine?
Who are you dining with?
Budget?
Dietary requirements?
Occasion?
Atmosphere?
Date / time?
```

Then generate:

```text
Top Restaurant
Backup Restaurant
Recommended Order
Estimated Cost
Dining Flow
Why This Plan Works
```

---

# 37. RESTAURANT COMPARISON

Allow users to select:

```text
Compare
```

Maximum:

```text
3 restaurants
```

Comparison screen:

```text
                 Restaurant A   Restaurant B   Restaurant C

Overall Match        94%            87%            81%

Budget               ✓              ✓              ✕

Diet                 ✓              ✓              ?

Atmosphere            ✓              ✕              ✓

Rating               4.9            4.7            4.6

Value                High           Medium         High
```

Add:

```text
AI Verdict
```

---

# 38. SAVED RESTAURANTS

Since there is no authentication, use:

```text
localStorage
```

Users can:

```text
Save
Unsave
View Saved Restaurants
```

Create:

```text
/saved
```

Include a polished empty state.

---

# 39. RECENTLY VIEWED

Use localStorage.

Track:

```text
Recently Viewed Restaurants
```

Show:

```text
Continue Exploring
```

---

# 40. PERSONALIZATION

Maintain current-session preferences.

Example:

```text
Cuisine:
Pakistani

Diet:
Halal

Budget:
Moderate

Occasion:
Family Dining
```

Use these preferences to improve recommendations.

Do not claim persistent personalization without persistent storage.

---

# 41. AI DINING PROFILE

Create a lightweight session profile.

Example:

```text
YOUR DINING PROFILE

Preferred cuisines
Pakistani
Middle Eastern

Typical budget
PKR 3,000–5,000

Preferred occasions
Family
Casual

Diet
Halal
```

Allow editing.

Store locally for this implementation.

---

# 42. RESTAURANT RECOMMENDATION SCORE

Create a transparent scoring model.

Example:

```text
Overall Match

Cuisine        20%
Budget         20%
Diet           20%
Occasion       15%
Atmosphere     10%
Rating         10%
Menu Fit        5%
```

Make weights configurable in code.

AI reasoning can complement this score.

Do not let the AI arbitrarily invent numerical scores without a defined framework.

---

# 43. LOCATION HANDLING

Support:

```text
City
Area
Neighborhood
```

Allow users to manually select a location.

Example:

```text
Karachi
Lahore
Islamabad
Dubai
London
New York
```

Do not pretend to have live GPS data unless it is actually implemented.

If browser geolocation is implemented, request permission properly and provide a manual fallback.

---

# 44. RESTAURANT AVAILABILITY

Do not fabricate live reservations.

If availability is not connected to a real booking provider:

Display:

```text
Availability not connected
```

or:

```text
Check with the restaurant directly.
```

Never present fictional availability as real.

---

# 45. REVIEWS

Use fictional dataset review summaries.

Do NOT scrape or fabricate real customer identities.

Store:

```text
rating
review_count
review themes
```

AI can summarize the fictional dataset.

Clearly label sample/demo review data where appropriate.

---

# 46. SHARE

Implement:

```text
Share Restaurant
Share Dining Plan
```

Use Web Share API where available.

Fallback:

```text
Copy Link
```

Toast:

```text
Link copied.
```

---

# 47. FEEDBACK

Add:

```text
Was this recommendation useful?

👍 Yes
👎 No
```

Store aggregate feedback locally.

Associate feedback with an anonymous local identifier.

---

# 48. AI EXPLANATION

Every major recommendation should provide:

```text
Why we recommend this
```

Example:

```text
We recommend Saffron House because:

• It fits your PKR 5,000 budget.
• It has strong family-dining suitability.
• Its menu contains multiple halal-friendly options.
• Its cuisine matches your preference.
```

Avoid generic AI explanations.

Use actual recommendation inputs.

---

# 49. LOADING EXPERIENCE

Every AI operation needs a polished contextual loading state.

Example:

```text
Finding Your Perfect Restaurant

✓ Understanding your preferences
✓ Filtering restaurants
● Analyzing menus
○ Checking dietary compatibility
○ Comparing top options
○ Building your recommendation
```

Do not use a generic spinner everywhere.

---

# 50. ERROR HANDLING

If AI fails:

```text
We couldn't complete your dining analysis right now.

Please try again.
```

Never expose:

* API errors
* stack traces
* internal prompts
* API keys
* internal implementation details

---

# 51. AI SAFETY

The AI must not make unsupported claims about:

* allergies
* food safety
* medical conditions
* religious certification
* restaurant licensing
* real-time availability

For dietary restrictions:

```text
AI assessment is informational only.
Always confirm ingredients and preparation
directly with the restaurant for serious allergies
or dietary restrictions.
```

---

# 52. DATA STORAGE

Use JSON files for persistent application data.

Example:

```text
app/data/
├── restaurants.json
├── cuisines.json
├── menu_items.json
├── categories.json
├── feedback.json
└── contacts.json
```

Create reusable JSON storage utilities.

Do not duplicate read/write logic.

---

# 53. API DESIGN

Implement clean FastAPI routes.

Example:

```text
GET  /
GET  /discover
GET  /restaurant/{slug}
GET  /planner
GET  /saved
GET  /about
GET  /faq
GET  /contact

GET  /api/restaurants
GET  /api/restaurants/{id}
GET  /api/search
GET  /api/cuisines
GET  /api/categories
GET  /api/menu/{restaurant_id}

POST /api/ai/discover
POST /api/ai/analyze-restaurant
POST /api/ai/analyze-menu
POST /api/ai/check-diet
POST /api/ai/compare
POST /api/ai/dining-plan
POST /api/ai/restaurant-chat
POST /api/feedback
POST /api/contact
```

Use proper Pydantic request and response models.

---

# 54. OPENAI SERVICE

Create:

```text
app/services/openai_service.py
```

Centralize OpenAI communication.

Functions:

```python
extract_dining_intent()
analyze_restaurant()
analyze_menu()
evaluate_dietary_compatibility()
compare_restaurants()
generate_dining_plan()
answer_restaurant_question()
```

Do not scatter OpenAI API calls throughout route files.

---

# 55. AGENT ARCHITECTURE

Maintain clean separation:

```text
User Request
     ↓
Intent Extraction
     ↓
Candidate Retrieval
     ↓
Specialized Agents
     ↓
Validation
     ↓
Recommendation Engine
     ↓
Final Response
```

For restaurant discovery:

```text
User Query
     ↓
Intent Extraction
     ↓
Local Filtering
     ↓
Top Candidates
     ↓
AI Ranking
     ↓
Final Recommendations
```

Do not send the entire dataset to OpenAI.

---

# 56. PROJECT STRUCTURE

Use:

```text
ai-restaurant-intelligence/
│
├── app/
│   ├── main.py
│
│   ├── routes/
│   │   ├── pages.py
│   │   ├── restaurants.py
│   │   ├── ai.py
│   │   └── feedback.py
│
│   ├── agents/
│   │   ├── orchestrator.py
│   │   ├── restaurant_discovery_agent.py
│   │   ├── restaurant_intelligence_agent.py
│   │   ├── menu_analysis_agent.py
│   │   ├── dietary_agent.py
│   │   ├── comparison_agent.py
│   │   └── dining_plan_agent.py
│
│   ├── services/
│   │   ├── openai_service.py
│   │   ├── restaurant_service.py
│   │   └── json_store.py
│
│   ├── models/
│   │   ├── restaurant.py
│   │   ├── menu.py
│   │   ├── ai_request.py
│   │   └── feedback.py
│
│   ├── data/
│   │   ├── restaurants.json
│   │   ├── cuisines.json
│   │   ├── categories.json
│   │   ├── menu_items.json
│   │   ├── feedback.json
│   │   └── contacts.json
│
│   └── utils/
│       ├── validation.py
│       ├── scoring.py
│       └── helpers.py
│
├── templates/
│   ├── base.html
│   ├── index.html
│   ├── discover.html
│   ├── restaurant.html
│   ├── planner.html
│   ├── saved.html
│   ├── cuisine.html
│   ├── comparison.html
│   ├── about.html
│   ├── contact.html
│   ├── faq.html
│   └── 404.html
│
├── static/
│   ├── css/
│   │   └── styles.css
│   │
│   ├── js/
│   │   ├── main.js
│   │   ├── discover.js
│   │   ├── restaurant.js
│   │   ├── planner.js
│   │   ├── comparison.js
│   │   └── saved.js
│   │
│   └── images/
│
├── requirements.txt
├── .env.example
├── .gitignore
└── README.md
```

Adapt the structure if the existing project already has a better structure.

Maintain clean separation of responsibilities.

---

# 57. ABOUT PAGE

Create:

```text
/about
```

Explain:

```text
What the platform does
How restaurant intelligence works
How AI agents analyze dining options
How menu intelligence works
How personalization works
```

Keep the copy professional.

---

# 58. FAQ PAGE

Create:

```text
/faq
```

Include:

```text
How does restaurant matching work?
How does the AI analyze menus?
Can I specify dietary requirements?
Can I compare restaurants?
Can I create a dining plan?
Does the platform provide live restaurant availability?
How is my data stored?
```

---

# 59. CONTACT PAGE

Create:

```text
/contact
```

Fields:

```text
Name
Email
Subject
Message
```

Store submissions locally.

Do not pretend messages are actually emailed.

Show:

```text
Message received.
```

---

# 60. FOOTER

Create a polished footer:

```text
AI Restaurant Intelligence

Discover smarter.
Dine better.

Explore
Discover
Restaurants
Cuisines
Dining Planner
Saved

AI Tools
Restaurant Intelligence
Menu Analysis
Dining Planner
Compare Restaurants

Company
About
FAQ
Contact

© 2026 AI Restaurant Intelligence
```

---

# 61. SEO

Implement:

* unique page titles
* meta descriptions
* canonical URLs
* Open Graph metadata
* descriptive headings

Restaurant pages should have unique metadata.

Where practical, use appropriate structured data for restaurant pages.

Do not generate misleading structured data.

---

# 62. ACCESSIBILITY

Implement:

* semantic HTML
* proper labels
* keyboard navigation
* focus states
* accessible buttons
* accessible dialogs
* proper contrast
* descriptive alt text
* accessible dropdowns
* screen-reader-friendly status messages

---

# 63. TOAST SYSTEM

Create a reusable toast notification system.

Examples:

```text
Restaurant saved
Restaurant removed
Link copied
Dining plan created
Preferences updated
Feedback submitted
```

---

# 64. EMPTY STATES

Create polished empty states.

Example:

```text
Your dining list is empty.

Discover restaurants you'll want
to come back to.

[Explore Restaurants]
```

Never show a blank page.

---

# 65. 404 PAGE

Create a polished:

```text
404
```

Example:

```text
This restaurant seems to have
disappeared from the menu.

[Back Home]
[Discover Restaurants]
```

---

# 66. PERFORMANCE

Optimize the application.

Important:

* perform local filtering before AI calls
* avoid unnecessary AI requests
* cache suitable computations
* lazy-load images
* minimize JavaScript
* keep API payloads clean
* avoid blocking UI
* use asynchronous FastAPI operations where appropriate

---

# 67. AI COST CONTROL

Do not call AI unnecessarily.

Use:

```text
Local filtering
     ↓
Candidate reduction
     ↓
AI reasoning
```

For example:

If the dataset contains 100 restaurants, do NOT send all 100 to OpenAI.

First reduce to:

```text
Top 5–10 candidates
```

Then ask the AI to analyze them.

---

# 68. SESSION MEMORY

Maintain session-level preferences.

Example:

```text
Cuisine
Budget
Diet
Occasion
Atmosphere
Location
```

Use browser localStorage where appropriate.

Do not imply persistent cloud memory.

---

# 69. IMPORTANT: DO NOT BUILD A FAKE UI

Every major interaction must work.

These must actually work:

```text
Search
Natural-language intent extraction
Filtering
Sorting
Restaurant details
Menu filtering
AI analysis
Dietary analysis
Restaurant comparison
Dining plan generation
Save / Unsave
Recently viewed
Share
Feedback
Navigation
```

Do not create buttons that only visually respond.

---

# 70. RECOMMENDATION EXPERIENCE

The recommendation screen should feel like the conclusion of an intelligent investigation.

Example:

```text
YOUR BEST MATCH

Saffron House

94% Match

Why it fits you

✓ Within your budget
✓ Strong match for your cuisine preference
✓ Suitable for family dining
✓ Multiple compatible menu options

Estimated Cost
PKR 4,650

Best Order
Chicken Karahi
Garlic Naan
Fresh Salad
Kheer

[View Restaurant]

[Build Dining Plan]
```

---

# 71. MULTI-AGENT ACTIVITY UI

When appropriate, show the intelligence process visually.

Example:

```text
AI DINING INTELLIGENCE

✓ Understanding your preferences
✓ Finding restaurant candidates
✓ Analyzing restaurant profiles
✓ Reading relevant menus
✓ Checking dietary compatibility
✓ Comparing top matches
✓ Building your recommendation
```

This should feel like a premium AI system rather than a generic spinner.

---

# 72. AI CONFIDENCE

When AI conclusions involve uncertainty, show it.

Examples:

```text
High Confidence
Medium Confidence
Needs Verification
```

Do not create fake precision.

For dietary compatibility, always prefer cautious language.

---

# 73. FINAL END-TO-END USER JOURNEY

Test the complete flow:

```text
Home
 ↓
Smart Dining Search
 ↓
"Quiet halal dinner under PKR 5,000"
 ↓
Intent Extraction
 ↓
Restaurant Discovery
 ↓
Local Filtering
 ↓
AI Ranking
 ↓
Restaurant Recommendations
 ↓
Open Restaurant
 ↓
Analyze Menu
 ↓
Dietary Compatibility
 ↓
Compare Restaurants
 ↓
Select Restaurant
 ↓
Build Dining Plan
 ↓
Recommended Order
 ↓
Estimated Cost
 ↓
Save Restaurant
 ↓
Share Dining Plan
```

Test on:

```text
Desktop
Tablet
Mobile
```

Fix all broken states.

---

# 74. FINAL QUALITY BAR

The final application must NOT look like:

```text
student project
basic CRUD application
restaurant directory
generic Tailwind template
AI chatbot
admin dashboard
prototype
```

It should look like:

```text
A premium AI-powered dining intelligence product.
```

Pay special attention to:

* restaurant imagery
* typography
* spacing
* recommendation hierarchy
* menu readability
* search experience
* AI states
* comparison UI
* mobile experience
* dietary warnings
* loading states
* empty states
* hover states
* accessibility

---

# 75. FINAL IMPLEMENTATION REQUIREMENT

Do not stop after creating the initial pages.

Continue implementing until the complete application works end-to-end.

Inspect the existing project before modifying it.

Reuse existing styles where appropriate.

Do not ask me to design the UI for you.

You are responsible for all UI/UX decisions.

Use:

```text
Python
FastAPI
Uvicorn
Pydantic
OpenAI Python SDK
Jinja2
HTML
Tailwind CSS
Vanilla JavaScript
GPT-4.1-mini
```

No login or signup.

No unnecessary infrastructure.

No fake live data.

No fake reservations.

No unsupported medical, allergy, certification, or availability claims.

The final product should be a **complete AI-powered restaurant intelligence and dining recommendation platform**, with specialized AI agents working together behind a polished consumer-facing interface.

Build it to a level where the interface should require **little to no manual UI redesign after implementation**.
