import { useEffect } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import BuildingLayer from "../../components/map/BuildingLayer";
import WalkwayLayer from "../../components/map/WalkwayLayer";
import EntranceLayer from "../../components/map/EntranceLayer";
import CurrentLocation from "../../components/map/CurrentLocation";

import { loadGraph } from "../../utils/loadGraph";
import { testGraph } from "../../utils/testGraph";

export default function CampusPage() {
  const center = [8.9138, 76.6323];

  useEffect(() => {
    async function initializeNavigation() {
      try {
        console.log("CampusPage Loaded");

        // Load graph from walkways
        const graph = await loadGraph();

        console.log("Navigation Graph");
        console.log(graph);

        console.log(
          "Number of Nodes:",
          Object.keys(graph).length
        );

        // Test A* algorithm
        testGraph(graph);

      } catch (err) {
        console.error("Navigation Error:", err);
      }
    }

    initializeNavigation();
  }, []);

  return (
    <MapContainer
      center={center}
      zoom={18}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer
  attribution="© OpenStreetMap contributors"
  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
/>

<BuildingLayer />
<WalkwayLayer />
<EntranceLayer />
<CurrentLocation />
    </MapContainer>
  );
}