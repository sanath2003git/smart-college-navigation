import GeoJsonLayer from "../map/GeoJsonLayer";
import CurrentLocation from "../map/CurrentLocation";
import LocateButton from "../controls/LocateButton";

export default function PermanentLayers({
  handleBuildingClick,
}) {
  return (
    <>
      {/* =====================================
          Campus Boundary
          ===================================== */}

      <GeoJsonLayer
        url="/data/campus/campus_outline.geojson"
        interactive={false}
        style={{
          color: "#8FB8AF",
          weight: 3,
          opacity: 1,
          fillColor: "#DCEAE6",
          fillOpacity: 1,
        }}
      />

      {/* =====================================
          Campus Areas
          ===================================== */}

      <GeoJsonLayer
        url="/data/campus/areas.geojson"
        interactive={false}
        style={{
          color: "#8FB8AF",
          weight: 1,
          opacity: 0.8,
          fillColor: "#A8D1C8",
          fillOpacity: 0.75,
        }}
      />

      {/* =====================================
          Buildings
          + Building Names
          ===================================== */}

      <GeoJsonLayer
        url="/data/campus/buildings.geojson"
        interactive={true}
        onEachFeature={handleBuildingClick}
        labelProperty="name"
        style={{
          color: "#4F8F8A",
          weight: 2,
          opacity: 1,
          fillColor: "#A9CEC6",
          fillOpacity: 1,
        }}
      />

      {/* =====================================
          Current Location
          ===================================== */}

      <CurrentLocation />

      {/* =====================================
          Locate Button
          ===================================== */}

      <LocateButton />
    </>
  );
}