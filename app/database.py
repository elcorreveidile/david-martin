from __future__ import annotations

import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

_DB_PATH = Path(__file__).resolve().parent.parent / "reservations.db"


def set_db_path(path: Path) -> None:
    global _DB_PATH
    _DB_PATH = path
    _DB_PATH.parent.mkdir(parents=True, exist_ok=True)


def _ensure_directory() -> None:
    _DB_PATH.parent.mkdir(parents=True, exist_ok=True)


def connect() -> sqlite3.Connection:
    _ensure_directory()
    conn = sqlite3.connect(_DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


@contextmanager
def get_connection() -> Iterator[sqlite3.Connection]:
    conn = connect()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
