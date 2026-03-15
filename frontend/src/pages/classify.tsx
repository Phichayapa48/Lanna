import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/router";
import { VEGETABLE_DATA } from "../data/vegetables";

const MapComponent = dynamic(() => import("../components/MapPopup"), {
  ssr: false,
});

// ✅ ปรับ API_BASE ให้เป็น HTTPS และล้างตัวอักษร / ตัวสุดท้ายออก
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000")
  .replace("http://", "https://")
  .replace(/\/$/, "");

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

  // ✅ Cleanup URL ป้องกัน Memory Leak
  useEffect(() => {
    return () => {
      if (preview && preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const selectedFile = e.target.files[0];

    // ✅ ใช้ FileReader แทน URL.createObjectURL เพื่อความชัวร์ในมือถือทุกรุ่น
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);

    setFile(selectedFile);
    setResult(null);
    setError("");
    setSuccess("");
    setShowReview(false);
  };

  const handleUpload = async () => {
    if (!file) return setError("กรุณาเลือกรูปก่อน");
    
    const formData = new FormData();
    formData.append("file", file);
    const token = localStorage.getItem("access_token");

    try {
      setLoading(true);
      setError("");
      
      let res = await fetch(`${API_BASE}/api/v1/predict/`, {
        method: "POST",
        body: formData,
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });

      if (!res.ok && res.status === 404) {
        res = await fetch(`${API_BASE}/predict/`, {
          method: "POST",
          body: formData,
          headers: token ? { "Authorization": `Bearer ${token}` } : {},
        });
      }

      if (!res.ok) {
        if (res.status === 401) throw new Error("กรุณาเข้าสู่ระบบก่อนใช้งาน");
        throw new Error("เกิดข้อผิดพลาดในการทำนายบน Server");
      }

      const data = await res.json();
      setResult(data);

      if (data.class_name === "Unknown") {
        setError(data.message || "ไม่สามารถจำแนกได้");
      }

    } catch (err: any) {
      setError(err.message || "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!result) return;
    const token = localStorage.getItem("access_token");

    if (!token) {
      alert("กรุณาเข้าสู่ระบบก่อนบันทึกรีวิวครับ");
      router.push("/auth");
      return;
    }

    try {
      setReviewLoading(true);
      const res = await fetch(`${API_BASE}/api/v1/reviews/`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({
          class_name: result.class_name,
          review_text: reviewText,
          rating: rating,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          alert("เซสชั่นหมดอายุ กรุณา Login ใหม่อีกครั้ง");
          router.push("/auth");
        } else {
          alert(data.detail || "เกิดข้อผิดพลาดในการบันทึก");
        }
        return;
      }

      router.push(`/review-map?review_id=${data.review_id}&class=${result.class_name}`);

    } catch (err) {
      alert("ไม่สามารถบันทึกรีวิวได้ โปรดตรวจสอบอินเทอร์เน็ต");
    } finally {
      setReviewLoading(false);
    }
  };

  const vegetable =
    result && result.class_name !== "Unknown" && VEGETABLE_DATA[result.class_name]
      ? VEGETABLE_DATA[result.class_name]
      : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 to-emerald-700 text-white flex items-center justify-center px-6 py-16">
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 md:p-10 w-full max-w-4xl border border-white/20 shadow-2xl">
        
        <div className="mb-6">
          <Link href="/" className="inline-block bg-white/10 hover:bg-white/20 px-5 py-2 rounded-xl text-sm transition">
            ← กลับหน้าแรก
          </Link>
        </div>

        <h1 className="text-3xl md:text-4xl font-semibold mb-10 text-center text-green-300">
          🌿 Vegetable Classification
        </h1>

        <div className="space-y-6">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full border border-white/20 rounded-2xl p-3 bg-white/5 text-white"
          />

          {/* ✅ ส่วนพรีวิวรูปภาพ: ปรับให้รองรับอาการรูปไม่ขึ้น */}
          <div className="flex justify-center bg-black/20 rounded-3xl min-h-[250px] items-center overflow-hidden border border-white/5">
            {preview ? (
              <img
                src={preview}
                alt="preview"
                className="w-64 h-64 md:w-72 md:h-72 object-cover rounded-3xl shadow-lg border-2 border-green-500/50"
                onError={() => setError("ไม่สามารถแสดงรูปพรีวิวได้")}
              />
            ) : (
              <div className="text-white/20 italic">ยังไม่มีรูปภาพ</div>
            )}
          </div>

          <button
            onClick={handleUpload}
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 transition py-4 rounded-2xl font-bold shadow-lg text-lg disabled:opacity-50"
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
          <div className="mt-14 rounded-3xl overflow-hidden bg-white/5 border border-white/10 shadow-inner animate-fadeIn">
            <div className="bg-green-600 text-white p-8 text-center">
              <h2 className="text-3xl font-bold">{vegetable.thai_name}</h2>
              <div className="mt-4 inline-block bg-black/20 px-4 py-1 rounded-full text-sm">
                ความเชื่อมั่น {(result.confidence * 100).toFixed(2)}%
              </div>
            </div>

            <div className="p-8 md:p-10 space-y-8 text-gray-200">
              {/* ✅ ส่วนรูปภาพตัวอย่าง: Force HTTPS ให้ทุกลูก */}
              {vegetable.images && (
                <div className="flex justify-center gap-4 flex-wrap">
                  {vegetable.images.map((img: string, index: number) => (
                    <img
                      key={index}
                      src={img.replace("http://", "https://")}
                      alt="vegetable example"
                      className="w-32 h-32 md:w-44 md:h-44 object-cover rounded-2xl border border-white/10 shadow-lg"
                      onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/150?text=No+Image")}
                    />
                  ))}
                </div>
              )}

              {/* ... ส่วนข้อมูลสรรพคุณ (เหมือนเดิม) ... */}
              <div className="grid md:grid-cols-2 gap-6 text-sm">
                 <div>
                    <h4 className="font-bold text-green-400">📍 ชื่อท้องถิ่น</h4>
                    <p className="pl-4 border-l-2 border-green-500/30">{vegetable.local_name}</p>
                 </div>
                 <div>
                    <h4 className="font-bold text-green-400">💊 สรรพคุณ</h4>
                    <p className="pl-4 border-l-2 border-green-500/30">{vegetable.benefits}</p>
                 </div>
              </div>

              {/* Review Section */}
              <div className="mt-10 pt-8 border-t border-white/10 text-center">
                {!showReview ? (
                  <button
                    onClick={() => setShowReview(true)}
                    className="bg-yellow-500 text-black px-8 py-3 rounded-xl font-bold transition transform hover:scale-105"
                  >
                    ⭐ เขียนรีวิวและปักหมุด
                  </button>
                ) : (
                  <div className="mt-6 space-y-4 text-left">
                    <textarea
                      placeholder="บอกเล่าประสบการณ์ที่พบเจอ..."
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      className="w-full p-4 rounded-xl bg-gray-800 text-white border border-white/20 h-32 outline-none focus:border-green-500 transition"
                    />
                    <div className="flex gap-4">
                      <button
                        onClick={handleSubmitReview}
                        disabled={reviewLoading}
                        className="flex-1 bg-green-500 py-3 rounded-xl font-bold transition disabled:opacity-50"
                      >
                        {reviewLoading ? "⌛ กำลังบันทึก..." : "📍 บันทึกและเปิดแผนที่"}
                      </button>
                      <button onClick={() => setShowReview(false)} className="px-6 py-3 rounded-xl bg-white/10">ยกเลิก</button>
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
