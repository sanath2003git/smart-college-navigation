import { buildGraph } from "./graph";

export async function loadGraph() {
  console.log("Loading walkways...");

  const response = await fetch("/data/walkways.geojson");

  console.log("HTTP Status:", response.status);

  if (!response.ok) {
    throw new Error("Could not load walkways.geojson");
  }

  const geojson = await response.json();

  console.log("GeoJSON Loaded");
  console.log(geojson);

  const graph = buildGraph(geojson);

  console.log("Graph Built");
  console.log(graph);

  return graph;
}