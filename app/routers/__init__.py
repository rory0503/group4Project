from fastapi import APIRouter

from app.routers.views import router as views_router
from app.routers.users import router as users_router

api_router = APIRouter()

api_router.include_router(views_router, prefix="/views", tags=["Views"])
api_router.include_router(users_router, prefix="/users", tags=["Users"])