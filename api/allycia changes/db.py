# import sqlite3
# from contextlib import contextmanager
from pathlib import Path
import sqlalchemy
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# DB_PATH = Path(__file__).resolve().parent.parent / "db" / "questify.db"
# DB_PATH = "sqlite:///../db/questify.db"
DB_PATH = f"sqlite:///{Path(__file__).resolve().parent.parent}/db/questify.db"
engine = create_engine(DB_PATH)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = sqlalchemy.orm.declarative_base()

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# def _connect():
#     conn = sqlite3.connect(DB_PATH)
#     conn.row_factory = sqlite3.Row
#     conn.execute("PRAGMA foreign_keys = ON")
#     return conn

# @contextmanager
# def get_conn():
#     conn = _connect()
#     try:
#         yield conn
#     finally:
#         conn.close()