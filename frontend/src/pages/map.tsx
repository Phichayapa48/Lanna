import { useEffect, useRef, useState } from "react";

export default function Map() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      setError("Google Maps API key not found");
      setLoading(false);
      return;
    }

    const initMap = () => {
      const google = (window as any).google;
      if (!google || !mapRef.current) return;

      const chiangMai = { lat: 18.7883, lng: 98.9853 };

      const map = new google.maps.Map(mapRef.current, {
        center: chiangMai,
        zoom: 12,
      });

      new google.maps.Marker({
        position: chiangMai,
        map,
        title: "Chiang Mai",
      });

      setLoading(false);
    };

    // ถ้า google โหลดแล้ว
    if ((window as any).google) {
      initMap();
      return;
    }

    // กันโหลดซ้ำ
    if (!document.getElementById("google-maps-script")) {
      const script = document.createElement("script");
      script.id = "google-maps-script";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      script.onerror = () => {
        setError("Failed to load Google Maps");
        setLoading(false);
      };

      document.head.appendChild(script);
    }
  }, []);

  return (
    <div className="h-screen w-full relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
          <p className="text-lg font-semibold text-green-700">
            🗺 Loading Map...
          </p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
          <p className="text-red-500 font-semibold">{error}</p>
        </div>
      )}

      <div ref={mapRef} className="h-full w-full" />
    </div>
  );
}