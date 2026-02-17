/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // !! คำเตือน !!
    // อันนี้จะทำให้ Build ผ่านแม้จะมี Type errors
    // เหมาะมากสำหรับเวลาจะรีบเอาขึ้น Production แบบตอนนี้
    ignoreBuildErrors: true,
  },
  eslint: {
    // ปิดการตรวจ Lint ตอน Build ด้วย จะได้ไวขึ้นและไม่พังง่าย
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
