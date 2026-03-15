import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import axios from "axios";

export default function AuthPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  useEffect(() => {
    // ✅ 1. ดักจับ Token จาก URL (กรณี Redirect มาจาก Google Login)
    const { token } = router.query;
    
    if (token && typeof token === "string") {
      localStorage.setItem("access_token", token);
      // ล้าง Token ออกจาก URL เพื่อความปลอดภัย
      router.replace("/auth", undefined, { shallow: true });
    }

    // ✅ 2. ดึงข้อมูล User
    const fetchUser = async () => {
      const accessToken = localStorage.getItem("access_token");
      
      if (!token && !accessToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(`${API_URL}/auth/me`, {
          withCredentials: true,
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        });
        
        const userData = res.data.user || res.data;
        setUser(userData);

        // 🔥 [เพิ่มใหม่] พอดึงข้อมูลสำเร็จ ให้หน่วงเวลาแว๊บเดียวแล้ววาร์ปกลับหน้าหลัก
        setTimeout(() => {
          router.push("/");
        }, 800); // หน่วงไว้ 0.8 วินาทีให้พอเห็นชื่อตัวเอง

      } catch (err) {
        console.log("Not logged in or token expired");
        localStorage.removeItem("access_token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    if (router.isReady) {
      fetchUser();
    }
  }, [router.isReady, router.query.token]);

  const handleLogout = async () => {
    try {
      await axios.get(`${API_URL}/auth/logout`, { withCredentials: true });
    } catch (err) {
      console.error("Server logout failed", err);
    } finally {
      localStorage.removeItem("access_token");
      setUser(null);
      window.location.href = "/";
    }
  };

  // --- UI เดิมที่อ้ายห้ามแก้ ---
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
            <p style={{ fontSize: "12px", color: "#94a3b8" }}>Redirecting to home...</p>

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
            <p style={{ fontSize: "14px", opacity: 0.7 }}>Please login to continue</p>
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
