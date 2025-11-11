from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .oauth import router as oauth_router
from .calendar_api import router as calendar_router
from .db import Base, engine 

app = FastAPI()

ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://questify.duckdns.org",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(oauth_router, prefix="/api")
app.include_router(calendar_router, prefix="/api")
