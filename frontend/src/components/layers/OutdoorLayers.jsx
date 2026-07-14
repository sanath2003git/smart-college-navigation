import GeoJsonLayer from "../map/GeoJsonLayer";

export default function OutdoorLayers({
  handleBuildingClick,
}) {
  return (
    <>
      {/* Buildings */}
      <GeoJsonLayer
        url="/data/buildings.geojson"
        interactive={true}
        onEachFeature={handleBuildingClick}
        style={{
          color: "#d32f2f",
          weight: 2,
          fillColor: "#ef9a9a",
          fillOpacity: 0.5,
        }}
      />

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