import { useEffect, useState } from "react";
import Link from "next/link";

const API = "http://localhost:8000";

export default function Reviews() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    fetch(`${API}/reviews/all/list`)
      .then((res) => res.json())
      .then((data) => {
        console.log("REVIEWS DATA:", data); // 🔥 debug ดู lat/lng
        setReviews(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-700 text-white px-6 py-16">
      <div className="max-w-4xl mx-auto">

        {/* 🔥 ปุ่มกลับหน้าแรก */}
        <Link
          href="/"
          className="inline-block mb-8 bg-white/10 hover:bg-white/20 px-5 py-2 rounded-xl text-sm transition"
        >
          ← กลับหน้าแรก
        </Link>

        <h1 className="text-3xl font-bold mb-14 text-center">
          รีวิวทั้งหมด
        </h1>

        {loading && (
          <p className="text-center text-green-200 mb-10">
            กำลังโหลด...
          </p>
        )}

        {!loading && reviews.length === 0 && (
          <p className="text-center text-green-200 mb-10">
            ยังไม่มีรีวิว
          </p>
        )}

        {reviews.map((r) => {
          const lat = r.latitude != null ? Number(r.latitude) : null;
          const lng = r.longitude != null ? Number(r.longitude) : null;

          return (
            <div
              key={r.id}
              className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 mb-10 rounded-3xl shadow-xl transition"
            >

              {/* Header */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-green-300">
                  {r.class_name}
                </h2>

                <div className="text-yellow-400 text-lg">
                  {"★".repeat(r.rating)}
                  <span className="text-gray-400 ml-1">
                    {"★".repeat(5 - r.rating)}
                  </span>
                </div>
              </div>

              {/* Review Text */}
              <p className="text-green-100 mb-4">
                {r.review_text}
              </p>

              {/* User + Date */}
              <div className="text-sm text-green-300 mb-6">
                โดย {r.username} •{" "}
                {new Date(r.created_at).toLocaleString()}
              </div>

              {/* ปุ่มดูเพิ่มเติม */}
              {lat !== null && lng !== null && (
                <button
                  onClick={() =>
                    setExpanded(expanded === r.id ? null : r.id)
                  }
                  className="bg-green-500 hover:bg-green-600 px-5 py-2 rounded-xl text-sm font-medium transition mb-4"
                >
                  {expanded === r.id ? "ซ่อนรายละเอียด" : "ดูเพิ่มเติม"}
                </button>
              )}

              {/* แสดง map */}
              {expanded === r.id && lat !== null && lng !== null && (
                <div className="space-y-5 mt-4">

                  {r.place_name && (
                    <div className="text-green-200 font-medium">
                      📍 {r.place_name}
                    </div>
                  )}

                  <div className="text-xs text-green-400">
                    Lat: {lat} | Lng: {lng}
                  </div>

                  {/* เช็ค API key */}
                  {process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ? (
                    <img
                      src={`https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=14&size=600x300&markers=color:red|${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}`}
                      className="rounded-2xl shadow-lg w-full"
                      alt="map"
                    />
                  ) : (
                    <div className="text-red-300">
                      ⚠ Google Maps API Key ไม่ถูกโหลด
                    </div>
                  )}

                  <button
                    onClick={() =>
                      window.open(
                        `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
                        "_blank"
                      )
                    }
                    className="bg-emerald-600 hover:bg-emerald-700 px-6 py-2 rounded-xl font-medium transition"
                  >
                    🧭 ขอเส้นทาง
                  </button>

                </div>
              )}

            </div>
          );
        })}

      </div>
    </div>
  );
}
