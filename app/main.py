import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.databaseConfig import Base, engine
from contextlib import contextmanager
from app.database import getDatabase
from app.routers.views import updateModelsAndProviders

from app.routers import api_router

PROJECT_NAME = os.getenv("PROJECT_NAME", "AI Environmental Impact Tracker")
API_V1_STR = "/api/v1"

Base.metadata.create_all(bind=engine)

ALLOWED_ORIGINS = [
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

app = FastAPI(
    title=PROJECT_NAME,
    version="1.0.0",
    openapi_url=f"{API_V1_STR}/openapi.json"
)

app.include_router(api_router, prefix="/api/v1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.get("/", tags=["Health Check"])
async def root():
    return {
        "status": "healthy",
        "project": PROJECT_NAME,
        "docs_url": "/docs"
    }

#on server startup, update data immedietelly
with contextmanager(getDatabase)() as db:
    try:
        updateModelsAndProviders(db)
        print("Database sync complete.", flush=True)
    except Exception as e:
        print(f"Error during sync: {e}", flush=True)
        db.rollback()