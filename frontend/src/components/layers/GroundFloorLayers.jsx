import GeoJsonLayer from "../map/GeoJsonLayer";

export default function GroundFloorLayers({
  building,
}) {
  console.log("GroundFloorLayers building:", building);

  return (
    <>
      {/* Chemical Block */}
      {building === "Chemical Block" && (
        <>
          {/* Indoor Navigation Paths */}
          <GeoJsonLayer
            url="/data/chemical/ground_floor/paths.geojson"
            interactive={false}
            style={{
              color: "#ff9800",
              weight: 3,
              dashArray: "6,4",
            }}
          />

          {/* Rooms */}
          <GeoJsonLayer
            url="/data/chemical/ground_floor/rooms.geojson"
            interactive={false}
            style={{
              color: "#00acc1",
              weight: 1,
              fillColor: "#80deea",
              fillOpacity: 0.35,
            }}
          />
        </>
      )}

      {/* Mechanical Block */}
      {building === "Mechanical Block" && (
        <>
          {/* Indoor Navigation Paths */}
          <GeoJsonLayer
            url="/data/mechanical/ground_floor/paths.geojson"
            interactive={false}
            style={{
              color: "#ff9800",
              weight: 3,
              dashArray: "6,4",
            }}
          />

          {/* Rooms */}
          <GeoJsonLayer
            url="/data/mechanical/ground_floor/rooms.geojson"
            interactive={false}
            style={{
              color: "#8e24aa",
              weight: 1,
              fillColor: "#ce93d8",
              fillOpacity: 0.35,
            }}
          />
        </>
      )}
    </>
  );
}