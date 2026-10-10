import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "@tomickigrzegorz/leaflet-rotate";

import PermanentLayers from "../layers/PermanentLayers";
import GroundFloorLayers from "../layers/GroundFloorLayers";
import FirstFloorLayers from "../layers/FirstFloorLayers";
import SecondFloorLayers from "../layers/SecondFloorLayers";
import ThirdFloorLayers from "../layers/ThirdFloorLayers";
import FloorSelector from "../navigation/FloorSelector";
import { BUILDING_CONFIGS } from "../../constants/buildingConfigs";

/**
 * Controller that actively enforces strict bounds on desktop and mobile.
 * Clamps camera center and viewport so the user cannot drag or fling to neighboring buildings,
 * and enforces minimum zoom limits so the wider campus cannot be viewed.
 */
function StrictBoundsController({ bounds, minZoom, maxZoom, center, zoom }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !bounds) return;

    const latLngBounds = L.latLngBounds(bounds);

    // 1. Direct Leaflet configuration
    map.setMinZoom(minZoom);
    map.setMaxZoom(maxZoom);
    map.setMaxBounds(latLngBounds);
    map.options.maxBoundsViscosity = 1.0;
    map.options.inertia = false; // Disable fling momentum to prevent panning past bounds

    // 2. Initial view enforcement
    const targetZoom = Math.max(zoom || minZoom, minZoom);
    map.setView(center, targetZoom, { animate: false });
    map.panInsideBounds(latLngBounds, { animate: false });

    // 3. Active clamping handler
    const enforce = () => {
      // Minimum zoom enforcement
      if (map.getZoom() < minZoom) {
        map.setZoom(minZoom, { animate: false });
      }

      // Camera center clamping within allowed box
      const curCenter = map.getCenter();
      const south = latLngBounds.getSouth();
      const north = latLngBounds.getNorth();
      const west = latLngBounds.getWest();
      const east = latLngBounds.getEast();

      const clampedLat = Math.min(Math.max(curCenter.lat, south), north);
      const clampedLng = Math.min(Math.max(curCenter.lng, west), east);

      if (curCenter.lat !== clampedLat || curCenter.lng !== clampedLng) {
        map.setView([clampedLat, clampedLng], map.getZoom(), { animate: false });
      }

      // Viewport edge enforcement
      map.panInsideBounds(latLngBounds, { animate: false });
    };

    // Listen to all movement events on Leaflet instance
    map.on("drag", enforce);
    map.on("move", enforce);
    map.on("moveend", enforce);
    map.on("zoomend", enforce);

    const container = map.getContainer();
    const handleTouch = () => {
      enforce();
    };
    container.addEventListener("touchmove", handleTouch, { passive: true });
    container.addEventListener("touchend", handleTouch, { passive: true });

    enforce();

    return () => {
      map.off("drag", enforce);
      map.off("move", enforce);
      map.off("moveend", enforce);
      map.off("zoomend", enforce);
      container.removeEventListener("touchmove", handleTouch);
      container.removeEventListener("touchend", handleTouch);
    };
  }, [map, bounds, minZoom, maxZoom, center, zoom]);

  return null;
}

export default function BuildingFloorExplorer({ buildingName }) {
  const navigate = useNavigate();

  const config = BUILDING_CONFIGS[buildingName] || {
    name: buildingName,
    center: [8.9138, 76.6323],
    bounds: [
      [8.912, 76.63],
      [8.915, 76.634],
    ],
    zoom: 19.5,
    minZoom: 19,
    maxZoom: 22,
    availableFloors: [],
    defaultFloor: 0,
    hasFloorData: false,
  };

  const hasFloorData =
    Boolean(config.hasFloorData) &&
    Array.isArray(config.availableFloors) &&
    config.availableFloors.length > 0;

  // Local exploration floor selection (isolated from navigation state)
  const [selectedFloor, setSelectedFloor] = useState(config.defaultFloor ?? 0);

  useEffect(() => {
    setSelectedFloor(config.defaultFloor ?? 0);
  }, [buildingName, config.defaultFloor]);

  /**
   * Handle building polygon interaction in building explorer.
   * Navigates to a different building's page when clicked/tapped, while
   * ignoring clicks on the currently viewed building.
   */
  const handleBuildingClick = useCallback(
    (feature, layer) => {
      const clickedName = feature?.properties?.name;
      const isCurrentBuilding = clickedName === config.name;
      const targetRoute = clickedName ? BUILDING_CONFIGS[clickedName]?.route : null;
      const isNavigable = Boolean(targetRoute && !isCurrentBuilding);

      const normalStyle = {
        color: isCurrentBuilding ? "#0E4F63" : "#4F8F8A",
        weight: isCurrentBuilding ? 3 : 2,
        opacity: 1,
        fillColor: isCurrentBuilding ? "#82B8AE" : "#A9CEC6",
        fillOpacity: 1,
        className: isCurrentBuilding
          ? "active-building-polygon"
          : "navigable-building-polygon",
      };

      const hoverStyle = {
        color: "#0E4F63",
        weight: 3.5,
        opacity: 1,
        fillColor: "#82B8AE",
        fillOpacity: 1,
        className: "navigable-building-polygon",
      };

      layer.on({
        mouseover: () => {
          if (isNavigable) {
            layer.setStyle(hoverStyle);
            if (typeof layer.bringToFront === "function") {
              layer.bringToFront();
            }
          }
        },
        mouseout: () => {
          if (isNavigable) {
            layer.setStyle(normalStyle);
          }
        },
        click: () => {
          // Clicking current building or unmapped polygon is a no-op
          if (!isNavigable || !targetRoute) {
            return;
          }
          navigate(targetRoute);
        },
      });
    },
    [config.name, navigate]
  );

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      {/* =======================================================
          TOP BAR CONTROLS (Back to Campus + Reused FloorSelector)
      ======================================================= */}
      <div className="building-explorer-topbar">
        <button
          type="button"
          className="smartnav-back-to-campus-btn"
          onClick={() => navigate("/")}
          aria-label="Back to Campus Map"
        >
          <ArrowLeftIcon />
          <span>Campus Map</span>
        </button>

        {/* Display shared FloorSelector only for buildings with floor data */}
        {hasFloorData && (
          <FloorSelector
            mode="explore"
            building={config.name}
            availableFloors={config.availableFloors}
            activeFloor={selectedFloor}
            onFloorChange={setSelectedFloor}
          />
        )}
      </div>

      {/* =======================================================
          INFORMATIONAL OVERLAY (Buildings without floor data)
          Shows on top of the real building polygon without replacing the map
      ======================================================= */}
      {!hasFloorData && (
        <div className="building-no-data-overlay" role="status">
          <div className="bndo-header">
            <div className="bndo-icon" aria-hidden="true">
              <BuildingIcon />
            </div>
            <div className="bndo-title">{config.name}</div>
          </div>
          <p className="bndo-desc">
            Indoor floor plans and room layouts are not yet mapped for this building.
          </p>
        </div>
      )}

      {/* =======================================================
          LEAFLET MAP (Strictly bounded to building viewing area)
      ======================================================= */}
      <MapContainer
        key={config.name}
        center={config.center}
        zoom={config.zoom || 19.5}
        minZoom={config.minZoom || 19}
        maxZoom={config.maxZoom || 22}
        maxBounds={config.bounds}
        maxBoundsViscosity={1.0}
        inertia={false}
        rotate={true}
        bearing={0}
        touchRotate={false}
        dragRotate={false}
        shiftKeyRotate={false}
        className="min-h-0 flex-1 w-full"
      >
        <StrictBoundsController
          bounds={config.bounds}
          minZoom={config.minZoom || 19}
          maxZoom={config.maxZoom || 22}
          center={config.center}
          zoom={config.zoom || 19.5}
        />

        {/* OpenStreetMap Base Tile Layer */}
        <TileLayer
          attribution="© OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Permanent Campus Layers (Building polygon underneath, no locate button) */}
        <PermanentLayers
          handleBuildingClick={handleBuildingClick}
          activeBuilding={config.name}
          showControls={false}
        />

        {/* Indoor Floor Layers (Rendered above PermanentLayers when floor data exists) */}
        {hasFloorData && selectedFloor === 0 && (
          <GroundFloorLayers building={config.name} />
        )}
        {hasFloorData && selectedFloor === 1 && (
          <FirstFloorLayers building={config.name} />
        )}
        {hasFloorData && selectedFloor === 2 && (
          <SecondFloorLayers building={config.name} />
        )}
        {hasFloorData && selectedFloor === 3 && (
          <ThirdFloorLayers building={config.name} />
        )}
      </MapContainer>
    </div>
  );
}

function ArrowLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="15"
      height="15"
    >
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="18"
      height="18"
    >
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01" />
      <path d="M16 6h.01" />
      <path d="M8 10h.01" />
      <path d="M16 10h.01" />
      <path d="M8 14h.01" />
      <path d="M16 14h.01" />
    </svg>
  );
}
