import { useMap } from "react-leaflet";
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
      style={{
        position: "absolute",
        right: "15px",
        bottom: "20px",
        zIndex: 1000,
        padding: "10px 14px",
        borderRadius: "10px",
        border: "none",
        background: "#2563eb",
        color: "white",
        cursor: "pointer",
        boxShadow: "0 2px 8px rgba(0,0,0,.3)",
      }}
    >
      📍 Locate Me
    </button>
  );
}