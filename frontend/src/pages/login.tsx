import React, { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // ดึงค่าจาก ENV หรือใช้ localhost ถ้าไม่มี (อย่าลืมตั้งค่าใน Render Dashboard)
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const handleGoogleLogin = () => {
    // ✅ แก้ไข: เติม /auth เพื่อให้ตรงกับ app.include_router(auth_router, prefix="/auth")
    window.location.href = `${API_BASE}/auth/google/login`;
  };

  const handleNormalLogin = async (e) => {
    e.preventDefault(); 
    setLoading(true);

    try {
      // ✅ แก้ไข: เติม /auth เพื่อให้ส่งไปที่ router ที่ถูกต้อง
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include", 
      });

      const data = await res.json();

      if (res.ok) {
        window.location.href = "/";
      } else {
        alert(data.detail || "เข้าสู่ระบบไม่สำเร็จ");
      }
    } catch (err) {
      console.error(err);
      alert("ไม่สามารถติดต่อ Server ได้ (ตรวจสอบการตั้งค่า CORS หรือ Path)");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "#0f172a",
      }}
    >
      <div
        style={{
          background: "#1e293b",
          padding: "40px",
          borderRadius: "12px",
          width: "350px",
          textAlign: "center",
          color: "white",
        }}
      >
        <h2 style={{ marginBottom: "20px" }}>Sign In</h2>

        <form onSubmit={handleNormalLogin}>
          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "10px",
              borderRadius: "8px",
              border: "1px solid #334155",
              background: "#0f172a",
              color: "white",
              outline: "none",
            }}
          />

          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "10px",
              borderRadius: "8px",
              border: "1px solid #334155",
              background: "#0f172a",
              color: "white",
              outline: "none",
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "20px",
              borderRadius: "8px",
              background: loading ? "#64748b" : "#2563eb",
              color: "white",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: "bold",
            }}
          >
            {loading ? "กำลังตรวจสอบ..." : "Sign In"}
          </button>
        </form>

        <div style={{ margin: "25px 0", opacity: 0.5, fontSize: "14px" }}>
          ───── หรือเข้าสู่ระบบด้วย ─────
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "8px",
            background: "white",
            color: "#1e293b",
            border: "1px solid #ccc",
            cursor: "pointer",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
          }}
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="Google"
            width="20"
            height="20"
          />
          Continue with Google
        </button>
      </div>
    </div>
  );
}
