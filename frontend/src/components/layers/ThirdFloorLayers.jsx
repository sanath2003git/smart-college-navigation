import GeoJsonLayer from "../map/GeoJsonLayer";

export default function ThirdFloorLayers({
  building,
}) {
  return (
    <>
      {/* ===================================
          Mechanical Block - Third Floor
          =================================== */}

      {building === "Mechanical Block" && (
        <>
          {/* Indoor Navigation Paths */}
          <GeoJsonLayer
            url="/data/mechanical/top_floor/paths.geojson"
            interactive={false}
            style={{
              color: "#ff9800",
              weight: 3,
              dashArray: "6,4",
            }}
          />

          {/* Rooms */}
          <GeoJsonLayer
            url="/data/mechanical/top_floor/rooms.geojson"
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