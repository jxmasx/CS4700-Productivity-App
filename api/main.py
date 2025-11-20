import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from dotenv import load_dotenv

from auth import router as auth_router
from tasks import router as tasks_router
from economy import router as economy_router
from quests import router as quests_router
from qcalendar import router as calendar_router
from googlecalendar import router as googlecalendar_router

load_dotenv()

API = FastAPI(title="Questify API", version="0.1.0")

API.add_middleware(SessionMiddleware, secret_key="change-this-secret")

API.add_middleware(
    CORSMiddleware,
    allow_origins=["https://jxmasx.github.io"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@API.get("/api/health")
def health():
    return {"ok": True}

API.include_router(auth_router)
API.include_router(tasks_router)
API.include_router(economy_router)
API.include_router(quests_router)
API.include_router(calendar_router)
API.include_router(googlecalendar_router)


if __name__ == "__main__":
    import uvicorn
    import traceback
    import logging

    # Enable logging
    logging.basicConfig(level=logging.INFO)
    
    try:
        uvicorn.run(API, host="0.0.0.0", port=5000, log_level="info")
    except Exception as e:
        print("\nError occurred:")
        traceback.print_exc()