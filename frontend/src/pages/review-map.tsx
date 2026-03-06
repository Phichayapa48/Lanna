import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";

// ✅ แก้ไข: ดึงค่าจาก Environment Variable เพื่อให้ใช้งานได้ทั้ง Local และ Render
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");

export default function ReviewMap() {

  const router = useRouter();
  const { review_id, class: className } = router.query;

  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [placeName, setPlaceName] = useState("");
  const [loading, setLoading] = useState(false);

  // 📍 ดึงตำแหน่งปัจจุบัน
  useEffect(() => {
    if (!navigator.geolocation) {
      alert("เบราว์เซอร์ไม่รองรับ Geolocation");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
      },
      () => {
        alert("ไม่สามารถดึงตำแหน่งได้ กรุณาเปิดสิทธิ์ GPS");
      },
      { enableHighAccuracy: true } // เพิ่มเพื่อให้พิกัดแม่นยำขึ้น
    );
  }, []);

  const handleSaveLocation = async () => {

    if (!review_id || lat == null || lng == null) {
      alert("ข้อมูลพิกัดยังไม่พร้อม");
      return;
    }

    try {
      setLoading(true);

      // ✅ แก้ไข: พยายามเรียกผ่าน /api/v1/ ก่อน
      const url = `${API_BASE}/api/v1/reviews/${review_id}/location`;
      
      let res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // สำคัญมาก: เพื่อส่งคุกกี้กุญแจ (access_token) ไปด้วย
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
          place_name: placeName || "พิกัดจากผู้ใช้",
        }),
      });

      // 🔄 Fallback: ถ้า 404 ให้ลอง Path ปกติ (เผื่อพี่แป๊ปยังไม่แก้ Router)
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
        const err = await res.json();
        alert(err.detail || "บันทึกไม่สำเร็จ");
        return;
      }

      alert("บันทึกพิกัดเรียบร้อย!");

      // ✅ redirect ไปหน้ารวมรีวิว พร้อม filter class
      if (className) {
        router.push(`/reviews?class=${className}`);
      } else {
        router.push("/reviews");
      }

    } catch (error) {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
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

        {lat && lng && (
          <div className="text-sm text-green-300 text-center">
            Lat: {lat.toFixed(6)} | Lng: {lng.toFixed(6)}
          </div>
        )}

        <input
          placeholder="ชื่อสถานที่ เช่น ตลาดสด"
          value={placeName}
          onChange={(e) => setPlaceName(e.target.value)}
          className="w-full p-3 rounded-xl text-black"
        />

        <button
          onClick={handleSaveLocation}
          disabled={loading || !lat}
          className="w-full bg-green-500 hover:bg-green-600 px-6 py-3 rounded-xl font-semibold transition disabled:opacity-50"
        >
          {loading ? "กำลังบันทึก..." : "บันทึกตำแหน่ง"}
        </button>

      </div>
    </div>
  );
}
