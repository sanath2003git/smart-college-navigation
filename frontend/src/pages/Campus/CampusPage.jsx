import { useEffect } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";

import PermanentLayers from "../../components/layers/PermanentLayers";
import OutdoorLayers from "../../components/layers/OutdoorLayers";
import GroundFloorLayers from "../../components/layers/GroundFloorLayers";
import FirstFloorLayers from "../../components/layers/FirstFloorLayers";

import { loadGraphs } from "../../navigation/loadGraphs";

import { useNavigation } from "../../hooks/useNavigation";
import { useNavigationStage } from "../../hooks/useNavigationStage";
import { useFloorTransition } from "../../hooks/useFloorTransition";

import { NAVIGATION_STAGE } from "../../constants/navigationStages";

const CAMPUS_BOUNDS = [
  [8.9118, 76.6298],
  [8.9162, 76.6352],
];

export default function CampusPage() {
  const navigate = useNavigate();

  const { navigationStage } = useNavigation();

  const center = [8.9138, 76.6323];

  // Automatic Outdoor → Ground Floor
  useNavigationStage();

  // Automatic Ground Floor → First Floor
  useFloorTransition();

  const handleBuildingClick = (feature, layer) => {
    layer.on({
      click: () => {
        const slug = feature.properties.slug;

        if (slug) {
          navigate(`/${slug}`);
        }
      },
    });
  };

  useEffect(() => {
    async function initializeNavigation() {
      try {
        console.log("CampusPage Loaded");

        const graphs = await loadGraphs();

        console.log("========== NAVIGATION ENGINE V2 ==========");

        console.log(
          "Outdoor Graph Nodes:",
          Object.keys(graphs.outdoor).length
        );

        console.log(
          "Ground Floor Graph Nodes:",
          Object.keys(graphs.groundFloor).length
        );

        console.log(
          "First Floor Graph Nodes:",
          Object.keys(graphs.firstFloor).length
        );

        console.log("Navigation Engine V2 Ready");
        console.log("==========================================");
      } catch (err) {
        console.error("Navigation Error:", err);
      }
    }

    initializeNavigation();
  }, []);

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <MapContainer
        center={center}
        zoom={18}
        minZoom={17}
        maxZoom={22}
        maxBounds={CAMPUS_BOUNDS}
        maxBoundsViscosity={1.0}
        style={{
          height: "calc(100vh - 170px)",
          width: "100%",
        }}
      >
        <TileLayer
          attribution="© OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Always Visible */}
        <PermanentLayers handleBuildingClick={handleBuildingClick} />

        {navigationStage === NAVIGATION_STAGE.OUTDOOR && (
          <OutdoorLayers/>
        )}

        {navigationStage === NAVIGATION_STAGE.GROUND_FLOOR && (
          <GroundFloorLayers />
        )}

        {navigationStage === NAVIGATION_STAGE.FIRST_FLOOR && (
          <FirstFloorLayers />
        )}
      </MapContainer>
    </div>
  );
}