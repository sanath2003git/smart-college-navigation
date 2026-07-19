import { NAVIGATION_STAGE } from "../constants/navigationStages";

/**
 * Determines the next navigation segment.
 *
 * Returns the information needed by the Navigation Router
 * to calculate the next route.
 */
export function getNextSegment({
  stage,
  currentLocation,
  destination,
  targetEntrance,
  targetStair,
}) {
  switch (stage) {
    case NAVIGATION_STAGE.OUTDOOR:
      return {
        stage: NAVIGATION_STAGE.OUTDOOR,
        start: currentLocation,
        goal: targetEntrance,
      };

    case NAVIGATION_STAGE.GROUND_FLOOR:
      return {
        stage: NAVIGATION_STAGE.GROUND_FLOOR,
        start: targetEntrance,
        goal: targetStair,
      };

    case NAVIGATION_STAGE.FIRST_FLOOR:
      return {
        stage: NAVIGATION_STAGE.FIRST_FLOOR,
        start: targetStair,
        goal: destination,
      };

    default:
      return null;
  }
}