from fastapi import APIRouter, Request, HTTPException, Cookie, Depends
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
# Google Callback
# =========================
@router.get("/google/callback", name="auth_callback")
async def auth_callback(request: Request):
    db = SessionLocal()

    try:
        oauth = request.app.state.oauth
        token = await oauth.google.authorize_access_token(request)
        user_info = token.get("userinfo")

        if not user_info:
            raise HTTPException(
                status_code=400,
                detail="ไม่สามารถดึงข้อมูลจาก Google ได้"
            )

        user = db.query(User).filter(
            User.email == user_info["email"]
        ).first()

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

        jwt_token = create_access_token({"sub": user.email})

        response = RedirectResponse(
            url=settings.FRONTEND_URL,
            status_code=302
        )

        response.set_cookie(
            key="access_token",
            value=jwt_token,
            httponly=True,
            secure=False,  # True เมื่อ deploy HTTPS
            samesite="lax",
            path="/"
        )

        return response

    finally:
        db.close()


# =========================
# 🔥 JWT Dependency (แก้ไขภาษาไทย)
# =========================
def get_current_user(
    access_token: str = Cookie(None),
    db: Session = Depends(get_db)
):
    if not access_token:
        raise HTTPException(
            status_code=401,
            detail="กรุณาเข้าสู่ระบบก่อนใช้งาน"
        )

    payload = verify_token(access_token)

    if not payload:
        raise HTTPException(
            status_code=401,
            detail="Session หมดอายุ กรุณาเข้าสู่ระบบใหม่"
        )

    user = db.query(User).filter(
        User.email == payload.get("sub")
    ).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="ไม่พบผู้ใช้งาน กรุณาเข้าสู่ระบบใหม่"
        )

    return user


# =========================
# GET CURRENT USER
# =========================
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
# Logout
# =========================
@router.get("/logout")
def logout():
    response = RedirectResponse(
        url=settings.FRONTEND_URL,
        status_code=302
    )

    response.delete_cookie("access_token", path="/")
    return response
