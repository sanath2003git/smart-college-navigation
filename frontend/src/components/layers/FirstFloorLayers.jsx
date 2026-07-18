import GeoJsonLayer from "../map/GeoJsonLayer";

export default function FirstFloorLayers({
  building,
}) {
  return (
    <>
      {/* Indoor Navigation Paths */}
      <GeoJsonLayer
        url="/data/indoor_paths_ff.geojson"
        interactive={false}
        style={{
          color: "#ff9800",
          weight: 3,
          dashArray: "6,4",
        }}
      />

      {/* Chemical First Floor */}
      {building === "Chemical Block" && (
  <GeoJsonLayer
    url="/data/chemical_ff.geojson"
    interactive={false}
    style={{
      color: "#00acc1",
      weight: 1,
      fillColor: "#80deea",
      fillOpacity: 0.35,
    }}
  />
)}
    </>
  );
}