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
        duration: 1.2,
      }
    );
  };

  return (
    <button
      type="button"
      onClick={handleLocate}
      title="Locate Me"
      aria-label="Locate Me"
      className="
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
        border-slate-200

        bg-white

        text-slate-700

        shadow-[0_4px_14px_rgba(20,33,55,0.18)]

        transition-all
        duration-200

        hover:bg-slate-50
        hover:text-blue-600
        hover:shadow-[0_6px_18px_rgba(20,33,55,0.22)]

        active:scale-95

        focus:outline-none
        focus:ring-2
        focus:ring-blue-500
        focus:ring-offset-2
      "
    >
      <Crosshair
        size={20}
        strokeWidth={2.2}
        className="text-blue-600"
      />
    </button>
  );
}