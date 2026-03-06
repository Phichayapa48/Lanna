import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import axios from "axios";

export default function AuthPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // ดึงค่า URL จาก Environment Variable
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  useEffect(() => {
    axios
      .get(`${API_URL}/auth/me`, { // ใช้ URL จากตัวแปร env และใส่ /auth นำหน้าตาม main.py
        withCredentials: true,
      })
      .then((res) => {
        // ปรับตามโครงสร้างข้อมูลที่ Backend ส่งมา
        setUser(res.data.user || res.data);
      })
      .catch((err) => {
        // ถ้ายังไม่ Login มันจะเด้งมาที่นี่ (401) เป็นเรื่องปกติครับ
        console.log("Not logged in yet"); 
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [API_URL]);

  const handleLogout = () => {
    document.cookie = "access_token=; Max-Age=0; path=/;";
    setUser(null);
  };

  if (loading) {
    return <div style={{ color: "white", textAlign: "center", marginTop: "100px" }}>Loading...</div>;
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
        }}
      >
        {user ? (
          <>
            <h2>Welcome {user.full_name || user.username}</h2>
            <p>{user.email}</p>

            <button
              onClick={handleLogout}
              style={{
                marginTop: "20px",
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "none",
                background: "#c73c3c",
                color: "white",
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <h2>Welcome</h2>

            <button
              onClick={() => router.push("/login")}
              style={{
                marginTop: "20px",
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "none",
                background: "#2563eb",
                color: "white",
                cursor: "pointer",
              }}
            >
              Go to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
