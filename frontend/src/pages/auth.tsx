import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import axios from "axios";

export default function AuthPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // ดึง URL จาก Environment Variable ที่เราตั้งไว้ใน Render
  // ถ้าหาไม่เจอ (เช่น รันในเครื่อง) ให้ถอยกลับไปใช้ localhost
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  useEffect(() => {
    // ใช้ `${API_URL}/auth/me` เพราะใน main.py อ้ายตั้ง prefix ของ auth_router ไว้ว่า /auth
    axios
      .get(`${API_URL}/auth/me`, {
        withCredentials: true, // สำคัญมาก! เพื่อให้ Browser ส่ง Cookie ไปด้วย
      })
      .then((res) => {
        // เช็คโครงสร้างข้อมูลที่ Backend ส่งมา (ปกติจะเป็น res.data.user หรือ res.data)
        setUser(res.data.user || res.data);
      })
      .catch((err) => {
        console.error("Auth check failed:", err);
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [API_URL]);

  const handleLogout = async () => {
    try {
      // 1. เรียก API ไปบอก Backend ให้ลบ Session (ถ้ามี endpoint logout)
      await axios.post(`${API_URL}/auth/logout`, {}, { withCredentials: true });
    } catch (err) {
      console.error("Logout API failed", err);
    } finally {
      // 2. ล้าง Cookie ฝั่ง Client และ Reset State
      document.cookie = "access_token=; Max-Age=0; path=/;";
      setUser(null);
      router.push("/"); // เด้งกลับหน้าแรก
    }
  };

  if (loading) {
    return (
      <div style={{ color: "white", textAlign: "center", marginTop: "100px", fontFamily: "sans-serif" }}>
        <div className="loader"></div>
        <p>กำลังตรวจสอบสิทธิ์...</p>
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
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          background: "#1e293b",
          padding: "40px",
          borderRadius: "12px",
          width: "350px",
          textAlign: "center",
          boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
        }}
      >
        {user ? (
          <>
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "50px" }}>👤</div>
              <h2 style={{ margin: "10px 0 5px 0" }}>ยินดีต้อนรับ</h2>
              <h3 style={{ color: "#38bdf8", margin: "0" }}>{user.full_name || user.username}</h3>
              <p style={{ color: "#94a3b8", fontSize: "14px" }}>{user.email}</p>
            </div>

            <button
              onClick={handleLogout}
              style={{
                marginTop: "10px",
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "none",
                background: "#ef4444",
                color: "white",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
            >
              ออกจากระบบ
            </button>
          </>
        ) : (
          <>
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "50px" }}>🔒</div>
              <h2>เข้าสู่ระบบ</h2>
              <p style={{ color: "#94a3b8" }}>กรุณาเข้าสู่ระบบเพื่อใช้งานต่อ</p>
            </div>

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
              }}
            >
              ไปที่หน้า Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
