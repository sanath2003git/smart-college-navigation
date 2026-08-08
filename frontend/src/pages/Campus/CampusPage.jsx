import { useEffect } from "react";

import {
  MapContainer,
  TileLayer,
} from "react-leaflet";

import { useNavigate } from "react-router-dom";

import "leaflet/dist/leaflet.css";

import PermanentLayers
  from "../../components/layers/PermanentLayers";

import OutdoorLayers
  from "../../components/layers/OutdoorLayers";

import GroundFloorLayers
  from "../../components/layers/GroundFloorLayers";

import FirstFloorLayers
  from "../../components/layers/FirstFloorLayers";

import SecondFloorLayers
  from "../../components/layers/SecondFloorLayers";

import ThirdFloorLayers
  from "../../components/layers/ThirdFloorLayers";

import FloorTransitionPrompt
  from "../../components/navigation/FloorTransitionPrompt";

import RouteLayer
  from "../../components/map/RouteLayer";

import { loadGraphs }
  from "../../navigation/loadGraphs";

import { useNavigation }
  from "../../hooks/useNavigation";

import { useNavigationStage }
  from "../../hooks/useNavigationStage";

import { useFloorTransition }
  from "../../hooks/useFloorTransition";

import { useDestinationArrival }
  from "../../hooks/useDestinationArrival";

import { NAVIGATION_STAGE }
  from "../../constants/navigationStages";

import useCurrentBuilding
  from "../../hooks/useCurrentBuilding";

import useIndoorEntry
  from "../../hooks/useIndoorEntry";

const CAMPUS_BOUNDS = [
  [8.9118, 76.6298],
  [8.9162, 76.6352],
];

export default function CampusPage() {
  const navigate = useNavigate();

  const {
    navigationStage,
    selectedBuilding,
    route,

    floorTransition,
    confirmFloorTransition,
  } = useNavigation();

  const center = [
    8.9138,
    76.6323,
  ];

  // ==========================================
  // Automatic Building Detection
  // ==========================================

  useCurrentBuilding();

  // ==========================================
  // Automatic Indoor Entry
  // ==========================================

  useIndoorEntry();

  // ==========================================
  // Outdoor → Ground Floor
  // ==========================================

  useNavigationStage();

  // ==========================================
  // Floor Transition
  // ==========================================

  useFloorTransition();

  // ==========================================
  // Destination Arrival
  // ==========================================

  useDestinationArrival();

  // ==========================================
  // Building Click
  // ==========================================

  const handleBuildingClick = (
    feature,
    layer
  ) => {
    layer.on({
      click: () => {
        const slug =
          feature.properties.slug;

        if (slug) {
          navigate(`/${slug}`);
        }
      },
    });
  };

  // ==========================================
  // Load Navigation Graphs
  // ==========================================

  useEffect(() => {
    async function initializeNavigation() {
      try {
        console.log(
          "CampusPage Loaded"
        );

        const graphs =
          await loadGraphs();

        console.log(
          "========== NAVIGATION ENGINE V2 =========="
        );

        console.log(
          "Outdoor Graph Nodes:",
          Object.keys(
            graphs.outdoor
          ).length
        );

        console.log(
          "Ground Floor Graph Nodes:",
          Object.keys(
            graphs.groundFloor
          ).length
        );

        console.log(
          "First Floor Graph Nodes:",
          Object.keys(
            graphs.firstFloor
          ).length
        );

        console.log(
          "Navigation Engine V2 Ready"
        );

        console.log(
          "=========================================="
        );
      } catch (err) {
        console.error(
          "Navigation Error:",
          err
        );
      }
    }

    initializeNavigation();
  }, []);

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
      }}
    >
      {/* =====================================
          Floor Transition Confirmation
          ===================================== */}

      {floorTransition.open && (
        <FloorTransitionPrompt
          nextFloor={
            floorTransition.nextFloor
          }

          transitionType={
            floorTransition.transitionType
          }

          onConfirm={
            confirmFloorTransition
          }
        />
      )}

      <MapContainer
        center={center}
        zoom={18}
        minZoom={17}
        maxZoom={22}
        maxBounds={CAMPUS_BOUNDS}
        maxBoundsViscosity={1.0}
        style={{
          height:
            "calc(100vh - 170px)",
          width: "100%",
        }}
      >
        <TileLayer
          attribution="© OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* =====================================
            Always Visible
            ===================================== */}

        <PermanentLayers
          handleBuildingClick={
            handleBuildingClick
          }
        />

        {/* =====================================
            Outdoor
            ===================================== */}

        {navigationStage ===
          NAVIGATION_STAGE.OUTDOOR && (
          <OutdoorLayers />
        )}

        {/* =====================================
            Ground Floor
            ===================================== */}

        {navigationStage ===
          NAVIGATION_STAGE.GROUND_FLOOR && (
          <GroundFloorLayers
            building={
              selectedBuilding
            }
          />
        )}

        {/* =====================================
            First Floor
            ===================================== */}

        {navigationStage ===
          NAVIGATION_STAGE.FIRST_FLOOR && (
          <FirstFloorLayers
            building={
              selectedBuilding
            }
          />
        )}

        {/* =====================================
            Second Floor
            ===================================== */}

        {navigationStage ===
          NAVIGATION_STAGE.SECOND_FLOOR && (
          <SecondFloorLayers
            building={
              selectedBuilding
            }
          />
        )}

        {/* =====================================
            Third Floor
            ===================================== */}

        {navigationStage ===
          NAVIGATION_STAGE.THIRD_FLOOR && (
          <ThirdFloorLayers
            building={
              selectedBuilding
            }
          />
        )}

        {/* =====================================
            Navigation Route
            ===================================== */}

        <RouteLayer
          path={route}
        />
      </MapContainer>
    </div>
  );
}