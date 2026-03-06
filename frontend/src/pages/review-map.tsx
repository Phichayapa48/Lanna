import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";

// ✅ 1. ตั้งค่า API และดึง KEY (ต้องชื่อนี้เท่านั้นถึงจะรันบน Render ได้)
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");
const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

export default function ReviewMap() {

  const router = useRouter();
  const { review_id, class: className } = router.query;

  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [placeName, setPlaceName] = useState("");
  const [loading, setLoading] = useState(false);

  // 📍 ดึงตำแหน่งปัจจุบัน
  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
      },
      () => {
        alert("ไม่สามารถดึงตำแหน่งได้");
      },
      { enableHighAccuracy: true }
    );
  }, []);

  const handleSaveLocation = async () => {

    if (!review_id || lat == null || lng == null) {
      alert("ข้อมูลไม่ครบ");
      return;
    }

    try {
      setLoading(true);

      // ✅ 2. ปรับ URL ให้เรียกผ่าน /api/v1 ตามมาตรฐาน Backend
      const res = await fetch(`${API_BASE}/api/v1/reviews/${review_id}/location`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
          place_name: placeName,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.detail || "บันทึกไม่สำเร็จ");
        return;
      }

      alert("บันทึกพิกัดเรียบร้อย!");
      if (className) {
        router.push(`/reviews?class=${className}`);
      } else {
        router.push("/reviews");
      }

    } catch {
      alert("เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-700 text-white flex items-center justify-center px-6 py-16">

      <div className="bg-white/10 backdrop-blur-xl p-10 rounded-3xl shadow-2xl space-y-6 w-full max-w-lg border border-white/20">

        <Link
          href="/"
          className="inline-block bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-sm transition"
        >
          ← กลับหน้าแรก
        </Link>

        <h1 className="text-2xl font-bold text-center">
          📍 ปักหมุดสถานที่รีวิว
        </h1>

        {/* 🗺️ 3. ส่วนแสดงแผนที่ (เพิ่ม <img> กลับเข้าไปเพื่อให้รูปขึ้น) */}
        <div className="rounded-2xl overflow-hidden border border-white/20 h-48 bg-slate-800 flex items-center justify-center">
          {lat && lng && GOOGLE_MAPS_KEY ? (
            <img
              src={`https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=600x300&markers=color:red|${lat},${lng}&key=${GOOGLE_MAPS_KEY}`}
              alt="Map Preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center p-4 italic text-white/40 text-sm">
              {lat ? "กำลังโหลดรูปแผนที่..." : "กำลังค้นหาพิกัด GPS..."}
            </div>
          )}
        </div>

        {lat && lng && (
          <div className="text-sm text-green-300 text-center font-mono">
            Lat: {lat.toFixed(6)} | Lng: {lng.toFixed(6)}
          </div>
        )}

        <input
          placeholder="ชื่อสถานที่ เช่น ตลาดสด"
          value={placeName}
          onChange={(e) => setPlaceName(e.target.value)}
          className="w-full p-3 rounded-xl text-black outline-none focus:ring-2 ring-green-500"
        />

        <button
          onClick={handleSaveLocation}
          disabled={loading || !lat}
          className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 px-6 py-3 rounded-xl font-semibold transition"
        >
          {loading ? "กำลังบันทึก..." : "บันทึกตำแหน่ง"}
        </button>

      </div>
    </div>
  );
}
