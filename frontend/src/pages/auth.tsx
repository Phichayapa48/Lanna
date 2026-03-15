import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import axios from "axios";

export default function AuthPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  useEffect(() => {
    // 1. ✅ ดักจับ Token จาก URL (ที่ Backend ส่งมาทาง ?token=...)
    const { token } = router.query;
    if (token) {
      localStorage.setItem("access_token", token as string);
      // ล้าง query บน URL เพื่อความสวยงาม
      router.replace("/auth", undefined, { shallow: true });
    }

    // 2. ✅ ดึงข้อมูล User โดยใช้ Header (แทน Cookie)
    const accessToken = localStorage.getItem("access_token");

    axios
      .get(`${API_URL}/auth/me`, {
        // ส่งทั้ง 2 แบบ (เผื่อคอมใช้คุกกี้ เผื่อมือถือใช้ Header)
        withCredentials: true, 
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      })
      .then((res) => {
        setUser(res.data.user || res.data);
      })
      .catch((err) => {
        console.log("Not logged in yet");
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [API_URL, router.query]); // เพิ่ม router.query เพื่อให้ทำงานเมื่อ token มาถึง

  const handleLogout = async () => {
    try {
      // ✅ เรียก Logout ฝั่ง Server
      await axios.get(`${API_URL}/auth/logout`, {
        withCredentials: true,
      });
      
      // ✅ ล้างบัตรผ่าน (Token) ในเครื่องออกให้หมด
      localStorage.removeItem("access_token");
      setUser(null);
      
      window.location.href = "/"; 
      
    } catch (err) {
      console.error("Logout failed", err);
      localStorage.removeItem("access_token");
      setUser(null);
      window.location.href = "/";
    }
  };

  // --- UI เดิมเป๊ะ ห้ามแก้ ---
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
