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

import InitialFloorSelection
  from "../../components/navigation/InitialFloorSelection";

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

    initialFloorSelection,
    confirmInitialFloorSelection,
  } = useNavigation();

  const center = [
    8.9138,
    76.6323,
  ];

  // ==========================================
  // Navigation / Building Detection Hooks
  // ==========================================

  useCurrentBuilding();

  useIndoorEntry();

  useNavigationStage();

  useFloorTransition();

  useDestinationArrival();

  // ==========================================
  // Building Interaction
  // ==========================================

  const handleBuildingClick = (
    feature,
    layer
  ) => {
    // ----------------------------------------
    // Normal building style
    // ----------------------------------------

    const normalStyle = {
      color: "#4F8F8A",
      weight: 2,
      opacity: 1,
      fillColor: "#A9CEC6",
      fillOpacity: 1,
    };

    // ----------------------------------------
    // Hovered building style
    // ----------------------------------------

    const hoverStyle = {
      color: "#0E4F63",
      weight: 4,
      opacity: 1,
      fillColor: "#82B8AE",
      fillOpacity: 1,
    };

    // ----------------------------------------
    // Selected building style
    // ----------------------------------------

    const selectedStyle = {
      color: "#0E4F63",
      weight: 4,
      opacity: 1,
      fillColor: "#6FB3B8",
      fillOpacity: 1,
    };

    // ========================================
    // Leaflet Events
    // ========================================

    layer.on({

      // --------------------------------------
      // Mouse enters building
      // --------------------------------------

      mouseover: () => {
        layer.setStyle(
          hoverStyle
        );

        if (
          typeof layer.bringToFront ===
          "function"
        ) {
          layer.bringToFront();
        }

        const element =
          layer.getElement?.();

        if (element) {
          element.style.cursor =
            "pointer";
        }
      },

      // --------------------------------------
      // Mouse leaves building
      // --------------------------------------

      mouseout: () => {
        layer.setStyle(
          normalStyle
        );
      },

      // --------------------------------------
      // Building clicked
      // --------------------------------------

      click: () => {
        layer.setStyle(
          selectedStyle
        );

        const buildingName =
          feature.properties?.name;

        console.log(
          "Building clicked:",
          buildingName
        );

        // ====================================
        // Building → Page Route Mapping
        // ====================================

        switch (buildingName) {

          case "Mechanical Block":
            navigate("/mechanical");
            break;

          case "Chemical Block":
            navigate("/chemical");
            break;

          case "Main Block":
            navigate("/main");
            break;

          case "Central Library":
            navigate("/library");
            break;

          case "Workshop Block":
            navigate("/workshop");
            break;

          case "Workshop (Electrical)":
            navigate(
              "/electrical-workshop"
            );
            break;

          case "Architecture Block":
            navigate(
              "/architecture"
            );
            break;

          case "Interdisciplinary Research Block (RUSA)":
            navigate("/research");
            break;

          default:
            console.warn(
              "No route configured for building:",
              buildingName
            );
        }
      },
    });
  };

  // ==========================================
  // Navigation Graph Initialization
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

  // ==========================================
  // Render
  // ==========================================

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">

      {/* =====================================
          Initial Floor Selection
          ===================================== */}

      {initialFloorSelection.open && (
        <InitialFloorSelection
          building={
            initialFloorSelection.building
          }
          onConfirm={
            confirmInitialFloorSelection
          }
        />
      )}

      {/* =====================================
          Floor Transition Prompt
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

      {/* =====================================
          Leaflet Campus Map
          ===================================== */}

      <MapContainer
        center={center}
        zoom={18}
        minZoom={17}
        maxZoom={22}
        maxBounds={CAMPUS_BOUNDS}
        maxBoundsViscosity={1.0}
        className="min-h-0 flex-1 w-full"
      >

        {/* ===================================
            OpenStreetMap Base Layer
            =================================== */}

        <TileLayer
          attribution="© OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* ===================================
            Permanent Campus Layers
            =================================== */}

        <PermanentLayers
          handleBuildingClick={
            handleBuildingClick
          }
        />

        {/* ===================================
            Outdoor Layers
            =================================== */}

        {navigationStage ===
          NAVIGATION_STAGE.OUTDOOR && (
          <OutdoorLayers />
        )}

        {/* ===================================
            Ground Floor
            =================================== */}

        {navigationStage ===
          NAVIGATION_STAGE.GROUND_FLOOR && (
          <GroundFloorLayers
            building={
              selectedBuilding
            }
          />
        )}

        {/* ===================================
            First Floor
            =================================== */}

        {navigationStage ===
          NAVIGATION_STAGE.FIRST_FLOOR && (
          <FirstFloorLayers
            building={
              selectedBuilding
            }
          />
        )}

        {/* ===================================
            Second Floor
            =================================== */}

        {navigationStage ===
          NAVIGATION_STAGE.SECOND_FLOOR && (
          <SecondFloorLayers
            building={
              selectedBuilding
            }
          />
        )}

        {/* ===================================
            Third Floor
            =================================== */}

        {navigationStage ===
          NAVIGATION_STAGE.THIRD_FLOOR && (
          <ThirdFloorLayers
            building={
              selectedBuilding
            }
          />
        )}

        {/* ===================================
            Navigation Route
            =================================== */}

        <RouteLayer
          path={route}
        />

      </MapContainer>
    </div>
  );
}