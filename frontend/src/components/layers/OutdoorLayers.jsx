import GeoJsonLayer from "../map/GeoJsonLayer";

export default function OutdoorLayers() {
  return (
    <>

      {/* Outdoor Walkways */}
      <GeoJsonLayer
        url="/data/campus/walkways.geojson"
        interactive={false}
        style={{
          color: "#bad9ce",
          weight: 5.5,
        }}
      />

      {/* Entrances */}
      <GeoJsonLayer
        url="/data/campus/entrances.geojson"
        interactive={false}
      />
    </>
  );
}