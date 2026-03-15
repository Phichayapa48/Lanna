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

# =========================
# 1. Create App
# =========================
app = FastAPI(
    title="Flower Veg Enterprise API",
    docs_url="/docs",
    redoc_url=None
)

# =========================
# 2. CORS Setup (หัวใจสำคัญของการเชื่อมต่อมือถือและเว็บ)
# =========================
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://lanna-frontend.onrender.com", 
    FRONTEND_URL,
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True, # ✅ จำเป็นสำหรับ Google OAuth
    allow_methods=["*"],
    allow_headers=["*"],    # ✅ สำคัญ: เพื่อให้มือถือส่ง Authorization Header ได้
)

# =========================
# 3. Session Middleware
# =========================
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SECRET_KEY,
    same_site="none",  
    https_only=True,   # ✅ บน Render/Production ต้องเป็น True เสมอเพื่อความปลอดภัย
)

# =========================
# 4. OAuth Setup
# =========================
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
# 5. Database Initial
# =========================
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
        "environment": "Production" if os.getenv("RENDER") else "Local",
        "frontend_target": FRONTEND_URL
    }

@app.get("/ping")
def ping():
    return {"pong": True}

# =========================
# 7. Routers (จัดกลุ่มรองรับทั้ง Mobile และ Web)
# =========================

# ✅ กลุ่มหลักที่ใช้ในหน้า classify.tsx (Standard Path)
app.include_router(predict_router, prefix="/api/v1", tags=["Prediction"])
app.include_router(review_router, prefix="/api/v1", tags=["Reviews"])

# ✅ กลุ่ม Auth
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])

# ✅ Legacy Paths (กันเหนียว เผื่อโค้ดเก่าส่วนอื่นยังเรียกใช้)
app.include_router(review_router, prefix="/reviews", tags=["Reviews Legacy"])
app.include_router(predict_router, prefix="/predict", tags=["Prediction Legacy"])
