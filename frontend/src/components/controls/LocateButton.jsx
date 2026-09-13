import { useEffect, useState } from "react";
import { useMap } from "react-leaflet";
import { Crosshair } from "lucide-react";

import { useLocation } from "../../hooks/useLocation";

export default function LocateButton() {
  const map = useMap();

  const { location } = useLocation();

  const [isCentered, setIsCentered] = useState(true);

  // ==========================================
  // Check whether map is centered on GPS
  // ==========================================

  const checkCentered = () => {
    if (!location) return;

    const center = map.getCenter();

    const distance = map.distance(
      center,
      [location.lat, location.lng]
    );

    // Consider map centered if within 30 meters
    setIsCentered(distance <= 30);
  };

  // ==========================================
  // Detect user moving the map
  // ==========================================

  useEffect(() => {
    if (!location) return;

    const handleMapMove = () => {
      checkCentered();
    };

    map.on("moveend", handleMapMove);

    return () => {
      map.off("moveend", handleMapMove);
    };
  }, [map, location]);

  // ==========================================
  // Re-center map
  // ==========================================

  const handleLocate = () => {
    if (!location) return;

    map.flyTo(
      [location.lat, location.lng],
      21.5,
      {
        animate: true,
        duration: 1.2,
      }
    );
  };

  return (
    <button
      type="button"
      onClick={handleLocate}
      title={
        isCentered
          ? "Locate Me"
          : "Re-center on your location"
      }
      aria-label={
        isCentered
          ? "Locate Me"
          : "Re-center on your location"
      }
      className={`
        absolute
        bottom-5
        right-5
        z-[1000]

        flex
        h-11
        w-11
        items-center
        justify-center

        rounded-xl
        border

        bg-white

        transition-all
        duration-200

        active:scale-95

        focus:outline-none
        focus:ring-2
        focus:ring-blue-500
        focus:ring-offset-2

        ${
          isCentered
            ? `
              border-slate-200
              shadow-[0_4px_14px_rgba(20,33,55,0.18)]
            `
            : `
              border-blue-200
              shadow-[0_5px_16px_rgba(37,99,235,0.25)]
            `
        }

        hover:bg-slate-50
        hover:shadow-[0_6px_18px_rgba(20,33,55,0.22)]
      `}
    >
      <Crosshair
        size={isCentered ? 20 : 22}
        strokeWidth={isCentered ? 2.2 : 2.5}
        className="text-blue-600"
      />
    </button>
  );
}