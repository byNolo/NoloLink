from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.api import api_router
from app.api.endpoints import redirect

app = FastAPI(title=settings.PROJECT_NAME, version=settings.PROJECT_VERSION)

# CORS
origins = [
    settings.FRONTEND_URL,
    "http://localhost:3070", # Keep localhost for safety
    "http://localhost:5173", # Keep default vite port for safety
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")
app.include_router(redirect.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to NoloLink API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=3071, reload=True)
