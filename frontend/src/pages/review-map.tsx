import { useRouter } from "next/router";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
// ✅ ใช้ Library เพื่อให้แผนที่โต้ตอบได้
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");
const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "";

export default function ReviewMap() {

  const router = useRouter();
  const { review_id, class: className } = router.query;

  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [placeName, setPlaceName] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ โหลด Google Maps Script
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: GOOGLE_MAPS_KEY,
  });

  // 📍 ดึงตำแหน่งปัจจุบันครั้งแรก
  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
      },
      () => {
        alert("ไม่สามารถดึงตำแหน่งได้");
      }
    );
  }, []);

  // ✅ ฟังก์ชันเมื่อจิ้มบนแผนที่ให้หมุดขยับ
  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      setLat(e.latLng.lat());
      setLng(e.latLng.lng());
    }
  }, []);

  const handleSaveLocation = async () => {

    if (!review_id || lat == null || lng == null) {
      alert("ข้อมูลไม่ครบ");
      return;
    }

    // 🔑 ดึงกุญแจ (Token) ออกมาจากกระเป๋า (localStorage)
    const token = localStorage.getItem("access_token");
    if (!token) {
      alert("ไม่พบข้อมูลการเข้าสู่ระบบ กรุณา Login ใหม่อีกครั้ง");
      router.push("/auth");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/api/v1/reviews/${review_id}/location`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          // ✅ เพิ่มบรรทัดนี้เพื่อส่งกุญแจไปให้ Backend
          "Authorization": `Bearer ${token}` 
        },
        // credentials: "include", // มักใช้คู่กับ Cookie แต่ในที่นี้เราใช้ Bearer Token เป็นหลัก
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
          place_name: placeName,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        // 🚨 ถ้า Backend บอกว่า Token หมดอายุ หรือไม่ถูกต้อง
        if (res.status === 401) {
          alert("เซสชั่นหมดอายุ (Missing or invalid token) กรุณาเข้าสู่ระบบใหม่");
          router.push("/auth");
        } else {
          alert(err.detail || "บันทึกไม่สำเร็จ");
        }
        return;
      }

      if (className) {
        router.push(`/reviews?class=${className}`);
      } else {
        router.push("/reviews");
      }

    } catch {
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

        <div className="rounded-2xl overflow-hidden border border-white/20 h-48 bg-slate-800 flex items-center justify-center">
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: "100%" }}
              center={{ lat: lat || 19.0, lng: lng || 99.0 }}
              zoom={15}
              onClick={onMapClick}
              options={{ disableDefaultUI: true }}
            >
              {lat && lng && <Marker position={{ lat, lng }} draggable={true} />}
            </GoogleMap>
          ) : (
            <div className="text-center p-4 italic text-white/40 text-sm">
              {lat ? "กำลังโหลดแผนที่..." : "กำลังค้นหาพิกัด GPS..."}
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
          className="w-full p-3 rounded-xl text-black"
        />

        <button
          onClick={handleSaveLocation}
          disabled={loading}
          className="w-full bg-green-500 hover:bg-green-600 px-6 py-3 rounded-xl font-semibold transition disabled:opacity-50"
        >
          {loading ? "กำลังบันทึก..." : "บันทึกตำแหน่ง"}
        </button>

      </div>
    </div>
  );
}
