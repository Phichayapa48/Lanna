import { useState, useEffect } from "react";
import axios from "axios";

// ✅ ดึงค่า URL จาก ENV เหมือนไฟล์อื่นๆ
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        // ✅ ส่ง withCredentials: true เพื่อให้ส่ง Cookie/Session ไปด้วย
        const res = await axios.get(`${API_BASE}/auth/me`, {
          withCredentials: true,
        });
        
        if (res.data) {
          setUser(res.data); // เก็บข้อมูล User ถ้า Login แล้ว
        }
      } catch (err: any) {
        // ถ้า 401 คือปกติ (Guest) ไม่ต้องตกใจครับ
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, []);

  return { user, loading };
}
