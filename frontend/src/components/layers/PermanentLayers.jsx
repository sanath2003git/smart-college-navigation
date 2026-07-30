import GeoJsonLayer from "../map/GeoJsonLayer";
import CurrentLocation from "../map/CurrentLocation";
import LocateButton from "../controls/LocateButton";

export default function PermanentLayers({
  handleBuildingClick,
}) {
  return (
    <>
      {/* Campus Boundary */}
      <GeoJsonLayer
        url="/data/campus/campus_outline.geojson"
        interactive={false}
        style={{
          color: "#1b5e20",
          weight: 3,
          fillColor: "#a5d6a7",
          fillOpacity: 1,
        }}
      />

      {/* Buildings */}
      <GeoJsonLayer
        url="/data/campus/buildings.geojson"
        interactive={true}
        onEachFeature={handleBuildingClick}
        style={{
          color: "#388095",
          weight: 2,
          fillColor: "#62b2cb",
          fillOpacity: 0.5,
        }}
      />

      {/* Current Location */}
      <CurrentLocation />

      {/* Locate Button */}
      <LocateButton />
    </>
  );
}