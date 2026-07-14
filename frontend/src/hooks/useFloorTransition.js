import { useEffect } from "react";

import { useNavigation } from "./useNavigation";

import { NAVIGATION_STAGE } from "../constants/navigationStages";
import { shouldEnterBuilding } from "../navigation/navigationStageManager";

import { navigateOnFloor } from "../navigation/floorNavigationService";

export function useFloorTransition() {
  const {
    graph,

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
      if (!graph) return;
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

      console.log(
        "✅ Stair reached. Switching to First Floor..."
      );

      setNavigationStage(
        NAVIGATION_STAGE.FIRST_FLOOR
      );

      // Generate the new First Floor route
      const result = await navigateOnFloor(
  graph,
  targetStair.properties.id,
  destination.properties.room_no
);

      if (!result) return;

      console.log(
        "========== FIRST FLOOR ROUTE =========="
      );
      console.log(result.route);

      setRoute(result.route);
    }

    transitionToFirstFloor();
  }, [
    graph,
    currentLocation,
    destination,
    currentFloor,
    navigationStage,
    targetStair,
    setNavigationStage,
    setRoute,
  ]);
}