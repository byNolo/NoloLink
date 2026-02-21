from fastapi import APIRouter
from app.api.endpoints import auth, links, users, verify, campaigns, export, audit, organizations

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(links.router, prefix="/links", tags=["links"])
api_router.include_router(campaigns.router, prefix="/campaigns", tags=["campaigns"])
api_router.include_router(verify.router, prefix="/verify", tags=["verify"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(export.router, prefix="/export", tags=["export"])
api_router.include_router(audit.router, prefix="/audit", tags=["audit"])
api_router.include_router(organizations.router, prefix="/orgs", tags=["organizations"])

