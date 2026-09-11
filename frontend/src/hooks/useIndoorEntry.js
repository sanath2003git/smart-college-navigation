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

    initialFloorSelection,
    setInitialFloorSelection,
  } = useNavigation();

  // ==========================================
  // Previous Building
  // ==========================================

  const previousBuilding = useRef(null);

  // ==========================================
  // Initial Location Check
  //
  // Used to distinguish:
  //
  // 1. User opened SmartNav INSIDE a building
  //
  // 2. User opened SmartNav OUTSIDE and later
  //    entered a building.
  // ==========================================

  const initialLocationChecked = useRef(false);

  useEffect(() => {
    console.log("========== INDOOR ENTRY ==========");

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
      destination?.properties?.room_no ?? null
    );

    console.log(
      "Previous Building:",
      previousBuilding.current
    );

    console.log(
      "Initial Location Checked:",
      initialLocationChecked.current
    );

    console.log("===============================");

    // ========================================
    // Wait until GPS/building detection gives
    // us a meaningful result.
    //
    // currentBuilding === null can mean:
    // - user is outside
    // - GPS has not detected building yet
    //
    // We use the first confirmed building
    // detection to determine initial state.
    // ========================================

    if (!currentBuilding) {
      /*
       * If the app has already confirmed the user
       * was inside a building and they subsequently
       * leave it, handle the outdoor transition.
       */
      const exitedBuilding =
        previousBuilding.current !== null &&
        currentBuilding === null;

      if (exitedBuilding) {
        console.log(
          "========== BUILDING EXIT =========="
        );

        /*
         * Only automatically leave indoor mode
         * when we are currently on Ground Floor.
         */
        if (
          navigationStage === "GROUND_FLOOR"
        ) {
          console.log(
            "Exiting Building..."
          );

          setSelectedBuilding(null);

          setNavigationStage("OUTDOOR");
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
    // Destination / Navigation Mode
    //
    // When a destination exists, the user is
    // actively navigating. Don't show the
    // initial floor-selection prompt here.
    // ========================================

    if (destination) {
      console.log(
        "Indoor Entry: Navigation mode, skipping initial floor selection."
      );

      /*
       * If this is a navigation route entering
       * a building, preserve the existing behavior.
       */
      if (
        navigationStage === "OUTDOOR" &&
        previousBuilding.current !== null &&
        previousBuilding.current !== currentBuilding
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
    //
    // If the FIRST confirmed location is
    // already inside a building, the user
    // probably opened SmartNav indoors.
    //
    // Ask them to select their floor.
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
       * Mark the initial location as checked
       * before opening the prompt.
       */
      initialLocationChecked.current =
        true;

      /*
       * Tell the renderer which building is
       * currently occupied.
       */
      setSelectedBuilding(
        currentBuilding
      );

      /*
       * Open floor selection prompt.
       */
      setInitialFloorSelection({
        open: true,
        building: currentBuilding,
      });

      console.log(
        "Floor selection prompt opened."
      );

      console.log(
        "=============================================="
      );

      previousBuilding.current =
        currentBuilding;

      return;
    }

    // ========================================
    // OUTDOOR → BUILDING ENTRY
    //
    // If the user was previously outside and
    // is now detected inside a building,
    // automatically load Ground Floor.
    // ========================================

    const enteredBuilding =
      previousBuilding.current === null &&
      initialLocationChecked.current;

    /*
     * We also handle a transition between
     * buildings while already using the app.
     */
    const changedBuilding =
      previousBuilding.current !== null &&
      previousBuilding.current !== currentBuilding;

    console.log(
      "Entered Building:",
      enteredBuilding
    );

    console.log(
      "Changed Building:",
      changedBuilding
    );

    // ========================================
    // Outdoor → Indoor
    // ========================================

    if (
      navigationStage === "OUTDOOR" &&
      (enteredBuilding || changedBuilding)
    ) {
      console.log(
        "========== OUTDOOR → INDOOR =========="
      );

      console.log(
        "Entering:",
        currentBuilding
      );

      console.log(
        "Automatically loading Ground Floor."
      );

      // --------------------------------------
      // Select building
      // --------------------------------------

      setSelectedBuilding(
        currentBuilding
      );

      // --------------------------------------
      // Set Ground Floor
      //
      // Your existing navigation state uses
      // GROUND_FLOOR as the indoor stage.
      // --------------------------------------

      setNavigationStage(
        "GROUND_FLOOR"
      );

      console.log(
        "======================================="
      );
    }

    // ========================================
    // Save current building for the next GPS
    // reading.
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