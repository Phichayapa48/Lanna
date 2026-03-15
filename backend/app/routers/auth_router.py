from fastapi import APIRouter, Request, HTTPException, Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.config import settings
from app.models.user import User
from app.database import SessionLocal, get_db
from app.utils.security import create_access_token, verify_token
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

# =========================
# Google Login Redirect
# =========================
@router.get("/google/login")
async def login_via_google(request: Request):
    # ดึงค่า oauth ที่เราตั้งค่าไว้ตอนเริ่มต้นแอป
    oauth = request.app.state.oauth
    redirect_uri = request.url_for("auth_callback")
    return await oauth.google.authorize_redirect(request, redirect_uri)

# =========================
# Google Callback (ส่ง Token ผ่าน URL)
# =========================
@router.get("/google/callback", name="auth_callback")
async def auth_callback(request: Request):
    db = SessionLocal()
    try:
        oauth = request.app.state.oauth
        token = await oauth.google.authorize_access_token(request)
        user_info = token.get("userinfo")

        if not user_info:
            return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=google_failed")

        # ตรวจสอบว่ามี User นี้ในระบบหรือยัง
        user = db.query(User).filter(User.email == user_info["email"]).first()

        if not user:
            # ถ้ายังไม่มี ให้ลงทะเบียนใหม่ (OAuth มักจะไม่มี password)
            user = User(
                email=user_info["email"],
                full_name=user_info.get("name"),
                google_id=user_info.get("sub"),
                password=None  # สำหรับผู้ใช้ที่สมัครผ่าน Google
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        # 1. ✅ สร้าง JWT Token (บัตรผ่านสำหรับ Frontend)
        jwt_token = create_access_token({"sub": user.email})

        # 2. ✅ ส่ง Token กลับไปที่หน้าพัก (เช่น /auth) ของ Frontend ทาง URL
        # วิธีนี้มือถือ Android/iOS จะไม่บล็อก เพราะไม่ใช่การฝังคุกกี้ข้ามโดเมน
        redirect_url = f"{settings.FRONTEND_URL}/auth?token={jwt_token}"
        
        return RedirectResponse(url=redirect_url)

    except Exception as e:
        logger.error(f"Auth Error: {e}")
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=exception")
    finally:
        db.close()

# =========================
# Dependency: ตรวจสอบตัวตนจาก Header
# =========================
def get_current_user(request: Request, db: Session = Depends(get_db)):
    # อ่านจาก Header: Authorization: Bearer <token>
    auth_header = request.headers.get("Authorization")
    
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=401, 
            detail="กรุณาเข้าสู่ระบบ (Missing or invalid token)"
        )

    token = auth_header.split(" ")[1]
    payload = verify_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=401, 
            detail="Session หมดอายุ กรุณาเข้าสู่ระบบใหม่"
        )

    user = db.query(User).filter(User.email == payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=401, detail="ไม่พบข้อมูลผู้ใช้งาน")

    return user

# =========================
# เส้นทางเช็คข้อมูลตัวเอง
# =========================
@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "user": {
            "email": current_user.email,
            "full_name": current_user.full_name,
            "role": getattr(current_user, "role", "user") # ป้องกันกรณีไม่มีฟิลด์ role
        }
    }

# =========================
# Logout (Redirect กลับเฉยๆ)
# =========================
@router.get("/logout")
def logout():
    # ฝั่ง Backend แค่ส่งกลับไปหน้าแรก 
    # หน้าที่ลบ Token จริงๆ จะอยู่ที่ Frontend (localStorage.removeItem)
    return RedirectResponse(url=settings.FRONTEND_URL)
