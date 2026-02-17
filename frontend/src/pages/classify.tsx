import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { VEGETABLE_DATA } from "../data/vegetables";

const MapComponent = dynamic(() => import("../components/MapPopup"), {
  ssr: false,
});

const API_BASE = "http://localhost:8000";

type PredictionResult = {
  class_name: string;
  confidence: number;
  message?: string;
};

export default function Classify() {
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

  const [reviewId, setReviewId] = useState<number | null>(null);
  const [showMap, setShowMap] = useState(false);

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

      const res = await fetch(`${API_BASE}/predict/`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) throw new Error("เกิดข้อผิดพลาดในการทำนาย");

      const data = await res.json();
      setResult(data);

      if (data.class_name === "Unknown") {
        setError(data.message || "ไม่สามารถจำแนกได้");
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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

      <div className="bg-white/10 dark:bg-slate-800 backdrop-blur-xl rounded-3xl shadow-2xl p-10 w-full max-w-4xl border border-white/20">

        <div className="mb-6">
          <Link
            href="/"
            className="inline-block bg-white/10 hover:bg-white/20 px-5 py-2 rounded-xl text-sm transition"
          >
            ← กลับหน้าแรก
          </Link>
        </div>

        <h1 className="text-4xl font-semibold mb-10 text-center text-green-300 tracking-tight">
          🌿 Vegetable Classification
        </h1>

        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="w-full border border-gray-400 dark:border-slate-600 rounded-2xl p-3 mb-6 bg-white dark:bg-slate-700 text-black dark:text-white"
        />

        {preview && (
          <div className="mb-6 flex justify-center">
            <img
              src={preview}
              alt="preview"
              className="w-72 h-72 object-cover rounded-3xl shadow-lg"
            />
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={loading}
          className="w-full bg-green-500 hover:bg-green-600 transition px-6 py-3 rounded-full font-semibold shadow-lg"
        >
          {loading ? "กำลังวิเคราะห์..." : "Predict"}
        </button>

        {error && (
          <div className="mt-6 text-red-400 text-center text-lg font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-6 text-green-400 text-center">
            {success}
          </div>
        )}

        {vegetable && result && (
          <div className="mt-14 rounded-3xl overflow-hidden bg-white/10 dark:bg-slate-900 border border-white/20">

            <div className="bg-green-600 text-white p-8 text-center">
              <h2 className="text-3xl font-semibold">
                {vegetable.thai_name}
              </h2>
              <p className="italic mt-2">{vegetable.scientific_name}</p>
              <div className="mt-3 text-sm">
                Confidence {(result.confidence * 100).toFixed(2)}%
              </div>
            </div>

            <div className="p-10 space-y-8 text-gray-200">

              {/* ✅ แสดงรูปภาพ */}
              {vegetable.images && (
                <div className="flex justify-center gap-4 flex-wrap">
                  {vegetable.images.map((img: string, index: number) => (
                    <img
                      key={index}
                      src={img}
                      alt="vegetable"
                      className="w-44 h-44 object-cover rounded-2xl shadow-lg border border-white/20 hover:scale-105 transition"
                    />
                  ))}
                </div>
              )}

              <div>
                <h4 className="font-semibold text-green-400">📍 ชื่อท้องถิ่น</h4>
                <p>{vegetable.local_name}</p>
              </div>

              <div>
                <h4 className="font-semibold text-green-400">🌱 ลักษณะทางพฤกษศาสตร์</h4>
                <p>{vegetable.description}</p>
              </div>

              <div>
                <h4 className="font-semibold text-green-400">💊 สรรพคุณ</h4>
                <p>{vegetable.benefits}</p>
              </div>

              <div>
                <h4 className="font-semibold text-green-400">🍽 เมนูแนะนำ</h4>
                <ul className="list-disc list-inside">
                  {vegetable.recommended_menu.map((menu: string, i: number) => (
                    <li key={i}>{menu}</li>
                  ))}
                </ul>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
