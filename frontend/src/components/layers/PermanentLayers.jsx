import GeoJsonLayer from "../map/GeoJsonLayer";
import CurrentLocation from "../map/CurrentLocation";
import LocateButton from "../controls/LocateButton";

export default function PermanentLayers({
  handleBuildingClick,
  activeBuilding = null,
  showControls = true,
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
        labelProperty={(feat) => {
          if (activeBuilding && feat?.properties?.name === activeBuilding) {
            return null;
          }
          return feat?.properties?.name || null;
        }}
        style={(feature) => {
          const isActive =
            activeBuilding &&
            feature?.properties?.name === activeBuilding;
          return {
            color: isActive ? "#0E4F63" : "#4F8F8A",
            weight: isActive ? 3 : 2,
            opacity: 1,
            fillColor: isActive ? "#82B8AE" : "#A9CEC6",
            fillOpacity: 1,
            className: isActive
              ? "active-building-polygon"
              : "navigable-building-polygon",
          };
        }}
      />

      {/* =====================================
          Current Location
          ===================================== */}

      <CurrentLocation />

      {/* =====================================
          Locate Button
          ===================================== */}

      {showControls && <LocateButton />}
    </>
  );
}