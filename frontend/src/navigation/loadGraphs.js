import { buildGraph } from "./graph";
import { setGraphs } from "./graphManager";
import { connectFloorTransitions } from "./graphConnector";

export async function loadGraphs() {
  console.log("========== LOADING NAVIGATION ENGINE V2 ==========");

  const [
    walkwaysRes,
    indoorGFRes,
    indoorFFRes,
  ] = await Promise.all([
    fetch("/data/campus/walkways.geojson"),
    fetch("/data/chemical/ground_floor/paths.geojson"),
    fetch("/data/chemical/first_floor/paths.geojson"),
  ]);

  if (!walkwaysRes.ok)
    throw new Error("Failed to load campus/walkways.geojson");

  if (!indoorGFRes.ok)
    throw new Error(
  "Failed to load chemical/ground_floor/paths.geojson");

  if (!indoorFFRes.ok)
    throw new Error(
  "Failed to load chemical/first_floor/paths.geojson");

  const walkways = await walkwaysRes.json();
  const indoorGF = await indoorGFRes.json();
  const indoorFF = await indoorFFRes.json();

  console.log("Outdoor Paths:", walkways.features.length);
  console.log("Ground Floor Paths:", indoorGF.features.length);
  console.log("First Floor Paths:", indoorFF.features.length);

  // ----------------------------
  // Build three independent graphs
  // ----------------------------

  const outdoorGraph = buildGraph(walkways);
  const groundFloorGraph = buildGraph(indoorGF);
  const firstFloorGraph = buildGraph(indoorFF);

  console.log(
    "Outdoor Graph Nodes:",
    Object.keys(outdoorGraph).length
  );

  console.log(
    "Ground Floor Graph Nodes:",
    Object.keys(groundFloorGraph).length
  );

  console.log(
    "First Floor Graph Nodes:",
    Object.keys(firstFloorGraph).length
  );

  // ----------------------------
  // Register graphs
  // ----------------------------

  setGraphs({
  outdoor: outdoorGraph,
  groundFloor: groundFloorGraph,
  firstFloor: firstFloorGraph,
});

// Build stair lookup table
await connectFloorTransitions(firstFloorGraph);

console.log("Navigation Engine V2 Ready");

  console.log("==============================================");

  return {
    outdoor: outdoorGraph,
    groundFloor: groundFloorGraph,
    firstFloor: firstFloorGraph,
  };
}