import React, { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // ดึงค่า URL จาก Environment Variable
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const handleGoogleLogin = () => {
    // ✅ แก้ไข: เติม /auth นำหน้า เพื่อให้ตรงกับ Backend Router Prefix
    window.location.href = `${API_BASE}/auth/google/login`;
  };

  const handleNormalLogin = async (e) => {
    e.preventDefault(); 
    setLoading(true);

    try {
      // ✅ แก้ไข: เติม /auth นำหน้า login
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
        alert(data.detail || "Login failed");
      }
    } catch (err) {
      console.error(err);
      alert("ไม่สามารถติดต่อ Server ได้ (ตรวจสอบ CORS หรือ URL)");
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
        <h2>Sign In</h2>

        <form onSubmit={handleNormalLogin}>
          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "15px",
              borderRadius: "8px",
              border: "1px solid #334155",
              background: "#0f172a",
              color: "white",
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
              padding: "10px",
              marginTop: "10px",
              borderRadius: "8px",
              border: "1px solid #334155",
              background: "#0f172a",
              color: "white",
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "15px",
              borderRadius: "8px",
              background: loading ? "#64748b" : "#2563eb",
              color: "white",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div style={{ margin: "20px 0", opacity: 0.6 }}>───── or ─────</div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "8px",
            background: "white",
            color: "black",
            border: "1px solid #ccc",
            cursor: "pointer",
            fontWeight: "500",
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
