import GeoJsonLayer from "../map/GeoJsonLayer";
import RouteLayer from "../map/RouteLayer";
import CurrentLocation from "../map/CurrentLocation";
import LocateButton from "../controls/LocateButton";

import { useNavigation } from "../../hooks/useNavigation";

export default function PermanentLayers() {
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

      {/* Navigation Route */}
      <RouteLayer path={route} />

      {/* Current Location */}
      <CurrentLocation />

      {/* Locate Button */}
      <LocateButton />
    </>
  );
}