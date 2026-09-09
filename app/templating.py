"""Shared Jinja2Templates instance used across route modules."""
from fastapi.templating import Jinja2Templates

templates = Jinja2Templates(directory="templates")
