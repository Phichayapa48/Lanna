import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";

// ✅ ดึงค่าจาก ENV เพื่อรองรับทั้ง Local และ Render
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");
const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

export default function ReviewMap() {
  const router = useRouter();
  const { review_id, class: className } = router.query;

  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [placeName, setPlaceName] = useState("");
  const [loading, setLoading] = useState(false);

  // 📍 1. ดึงตำแหน่งปัจจุบันจาก Browser
  useEffect(() => {
    if (!navigator.geolocation) {
      alert("เบราว์เซอร์ของคุณไม่รองรับการระบุตำแหน่ง");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
      },
      (err) => {
        console.error(err);
        alert("ไม่สามารถดึงตำแหน่งได้ กรุณาเปิด GPS และอนุญาตสิทธิ์การเข้าถึง");
      },
      { enableHighAccuracy: true }
    );
  }, []);

  // 💾 2. ฟังก์ชันส่งข้อมูลไปบันทึกที่ Backend
  const handleSaveLocation = async () => {
    if (!review_id || lat == null || lng == null) {
      alert("ข้อมูลไม่ครบ หรือยังดึงพิกัดไม่ได้");
      return;
    }

    try {
      setLoading(true);

      // พยายามเรียกไปที่ /api/v1/ ก่อน ถ้าไม่ได้ค่อยลองแบบไม่มี prefix
      const url = `${API_BASE}/api/v1/reviews/${review_id}/location`;
      
      let res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
          place_name: placeName || "พิกัดจากผู้ใช้",
        }),
      });

      // 🔄 Fallback: ถ้า 404 ให้ลอง path ของเพื่อนที่ไม่มี api/v1
      if (res.status === 404) {
        res = await fetch(`${API_BASE}/reviews/${review_id}/location`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            latitude: lat,
            longitude: lng,
            place_name: placeName,
          }),
        });
      }

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "บันทึกไม่สำเร็จ");
      }

      alert("บันทึกพิกัดเรียบร้อย!");

      // ✅ Redirect ไปหน้ารวมรีวิว
      if (className) {
        router.push(`/reviews?class=${className}`);
      } else {
        router.push("/reviews");
      }

    } catch (error: any) {
      alert(error.message || "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-700 text-white flex items-center justify-center px-6 py-16">
      <div className="bg-white/10 backdrop-blur-xl p-8 md:p-10 rounded-3xl shadow-2xl space-y-6 w-full max-w-lg border border-white/20">
        
        <Link
          href="/"
          className="inline-block bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-sm transition border border-white/5"
        >
          ← กลับหน้าแรก
        </Link>

        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-green-300">
            📍 ปักหมุดสถานที่รีวิว
          </h1>
          <p className="text-sm text-green-100/70">
            ระบบจะบันทึกพิกัดที่คุณอยู่ปัจจุบัน เพื่อแชร์ให้ผู้อื่นทราบ
          </p>
        </div>

        {/* 🗺️ Preview แผนที่ (Static Map) */}
        {lat && lng && GOOGLE_MAPS_KEY ? (
          <div className="rounded-2xl overflow-hidden border-2 border-white/20 shadow-lg h-48 bg-slate-800">
            <img
              src={`https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=600x300&markers=color:red|${lat},${lng}&key=${GOOGLE_MAPS_KEY}`}
              alt="Map Preview"
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="h-48 bg-black/20 rounded-2xl flex items-center justify-center border border-dashed border-white/20 animate-pulse">
            <p className="text-sm text-green-200/50 italic">กำลังค้นหาพิกัด GPS...</p>
          </div>
        )}

        {lat && lng && (
          <div className="text-[10px] font-mono text-center bg-black/20 py-2 rounded-lg text-green-400">
            LAT: {lat.toFixed(6)} | LNG: {lng.toFixed(6)}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm ml-1 text-green-200">ระบุชื่อสถานที่ (Optional)</label>
          <input
            placeholder="เช่น ตลาดสดพะเยา, หลังบ้าน..."
            value={placeName}
            onChange={(e) => setPlaceName(e.target.value)}
            className="w-full p-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 outline-none focus:ring-2 ring-green-500 transition"
          />
        </div>

        <button
          onClick={handleSaveLocation}
          disabled={loading || !lat}
          className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-4 rounded-2xl font-bold text-lg transition shadow-xl active:scale-95 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              กำลังบันทึก...
            </>
          ) : (
            "✅ ยืนยันพิกัดและบันทึก"
          )}
        </button>

        <p className="text-[10px] text-center text-white/40 italic">
          * พิกัดนี้จะถูกนำไปแสดงในหน้าแผนที่รวมผักพื้นเมือง
        </p>
      </div>
    </div>
  );
}
