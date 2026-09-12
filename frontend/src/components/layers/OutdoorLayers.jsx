import GeoJsonLayer from "../map/GeoJsonLayer";
import L from "leaflet";

export default function OutdoorLayers() {
  return (
    <>
      {/* Outdoor Walkways */}
      <GeoJsonLayer
        url="/data/campus/walkways.geojson"
        interactive={false}
        style={{
          color: "#FFFFFF",
          weight: 4,
          opacity: 1,
        }}
      />

      {/* Entrances */}
      <GeoJsonLayer
        url="/data/campus/entrances.geojson"
        interactive={false}
        pointToLayer={(feature, latlng) =>
          L.circleMarker(latlng, {
            radius: 6,
            color: "#FFFFFF",
            weight: 2,
            fillColor: "#E9A400",
            fillOpacity: 1,
            interactive: false,
          })
        }
      />
    </>
  );
}