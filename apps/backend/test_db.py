from sqlalchemy import create_engine
from app.core.config import settings

print(f"Testing URL: {settings.DATABASE_URL}")
try:
    engine = create_engine(settings.DATABASE_URL)
    with engine.connect() as conn:
        print("Connection successful!")
except Exception as e:
    print(f"Connection failed: {e}")
    import traceback
    traceback.print_exc()
