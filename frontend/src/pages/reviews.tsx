import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

/* =============================================
   ✅ จัดการ API URL ให้สะอาด (ลบ / ท้ายสุดออกถ้ามี)
   ============================================= */
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");

export default function Reviews() {
  const router = useRouter();
  const { class: className } = router.query;

  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  // ทำให้ค่า className ชัวร์ว่าเป็น string
  const normalizedClass =
    typeof className === "string"
      ? className
      : Array.isArray(className)
      ? className[0]
      : undefined;

  useEffect(() => {
    // รอจนกว่า Router จะพร้อมดึง Query String
    if (!router.isReady) return;

    const fetchReviews = async () => {
      setLoading(true);
      
      /* ---------------------------------------------------------
         🛡️ ยุทธวิธีเรียกหลาย Endpoint เผื่อ Backend เปลี่ยน Path
         --------------------------------------------------------- */
      const endpoints = normalizedClass
        ? [
            `${API_BASE}/api/v1/reviews/class/${encodeURIComponent(normalizedClass)}`,
            `${API_BASE}/reviews/class/${encodeURIComponent(normalizedClass)}`
          ]
        : [
            `${API_BASE}/api/v1/reviews/all/list`,
            `${API_BASE}/reviews/all/list`,
            `${API_BASE}/api/v1/reviews/`,
            `${API_BASE}/reviews/`
          ];

      let success = false;
      for (const url of endpoints) {
        try {
          console.log(`Trying to fetch from: ${url}`);
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            // เช็คว่าข้อมูลที่ได้เป็น Array ไหม
            setReviews(Array.isArray(data) ? data : []);
            success = true;
            break; // ถ้าเจอแล้วให้หยุด Loop ทันที
          }
        } catch (err) {
          console.error(`Error fetching from ${url}:`, err);
        }
      }

      if (!success) {
        console.warn("Could not fetch reviews from any endpoint.");
        setReviews([]);
      }
      setLoading(false);
    };

    fetchReviews();
  }, [router.isReady, normalizedClass]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-700 text-white px-6 py-16">
      <div className="max-w-4xl mx-auto">

        {/* 🔙 ปุ่มย้อนกลับ */}
        <Link 
          href="/" 
          className="inline-block mb-8 bg-white/10 hover:bg-white/20 px-5 py-2 rounded-xl text-sm transition border border-white/5 shadow-sm"
        >
          ← กลับหน้าแรก
        </Link>

        {/* 🏷️ หัวข้อหน้า */}
        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center text-green-200 tracking-tight">
          {normalizedClass ? `รีวิวของ "${normalizedClass}"` : "รีวิวผักพื้นเมืองทั้งหมด"}
        </h1>

        {/* 🔄 ปุ่มสลับโหมดดูทั้งหมด */}
        {normalizedClass && (
          <div className="text-center mb-10">
            <Link 
              href="/reviews" 
              className="bg-yellow-400 hover:bg-yellow-500 text-black px-6 py-2 rounded-xl text-sm font-bold transition shadow-lg inline-block active:scale-95"
            >
              แสดงรีวิวผักทุกชนิด
            </Link>
          </div>
        )}

        {/* ⏳ ส่วนแสดงสถานะ Loading */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-b-4 border-green-300 mb-4"></div>
            <p className="text-green-200 animate-pulse text-lg">กำลังดึงพิกัดและรีวิวจากระบบ...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-24 bg-black/10 rounded-3xl border border-dashed border-white/20">
            <p className="text-green-200 italic text-xl opacity-60">ยังไม่มีรีวิวสำหรับรายการนี้ในขณะนี้</p>
          </div>
        ) : (
          /* 📝 รายการรีวิว */
          <div className="space-y-8 animate-fadeIn">
            {reviews.map((r) => {
              const lat = r.latitude != null ? Number(r.latitude) : null;
              const lng = r.longitude != null ? Number(r.longitude) : null;

              return (
                <div 
                  key={r.id} 
                  className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 md:p-8 rounded-3xl shadow-2xl transition-all hover:bg-white/15"
                >
                  {/* Header: ชื่อผัก + ให้ดาว */}
                  <div className="flex flex-wrap justify-between items-center gap-4 mb-5">
                    <h2 className="text-2xl font-bold text-green-300">{r.class_name}</h2>
                    <div className="text-yellow-400 text-xl tracking-widest bg-black/30 px-5 py-1.5 rounded-full shadow-inner">
                      {"★".repeat(r.rating)}
                      <span className="opacity-20">{"★".repeat(5 - r.rating)}</span>
                    </div>
                  </div>

                  {/* กล่องข้อความรีวิว */}
                  <div className="bg-black/20 p-5 rounded-2xl mb-5 border border-white/5">
                    <p className="text-green-50 text-lg leading-relaxed italic font-light">
                      "{r.review_text}"
                    </p>
                  </div>

                  {/* Metadata: ผู้รีวิวและวันที่ */}
                  <div className="flex items-center gap-3 text-sm text-green-300/70 mb-8 font-light italic">
                    <span className="flex items-center gap-1">👤 {r.username || r.full_name || "ผู้ใช้ทั่วไป"}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">📅 {new Date(r.created_at).toLocaleDateString("th-TH", {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}</span>
                  </div>

                  {/* 📍 ส่วนของพิกัดและแผนที่ */}
                  {lat !== null && lng !== null && (
                    <div className="mt-4 pt-6 border-t border-white/10">
                      <button
                        onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg active:scale-95 ${
                          expanded === r.id ? "bg-red-500 hover:bg-red-600" : "bg-emerald-500 hover:bg-emerald-600"
                        }`}
                      >
                        {expanded === r.id ? "🔼 ปิดแผนที่" : "📍 ดูพิกัดที่พบเจอ"}
                      </button>

                      {expanded === r.id && (
                        <div className="mt-6 space-y-4 animate-slideDown">
                          {r.place_name && (
                            <div className="text-green-100 font-medium flex items-center gap-2 bg-white/5 p-4 rounded-xl border border-white/10 shadow-sm">
                              <span className="text-xl">🏢</span> {r.place_name}
                            </div>
                          )}

                          {/* แผนที่ (Static Map หรือ Placeholder) */}
                          <div className="overflow-hidden rounded-2xl border-2 border-white/20 shadow-2xl bg-slate-800 h-[280px] relative group">
                            {process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ? (
                              <img
                                src={`https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=800x400&markers=color:red|label:V|${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}`}
                                className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                                alt="Location Map"
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center h-full text-red-300 p-10 text-center gap-2">
                                <span className="text-3xl">⚠️</span>
                                <p className="text-sm">ไม่สามารถโหลดแผนที่ได้ (ขาด API Key)</p>
                                <p className="text-[10px] opacity-50">Coordinates: {lat}, {lng}</p>
                              </div>
                            )}
                          </div>

                          {/* ปุ่มเปิดแอปแผนที่ภายนอก */}
                          <div className="flex flex-wrap items-center gap-4">
                            <button
                              onClick={() => window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank")}
                              className="bg-white text-emerald-900 hover:bg-green-100 px-6 py-2.5 rounded-xl font-bold transition flex items-center gap-2 text-sm shadow-xl"
                            >
                              🧭 นำทางด้วย Google Maps
                            </button>
                            <span className="text-[10px] text-green-400/40 font-mono bg-black/20 px-3 py-1 rounded-md">
                              LOC: {lat.toFixed(5)}, {lng.toFixed(5)}
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
      
      {/* 🌿 Footer */}
      <footer className="mt-24 text-center text-green-400/30 text-[10px] uppercase tracking-widest pb-10">
        LannaVeg Classification Project | University of Phayao
      </footer>
    </div>
  );
}
