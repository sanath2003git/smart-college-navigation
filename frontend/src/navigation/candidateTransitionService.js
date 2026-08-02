// src/navigation/candidateTransitionService.js

import { transitionMap } from "./transitionMap";

/**
 * Returns all valid transition IDs that
 * can reach the requested destination floor.
 */
export function getCandidateTransitions(
  building,
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

  return (
    buildingConfig
      .candidateTransitions?.[
      destinationFloor
    ] ?? []
  );
}

