import { useEffect } from "react";

import { useNavigation } from "./useNavigation";

import { shouldEnterBuilding } from "../navigation/navigationStageManager";
import { NAVIGATION_STAGE } from "../constants/navigationStages";

export function useNavigationStage() {
  const {
    currentLocation,

    destination,

    targetEntrance,

    currentFloor,

    navigationStage,

    setNavigationStage,
  } = useNavigation();

  useEffect(() => {
    // Wait until everything is available
    if (!currentLocation) return;
    if (!destination) return;
    if (!targetEntrance) return;

    // Already inside the building
    if (navigationStage !== NAVIGATION_STAGE.OUTDOOR) {
      return;
    }

    const [lng, lat] = targetEntrance.geometry.coordinates;

    // Debug Logs
    console.log("========== NAVIGATION STAGE ==========");
    console.log("Stage:", navigationStage);
    console.log("Floor:", currentFloor);

    console.log("Destination:");
    console.log(
      destination.properties.room_no ??
        destination.properties.id
    );

    console.log("========== TARGET ENTRANCE ==========");
    console.log("Latitude :", lat);
    console.log("Longitude:", lng);

    console.log("========== CURRENT LOCATION ==========");
    console.log("Latitude :", currentLocation.lat);
    console.log("Longitude:", currentLocation.lng);

    const reachedEntrance = shouldEnterBuilding(
      currentLocation,
      {
        lat,
        lng,
      },
      5 // meters
    );

    console.log("Reached Entrance:", reachedEntrance);

    if (reachedEntrance) {
      console.log(
        "✅ Building entrance reached. Switching to Ground Floor..."
      );

      setNavigationStage(
        NAVIGATION_STAGE.GROUND_FLOOR
      );
    }
  }, [
    currentLocation,
    destination,
    targetEntrance,
    currentFloor,
    navigationStage,
    setNavigationStage,
  ]);
}