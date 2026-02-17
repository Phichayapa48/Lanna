import "../styles/globals.css";
import type { AppProps } from "next/app";
import { useEffect, useState } from "react";
import Head from "next/head";

export default function MyApp({ Component, pageProps }: AppProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  // ✅ 1. จัดการเรื่อง Theme เมื่อ Component เริ่มทำงาน
  useEffect(() => {
    setMounted(true);
    
    // ดึงค่าจาก LocalStorage ถ้าไม่มีให้ใช้ light
    const savedTheme = (localStorage.getItem("theme") as "light" | "dark") || "light";
    setTheme(savedTheme);
    
    // จัดการ Class ใน Document เพื่อให้ Tailwind dark mode ทำงาน
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // ✅ 2. ฟังก์ชันสลับ Theme
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);

    // ใช้ toggle เพื่อความกริบของโค้ด
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  // ✅ 3. ป้องกัน Hydration Mismatch (หน้าจอกระพริบตอนโหลด)
  if (!mounted) {
    return null;
  }

  return (
    <>
      <Head>
        <title>LannaVeg - ระบบจำแนกผักพื้นเมือง</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
        {/* 🔥 ถ้าแอ๋มอยากเปิด Navbar ให้โชว์ทุกหน้า 
           ให้สร้างไฟล์ Navbar.tsx แล้วมา Un-comment ตรงนี้ได้เลย 
        */}
        {/* <Navbar theme={theme} toggleTheme={toggleTheme} /> */}

        <main>
          {/* ✅ ส่ง theme และ toggleTheme เข้าไปใน pageProps เพื่อให้หน้าลูกดึงไปใช้ได้ */}
          <Component 
            {...pageProps} 
            theme={theme} 
            toggleTheme={toggleTheme} 
          />
        </main>
      </div>
    </>
  );
}
