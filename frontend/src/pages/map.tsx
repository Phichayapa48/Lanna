import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function Map() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    /* =============================================
       ✅ แก้ให้ตรงกับ .env: NEXT_PUBLIC_GOOGLE_MAPS_KEY
       ============================================= */
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

    if (!apiKey) {
      setError("ไม่พบ Google Maps API Key ในระบบ (Check .env.local)");
      setLoading(false);
      return;
    }

    const initMap = () => {
      const google = (window as any).google;
      if (!google || !mapRef.current) return;

      // พิกัดเริ่มต้น (เชียงใหม่)
      const chiangMai = { lat: 18.7883, lng: 98.9853 };

      const map = new google.maps.Map(mapRef.current, {
        center: chiangMai,
        zoom: 12,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
      });

      // ปักหมุดเริ่มต้น
      new google.maps.Marker({
        position: chiangMai,
        map,
        title: "Chiang Mai",
        animation: google.maps.Animation.DROP,
      });

      setLoading(false);
    };

    // เช็คว่ามี script โหลดอยู่แล้วไหม
    if ((window as any).google) {
      initMap();
      return;
    }

    if (!document.getElementById("google-maps-script")) {
      const script = document.createElement("script");
      script.id = "google-maps-script";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      script.onerror = () => {
        setError("โหลด Google Maps ไม่สำเร็จ กรุณาเช็คอินเทอร์เน็ตหรือ API Key");
        setLoading(false);
      };

      document.head.appendChild(script);
    }
  }, []);

  return (
    <div className="h-screen w-full relative bg-gray-100">
      {/* ปุ่มย้อนกลับ */}
      <div className="absolute top-4 left-4 z-20">
        <Link
          href="/"
          className="bg-white/90 backdrop-blur px-4 py-2 rounded-xl shadow-lg text-green-700 font-bold hover:bg-green-50 transition flex items-center gap-2"
        >
          ← กลับหน้าแรก
        </Link>
      </div>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mx-auto mb-4"></div>
            <p className="text-lg font-semibold text-green-700 animate-pulse">
              🗺 กำลังโหลดแผนที่...
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50 z-10 px-6">
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-red-200 text-center">
            <p className="text-red-500 font-bold text-lg mb-2">เกิดข้อผิดพลาด</p>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      )}

      {/* พื้นที่แสดงแผนที่ */}
      <div ref={mapRef} className="h-full w-full" />
    </div>
  );
}
