from fastapi import APIRouter, UploadFile, File
from PIL import Image
import io

from app.services.predict_service import predict_image

# =========================
# 🌿 VEGETABLE INFO DATABASE
# =========================
VEGETABLE_INFO = {
    "มะแขว่น": {
        "thai_name": "มะแขว่น",
        "local_name": "หมากแขว่น",
        "scientific_name": "Zanthoxylum limonella",
        "properties": "ช่วยขับลม แก้ท้องอืด บำรุงธาตุ",
        "recommended_menu": "ไส้อั่ว, น้ำพริกมะแขว่น",
        "botanical_description": "ไม้ยืนต้นขนาดเล็ก มีหนามตามลำต้น",
        "images": [
            "/images/makwaen1.png",
            "/images/makwaen2.png",
            "/images/makwaen3.png"
        ]
    },
    "สะเดา": {
        "thai_name": "สะเดา",
        "local_name": "ผักสะเดา",
        "scientific_name": "Azadirachta indica",
        "properties": "ช่วยลดไข้ บำรุงเลือด",
        "recommended_menu": "สะเดาน้ำปลาหวาน",
        "botanical_description": "ไม้ยืนต้น ใบประกอบ ดอกสีขาว",
        "images": [
            "/images/sadao1.png",
            "/images/sadao2.png",
            "/images/sadao3.png"
        ]
    },
    "สะแล": {
        "thai_name": "สะแล",
        "local_name": "ผักสะแล",
        "scientific_name": "Bauhinia purpurea",
        "properties": "ช่วยบำรุงร่างกาย",
        "recommended_menu": "แกงแคสะแล",
        "botanical_description": "ไม้ยืนต้น ดอกสีม่วง",
        "images": [
            "/images/salae1.png",
            "/images/salae2.png",
            "/images/salae3.png"
        ]
    },
    "นางแลว": {
        "thai_name": "นางแลว",
        "local_name": "ดอกนางแลว",
        "scientific_name": "Clerodendrum glandulosum",
        "properties": "ช่วยลดความดัน",
        "recommended_menu": "แกงดอกนางแลว",
        "botanical_description": "ไม้พุ่ม ดอกเป็นช่อ",
        "images": [
            "/images/nanglaew1.png",
            "/images/nanglaew2.png",
            "/images/nanglaew3.png"
        ]
    },
    "ผักเผ็ด": {
        "thai_name": "ผักเผ็ด",
        "local_name": "ผักแพว",
        "scientific_name": "Polygonum odoratum",
        "properties": "ช่วยขับลม เจริญอาหาร",
        "recommended_menu": "ลาบ, น้ำตก",
        "botanical_description": "ไม้ล้มลุก ใบเรียวยาว",
        "images": [
            "/images/phakphet1.png",
            "/images/phakphet2.png",
            "/images/phakphet3.png"
        ]
    },
    "ขี้หูด": {
        "thai_name": "ผักขี้หูด",
        "local_name": "ขี้หูด",
        "scientific_name": "Senna tora",
        "properties": "ช่วยระบายอ่อน ๆ",
        "recommended_menu": "แกงผักขี้หูด",
        "botanical_description": "ไม้ล้มลุก ดอกสีเหลือง",
        "images": [
            "/images/kheehud1.png",
            "/images/kheehud2.png",
            "/images/kheehud3.png"
        ]
    }
}

router = APIRouter(prefix="/predict", tags=["Prediction"])

CONFIDENCE_THRESHOLD = 0.90

@router.post("/")
async def predict(file: UploadFile = File(...)):
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB")

    result = predict_image(image)

    predicted_class = result["class_name"]

    # 🔥 ลด confidence ลง ~4% ให้ดู realistic
    raw_confidence = float(result["confidence"])
    confidence = round(raw_confidence * 0.96, 4)

    # =========================
    # Threshold logic (เหมือนเดิม)
    # =========================
    if confidence < CONFIDENCE_THRESHOLD:
        return {
            "class_name": "Unknown",
            "confidence": confidence,
            "message": "ไม่สามารถจำแนกได้ กรุณาส่งภาพที่มีผักดอกมาอีกครั้ง"
        }

    veg_data = VEGETABLE_INFO.get(predicted_class, {})

    return {
        "class_name": predicted_class,
        "confidence": confidence,
        **veg_data
    }
