import { useEffect } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";

import GeoJsonLayer from "../../components/map/GeoJsonLayer";
import RouteLayer from "../../components/map/RouteLayer";
import CurrentLocation from "../../components/map/CurrentLocation";

import { loadGraph } from "../../navigation/loadGraph";
import { useNavigation } from "../../hooks/useNavigation";
import LocateButton from "../../components/controls/LocateButton";

const CAMPUS_BOUNDS = [
  [8.9118, 76.6298],
  [8.9162, 76.6352],
];

export default function CampusPage() {
  const navigate = useNavigate();

  const {
    graph,
    setGraph,
    route,
  } = useNavigation();

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

        // Load graph only once
        if (!graph) {
          const loadedGraph = await loadGraph();

          console.log("Navigation Graph");
          console.log(loadedGraph);

          console.log(
            "Number of Nodes:",
            Object.keys(loadedGraph).length
          );

          setGraph(loadedGraph);
        }

      } catch (err) {
        console.error("Navigation Error:", err);
      }
    }

    initializeNavigation();
  }, [graph, setGraph]);

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
            fillOpacity: 95,
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
            color: "#25eb92",
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

        {/* Navigation Route */}
        <RouteLayer path={route} />

        {/* Current Location */}
        <CurrentLocation />
        <LocateButton />
      </MapContainer>
    </div>
  );
}