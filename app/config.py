"""Application configuration loaded from environment variables."""
import os
from pathlib import Path

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

BASE_DIR = Path(__file__).resolve().parent.parent

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
OPENAI_MODEL = "gpt-4.1-mini"
APP_NAME = "AI Restaurant Intelligence"
DEBUG = os.environ.get("DEBUG", "false").lower() == "true"
