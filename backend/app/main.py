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

# Models (ต้อง Import เพื่อให้ SQLAlchemy สร้าง Table)
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
# 2. CORS Setup (ปรับให้ยืดหยุ่น)
# =========================
# ดึง URL จาก Environment Variable (ถ้ามี) หรือใส่เอง
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    FRONTEND_URL, # Domain ของเพื่อนบน Vercel/Render
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,   # จำเป็นสำหรับ Cookie / OAuth
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# 3. Session Middleware
# =========================
# บน Render เราจะได้ HTTPS มาฟรีๆ ดังนั้นต้องตั้งค่าให้รองรับ
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SECRET_KEY,
    same_site="lax",     
    https_only=True,     # เปลี่ยนเป็น True เพื่อความปลอดภัยบน Production
)

# =========================
# 4. OAuth Setup
# =========================
if not settings.GOOGLE_CLIENT_ID:
    # บน Render ถ้าลืมใส่ Env ตัวนี้ App จะพังทันที (ป้องกัน Bug)
    print("⚠️ WARNING: GOOGLE_CLIENT_ID is missing!")

oauth = OAuth()
oauth.register(
    name="google",
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={
        "scope": "openid email profile",
    }
)

app.state.oauth = oauth

# =========================
# 5. Database Initial
# =========================
# สร้างตารางอัตโนมัติ (เฉพาะตอนที่ยังไม่มี)
Base.metadata.create_all(bind=engine)

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

# รวม Router ต่างๆ
app.include_router(predict_router, prefix="/api/v1") # แนะนำให้ใส่ prefix เพื่อความเป็นระเบียบ
app.include_router(auth_router, prefix="/auth")
app.include_router(review_router, prefix="/api/v1")
