import { GeoJSON } from "react-leaflet";
import { useEffect, useState } from "react";

export default function WalkwayLayer() {
  const [walkways, setWalkways] = useState(null);

  useEffect(() => {
    fetch("/data/walkways.geojson")
      .then((res) => res.json())
      .then((data) => setWalkways(data));
  }, []);

  if (!walkways) return null;

  return (
    <GeoJSON
      data={walkways}
      style={{
        color: "#2563eb",
        weight: 5,
      }}
    />
  );
}