import { useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Map, NavigationControl, Marker, setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import * as turf from "@turf/turf";
import { Crosshair } from "lucide-react";

// Configure MapLibre Web Worker explicitly for Vite
setWorkerUrl(workerUrl);

import { useNavigation } from "../../hooks/useNavigation";
import { useLocation } from "../../hooks/useLocation";
import useDeviceHeading from "../../hooks/useDeviceHeading";
import {
  BUILDING_3D_CONFIG,
  NON_EXTRUDED_SURFACES,
  buildBuildingHeightExpression,
  buildBuildingColorExpression,
} from "../../config/building3DConfig";
import { BUILDING_CONFIGS } from "../../constants/buildingConfigs";

// Campus geographic bounds clamped to campus area
const CAMPUS_BOUNDS = [
  [76.628, 8.910], // Southwest [lng, lat]
  [76.637, 8.918], // Northeast [lng, lat]
];

const INITIAL_CENTER = [76.6323, 8.9138]; // [lng, lat]
const INITIAL_ZOOM = 18;
const INITIAL_PITCH = 45; // Angled to showcase 3D extrusion
const INITIAL_BEARING = -15; // Oriented towards Mechanical Block
const DISPLAY_ACCURACY_RADIUS_METRES = 4; // Fixed 4-metre visual radius matching CurrentLocation.jsx

export default function OutdoorMap3D({ onToggle2D }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const gpsMarkerRef = useRef(null);

  const navigate = useNavigate();

  const {
    route,
    selectedBuilding,
    currentBuilding,
    setSelectedBuilding,
  } = useNavigation();

  const { location } = useLocation();
  const heading = useDeviceHeading();

  const routeRef = useRef(route);
  routeRef.current = route;

  const locationRef = useRef(location);
  locationRef.current = location;

  const activeBuilding = selectedBuilding || currentBuilding || null;

  // ============================================================
  // Route coordinates converter: converts route nodes to [lng, lat]
  // ============================================================
  const getRouteCoordinates = useCallback((routeNodes) => {
    if (!routeNodes || routeNodes.length < 2) return [];

    return routeNodes
      .map((node) => {
        if (typeof node === "string") {
          const [lat, lng] = node.split(",").map(Number);
          if (!isNaN(lat) && !isNaN(lng)) return [lng, lat];
        } else if (Array.isArray(node) && node.length >= 2) {
          const lat = Number(node[0]);
          const lng = Number(node[1]);
          if (!isNaN(lat) && !isNaN(lng)) return [lng, lat];
        } else if (node && typeof node === "object" && "lat" in node && "lng" in node) {
          const lat = Number(node.lat);
          const lng = Number(node.lng);
          if (!isNaN(lat) && !isNaN(lng)) return [lng, lat];
        }
        return null;
      })
      .filter(Boolean);
  }, []);

  // ============================================================
  // Building navigation click handler
  // ============================================================
  const handleBuildingClick = useCallback(
    (buildingName) => {
      if (!buildingName) return;

      console.log("3D Map: Building clicked:", buildingName);

      if (typeof setSelectedBuilding === "function") {
        setSelectedBuilding(buildingName);
      }

      const targetRoute = BUILDING_CONFIGS[buildingName]?.route;
      if (targetRoute) {
        navigate(targetRoute);
        return;
      }

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
          navigate("/electrical-workshop");
          break;
        case "Architecture Block":
          navigate("/architecture");
          break;
        case "Interdisciplinary Research Block (RUSA)":
          navigate("/research");
          break;
        default:
          console.warn("No route configured for building:", buildingName);
      }
    },
    [navigate, setSelectedBuilding]
  );

  // ============================================================
  // Map Initialization
  // ============================================================
  useEffect(() => {
    if (!mapContainerRef.current) return;

    let isMounted = true;

    const map = new Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          "osm-tiles": {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            minzoom: 0,
            maxzoom: 19,
            attribution: "© OpenStreetMap contributors",
          },
        },
        layers: [
          {
            id: "osm-raster-layer",
            type: "raster",
            source: "osm-tiles",
            minzoom: 0,
            maxzoom: 22,
          },
        ],
        // Directional lighting for clear 3D wall shading and depth
        light: {
          anchor: "viewport",
          color: "#ffffff",
          intensity: 0.45,
          position: [1.15, 210, 30],
        },
      },
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      minZoom: 16.5,
      maxZoom: 22,
      pitch: INITIAL_PITCH,
      maxPitch: 65,
      bearing: INITIAL_BEARING,
      maxBounds: CAMPUS_BOUNDS,
    });

    mapRef.current = map;

    map.on("error", (e) => {
      console.error("MapLibre GL error:", e);
    });

    // Add navigation control (pitch/bearing tilt and compass reset)
    map.addControl(
      new NavigationControl({
        visualizePitch: true,
        showCompass: true,
        showZoom: true,
      }),
      "top-right"
    );

    map.on("load", () => {
      if (!isMounted || !mapRef.current) return;

      // 1. Campus Boundary
      map.addSource("campus-boundary", {
        type: "geojson",
        data: "/data/campus/campus_outline.geojson",
      });
      map.addLayer({
        id: "campus-boundary-fill",
        type: "fill",
        source: "campus-boundary",
        paint: {
          "fill-color": "#DCEAE6",
          "fill-opacity": 0.95,
        },
      });
      map.addLayer({
        id: "campus-boundary-line",
        type: "line",
        source: "campus-boundary",
        paint: {
          "line-color": "#8FB8AF",
          "line-width": 3,
        },
      });

      // 2. Campus Areas
      map.addSource("campus-areas", {
        type: "geojson",
        data: "/data/campus/areas.geojson",
      });
      map.addLayer({
        id: "campus-areas-fill",
        type: "fill",
        source: "campus-areas",
        paint: {
          "fill-color": "#A8D1C8",
          "fill-opacity": 0.75,
        },
      });
      map.addLayer({
        id: "campus-areas-line",
        type: "line",
        source: "campus-areas",
        paint: {
          "line-color": "#8FB8AF",
          "line-width": 1,
          "line-opacity": 0.8,
        },
      });

      // 3. Outdoor Walkways
      map.addSource("campus-walkways", {
        type: "geojson",
        data: "/data/campus/walkways.geojson",
      });
      map.addLayer({
        id: "campus-walkways-line",
        type: "line",
        source: "campus-walkways",
        paint: {
          "line-color": "#FFFFFF",
          "line-width": 4,
          "line-opacity": 1,
        },
      });

      // 4. Outdoor Entrances
      map.addSource("campus-entrances", {
        type: "geojson",
        data: "/data/campus/entrances.geojson",
      });
      map.addLayer({
        id: "campus-entrances-circle",
        type: "circle",
        source: "campus-entrances",
        paint: {
          "circle-color": "#E9A400",
          "circle-radius": 6,
          "circle-stroke-color": "#FFFFFF",
          "circle-stroke-width": 2,
        },
      });

      // 5. Buildings Data Source
      map.addSource("campus-buildings", {
        type: "geojson",
        data: "/data/campus/buildings.geojson",
      });

      // Filters separating non-extruded 2D surfaces (e.g. Badminton Court) from 3D extruded buildings
      const nonExtrudedFilter =
        NON_EXTRUDED_SURFACES.length === 1
          ? ["==", ["get", "name"], NON_EXTRUDED_SURFACES[0]]
          : ["in", ["get", "name"], ["literal", NON_EXTRUDED_SURFACES]];

      const extrudedFilter =
        NON_EXTRUDED_SURFACES.length === 1
          ? ["!=", ["get", "name"], NON_EXTRUDED_SURFACES[0]]
          : ["!", ["in", ["get", "name"], ["literal", NON_EXTRUDED_SURFACES]]];

      // 5A. 2D Footprints for open-air ground surfaces (e.g. Badminton Court)
      map.addLayer({
        id: "buildings-2d-fill",
        type: "fill",
        source: "campus-buildings",
        filter: nonExtrudedFilter,
        paint: {
          "fill-color": "#A9CEC6",
          "fill-opacity": 0.85,
        },
      });
      map.addLayer({
        id: "buildings-2d-line",
        type: "line",
        source: "campus-buildings",
        filter: nonExtrudedFilter,
        paint: {
          "line-color": "#4F8F8A",
          "line-width": 2,
        },
      });

      // 5B. TRUE 3D Extrusion Layer for All Campus Buildings
      map.addLayer({
        id: "campus-buildings-3d",
        type: "fill-extrusion",
        source: "campus-buildings",
        filter: extrudedFilter,
        paint: {
          "fill-extrusion-height": buildBuildingHeightExpression(),
          "fill-extrusion-base": 0,
          "fill-extrusion-color": buildBuildingColorExpression(activeBuilding),
          "fill-extrusion-opacity": 0.92,
        },
      });

      // 5C. Footprint Base Outline for Extruded Campus Buildings
      map.addLayer({
        id: "buildings-base-line",
        type: "line",
        source: "campus-buildings",
        filter: extrudedFilter,
        paint: {
          "line-color": "#0E4F63",
          "line-width": 2,
          "line-opacity": 0.75,
        },
      });

      // 6. Outdoor Route Source & Layer
      const initialRouteCoords = getRouteCoordinates(routeRef.current);
      map.addSource("outdoor-route", {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: initialRouteCoords,
          },
        },
      });
      map.addLayer({
        id: "outdoor-route-line",
        type: "line",
        source: "outdoor-route",
        paint: {
          "line-color": "#2563EB",
          "line-width": 5,
          "line-opacity": 0.9,
        },
      });

      // 7. GPS Accuracy Circle Source & Layer (Fixed 4-metre visual radius)
      let initialAccuracyData = {
        type: "FeatureCollection",
        features: [],
      };
      const currLoc = locationRef.current;
      if (currLoc?.lng && currLoc?.lat) {
        initialAccuracyData = turf.circle([currLoc.lng, currLoc.lat], DISPLAY_ACCURACY_RADIUS_METRES, {
          steps: 64,
          units: "meters",
        });
      }
      map.addSource("gps-accuracy", {
        type: "geojson",
        data: initialAccuracyData,
      });
      map.addLayer({
        id: "gps-accuracy-fill",
        type: "fill",
        source: "gps-accuracy",
        paint: {
          "fill-color": "#2563EB",
          "fill-opacity": 0.10,
        },
      });
      map.addLayer({
        id: "gps-accuracy-line",
        type: "line",
        source: "gps-accuracy",
        paint: {
          "line-color": "#2563EB",
          "line-width": 1.5,
          "line-opacity": 0.5,
        },
      });

      // ============================================================
      // Interactive Click & Hover Listeners
      // ============================================================

      // Click & Hover on 3D Campus Buildings
      map.on("click", "campus-buildings-3d", (e) => {
        const feature = e.features?.[0];
        const name = feature?.properties?.name;
        handleBuildingClick(name);
      });

      map.on("mouseenter", "campus-buildings-3d", () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", "campus-buildings-3d", () => {
        map.getCanvas().style.cursor = "";
      });

      // Click & Hover on 2D Buildings / Ground Surfaces
      map.on("click", "buildings-2d-fill", (e) => {
        const feature = e.features?.[0];
        const name = feature?.properties?.name;
        handleBuildingClick(name);
      });

      map.on("mouseenter", "buildings-2d-fill", () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", "buildings-2d-fill", () => {
        map.getCanvas().style.cursor = "";
      });

      console.log("MapLibre 3D: Style loaded. All campus building 3D extrusions active.");
    });

    return () => {
      isMounted = false;
      if (gpsMarkerRef.current) {
        gpsMarkerRef.current.remove();
        gpsMarkerRef.current = null;
      }
      map.remove();
      mapRef.current = null;
    };
  }, [handleBuildingClick, getRouteCoordinates]);

  // ============================================================
  // Sync Outdoor Route Layer
  // ============================================================
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const source = map.getSource("outdoor-route");
    if (!source) return;

    const coords = getRouteCoordinates(route);
    source.setData({
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: coords,
      },
    });
  }, [route, getRouteCoordinates]);

  // ============================================================
  // Sync Selected/Active Building 3D Extrusion Highlight
  // ============================================================
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    if (map.getLayer("campus-buildings-3d")) {
      map.setPaintProperty(
        "campus-buildings-3d",
        "fill-extrusion-color",
        buildBuildingColorExpression(activeBuilding)
      );
    }
  }, [activeBuilding]);

  // ============================================================
  // Sync GPS Marker & Accuracy Circle
  // ============================================================
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!location) {
      if (gpsMarkerRef.current) {
        gpsMarkerRef.current.remove();
        gpsMarkerRef.current = null;
      }
      return;
    }

    const { lng, lat, accuracy } = location;

    // 1. Update or create GPS Marker DOM element
    if (!gpsMarkerRef.current) {
      const el = document.createElement("div");
      el.className = "smartnav-maplibre-gps-marker";
      el.innerHTML = `
        <div class="smartnav-gps-container" style="position:relative; width:44px; height:44px; display:flex; align-items:center; justify-content:center;">
          <div class="smartnav-gps-arrow" style="position:absolute; width:22px; height:28px; left:50%; top:50%; transform:translate(-50%, -88%) rotate(${heading ?? 0}deg); transform-origin:50% 88%; z-index:1; filter:drop-shadow(0 2px 4px rgba(20,33,55,0.22));">
            <div style="position:absolute; inset:0; background:#FFFFFF; clip-path:polygon(50% 0%, 100% 100%, 50% 76%, 0% 100%);"></div>
            <div style="position:absolute; left:2px; right:2px; top:2px; bottom:2px; background:#2563EB; clip-path:polygon(50% 0%, 100% 100%, 50% 76%, 0% 100%);"></div>
          </div>
          <div style="position:absolute; width:20px; height:20px; border-radius:50%; background:rgba(37,99,235,0.18); z-index:2;"></div>
          <div style="position:relative; width:13px; height:13px; border-radius:50%; background:#FFFFFF; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 6px rgba(20,33,55,0.3); z-index:3;">
            <div style="width:8px; height:8px; border-radius:50%; background:#2563EB;"></div>
          </div>
        </div>
      `;

      const marker = new Marker({
        element: el,
        anchor: "center",
      })
        .setLngLat([lng, lat])
        .addTo(map);

      gpsMarkerRef.current = marker;
    } else {
      gpsMarkerRef.current.setLngLat([lng, lat]);
      // Update heading rotation
      const arrow = gpsMarkerRef.current.getElement().querySelector(".smartnav-gps-arrow");
      if (arrow) {
        arrow.style.transform = `translate(-50%, -88%) rotate(${heading ?? 0}deg)`;
      }
    }

    // 2. Update accuracy circle (Fixed 4-metre visual radius)
    if (map.isStyleLoaded()) {
      const accuracySource = map.getSource("gps-accuracy");
      if (accuracySource) {
        const circlePolygon = turf.circle([lng, lat], DISPLAY_ACCURACY_RADIUS_METRES, {
          steps: 64,
          units: "meters",
        });
        accuracySource.setData(circlePolygon);
      }
    }
  }, [location, heading]);

  // ============================================================
  // Re-center / Locate Button Action
  // ============================================================
  const handleLocateMe = useCallback(() => {
    const map = mapRef.current;
    if (!map || !location) return;

    map.flyTo({
      center: [location.lng, location.lat],
      zoom: 19.5,
      pitch: 45,
      essential: true,
      duration: 1200,
    });
  }, [location]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* MapLibre WebGL Canvas Container */}
      <div ref={mapContainerRef} className="h-full w-full" />

      {/* View Mode Toggle (3D / 2D) */}
      <div className="smartnav-view-mode-toggle smartnav-view-mode-toggle-3d">
        <button
          type="button"
          onClick={onToggle2D}
          className="smartnav-mode-toggle-btn"
          title="Switch to 2D Leaflet Map"
          aria-label="Switch to 2D Map"
        >
          <span className="smartnav-mode-indicator bg-emerald-500" />
          <span>Switch to 2D</span>
          <span className="hidden sm:inline text-slate-400 font-normal">· 3D Active</span>
        </button>
      </div>

      {/* Floating Locate Button */}
      <button
        type="button"
        onClick={handleLocateMe}
        title="Locate Me"
        aria-label="Locate Me"
        className="absolute bottom-5 right-5 z-10 flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-[0_4px_14px_rgba(20,33,55,0.18)] transition-all duration-200 hover:bg-slate-50 hover:shadow-[0_6px_18px_rgba(20,33,55,0.22)] active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <Crosshair size={22} strokeWidth={2.4} className="text-blue-600" />
      </button>

      {/* 3D Extrusion Badge */}
      <div className="pointer-events-none absolute bottom-5 left-5 z-10 rounded-md bg-slate-900/75 px-2.5 py-1 text-[11px] font-medium text-slate-100 shadow backdrop-blur-sm">
        Campus 3D View · Building Extrusions Active (5m / floor)
      </div>
    </div>
  );
}
