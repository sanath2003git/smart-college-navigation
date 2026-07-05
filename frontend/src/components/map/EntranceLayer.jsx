import { GeoJSON } from "react-leaflet";
import { useEffect, useState } from "react";
import L from "leaflet";

export default function EntranceLayer() {
  const [entrances, setEntrances] = useState(null);

  useEffect(() => {
    fetch("/data/entrances.geojson")
      .then((res) => res.json())
      .then((data) => setEntrances(data));
  }, []);

  if (!entrances) return null;

  return (
    <GeoJSON
      data={entrances}
      pointToLayer={(feature, latlng) =>
        L.circleMarker(latlng, {
          radius: 7,
          fillColor: "#16a34a",
          color: "#ffffff",
          weight: 2,
          opacity: 1,
          fillOpacity: 1,
        })
      }
      onEachFeature={(feature, layer) => {
        layer.bindPopup(`
          <b>${feature.properties.name}</b><br/>
          Building: ${feature.properties.building}<br/>
          Floor: ${feature.properties.floor}
        `);
      }}
    />
  );
}