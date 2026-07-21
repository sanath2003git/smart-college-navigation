import { buildGraph } from "./graph";
import { setGraphs } from "./graphManager";
import { connectFloorTransitions } from "./graphConnector";

export async function loadGraphs() {
  console.log("========== LOADING NAVIGATION ENGINE V2 ==========");

  const [
    walkwaysRes,

    chemicalGFRes,
    chemicalFFRes,

    mechanicalGFRes,
    mechanicalFFRes,
  ] = await Promise.all([
    fetch("/data/campus/walkways.geojson"),

    fetch("/data/chemical/ground_floor/paths.geojson"),
    fetch("/data/chemical/first_floor/paths.geojson"),

    fetch("/data/mechanical/ground_floor/paths.geojson"),
    fetch("/data/mechanical/first_floor/paths.geojson"),
  ]);

  if (!walkwaysRes.ok)
    throw new Error("Failed to load campus/walkways.geojson");

  if (!chemicalGFRes.ok)
    throw new Error(
      "Failed to load chemical/ground_floor/paths.geojson"
    );

  if (!chemicalFFRes.ok)
    throw new Error(
      "Failed to load chemical/first_floor/paths.geojson"
    );

  if (!mechanicalGFRes.ok)
    throw new Error(
      "Failed to load mechanical/ground_floor/paths.geojson"
    );

  if (!mechanicalFFRes.ok)
    throw new Error(
      "Failed to load mechanical/first_floor/paths.geojson"
    );

  const walkways = await walkwaysRes.json();

  const chemicalGF = await chemicalGFRes.json();
  const chemicalFF = await chemicalFFRes.json();

  const mechanicalGF = await mechanicalGFRes.json();
  const mechanicalFF = await mechanicalFFRes.json();

  console.log("Outdoor Paths:", walkways.features.length);

  console.log(
    "Chemical Ground Floor Paths:",
    chemicalGF.features.length
  );

  console.log(
    "Chemical First Floor Paths:",
    chemicalFF.features.length
  );

  console.log(
    "Mechanical Ground Floor Paths:",
    mechanicalGF.features.length
  );

  console.log(
    "Mechanical First Floor Paths:",
    mechanicalFF.features.length
  );

  // ----------------------------
  // Build graphs
  // ----------------------------

  const outdoorGraph = buildGraph(walkways);

  const groundFloorGraphs = {
    "Chemical Block": buildGraph(chemicalGF),
    "Mechanical Block": buildGraph(mechanicalGF),
  };

  const firstFloorGraphs = {
    "Chemical Block": buildGraph(chemicalFF),
    "Mechanical Block": buildGraph(mechanicalFF),
  };

  console.log(
    "Outdoor Graph Nodes:",
    Object.keys(outdoorGraph).length
  );

  console.log(
    "Chemical GF Graph Nodes:",
    Object.keys(
      groundFloorGraphs["Chemical Block"]
    ).length
  );

  console.log(
    "Mechanical GF Graph Nodes:",
    Object.keys(
      groundFloorGraphs["Mechanical Block"]
    ).length
  );

  console.log(
    "Chemical FF Graph Nodes:",
    Object.keys(
      firstFloorGraphs["Chemical Block"]
    ).length
  );

  console.log(
    "Mechanical FF Graph Nodes:",
    Object.keys(
      firstFloorGraphs["Mechanical Block"]
    ).length
  );

  // ----------------------------
  // Register graphs
  // ----------------------------

  setGraphs({
    outdoor: outdoorGraph,
    groundFloor: groundFloorGraphs,
    firstFloor: firstFloorGraphs,
  });

  // Leave this as-is for now.
  // We'll refactor graphConnector.js next.
  await connectFloorTransitions(
    firstFloorGraphs["Chemical Block"]
  );

  console.log("Navigation Engine V2 Ready");
  console.log("==============================================");

  return {
    outdoor: outdoorGraph,
    groundFloor: groundFloorGraphs,
    firstFloor: firstFloorGraphs,
  };
}