# from cs4700 folder: python -m PyInstaller --add-data "db/questify.db;db" --onefile api/main.py --distpath ap

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from auth import router as auth_router
# from quests import router as quests_router

load_dotenv()

API = FastAPI(title="Questify API", version="0.1.0")

API.add_middleware(
    CORSMiddleware,
    # allow_origins=[os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")],
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@API.get("/api/health")
def health():
    return {"ok": True}

API.include_router(auth_router)
# API.include_router(quests_router)

if __name__ == "__main__":
    import uvicorn
    import traceback

    try:
        uvicorn.run(API, host="0.0.0.0", port=5000,
                    ssl_keyfile="key.pem", ssl_certfile="cert.pem",)
    except Exception as e:
        print("\nError occurred:")
        traceback.print_exc()