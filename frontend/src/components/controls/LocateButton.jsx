import { useMap } from "react-leaflet";
import { Crosshair } from "lucide-react";

import { useLocation } from "../../hooks/useLocation";

export default function LocateButton() {
  const map = useMap();

  const { location } = useLocation();

  const handleLocate = () => {
    if (!location) return;

    map.flyTo(
      [location.lat, location.lng],
      21.5,
      {
        animate: true,
        duration: 1.5,
      }
    );
  };

  return (
    <button
      onClick={handleLocate}
      title="Locate Me"
      aria-label="Locate Me"
      className="
        absolute bottom-5 right-5 z-[1000]
        flex items-center gap-2
        rounded-2xl border border-slate-200
        bg-white px-4 py-3
        text-sm font-semibold text-slate-700
        shadow-[0_8px_25px_rgba(15,23,42,0.18)]
        transition-all duration-200
        hover:-translate-y-0.5
        hover:bg-slate-50
        hover:shadow-[0_12px_30px_rgba(15,23,42,0.22)]
        active:translate-y-0
      "
    >
      <Crosshair
        size={19}
        className="text-blue-600"
      />

      <span className="hidden sm:inline">
        Locate Me
      </span>
    </button>
  );
}