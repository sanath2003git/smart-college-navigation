import GeoJsonLayer from "../map/GeoJsonLayer";
import RouteLayer from "../map/RouteLayer";
import CurrentLocation from "../map/CurrentLocation";
import LocateButton from "../controls/LocateButton";

import { useNavigation } from "../../hooks/useNavigation";

export default function PermanentLayers({
  handleBuildingClick,
}) {
  const { route } = useNavigation();

  return (
    <>
      {/* Campus Boundary */}
      <GeoJsonLayer
        url="/data/campus_outline.geojson"
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

      {/* Navigation Route */}
      <RouteLayer path={route} />

      {/* Current Location */}
      <CurrentLocation />

      {/* Locate Button */}
      <LocateButton />
    </>
  );
}