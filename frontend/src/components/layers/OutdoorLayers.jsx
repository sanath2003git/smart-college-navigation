import GeoJsonLayer from "../map/GeoJsonLayer";

export default function OutdoorLayers() {
  return (
    <>

      {/* Outdoor Walkways */}
      <GeoJsonLayer
        url="/data/walkways.geojson"
        interactive={false}
        style={{
          color: "#25eb92",
          weight: 4,
        }}
      />

      {/* Entrances */}
      <GeoJsonLayer
        url="/data/entrances.geojson"
        interactive={false}
      />
    </>
  );
}