import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/router";
import { VEGETABLE_DATA } from "../data/vegetables";

const MapComponent = dynamic(() => import("../components/MapPopup"), {
  ssr: false,
});

/* =============================================
   ✅ ใช้ Environment Variable ตามเวอร์ชันใหม่
   ============================================= */
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  "http://localhost:8000";

type PredictionResult = {
  class_name: string;
  confidence: number;
  message?: string;
};

export default function Classify() {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showReview, setShowReview] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [rating, setRating] = useState(5);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selectedFile = e.target.files[0];
    if (preview) URL.revokeObjectURL(preview);

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setResult(null);
    setError("");
    setSuccess("");
    setShowReview(false);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("กรุณาเลือกรูปก่อน");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      /* ✅ ใช้ Path api/v1 ตามที่เพื่อนอัปเดต */
      const res = await fetch(`${API_BASE}/api/v1/predict/`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "เกิดข้อผิดพลาดในการทำนาย");
      }

      const data = await res.json();
      setResult(data);

      if (data.class_name === "Unknown") {
        setError(data.message || "ไม่สามารถจำแนกได้");
      }

    } catch (err: any) {
      setError(err.message || "Load failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!result) return;

    try {
      setReviewLoading(true);

      /* ✅ เรียก API สำหรับบันทึกรีวิว */
      const res = await fetch(`${API_BASE}/reviews/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          class_name: result.class_name,
          review_text: reviewText,
          rating: rating,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.detail || "เกิดข้อผิดพลาด");
        return;
      }

      /* ✅ Redirect ไปหน้าแผนที่พิกัดที่เพิ่งรีวิว */
      router.push(
        `/review-map?review_id=${data.review_id}&class=${result.class_name}`
      );

    } catch (err) {
      alert("ไม่สามารถบันทึกรีวิวได้");
    } finally {
      setReviewLoading(false);
    }
  };

  const vegetable =
    result &&
    result.class_name !== "Unknown" &&
    VEGETABLE_DATA[result.class_name]
      ? VEGETABLE_DATA[result.class_name]
      : null;

  return (
    <div className="min-h-screen transition-colors duration-300 bg-gradient-to-br from-green-900 via-green-800 to-emerald-700 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-white flex items-center justify-center px-6 py-16">

      <div className="bg-white/10 dark:bg-slate-800 backdrop-blur-xl rounded-3xl shadow-2xl p-6 md:p-10 w-full max-w-4xl border border-white/20">

        <div className="mb-6">
          <Link
            href="/"
            className="inline-block bg-white/10 hover:bg-white/20 px-5 py-2 rounded-xl text-sm transition"
          >
            ← กลับหน้าแรก
          </Link>
        </div>

        <h1 className="text-3xl md:text-4xl font-semibold mb-10 text-center text-green-300 tracking-tight">
          🌿 Vegetable Classification
        </h1>

        <div className="space-y-6">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full border border-gray-400 dark:border-slate-600 rounded-2xl p-3 bg-white dark:bg-slate-700 text-black dark:text-white"
          />

          {preview && (
            <div className="flex justify-center">
              <img
                src={preview}
                alt="preview"
                className="w-64 h-64 md:w-72 md:h-72 object-cover rounded-3xl shadow-lg border-2 border-green-500/50"
              />
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 transition px-6 py-4 rounded-2xl font-bold shadow-lg text-lg disabled:opacity-50"
          >
            {loading ? "⌛ กำลังวิเคราะห์..." : "🔍 เริ่มวิเคราะห์ภาพ"}
          </button>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-center font-medium">
            ❌ {error}
          </div>
        )}

        {vegetable && result && (
          <div className="mt-14 rounded-3xl overflow-hidden bg-white/10 dark:bg-slate-900 border border-white/20 shadow-inner animate-fadeIn">

            <div className="bg-green-600 text-white p-8 text-center">
              <h2 className="text-3xl font-bold">
                {vegetable.thai_name}
              </h2>
              <p className="italic mt-2 opacity-90">{vegetable.scientific_name}</p>
              <div className="mt-4 inline-block bg-black/20 px-4 py-1 rounded-full text-sm">
                ความเชื่อมั่น {(result.confidence * 100).toFixed(2)}%
              </div>
            </div>

            <div className="p-8 md:p-10 space-y-8 text-gray-200">

              {vegetable.images && (
                <div className="flex justify-center gap-4 flex-wrap">
                  {vegetable.images.map((img: string, index: number) => (
                    <img
                      key={index}
                      src={img}
                      alt="vegetable example"
                      className="w-32 h-32 md:w-44 md:h-44 object-cover rounded-2xl shadow-lg border border-white/10 hover:scale-110 transition duration-300"
                    />
                  ))}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6 text-sm md:text-base">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-green-400 flex items-center gap-2">📍 ชื่อท้องถิ่น</h4>
                    <p className="pl-6 border-l-2 border-green-500/30">{vegetable.local_name}</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-green-400 flex items-center gap-2">🌱 ลักษณะทางพฤกษศาสตร์</h4>
                    <p className="pl-6 border-l-2 border-green-500/30">{vegetable.description}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-green-400 flex items-center gap-2">💊 สรรพคุณ</h4>
                    <p className="pl-6 border-l-2 border-green-500/30">{vegetable.benefits}</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-green-400 flex items-center gap-2">🍽 เมนูแนะนำ</h4>
                    <ul className="list-disc list-inside pl-6 border-l-2 border-green-500/30">
                      {vegetable.recommended_menu.map((menu: string, i: number) => (
                        <li key={i}>{menu}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* 🌟 ส่วนเขียนรีวิว (แอ๋มกู้ชีพกลับมา) */}
              <div className="mt-10 pt-8 border-t border-white/10 text-center">
                {!showReview ? (
                  <button
                    onClick={() => setShowReview(true)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black px-8 py-3 rounded-xl font-bold transition transform hover:scale-105 shadow-xl"
                  >
                    ⭐ คุณเจอผักชนิดนี้ที่ไหน? เขียนรีวิวเลย
                  </button>
                ) : (
                  <div className="mt-6 bg-white/5 p-6 rounded-3xl border border-white/10 text-left space-y-4 animate-slideUp">
                    <h3 className="text-xl font-semibold text-yellow-400">เขียนรีวิวและปักหมุดพิกัด</h3>
                    
                    <div>
                      <label className="block text-sm mb-2">ให้คะแนนความพึงพอใจ</label>
                      <select
                        value={rating}
                        onChange={(e) => setRating(Number(e.target.value))}
                        className="w-full p-3 rounded-xl bg-gray-800 text-white border border-white/20 focus:ring-2 focus:ring-green-500 outline-none"
                      >
                        {[5,4,3,2,1].map(n => (
                          <option key={n} value={n}>{n} ดาว {"⭐".repeat(n)}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm mb-2">รายละเอียดรีวิว</label>
                      <textarea
                        placeholder="บอกเล่าประสบการณ์หรือสถานที่พบเจอ..."
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        className="w-full p-4 rounded-xl bg-gray-800 text-white border border-white/20 focus:ring-2 focus:ring-green-500 outline-none h-32"
                      />
                    </div>

                    <div className="flex gap-4">
                      <button
                        onClick={handleSubmitReview}
                        disabled={reviewLoading}
                        className="flex-1 bg-green-500 hover:bg-green-600 px-6 py-3 rounded-xl font-bold transition disabled:opacity-50 shadow-lg"
                      >
                        {reviewLoading ? "⌛ กำลังบันทึกพิกัด..." : "📍 บันทึกและเปิดแผนที่"}
                      </button>
                      <button
                        onClick={() => setShowReview(false)}
                        className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
