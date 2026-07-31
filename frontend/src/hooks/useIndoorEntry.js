import { useEffect, useRef } from "react";
import { useNavigation } from "./useNavigation";

export default function useIndoorEntry() {
  const {
    currentBuilding,
    navigationStage,
    currentFloor,
    destination,
    setNavigationStage,
    setSelectedBuilding,
  } = useNavigation();

  const previousBuilding = useRef(null);

  useEffect(() => {
    console.log("========== INDOOR ENTRY ==========");

    console.log("Current Building:", currentBuilding);
    console.log("Navigation Stage:", navigationStage);
    console.log("Current Floor:", currentFloor);
    console.log(
      "Destination:",
      destination?.properties?.room_no ?? null
    );

    console.log("===============================");

    const enteredBuilding =
  previousBuilding.current === null &&
  currentBuilding !== null;

const exitedBuilding =
  previousBuilding.current !== null &&
  currentBuilding === null;

console.log(
  "Previous Building:",
  previousBuilding.current
);

console.log(
  "Entered Building:",
  enteredBuilding
);

console.log(
  "Exited Building:",
  exitedBuilding
);

   if (!currentBuilding) {

  if (
    exitedBuilding &&
    navigationStage === "GROUND_FLOOR"
  ) {
    console.log(
      "Exiting Building..."
    );

    // Clear the selected building
    setSelectedBuilding(null);

    // Return to outdoor mode
    setNavigationStage("OUTDOOR");
  }

  previousBuilding.current = currentBuilding;
  return;
}

    if (destination) {
      console.log(
        "Indoor Entry: Navigation mode, skipping."
      );

      previousBuilding.current = currentBuilding;
      return;
    }

    console.log(
      "Indoor Entry: Exploration mode."
    );

    if (
  enteredBuilding &&
  navigationStage === "OUTDOOR"
) {
  console.log(
    "Entering Ground Floor..."
  );

  // Tell the renderer which building's indoor layers to display
  setSelectedBuilding(currentBuilding);

  // Switch to indoor mode
  setNavigationStage("GROUND_FLOOR");
}

    // Save for the next render
    previousBuilding.current = currentBuilding;

  }, [
    currentBuilding,
    navigationStage,
    currentFloor,
    destination,
    setNavigationStage,
    setSelectedBuilding,
  ]);
}