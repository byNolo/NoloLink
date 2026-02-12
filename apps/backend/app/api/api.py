from fastapi import APIRouter
from app.api.endpoints import auth, links, users

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(links.router, prefix="/links", tags=["links"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
