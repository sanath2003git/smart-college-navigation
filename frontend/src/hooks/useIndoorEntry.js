import {
  useEffect,
  useRef,
} from "react";

import {
  useNavigation,
} from "./useNavigation";

import { BUILDING_CONFIGS } from "../constants/buildingConfigs";

export default function useIndoorEntry() {
  const {
    currentBuilding,
    navigationStage,
    currentFloor,
    destination,

    setNavigationStage,
    setSelectedBuilding,

    initialFloorSelection,
    setInitialFloorSelection,
  } = useNavigation();

  // ==========================================
  // Previous building
  // ==========================================

  const previousBuilding =
    useRef(null);

  // ==========================================
  // Initial location state
  // ==========================================

  const initialLocationChecked =
    useRef(false);

  useEffect(() => {

    console.log(
      "========== INDOOR ENTRY =========="
    );

    console.log(
      "Current Building:",
      currentBuilding
    );

    console.log(
      "Navigation Stage:",
      navigationStage
    );

    console.log(
      "Current Floor:",
      currentFloor
    );

    console.log(
      "Destination:",
      destination?.properties?.room_no ??
        null
    );

    console.log(
      "Previous Building:",
      previousBuilding.current
    );

    console.log(
      "Initial Location Checked:",
      initialLocationChecked.current
    );

    console.log(
      "Initial Floor Selection:",
      initialFloorSelection
    );

    console.log(
      "================================="
    );

    // ========================================
    // No building detected
    // ========================================

    if (!currentBuilding) {

      if (initialFloorSelection?.open) {
        setInitialFloorSelection({
          open: false,
          building: null,
        });
      }

      const exitedBuilding =
        previousBuilding.current !==
          null &&
        currentBuilding === null;

      if (exitedBuilding) {

        console.log(
          "========== BUILDING EXIT =========="
        );

        /*
         * Only automatically leave indoor
         * navigation from Ground Floor.
         */

        if (
          navigationStage ===
          "GROUND_FLOOR"
        ) {

          console.log(
            "Exiting Building..."
          );

          setSelectedBuilding(
            null
          );

          setNavigationStage(
            "OUTDOOR"
          );
        }

        console.log(
          "===================================="
        );
      }

      previousBuilding.current =
        currentBuilding;

      return;
    }

    // ========================================
    // Destination navigation mode
    // ========================================

    if (destination) {

      console.log(
        "Indoor Entry: Navigation mode."
      );

      console.log(
        "Skipping initial floor selection."
      );

      /*
       * Navigation entering a destination
       * building.
       */

      if (
        navigationStage ===
          "OUTDOOR" &&
        previousBuilding.current !==
          null &&
        previousBuilding.current !==
          currentBuilding
      ) {

        console.log(
          "Navigation: Entered destination building."
        );

        setSelectedBuilding(
          currentBuilding
        );

        setNavigationStage(
          "GROUND_FLOOR"
        );
      }

      previousBuilding.current =
        currentBuilding;

      initialLocationChecked.current =
        true;

      return;
    }

    // ========================================
    // INITIAL INDOOR DETECTION
    // ========================================
    //
    // This happens when SmartNav opens and
    // the first confirmed building is already
    // detected.
    // ========================================

    if (
      !initialLocationChecked.current
    ) {

      console.log(
        "========== INITIAL INDOOR DETECTION =========="
      );

      console.log(
        "SmartNav opened inside:",
        currentBuilding
      );

      /*
       * Mark initial location as checked
       * before opening the dialog.
       */

      initialLocationChecked.current =
        true;

      /*
       * Store the detected building.
       */

      setSelectedBuilding(
        currentBuilding
      );

      /*
       * Open floor selection if building has indoor floor data.
       */

      const buildingConfig = currentBuilding ? BUILDING_CONFIGS[currentBuilding] : null;
      if (buildingConfig?.hasFloorData) {
        setInitialFloorSelection({
          open: true,
          building: currentBuilding,
        });

        console.log(
          "Floor selection prompt opened for:",
          currentBuilding
        );
      } else {
        console.log(
          "Building has no indoor floor data. Skipping prompt for:",
          currentBuilding
        );
      }

      console.log(
        "=============================================="
      );

      previousBuilding.current =
        currentBuilding;

      return;
    }

    // ========================================
    // OUTDOOR → BUILDING
    // ========================================

    const enteredBuilding =
      previousBuilding.current === null &&
      initialLocationChecked.current;

    const changedBuilding =
      previousBuilding.current !== null &&
      previousBuilding.current !==
        currentBuilding;

    console.log(
      "Entered Building:",
      enteredBuilding
    );

    console.log(
      "Changed Building:",
      changedBuilding
    );

    // ========================================
    // Enter building during normal usage
    // ========================================

    if (
      navigationStage === "OUTDOOR" &&
      (
        enteredBuilding ||
        changedBuilding
      )
    ) {

      console.log(
        "========== OUTDOOR → INDOOR =========="
      );

      console.log(
        "Entering:",
        currentBuilding
      );

      setSelectedBuilding(
        currentBuilding
      );

      const buildingConfig = currentBuilding ? BUILDING_CONFIGS[currentBuilding] : null;
      if (buildingConfig?.hasFloorData) {
        console.log(
          "Prompting user for current floor in:",
          currentBuilding
        );
        setInitialFloorSelection({
          open: true,
          building: currentBuilding,
        });
      } else {
        console.log(
          "Building has no indoor floor data. Preserving outdoor view."
        );
      }

      console.log(
        "======================================="
      );
    }

    // ========================================
    // Save building for next GPS update
    // ========================================

    previousBuilding.current =
      currentBuilding;

  }, [
    currentBuilding,
    navigationStage,
    currentFloor,
    destination,

    setNavigationStage,
    setSelectedBuilding,

    initialFloorSelection,
    setInitialFloorSelection,
  ]);
}