import GeoJsonLayer from "../map/GeoJsonLayer";

export default function GroundFloorLayers({
  building,
}) { console.log("GroundFloorLayers building:", building);
  return (
    <>
      {/* Indoor Navigation Paths */}
      <GeoJsonLayer
        url="/data/chemical_gf_paths.geojson"
        interactive={false}
        style={{
          color: "#ff9800",
          weight: 3,
          dashArray: "6,4",
        }}
      />

      {building === "Chemical Block" && (
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
)}

{building === "Mechanical Block" && (
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
)}

    </>
  );
}