import React, { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ✅ ใช้ localhost เท่านั้น (ห้าม 127.0.0.1)
  const API_BASE = "http://localhost:8000";

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE}/google/login`;
  };

  const handleNormalLogin = async () => {
    try {
      const res = await fetch(`${API_BASE}/login`, {
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
      alert("Server error");
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

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            marginTop: "15px",
            borderRadius: "8px",
          }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            marginTop: "10px",
            borderRadius: "8px",
          }}
        />

        {/* 🔵 Normal Login */}
        <button
          onClick={handleNormalLogin}
          style={{
            width: "100%",
            padding: "10px",
            marginTop: "15px",
            borderRadius: "8px",
            background: "#2563eb",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
        >
          Sign In
        </button>

        <div style={{ margin: "20px 0", opacity: 0.6 }}>
          ───── or ─────
        </div>

        {/* 🔴 Google Login */}
        <button
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
