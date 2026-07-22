import { useEffect } from "react";

import { useNavigation } from "./useNavigation";

import { NAVIGATION_STAGE } from "../constants/navigationStages";
import { shouldEnterBuilding } from "../navigation/navigationStageManager";

import { navigateOnFloor } from "../navigation/floorNavigationService";
import { speak } from "../services/voiceService";

export function useFloorTransition() {
  const {
  currentLocation,

  destination,

  currentFloor,

  navigationStage,
  setNavigationStage,

  targetStair,

  setRoute,
} = useNavigation();
  useEffect(() => {
    async function transitionToFirstFloor() {
  console.log("========== useFloorTransition ==========");
console.log("currentLocation:", currentLocation);
console.log("destination:", destination);
console.log("targetStair:", targetStair);
console.log("currentFloor:", currentFloor);
console.log("navigationStage:", navigationStage);

if (!currentLocation) return;
if (!destination) return;
if (!targetStair) return;

      // Only for First Floor destinations
      if (currentFloor !== 1) return;

      // Must already be on Ground Floor
      if (
        navigationStage !== NAVIGATION_STAGE.GROUND_FLOOR
      ) {
        return;
      }

      const [lng, lat] = targetStair.geometry.coordinates;

      console.log("========== FLOOR TRANSITION ==========");
      console.log("Current Floor:", currentFloor);
      console.log("Target Stair:", targetStair.properties.id);

      console.log("Target Stair Coordinates");
      console.log("Latitude :", lat);
      console.log("Longitude:", lng);

      console.log("Current Location");
      console.log("Latitude :", currentLocation.lat);
      console.log("Longitude:", currentLocation.lng);

      const reachedStair = shouldEnterBuilding(
        currentLocation,
        {
          lat,
          lng,
        },
        3
      );

      console.log("Reached Stair:", reachedStair);

      if (!reachedStair) return;

      // Voice instruction
      speak("Go to First Floor.");

     console.log(
  "✅ Stair reached. Switching to First Floor..."
);

console.log("Changing stage...");

setNavigationStage(
  NAVIGATION_STAGE.FIRST_FLOOR
);

console.log("Stage changed.");
console.log("Destination properties:");
console.log(destination.properties);

console.log("room_no:", destination.properties.room_no);
console.log("roomNumber:", destination.properties.roomNumber);
console.log("room:", destination.properties.room);
console.log("name:", destination.properties.name);
console.log("id:", destination.properties.id);
// Generate the new First Floor route
const result = await navigateOnFloor(
  destination.properties.building,
  targetStair.properties.id,
  destination.properties.room_no
);

console.log("navigateOnFloor Result:");
console.log(result);

if (!result) {
  console.error("First Floor route generation failed.");
  return;
}

console.log(
  "========== FIRST FLOOR ROUTE =========="
);
console.log(result.route);

setRoute(result.route);
    }

    transitionToFirstFloor();
  }, [
    currentLocation,
    destination,
    currentFloor,
    navigationStage,
    targetStair,
    setNavigationStage,
    setRoute,
  ]);
}