from fastapi import APIRouter

from app.routers.users import router as users_router

api_router = APIRouter()

api_router.include_router(users_router, prefix="/users", tags=["Users"])