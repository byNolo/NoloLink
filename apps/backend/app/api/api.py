from fastapi import APIRouter
from app.api.endpoints import auth, links, users, verify, campaigns

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(links.router, prefix="/links", tags=["links"])
api_router.include_router(campaigns.router, prefix="/campaigns", tags=["campaigns"])
api_router.include_router(verify.router, prefix="/verify", tags=["verify"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
