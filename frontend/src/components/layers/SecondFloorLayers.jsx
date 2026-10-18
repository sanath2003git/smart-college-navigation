import GeoJsonLayer from "../map/GeoJsonLayer";

export default function SecondFloorLayers({
  building,
}) {
  return (
    <>
      {/* ===================================
          Chemical Block - Second Floor
          =================================== */}

      {building === "Chemical Block" && (
        <>
          {/* Rooms */}
          <GeoJsonLayer
            url="/data/chemical/second_floor/rooms.geojson"
            interactive={false}
            labelProperty="room_no"
            labelClassName="smartnav-room-label"
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
          Mechanical Block - Second Floor
          =================================== */}

      {building === "Mechanical Block" && (
        <>
          {/* Indoor Navigation Paths */}
          <GeoJsonLayer
            url="/data/mechanical/second_floor/paths.geojson"
            interactive={false}
            style={{
              color: "#ff9800",
              weight: 3,
              dashArray: "6,4",
            }}
          />

          {/* Rooms */}
          <GeoJsonLayer
            url="/data/mechanical/second_floor/rooms.geojson"
            interactive={false}
            labelProperty="room_no"
            labelClassName="smartnav-room-label"
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