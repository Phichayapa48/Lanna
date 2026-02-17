import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

/* =============================================
   ✅ ใช้ค่าจาก .env.local เพื่อรองรับ Render
   ============================================= */
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function Reviews() {
  const router = useRouter();
  const { class: className } = router.query;

  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  const normalizedClass =
    typeof className === "string"
      ? className
      : Array.isArray(className)
      ? className[0]
      : undefined;

  useEffect(() => {
    if (!router.isReady) return;

    setLoading(true);

    // ✅ ปรับ URL ให้ตรงกับโครงสร้าง Backend
    const url = normalizedClass
      ? `${API}/reviews/class/${encodeURIComponent(normalizedClass)}`
      : `${API}/reviews/all/list`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("โหลดข้อมูลไม่สำเร็จ");
        return res.json();
      })
      .then((data) => {
        setReviews(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setLoading(false);
      });
  }, [router.isReady, normalizedClass]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-700 text-white px-6 py-16">
      <div className="max-w-4xl mx-auto">

        {/* 🔙 ปุ่มกลับหน้าแรก */}
        <Link
          href="/"
          className="inline-block mb-8 bg-white/10 hover:bg-white/20 px-5 py-2 rounded-xl text-sm transition border border-white/5"
        >
          ← กลับหน้าแรก
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center text-green-200">
          {normalizedClass ? `รีวิวของ "${normalizedClass}"` : "รีวิวผักพื้นเมืองทั้งหมด"}
        </h1>

        {normalizedClass && (
          <div className="text-center mb-10">
            <Link
              href="/reviews"
              className="bg-yellow-400 hover:bg-yellow-500 text-black px-6 py-2 rounded-xl text-sm font-bold transition shadow-lg inline-block"
            >
              แสดงรีวิวผักทุกชนิด
            </Link>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
            <p className="text-green-200 animate-pulse">กำลังดึงข้อมูลรีวิวจากระบบ...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-20 bg-black/10 rounded-3xl border border-dashed border-white/20">
            <p className="text-green-200 italic text-lg">ยังไม่มีรีวิวสำหรับรายการนี้ในขณะนี้</p>
          </div>
        ) : (
          <div className="space-y-8">
            {reviews.map((r) => {
              const lat = r.latitude != null ? Number(r.latitude) : null;
              const lng = r.longitude != null ? Number(r.longitude) : null;

              return (
                <div
                  key={r.id}
                  className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 md:p-8 rounded-3xl shadow-xl transition-all hover:bg-white/15"
                >
                  {/* Header: ชื่อผัก + ดาว */}
                  <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                    <h2 className="text-2xl font-bold text-green-300">
                      {r.class_name}
                    </h2>
                    <div className="text-yellow-400 text-xl tracking-widest bg-black/20 px-4 py-1 rounded-full">
                      {"★".repeat(r.rating)}
                      <span className="opacity-30">{"★".repeat(5 - r.rating)}</span>
                    </div>
                  </div>

                  {/* ข้อความรีวิว */}
                  <div className="bg-black/10 p-4 rounded-2xl mb-4">
                    <p className="text-green-50 text-lg leading-relaxed italic">
                      "{r.review_text}"
                    </p>
                  </div>

                  {/* ข้อมูลผู้รีวิว */}
                  <div className="flex items-center gap-2 text-sm text-green-300/80 mb-6 font-light">
                    <span>👤 โดย {r.username || r.full_name || "ผู้ใช้ทั่วไป"}</span>
                    <span>•</span>
                    <span>📅 {new Date(r.created_at).toLocaleDateString("th-TH", {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}</span>
                  </div>

                  {/* ส่วนแสดงแผนที่ */}
                  {lat !== null && lng !== null && (
                    <div className="mt-4">
                      <button
                        onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                        className={`px-5 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 shadow-md ${
                          expanded === r.id ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
                        }`}
                      >
                        {expanded === r.id ? "🔼 ปิดแผนที่" : "📍 ดูพิกัดที่พบเจอ"}
                      </button>

                      {expanded === r.id && (
                        <div className="mt-5 space-y-4 animate-fadeIn">
                          {r.place_name && (
                            <div className="text-green-200 font-medium flex items-center gap-2 bg-white/5 p-3 rounded-lg border border-white/10">
                              <span className="text-xl">📍</span> {r.place_name}
                            </div>
                          )}

                          <div className="overflow-hidden rounded-2xl border-2 border-white/20 shadow-2xl bg-gray-800 h-[250px] relative">
                            {process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ? (
                              <img
                                src={`https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=800x400&markers=color:red|label:V|${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}`}
                                className="w-full h-full object-cover"
                                alt="Location Map"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full text-red-300 p-10 text-center">
                                ⚠️ กรุณาตั้งค่า Google Maps Key ใน .env เพื่อแสดงแผนที่
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-3">
                            <button
                              onClick={() => window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank")}
                              className="bg-emerald-600 hover:bg-emerald-700 px-6 py-2 rounded-xl font-bold transition flex items-center gap-2 text-sm shadow-lg"
                            >
                              🧭 นำทางด้วย Google Maps
                            </button>
                            <span className="text-xs text-green-400/60 flex items-center font-mono">
                              Coordinates: {lat.toFixed(5)}, {lng.toFixed(5)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <footer className="mt-20 text-center text-green-400/50 text-xs">
        LannaVeg Project | University of Phayao
      </footer>
    </div>
  );
}
