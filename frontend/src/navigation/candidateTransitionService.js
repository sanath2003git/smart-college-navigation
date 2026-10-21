// src/navigation/candidateTransitionService.js

import { transitionMap } from "./transitionMap";

/**
 * Returns all valid transition IDs for the
 * NEXT floor the user needs to reach.
 *
 * Example:
 *
 * currentFloor = 0
 * destinationFloor = 3
 *
 * The user is on Ground Floor and needs to
 * eventually reach Top Floor.
 *
 * The NEXT transition must therefore be:
 *
 * Ground Floor → First Floor
 *
 * so we return the candidates for floor 1.
 */
export function getCandidateTransitions(
  building,
  currentFloor,
  destinationFloor
) {
  const buildingConfig =
    transitionMap[building];

  if (!buildingConfig) {
    console.warn(
      `Unknown building: ${building}`
    );

    return [];
  }

  // -----------------------------------
  // Already on destination floor
  // -----------------------------------

  if (
    currentFloor === destinationFloor
  ) {
    return [];
  }

  // -----------------------------------
  // Determine next floor
  // -----------------------------------

  const nextFloor =
    currentFloor + 1;

  console.log(
    "========== CANDIDATE TRANSITIONS =========="
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
    "Next Floor:",
    nextFloor
  );

  // -----------------------------------
  // Get candidates for the next floor
  // -----------------------------------

  const candidates =
    buildingConfig
      .candidateTransitions?.[
        nextFloor
      ] ?? [];

  console.log(
    "Candidate Transitions:",
    candidates
  );

  console.log(
    "==========================================="
  );

  return candidates;
}