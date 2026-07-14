import GeoJsonLayer from "../map/GeoJsonLayer";

export default function GroundFloorLayers() {
  return (
    <>
      {/* Indoor Navigation Paths */}
      <GeoJsonLayer
        url="/data/indoor_paths.geojson"
        interactive={false}
        style={{
          color: "#ff9800",
          weight: 3,
          dashArray: "6,4",
        }}
      />

      {/* Chemical Ground Floor */}
      <GeoJsonLayer
        url="/data/chemical_gf.geojson"
        interactive={false}
        style={{
          color: "#00acc1",
          weight: 1,
          fillColor: "#80deea",
          fillOpacity: 0.35,
        }}
      />

      {/* Mechanical Ground Floor */}
      <GeoJsonLayer
        url="/data/mechanical_gf.geojson"
        interactive={false}
        style={{
          color: "#8e24aa",
          weight: 1,
          fillColor: "#ce93d8",
          fillOpacity: 0.35,
        }}
      />
    </>
  );
}