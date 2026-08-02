// src/navigation/transitionSelector.js

import { getCandidateTransitions } from "./candidateTransitionService";

/**
 * Selects the best transition (stair/lift)
 * for reaching a destination floor.
 *
 * Currently:
 * - Returns the first candidate.
 *
 * Future:
 * - Evaluate all candidates using A*
 * - Compare route cost
 * - Return the shortest path
 */
export async function selectBestTransition({
  building,
  destinationFloor,
  start,
}) {
  const candidates = getCandidateTransitions(
    building,
    destinationFloor
  );

  console.log(
    "========== TRANSITION SELECTOR =========="
  );

  console.log("Building:", building);
  console.log(
    "Destination Floor:",
    destinationFloor
  );
  console.log("Current Location:", start);

  console.log(
    "Candidate Count:",
    candidates.length
  );

  console.table(
    candidates.map((id) => ({
      transition: id,
    }))
  );

  if (candidates.length === 0) {
    console.error(
      "No candidate transitions found."
    );

    return null;
  }

  // ----------------------------------------------------------------
  // TEMPORARY IMPLEMENTATION
  //
  // The router still expects a single transition ID.
  // For now we return the first candidate so behaviour
  // stays identical while we refactor incrementally.
  // ----------------------------------------------------------------

  const selectedTransition = {
    id: candidates[0],
    candidates,
    strategy: "FIRST_CANDIDATE",
  };

  console.log(
    "Selected Transition:",
    selectedTransition
  );

  console.log(
    "=========================================="
  );

  return selectedTransition;
}