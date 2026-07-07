import { buildGraph } from "./graph";

export async function loadGraph() {
  console.log("Loading navigation data...");

  // Load both GeoJSON files
  const [walkwaysRes, indoorRes] = await Promise.all([
    fetch("/data/walkways.geojson"),
    fetch("/data/indoor_paths.geojson"),
  ]);

  if (!walkwaysRes.ok) {
    throw new Error("Could not load walkways.geojson");
  }

  if (!indoorRes.ok) {
    throw new Error("Could not load indoor_paths.geojson");
  }

  const walkways = await walkwaysRes.json();
  const indoor = await indoorRes.json();

  console.log("Walkways Loaded:", walkways.features.length);
  console.log("Indoor Paths Loaded:", indoor.features.length);

  // Merge both FeatureCollections
  const mergedGeoJSON = {
    type: "FeatureCollection",
    features: [
      ...walkways.features,
      ...indoor.features,
    ],
  };

  console.log(
    "Total Navigation Paths:",
    mergedGeoJSON.features.length
  );

  // Build one graph
  const graph = buildGraph(mergedGeoJSON);

  console.log("Graph Built");
  console.log(graph);

  return graph;
}