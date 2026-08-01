import { buildGraph } from "./graph";
import { setGraphs } from "./graphManager";
import { connectFloorTransitions } from "./graphConnector";
import { getNextTransition } from "./transitionService";
export async function loadGraphs() {
  console.log("========== LOADING NAVIGATION ENGINE V2 ==========");

  const [
    walkwaysRes,

    chemicalGFRes,
    chemicalFFRes,

    mechanicalGFRes,
    mechanicalFFRes,
    mechanicalSFRes,
    mechanicalTFRes,
  ] = await Promise.all([
    fetch("/data/campus/walkways.geojson"),

    fetch("/data/chemical/ground_floor/paths.geojson"),
    fetch("/data/chemical/first_floor/paths.geojson"),

    fetch("/data/mechanical/ground_floor/paths.geojson"),
    fetch("/data/mechanical/first_floor/paths.geojson"),
    fetch("/data/mechanical/second_floor/paths.geojson"),
    fetch("/data/mechanical/top_floor/paths.geojson"),
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

  if (!mechanicalSFRes.ok)
    throw new Error(
      "Failed to load mechanical/second_floor/paths.geojson"
    );

  if (!mechanicalTFRes.ok)
    throw new Error(
      "Failed to load mechanical/top_floor/paths.geojson"
    );

  const walkways = await walkwaysRes.json();

  const chemicalGF = await chemicalGFRes.json();
  const chemicalFF = await chemicalFFRes.json();

  const mechanicalGF = await mechanicalGFRes.json();
  const mechanicalFF = await mechanicalFFRes.json();
  const mechanicalSF = await mechanicalSFRes.json();
  const mechanicalTF = await mechanicalTFRes.json();

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

  console.log(
    "Mechanical Second Floor Paths:",
    mechanicalSF.features.length
  );

  console.log(
    "Mechanical Top Floor Paths:",
    mechanicalTF.features.length
  );

  // --------------------------------------------------
  // Build Graphs
  // --------------------------------------------------

  const outdoorGraph = buildGraph(walkways);

  const groundFloorGraphs = {
    "Chemical Block": buildGraph(chemicalGF),
    "Mechanical Block": buildGraph(mechanicalGF),
  };

  const firstFloorGraphs = {
    "Chemical Block": buildGraph(chemicalFF),
    "Mechanical Block": buildGraph(mechanicalFF),
  };

  const secondFloorGraphs = {
    "Mechanical Block": buildGraph(mechanicalSF),
  };

  const thirdFloorGraphs = {
    "Mechanical Block": buildGraph(mechanicalTF),
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

  console.log(
    "Mechanical SF Graph Nodes:",
    Object.keys(
      secondFloorGraphs["Mechanical Block"]
    ).length
  );

  console.log(
    "Mechanical Top Floor Graph Nodes:",
    Object.keys(
      thirdFloorGraphs["Mechanical Block"]
    ).length
  );

  // --------------------------------------------------
  // Register Graphs
  // --------------------------------------------------

  setGraphs({
    outdoor: outdoorGraph,
    groundFloor: groundFloorGraphs,
    firstFloor: firstFloorGraphs,
    secondFloor: secondFloorGraphs,
    thirdFloor: thirdFloorGraphs,
  });

  await Promise.all([
    connectFloorTransitions(
      "Chemical Block",
      firstFloorGraphs["Chemical Block"]
    ),

    connectFloorTransitions(
      "Mechanical Block",
      firstFloorGraphs["Mechanical Block"]
    ),
  ]);

  console.log("Navigation Engine V2 Ready");
  console.log("==============================================");
  

  return {
    outdoor: outdoorGraph,
    groundFloor: groundFloorGraphs,
    firstFloor: firstFloorGraphs,
    secondFloor: secondFloorGraphs,
    thirdFloor: thirdFloorGraphs,
  };
}