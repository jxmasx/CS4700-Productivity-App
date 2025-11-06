from pathlib import Path
import sqlalchemy
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import sys
import os

def get_db_path():
    if getattr(sys, 'frozen', False):
        application_path = os.path.dirname(os.path.dirname(sys.executable))
    else:
        application_path = Path(__file__).resolve().parent.parent
    
    db_path = os.path.join(application_path, 'db', 'questify.db')
    return f"sqlite:///{db_path}"

# DB_PATH = f"sqlite:///{Path(__file__).resolve().parent.parent}/db/questify.db"
DB_PATH = get_db_path()
engine = create_engine(DB_PATH)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = sqlalchemy.orm.declarative_base()

# Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()