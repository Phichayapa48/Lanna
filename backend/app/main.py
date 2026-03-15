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
# 2. CORS Setup (หัวใจสำคัญของการเชื่อมต่อ)
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
    allow_credentials=True, # ✅ จำเป็นสำหรับ OAuth flow
    allow_methods=["*"],
    allow_headers=["*"],    # ✅ สำคัญ: ต้องอนุญาต headers ทั้งหมดเพื่อให้ส่ง Authorization: Bearer ได้
)

# =========================
# 3. Session Middleware
# =========================
# ใช้สำหรับเก็บ 'state' ตอนทำ Google Login ชั่วคราว
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SECRET_KEY,
    same_site="none",  
    https_only=True,   # ✅ บน Render ต้องเป็น True เสมอ
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

# ✅ เก็บ oauth ไว้ใน state เพื่อให้ auth_router เรียกใช้ได้
app.state.oauth = oauth

# =========================
# 5. Database Initial
# =========================
@app.on_event("startup")
def on_startup():
    try:
        # สร้าง Table ตาม Models ที่เรา Import มา (User, Review ฯลฯ)
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
# 7. Routers (จัดกลุ่มให้ Frontend ใช้ง่าย)
# =========================

# กลุ่ม API หลัก (Predict, Reviews)
app.include_router(predict_router, prefix="/api/v1", tags=["Prediction"])
app.include_router(review_router, prefix="/api/v1", tags=["Reviews"])

# กลุ่ม Auth (Google Login)
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])

# ✅ กันเหนียว: เผื่อ Frontend เรียก Review แบบไม่มี /api/v1
app.include_router(review_router, prefix="/reviews", tags=["Reviews Legacy"])
# ✅ กันเหนียว: เผื่อเรียก Predict แบบตรงๆ
app.include_router(predict_router, prefix="/predict", tags=["Prediction Legacy"])
