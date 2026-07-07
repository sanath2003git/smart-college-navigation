import { useEffect, useState } from "react";
import { GeoJSON } from "react-leaflet";
import L from "leaflet";

export default function GeoJsonLayer({
  url,
  style,
  pointToLayer,
  onEachFeature,
  interactive = true,
}) {
  const [data, setData] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch(url);
        const geojson = await response.json();
        setData(geojson);
      } catch (err) {
        console.error(`Error loading ${url}`, err);
      }
    }

    loadData();
  }, [url]);

  if (!data) return null;

  return (
    <GeoJSON
      data={data}
      style={style}
      interactive={interactive}
      pointToLayer={
        pointToLayer ||
        ((feature, latlng) =>
          L.circleMarker(latlng, {
            radius: 6,
            color: "#ff5722",
            fillColor: "#ff5722",
            fillOpacity: 1,
            interactive,
          })
        )
      }
      onEachFeature={onEachFeature}
    />
  );
}