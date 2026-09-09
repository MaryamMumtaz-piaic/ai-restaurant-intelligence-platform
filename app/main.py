"""FastAPI application entrypoint for AI Restaurant Intelligence."""
from fastapi import FastAPI, Request
from fastapi.exceptions import HTTPException as StarletteHTTPException
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.routes import ai, feedback, pages, restaurants
from app.templating import templates

app = FastAPI(title="AI Restaurant Intelligence")

app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(pages.router)
app.include_router(restaurants.router)
app.include_router(ai.router)
app.include_router(feedback.router)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    if exc.status_code == 404 and not request.url.path.startswith("/api"):
        return templates.TemplateResponse(
            "404.html",
            {
                "request": request,
                "page_title": "Page Not Found | AI Restaurant Intelligence",
                "meta_description": "The page you are looking for could not be found.",
                "canonical_path": request.url.path,
            },
            status_code=404,
        )
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
