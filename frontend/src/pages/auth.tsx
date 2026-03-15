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
      // ล้าง Token ออกจาก URL เพื่อความปลอดภัยและสวยงาม
      router.replace("/auth", undefined, { shallow: true });
    }

    // ✅ 2. ดึงข้อมูล User โดยใช้ Token ที่เพิ่งได้ หรือที่มีอยู่ในเครื่อง
    const fetchUser = async () => {
      const accessToken = localStorage.getItem("access_token");
      
      // ถ้าไม่มี Token ใน URL และไม่มีใน localStorage เลย ก็ไม่ต้อง Fetch
      if (!token && !accessToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(`${API_URL}/auth/me`, {
          // รองรับทั้งแบบ Cookie (withCredentials) และ Header (Bearer)
          withCredentials: true,
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        });
        
        // Backend ส่งมาเป็น { user: {...} } หรือมาเป็นก้อน Object เลย
        setUser(res.data.user || res.data);
      } catch (err) {
        console.log("Not logged in or token expired");
        // ❌ ถ้าดึงข้อมูลไม่ได้ (Token อาจหมดอายุ) ให้ล้าง Token ทิ้ง
        localStorage.removeItem("access_token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    // ป้องกันการรัน Fetch ก่อนที่ router.isReady จะเป็น True (Next.js Hydration)
    if (router.isReady) {
      fetchUser();
    }
  }, [router.isReady, router.query.token]); // รันเฉพาะตอน router พร้อม หรือ token เปลี่ยน

  const handleLogout = async () => {
    try {
      // ✅ เรียก Logout ฝั่ง Server เพื่อเคลียร์ Session/Cookie
      await axios.get(`${API_URL}/auth/logout`, { withCredentials: true });
    } catch (err) {
      console.error("Server logout failed", err);
    } finally {
      // ✅ ยังไงก็ต้องล้าง Token ในเครื่อง และส่ง User ไปหน้าแรก
      localStorage.removeItem("access_token");
      setUser(null);
      window.location.href = "/";
    }
  };

  // --- UI เดิมที่อ้ายห้ามแก้ (จัดให้ครับ!) ---
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
