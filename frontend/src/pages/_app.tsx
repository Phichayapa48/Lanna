import "../styles/globals.css";
import type { AppProps } from "next/app";
import Navbar from "../components/Navbar"; // 🔥 ยังเก็บไว้
import { useEffect, useState } from "react";

export default function MyApp({ Component, pageProps }: AppProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const savedTheme =
      (localStorage.getItem("theme") as "light" | "dark") || "light";

    setTheme(savedTheme);

    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";

    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);

    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  if (!mounted) return null;

  return (
    <>
      {/* 🔥 ปิด Navbar ตัวบนไว้ก่อน เพื่อไม่ให้ซ้อน */}
      {/* <Navbar theme={theme} toggleTheme={toggleTheme} /> */}

      {/* ✅ ส่ง theme และ toggleTheme ไปให้ทุกหน้าแทน */}
      <Component {...pageProps} theme={theme} toggleTheme={toggleTheme} />
    </>
  );
}
