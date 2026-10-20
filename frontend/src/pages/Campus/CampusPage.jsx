import { useEffect, useState, useCallback } from "react";

import {
  MapContainer,
  TileLayer,
} from "react-leaflet";

import { useNavigate } from "react-router-dom";
import { Box } from "lucide-react";

import "leaflet/dist/leaflet.css";

import "leaflet";
import "@tomickigrzegorz/leaflet-rotate";

import PermanentLayers
  from "../../components/layers/PermanentLayers";

import OutdoorLayers
  from "../../components/layers/OutdoorLayers";

import RouteLayer
  from "../../components/map/RouteLayer";

import OutdoorMap3D
  from "../../components/map/OutdoorMap3D";

import { loadGraphs }
  from "../../navigation/loadGraphs";

import { useNavigation }
  from "../../hooks/useNavigation";

import { useLocation }
  from "../../hooks/useLocation";

import { useLiveCampusEvents }
  from "../../hooks/useLiveCampusEvents";

import EventMapMarkersLayer
  from "../../components/map/EventMapMarkersLayer";

import { startNavigationToVenue }
  from "../../services/venueNavigationService";

const CAMPUS_BOUNDS = [
  [8.9118, 76.6298],
  [8.9162, 76.6352],
];

export default function CampusPage() {
  const navigate = useNavigate();
  const [is3DMode, setIs3DMode] = useState(true);

  const navContext = useNavigation();
  const locationContext = useLocation();
  const {
    selectedBuilding,
    currentBuilding,
    route,
  } = navContext;

  const { groupedVenues, now } = useLiveCampusEvents();

  const handleNavigateToVenue = useCallback(
    async (venue) => {
      if (!venue) return;
      await startNavigationToVenue(venue, navContext, navigate, {
        fallbackLocation:
          locationContext?.rawLocation || locationContext?.location,
      });
    },
    [navContext, navigate, locationContext]
  );

  const activeBuilding =
    selectedBuilding ||
    currentBuilding ||
    null;

  const center = [
    8.9138,
    76.6323,
  ];


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

  if (is3DMode) {
    return (
      <div className="relative flex h-full w-full flex-col overflow-hidden">
        <OutdoorMap3D
          onToggle2D={() => setIs3DMode(false)}
          liveVenues={groupedVenues}
          onNavigateToVenue={handleNavigateToVenue}
          now={now}
        />
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      {/* 2D to 3D View Toggle */}
      <div className="smartnav-view-mode-toggle smartnav-view-mode-toggle-2d">
        <button
          type="button"
          onClick={() => setIs3DMode(true)}
          className="smartnav-mode-toggle-btn"
          title="Switch to 3D MapLibre Map"
          aria-label="Switch to 3D Map"
        >
          <Box size={14} strokeWidth={2.2} className="text-blue-600 shrink-0" />
        </button>
      </div>

      {/* =====================================
          Leaflet Campus Map (Strictly Outdoor)
          ===================================== */}
      <MapContainer
        center={center}
        zoom={18}
        minZoom={17}
        maxZoom={22}
        maxBounds={CAMPUS_BOUNDS}
        maxBoundsViscosity={1.0}
        rotate={true}
        bearing={0}
        touchRotate={false}
        dragRotate={false}
        shiftKeyRotate={false}
        className="min-h-0 flex-1 w-full"
      >
        {/* OpenStreetMap Base Layer */}
        <TileLayer
          attribution="© OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Permanent Campus Layers (Boundary, Areas, Building Footprints) */}
        <PermanentLayers
          handleBuildingClick={handleBuildingClick}
          activeBuilding={activeBuilding}
        />

        {/* Outdoor Walkways and Entrances (Always visible on Campus Map) */}
        <OutdoorLayers />

        {/* Outdoor Navigation Route */}
        <RouteLayer path={route} />

        {/* Live Campus Event Markers */}
        <EventMapMarkersLayer
          groupedVenues={groupedVenues}
          onNavigateToVenue={handleNavigateToVenue}
          now={now}
        />
      </MapContainer>
    </div>
  );
}