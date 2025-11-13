import sqlite3
from contextlib import contextmanager

DB_PATH = "./calendar_local.db"

@contextmanager
def db_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def init_schema():
    with db_conn() as c:
        c.execute("""
            CREATE TABLE IF NOT EXISTS local_calendar_events(
                id TEXT PRIMARY KEY,
                title TEXT,
                start TEXT,
                end TEXT,
                description TEXT,
                created_at TEXT
            )
        """)
        c.commit()

init_schema()
