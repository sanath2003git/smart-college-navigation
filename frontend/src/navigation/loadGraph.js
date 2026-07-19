import { buildGraph } from "./graph";
import { connectFloorTransitions } from "./graphConnector.js";

// Node metadata
export const nodeMetadata = {};

// ------------------------------------
// Store all floors a node belongs to
// ------------------------------------
function addNodeMetadata(features, floor) {
  features.forEach((feature) => {
    if (feature.geometry.type !== "LineString") return;

    feature.geometry.coordinates.forEach(([lng, lat]) => {
      const node = `${lat.toFixed(7)},${lng.toFixed(7)}`;

      // Create metadata if it doesn't exist
      if (!nodeMetadata[node]) {
        nodeMetadata[node] = {
          floors: [],
        };
      }

      // Avoid duplicates
      if (!nodeMetadata[node].floors.includes(floor)) {
        nodeMetadata[node].floors.push(floor);
      }
    });
  });
}

export async function loadGraph() {
  console.log("Loading navigation data...");

  const [
    walkwaysRes,
    indoorGFRes,
    indoorFFRes,
  ] = await Promise.all([
    fetch("/data/walkways.geojson"),
    fetch("/data/chemical_gf_paths.geojson"),
    fetch("/data/chemical_ff_paths.geojson"),
  ]);

  if (!walkwaysRes.ok)
    throw new Error("Could not load walkways.geojson");

  if (!indoorGFRes.ok)
    throw new Error("Could not load chemical_gf_paths.geojson");

  if (!indoorFFRes.ok)
    throw new Error("Could not load chemical_ff_paths.geojson");

  const walkways = await walkwaysRes.json();
  const indoorGF = await indoorGFRes.json();
  const indoorFF = await indoorFFRes.json();

  console.log("Walkways Loaded:", walkways.features.length);
  console.log("Indoor GF Loaded:", indoorGF.features.length);
  console.log("Indoor FF Loaded:", indoorFF.features.length);

  // ------------------------------------
  // Build node metadata
  // ------------------------------------

  addNodeMetadata(walkways.features, null);
  addNodeMetadata(indoorGF.features, 0);
  addNodeMetadata(indoorFF.features, 1);

  console.log("========== NODE METADATA ==========");

  Object.entries(nodeMetadata).forEach(([node, data]) => {
    console.log(
      node,
      "→ Floors:",
      data.floors.join(", ")
    );
  });

  console.log("===================================");

  // ------------------------------------
  // Merge navigation paths
  // ------------------------------------

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

  // ------------------------------------
  // Build graph
  // ------------------------------------

  const graph = buildGraph(mergedGeoJSON);

  await connectFloorTransitions(graph);

  console.log("Graph Built");
  console.log(graph);

  console.log("========== GRAPH NODES ==========");

  Object.keys(graph).forEach((node) => {
    console.log(node);
  });

  console.log("=================================");

  return graph;
}