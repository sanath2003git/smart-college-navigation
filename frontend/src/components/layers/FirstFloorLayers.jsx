import GeoJsonLayer from "../map/GeoJsonLayer";

export default function FirstFloorLayers({
  building,
}) {
  return (
    <>
      {/* ===================================
          Chemical Block - First Floor
          =================================== */}

      {building === "Chemical Block" && (
        <>
          {/* Indoor Navigation Paths */}
          <GeoJsonLayer
            url="/data/chemical/first_floor/paths.geojson"
            interactive={false}
            style={{
              color: "#ff9800",
              weight: 3,
              dashArray: "6,4",
            }}
          />

          {/* Rooms */}
          <GeoJsonLayer
            url="/data/chemical/first_floor/rooms.geojson"
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

      {/* ===================================
          Mechanical Block - First Floor
          =================================== */}

      {building === "Mechanical Block" && (
        <>
          {/* Indoor Navigation Paths */}
          <GeoJsonLayer
            url="/data/mechanical/first_floor/paths.geojson"
            interactive={false}
            style={{
              color: "#ff9800",
              weight: 3,
              dashArray: "6,4",
            }}
          />

          {/* Rooms */}
          <GeoJsonLayer
            url="/data/mechanical/first_floor/rooms.geojson"
            interactive={false}
            style={{
              color: "#388095",
              weight: 1,
              fillColor: "#bfe7f3",
              fillOpacity: 0.35,
            }}
          />
        </>
      )}
    </>
  );
}