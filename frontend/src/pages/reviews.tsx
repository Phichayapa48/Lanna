import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

// ✅ แนะนำ: ในอนาคตควรเปลี่ยนเป็น process.env.NEXT_PUBLIC_API_BASE
const API = "http://localhost:8000";

export default function Reviews() {
  const router = useRouter();
  const { class: className } = router.query;

  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  // ✅ จัดการเรื่อง Query String ให้รองรับทั้งแบบเลือกชนิดผัก หรือดูทั้งหมด
  const normalizedClass =
    typeof className === "string"
      ? className
      : Array.isArray(className)
      ? className[0]
      : undefined;

  useEffect(() => {
    if (!router.isReady) return;

    setLoading(true);

    // ✅ ถ้ามี normalizedClass ให้ไปที่ path กรองชนิดผัก ถ้าไม่มีให้ดึง list ทั้งหมด
    const url = normalizedClass
      ? `${API}/reviews/class/${encodeURIComponent(normalizedClass)}`
      : `${API}/reviews/all/list`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("โหลดข้อมูลไม่สำเร็จ");
        return res.json();
      })
      .then((data) => {
        console.log("REVIEWS DATA:", data);
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
          className="inline-block mb-8 bg-white/10 hover:bg-white/20 px-5 py-2 rounded-xl text-sm transition"
        >
          ← กลับหน้าแรก
        </Link>

        <h1 className="text-3xl font-bold mb-6 text-center">
          {normalizedClass ? `รีวิวของ ${normalizedClass}` : "รีวิวทั้งหมด"}
        </h1>

        {/* 🌟 ปุ่มเคลียร์ตัวกรอง (แสดงเมื่อมีการเลือกชนิดผัก) */}
        {normalizedClass && (
          <div className="text-center mb-10">
            <Link
              href="/reviews"
              className="bg-yellow-400 hover:bg-yellow-500 text-black px-5 py-2 rounded-xl text-sm font-medium transition shadow-lg"
            >
              ดูรีวิวทั้งหมด
            </Link>
          </div>
        )}

        {loading && (
          <p className="text-center text-green-200 mb-10 animate-pulse">
            กำลังโหลดข้อมูล...
          </p>
        )}

        {!loading && reviews.length === 0 && (
          <p className="text-center text-green-200 mb-10 italic">
            ยังไม่มีรีวิวสำหรับรายการนี้
          </p>
        )}

        <div className="space-y-10">
          {reviews.map((r) => {
            const lat = r.latitude != null ? Number(r.latitude) : null;
            const lng = r.longitude != null ? Number(r.longitude) : null;

            return (
              <div
                key={r.id}
                className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-xl transition hover:border-white/40"
              >
                {/* Header: ชื่อผัก + ดาว */}
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-green-300">
                    {r.class_name}
                  </h2>
                  <div className="text-yellow-400 text-lg">
                    {"★".repeat(r.rating)}
                    <span className="text-gray-400">
                      {"★".repeat(5 - r.rating)}
                    </span>
                  </div>
                </div>

                {/* ข้อความรีวิว */}
                <p className="text-green-100 mb-4 leading-relaxed">
                  {r.review_text}
                </p>

                {/* ข้อมูลผู้รีวิว */}
                <div className="text-sm text-green-300/80 mb-6">
                  โดย {r.username || "ผู้ใช้ทั่วไป"} •{" "}
                  {new Date(r.created_at).toLocaleString("th-TH")}
                </div>

                {/* ส่วนแสดงแผนที่ (ถ้ามีพิกัด) */}
                {lat !== null && lng !== null && (
                  <>
                    <button
                      onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                      className="bg-green-500 hover:bg-green-600 px-5 py-2 rounded-xl text-sm font-medium transition mb-4 shadow-md"
                    >
                      {expanded === r.id ? "🔼 ซ่อนรายละเอียด" : "📍 ดูสถานที่เก็บ"}
                    </button>

                    {expanded === r.id && (
                      <div className="space-y-5 mt-4 pt-4 border-t border-white/10 animate-fadeIn">
                        {r.place_name && (
                          <div className="text-green-200 font-medium flex items-center gap-2">
                            <span>📍</span> {r.place_name}
                          </div>
                        )}

                        <div className="text-xs text-green-400 font-mono">
                          Lat: {lat.toFixed(6)} | Lng: {lng.toFixed(6)}
                        </div>

                        {/* Google Static Maps */}
                        {process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ? (
                          <img
                            src={`https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=14&size=600x300&markers=color:red|${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}`}
                            className="rounded-2xl shadow-lg w-full object-cover border border-white/20"
                            alt="Map Location"
                          />
                        ) : (
                          <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm">
                            ⚠️ กรุณาตั้งค่า Google Maps API Key เพื่อแสดงแผนที่
                          </div>
                        )}

                        <button
                          onClick={() =>
                            window.open(
                              `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
                              "_blank"
                            )
                          }
                          className="bg-emerald-600 hover:bg-emerald-700 px-6 py-2 rounded-xl font-medium transition flex items-center gap-2"
                        >
                          🧭 เปิดใน Google Maps
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
