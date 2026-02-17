from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from authlib.integrations.starlette_client import OAuth

from app.database import Base, engine
from app.config import settings

from app.routers.predict_router import router as predict_router
from app.routers.auth_router import router as auth_router
from app.routers.review_router import router as review_router

# 🔥 สำคัญมาก ต้อง import model เพื่อให้ Base.metadata.create_all ทำงานครบ
from app.models.review import Review
from app.models.user import User


# =========================
# Create App
# =========================
app = FastAPI(
    title="Flower Veg Enterprise API",
    docs_url="/docs",
    redoc_url=None
)

print("GOOGLE_CLIENT_ID:", settings.GOOGLE_CLIENT_ID)
print("SECRET_KEY:", settings.SECRET_KEY)


# =========================
# 🔥 CORS MUST BE FIRST
# =========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",        # 🔥 เพิ่มตัวนี้
        "http://127.0.0.1:8000",        # 🔥 เพิ่มตัวนี้
        "https://your-frontend-domain.onrender.com",
    ],
    allow_credentials=True,   # 🔥 สำคัญมากสำหรับ cookie login
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================
# 🔥 Session Middleware AFTER CORS
# =========================
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SECRET_KEY,
    same_site="lax",     # local dev ใช้ lax ถูกต้อง
    https_only=False,    # เปลี่ยนเป็น True ตอน deploy https
)


# =========================
# OAuth Setup
# =========================
if not settings.GOOGLE_CLIENT_ID:
    raise ValueError("GOOGLE_CLIENT_ID is empty. Check .env.dev")

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
# 🔥 DEBUG COOKIE CHECK (เพิ่มเพื่อเช็คปัญหา)
# =========================
@app.get("/debug-cookie")
def debug_cookie(request):
    return {
        "cookies": request.cookies
    }


# =========================
# Database (สร้างตารางครบ)
# =========================
Base.metadata.create_all(bind=engine)


# =========================
# Routers (ไม่ลบของคุณ)
# =========================
app.include_router(predict_router)
app.include_router(auth_router)
app.include_router(review_router)


# =========================
# Health
# =========================
@app.get("/")
def root():
    return {"status": "API Running"}


@app.get("/ping")
def ping():
    return {"pong": True}
