"""Reusable JSON file read/write utilities backing app/data/*.json."""
import json
import threading
from pathlib import Path
from typing import Any

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
_locks: dict[str, threading.Lock] = {}


def _lock_for(filename: str) -> threading.Lock:
    if filename not in _locks:
        _locks[filename] = threading.Lock()
    return _locks[filename]


def read_json(filename: str, default: Any = None) -> Any:
    path = DATA_DIR / filename
    if not path.exists():
        return default if default is not None else []
    with _lock_for(filename):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)


def write_json(filename: str, data: Any) -> None:
    path = DATA_DIR / filename
    with _lock_for(filename):
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False, default=str)


def append_json(filename: str, record: dict) -> None:
    records = read_json(filename, default=[])
    records.append(record)
    write_json(filename, records)
