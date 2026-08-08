// src/navigation/transitionSelector.js

import {
  getCandidateTransitions,
} from "./candidateTransitionService";

/**
 * Selects the transition that should be used
 * for the NEXT floor.
 *
 * The selector does NOT jump directly to the
 * final destination-floor transition.
 *
 * Example:
 *
 * currentFloor = 0
 * destinationFloor = 3
 *
 * The required sequence is:
 *
 * GF → F1
 * F1 → F2
 * F2 → F3
 *
 * Therefore, on Ground Floor we select
 * only the GF → F1 candidates.
 */
export async function selectBestTransition({
  building,
  currentFloor,
  destinationFloor,
  start,
}) {
  const candidates =
    getCandidateTransitions(
      building,
      currentFloor,
      destinationFloor
    );

  console.log(
    "========== TRANSITION SELECTOR =========="
  );

  console.log(
    "Building:",
    building
  );

  console.log(
    "Current Floor:",
    currentFloor
  );

  console.log(
    "Destination Floor:",
    destinationFloor
  );

  console.log(
    "Current Location:",
    start
  );

  console.log(
    "Candidate Count:",
    candidates.length
  );

  console.table(
    candidates.map((id) => ({
      transition: id,
    }))
  );

  // -----------------------------------
  // Already on destination floor
  // -----------------------------------

  if (
    currentFloor === destinationFloor
  ) {
    console.log(
      "Already on destination floor."
    );

    return null;
  }

  // -----------------------------------
  // No candidates
  // -----------------------------------

  if (candidates.length === 0) {
    console.error(
      "No candidate transitions found."
    );

    return null;
  }

  // -----------------------------------
  // Temporary selection
  // -----------------------------------
  //
  // The graph-based evaluator in
  // navigationRouter.js will evaluate
  // all candidates and select the
  // shortest route.
  //
  // This selector only determines the
  // correct FLOOR LEVEL of candidates.
  // -----------------------------------

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