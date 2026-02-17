import { useState, useEffect } from "react";
import Link from "next/link";
import Head from "next/head";
import { motion } from "framer-motion";

/* =============================================
   ✅ ตัวแปรกลางสำหรับเรียก API (ดึงจาก .env.local)
   ============================================= */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ใช้ Path ใหม่ /auth/me เพื่อความปลอดภัยและเป็นระเบียบตามที่เพื่อนแก้มา
    fetch(`${API_BASE}/auth/me`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    // เปลี่ยนไปใช้ Path /auth/logout
    window.location.href = `${API_BASE}/auth/logout`;
  };

  return (
    <>
      <Head>
        <title>LannaVeg | Home</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div
        className="
          min-h-screen transition-all duration-500
          bg-gradient-to-br
          from-green-900 via-green-800 to-emerald-700
          dark:from-gray-900 dark:via-gray-800 dark:to-gray-900
          text-white
        "
      >
        {/* ================= NAVBAR ================= */}
        <nav className="flex justify-between items-center px-10 py-6 bg-black/20 backdrop-blur-lg sticky top-0 z-50">
          <h1 className="text-2xl font-bold text-green-300">
            🌿 LannaVeg
          </h1>

          <div className="space-x-6 text-sm flex items-center">
            <Link href="/classify" className="hover:text-green-300 transition">Classify</Link>
            <Link href="/map" className="hover:text-green-300 transition">Map</Link>
            <Link href="/reviews" className="hover:text-green-300 transition">รีวิวทั้งหมด</Link>

            {loading ? (
              <span className="animate-pulse">Loading...</span>
            ) : user ? (
              <div className="flex items-center space-x-4">
                <span className="text-green-300 font-semibold bg-white/10 px-3 py-1 rounded-full">
                  👤 {user.full_name}
                </span>

                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition shadow-md"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href="/auth"
                className="bg-green-500 hover:bg-green-600 px-5 py-2 rounded-lg text-white font-medium transition shadow-md"
              >
                Login
              </Link>
            )}
          </div>
        </nav>

        {/* ================= HERO ================= */}
        <section className="text-center py-24 px-6 relative overflow-hidden">
          <motion.h2
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-6xl font-extrabold mb-6"
          >
            ระบบจำแนกผักช่อดอกพื้นเมืองภาคเหนือ
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-lg md:text-xl max-w-2xl mx-auto text-green-200 mb-10"
          >
            อัปโหลดภาพเพื่อให้ AI วิเคราะห์ชนิดของผักพื้นเมืองแบบแม่นยำ
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="flex justify-center"
          >
            <Link
              href="/classify"
              className="bg-green-500 hover:bg-green-600 px-8 py-4 rounded-xl font-semibold shadow-lg text-xl transition-transform hover:scale-105"
            >
              🔍 เริ่มจำแนกผัก
            </Link>
          </motion.div>
        </section>

        {/* ================= GALLERY ================= */}
        <section className="py-20 bg-white text-gray-800 dark:bg-gray-900 dark:text-white rounded-t-[3rem] shadow-2xl">
          <h3 className="text-3xl font-bold text-center mb-12">
            🖼 ตัวอย่างผักพื้นเมือง
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-6">
            {[
              { name: "มะแข่น", img: "/images/makhwaen2.png" },
              { name: "นางแลว", img: "/images/nanglaew2.png" },
              { name: "ผักเผ็ด", img: "/images/phak_phet3.png" },
            ].map((item, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -10 }}
                className="bg-gray-100 dark:bg-gray-800 p-6 rounded-3xl shadow-lg border border-transparent hover:border-green-500/50 transition-all"
              >
                <div className="overflow-hidden rounded-2xl mb-4 h-48">
                   <img
                    src={item.img}
                    alt={item.name}
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-110"
                  />
                </div>

                <h4 className="text-center font-bold text-xl text-green-700 dark:text-green-400">
                  {item.name}
                </h4>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ================= FOOTER ================= */}
        <footer className="text-center py-12 bg-green-900 dark:bg-black text-green-300 text-sm border-t border-white/5">
          <p className="mb-2">© 2026 LannaVeg Project | University of Phayao</p>
          <p className="opacity-60 font-light italic">สำรวจคุณค่าผักพื้นเมืองด้วยปัญญาประดิษฐ์</p>
        </footer>
      </div>
    </>
  );
}
