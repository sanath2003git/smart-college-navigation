// src/navigation/transitionService.js

import { transitionMap } from "./transitionMap";

export function getNextTransition(building, currentTransitionId) {
  const buildingMap = transitionMap[building];

  if (!buildingMap) {
    console.warn(`Unknown building: ${building}`);
    return null;
  }

  return buildingMap[currentTransitionId] ?? null;
}

export function hasTransition(building, currentTransitionId) {
  return getNextTransition(building, currentTransitionId) !== null;
}
