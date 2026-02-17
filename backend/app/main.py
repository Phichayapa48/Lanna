import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from authlib.integrations.starlette_client import OAuth

from app.database import Base, engine
from app.config import settings

# Routers
from app.routers.predict_router import router as predict_router
from app.routers.auth_router import router as auth_router
from app.routers.review_router import router as review_router

# Models (ต้อง import เพื่อให้ SQLAlchemy รู้จัก table)
from app.models.review import Review
from app.models.user import User

# =========================
# 1. Create App
# =========================
app = FastAPI(
    title="Flower Veg Enterprise API",
    docs_url="/docs",
    redoc_url=None
)

# =========================
# 2. CORS Setup
# =========================
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    FRONTEND_URL,
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# 3. Session Middleware
# =========================
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SECRET_KEY,
    same_site="lax",
    https_only=True,   # Render เป็น HTTPS
)

# =========================
# 4. OAuth Setup
# =========================
if not settings.GOOGLE_CLIENT_ID:
    print("⚠️ WARNING: GOOGLE_CLIENT_ID is missing!")

oauth = OAuth()
oauth.register(
    name="google",
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)

app.state.oauth = oauth

# =========================
# 5. Database Initial (สำคัญมาก)
# =========================
# ❌ ห้าม create_all ตอน import
# ✅ ย้ายมารันตอน startup แทน
@app.on_event("startup")
def on_startup():
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables checked/created")
    except Exception as e:
        print(f"❌ Database init failed: {e}")

# =========================
# 6. Routes & Endpoints
# =========================
@app.get("/")
def root():
    return {
        "status": "API Running",
        "environment": "Production" if os.getenv("RENDER") else "Local"
    }

@app.get("/ping")
def ping():
    return {"pong": True}

@app.get("/debug-cookie")
def debug_cookie(request: Request):
    return {
        "cookies": request.cookies,
        "session": request.session if "session" in request.scope else "no session"
    }

# =========================
# 7. Routers
# =========================
app.include_router(predict_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/auth")
app.include_router(review_router, prefix="/api/v1")
