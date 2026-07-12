import { buildGraph } from "./graph";
import { connectFloorTransitions } from "./graphConnector.js";

export async function loadGraph() {
  console.log("Loading navigation data...");

  const [
    walkwaysRes,
    indoorGFRes,
    indoorFFRes,
  ] = await Promise.all([
    fetch("/data/walkways.geojson"),
    fetch("/data/indoor_paths.geojson"),
    fetch("/data/indoor_paths_ff.geojson"),
  ]);

  if (!walkwaysRes.ok)
    throw new Error("Could not load walkways.geojson");

  if (!indoorGFRes.ok)
    throw new Error("Could not load indoor_paths.geojson");

  if (!indoorFFRes.ok)
    throw new Error("Could not load indoor_paths_ff.geojson");

  const walkways = await walkwaysRes.json();
  const indoorGF = await indoorGFRes.json();
  const indoorFF = await indoorFFRes.json();

  console.log("Walkways Loaded:", walkways.features.length);
  console.log("Indoor GF Loaded:", indoorGF.features.length);
  console.log("Indoor FF Loaded:", indoorFF.features.length);

  const mergedGeoJSON = {
    type: "FeatureCollection",
    features: [
      ...walkways.features,
      ...indoorGF.features,
      ...indoorFF.features,
    ],
  };

  console.log(
    "Total Navigation Paths:",
    mergedGeoJSON.features.length
  );

  // Build graph
  const graph = buildGraph(mergedGeoJSON);

  // Connect Ground Floor ↔ First Floor stairs
  await connectFloorTransitions(graph);

  console.log("Graph Built");
  console.log(graph);

  // Print every graph node (temporary)
  console.log("========== GRAPH NODES ==========");

  Object.keys(graph).forEach((node) => {
    console.log(node);
  });

  console.log("=================================");

  return graph;
}