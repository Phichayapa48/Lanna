from fastapi import APIRouter, Request, HTTPException, Depends, Header
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
    oauth = request.app.state.oauth
    redirect_uri = request.url_for("auth_callback")
    return await oauth.google.authorize_redirect(request, redirect_uri)

# =========================
# Google Callback (เปลี่ยนเป็นส่ง Token ผ่าน URL)
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

        user = db.query(User).filter(User.email == user_info["email"]).first()

        if not user:
            user = User(
                email=user_info["email"],
                full_name=user_info.get("name"),
                google_id=user_info.get("sub"),
                password=None
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        # 1. สร้าง JWT Token
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
# GET CURRENT USER (เปลี่ยนมาเช็คจาก Header)
# =========================
def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
):
    # ✅ อ่าน Token จาก Header: Authorization: Bearer <token>
    auth_header = request.headers.get("Authorization")
    
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")

    token = auth_header.split(" ")[1]
    payload = verify_token(token)
    
    if not payload:
        raise HTTPException(status_code=401, detail="Token expired or invalid")

    user = db.query(User).filter(User.email == payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "user": {
            "email": current_user.email,
            "full_name": current_user.full_name,
            "role": current_user.role
        }
    }

# =========================
# Logout (แบบ Token-based)
# =========================
@router.get("/logout")
def logout():
    # ฝั่ง Backend แค่ส่งกลับไปหน้าแรก 
    # หน้าที่ลบ Token จริงๆ จะอยู่ที่ Frontend (localStorage.removeItem)
    return RedirectResponse(url=settings.FRONTEND_URL)
