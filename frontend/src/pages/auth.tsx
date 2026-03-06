import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import axios from "axios";

export default function AuthPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // ✅ ดึงค่า URL จาก Environment Variable (Render)
  const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://lanna-backend.onrender.com").replace(/\/$/, "");

  useEffect(() => {
    const checkUser = async () => {
      try {
        const res = await axios.get(`${API_URL}/auth/me`, {
          withCredentials: true, // ✅ สำคัญ: เพื่อส่ง Cookie ไปเช็คที่ Backend
        });
        
        // ✅ ปรับตามโครงสร้างข้อมูลที่ Backend ส่งมา {"user": {...}}
        if (res.data && res.data.user) {
          setUser(res.data.user);
        } else {
          setUser(res.data);
        }
      } catch (err) {
        console.log("Not logged in yet or session expired");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [API_URL]);

  // 🔥 จุดที่อ้ายขอให้แก้: Logout แบบเรียก API เพื่อล้าง HttpOnly Cookie
  const handleLogout = async () => {
    try {
      await axios.get(`${API_URL}/auth/logout`, {
        withCredentials: true,
      });
      // ล้างข้อมูลหน้าบ้าน
      setUser(null);
      // พากลับไปหน้า Login หรือหน้าแรก
      router.push("/");
    } catch (err) {
      console.error("Logout error:", err);
      // ถึง API จะพลาด แต่เราล้าง State หน้าบ้านไว้ก่อนเพื่อความปลอดภัย
      setUser(null);
      router.push("/");
    }
  };

  if (loading) {
    return (
      <div style={{ color: "white", textAlign: "center", marginTop: "100px" }}>
        <p>กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "#0f172a",
        color: "white",
      }}
    >
      <div
        style={{
          background: "#1e293b",
          padding: "40px",
          borderRadius: "12px",
          width: "350px",
          textAlign: "center",
          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
        }}
      >
        {user ? (
          <>
            <h2 style={{ marginBottom: "10px" }}>
              ยินดีต้อนรับคุณ {user.full_name || user.username}
            </h2>
            <p style={{ color: "#94a3b8", marginBottom: "20px" }}>{user.email}</p>

            <button
              onClick={handleLogout}
              style={{
                marginTop: "20px",
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "none",
                background: "#c73c3c",
                color: "white",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = "#a83232")}
              onMouseOut={(e) => (e.currentTarget.style.background = "#c73c3c")}
            >
              ออกจากระบบ (Logout)
            </button>
          </>
        ) : (
          <>
            <h2 style={{ marginBottom: "20px" }}>กรุณาเข้าสู่ระบบ</h2>
            <button
              onClick={() => router.push("/login")}
              style={{
                marginTop: "10px",
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "none",
                background: "#2563eb",
                color: "white",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = "#1d4ed8")}
              onMouseOut={(e) => (e.currentTarget.style.background = "#2563eb")}
            >
              ไปหน้าเข้าสู่ระบบ
            </button>
          </>
        )}
      </div>
    </div>
  );
}
