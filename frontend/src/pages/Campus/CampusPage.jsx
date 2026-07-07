import { useEffect, useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";

import GeoJsonLayer from "../../components/map/GeoJsonLayer";
import RouteLayer from "../../components/map/RouteLayer";
import CurrentLocation from "../../components/map/CurrentLocation";

import { loadGraph } from "../../utils/loadGraph";
import { testGraph } from "../../utils/testGraph";
import { navigateToRoom } from "../../services/navigationService";
import { findRoom } from "../../services/roomService";

const CAMPUS_BOUNDS = [
  [8.9118, 76.6298],
  [8.9162, 76.6352],
];

export default function CampusPage() {
  const navigate = useNavigate();

  const [route, setRoute] = useState([]);

  const center = [8.9138, 76.6323];

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

        // -----------------------------
        // Load Navigation Graph
        // -----------------------------
        const graph = await loadGraph();

        console.log("Navigation Graph");
        console.log(graph);

        console.log(
          "Number of Nodes:",
          Object.keys(graph).length
        );

        // -----------------------------
        // Debug Test (keep for now)
        // -----------------------------
        const shortestPath = testGraph(graph);

        console.log("Shortest Route:");
        console.log(shortestPath);

        // -----------------------------
        // Test Room Lookup
        // -----------------------------
        const room = await findRoom("H107");

        console.log("Room Search Result:");
        console.log(room);

        // -----------------------------
        // Navigate to H107
        // -----------------------------
        const path = await navigateToRoom(
          graph,
          8.912525104666102,      // Current latitude (example)
          76.63148951153599,      // Current longitude (example)
          "H107"
        );

        console.log("Navigation Route:");
        console.log(path);

        setRoute(path);

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

        {/* Campus Boundary */}
        <GeoJsonLayer
          url="/data/campus_outline.geojson"
          interactive={false}
          style={{
            color: "#1b5e20",
            weight: 3,
            fillColor: "#a5d6a7",
            fillOpacity: 0.15,
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

        {/* Outdoor Walkways */}
        <GeoJsonLayer
          url="/data/walkways.geojson"
          interactive={false}
          style={{
            color: "#1976d2",
            weight: 4,
          }}
        />

        {/* Indoor Navigation Paths */}
        <GeoJsonLayer
          url="/data/indoor_paths.geojson"
          interactive={false}
          style={{
            color: "#ff9800",
            weight: 3,
            dashArray: "6,4",
          }}
        />

        {/* Entrances */}
        <GeoJsonLayer
          url="/data/entrances.geojson"
          interactive={false}
        />

        {/* Chemical Ground Floor */}
        <GeoJsonLayer
          url="/data/chemical_gf.geojson"
          interactive={false}
          style={{
            color: "#00acc1",
            weight: 1,
            fillColor: "#80deea",
            fillOpacity: 0.35,
          }}
        />

        {/* Mechanical Ground Floor */}
        <GeoJsonLayer
          url="/data/mechanical_gf.geojson"
          interactive={false}
          style={{
            color: "#8e24aa",
            weight: 1,
            fillColor: "#ce93d8",
            fillOpacity: 0.35,
          }}
        />

        {/* Calculated Route */}
        <RouteLayer path={route} />

        {/* Current Location */}
        <CurrentLocation />
      </MapContainer>
    </div>
  );
}