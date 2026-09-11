import { useState } from "react";
import NavigationContext from "./NavigationContext";
import { NAVIGATION_STAGE } from "../constants/navigationStages";

export function NavigationProvider({ children }) {
  // ==========================================
  // Navigation Route
  // ==========================================

  const [route, setRoute] = useState([]);

  // ==========================================
  // User GPS Location
  // ==========================================

  const [currentLocation, setCurrentLocation] =
    useState(null);

  // ==========================================
  // Selected Destination
  // ==========================================

  const [destination, setDestination] =
    useState(null);

  // ==========================================
  // Target Building Entrance
  // ==========================================

  const [targetEntrance, setTargetEntrance] =
    useState(null);

  // ==========================================
  // Target Stair / Lift
  // ==========================================

  const [targetStair, setTargetStair] =
    useState(null);

  // ==========================================
  // Navigation Stage
  // ==========================================

  const [navigationStage, setNavigationStage] =
    useState(NAVIGATION_STAGE.OUTDOOR);

  // ==========================================
  // Current Building
  // ==========================================

  const [currentBuilding, setCurrentBuilding] =
    useState(null);

  // ==========================================
  // Destination Building
  // ==========================================

  const [selectedBuilding, setSelectedBuilding] =
    useState(null);

  // ==========================================
  // Current Navigation Floor
  // ==========================================

  const [currentFloor, setCurrentFloor] =
    useState(0);

  // ==========================================
  // User's actual physical floor
  // ==========================================

  const [userFloor, setUserFloor] =
    useState(null);

  // ==========================================
  // Initial Indoor Floor Selection
  //
  // Used only when SmartNav is opened while
  // the user is already inside a building.
  // ==========================================

  const [
    initialFloorSelection,
    setInitialFloorSelection,
  ] = useState({
    open: false,
    building: null,
  });

  // ==========================================
  // Floor Transition Confirmation UI
  // ==========================================

  const [floorTransition, setFloorTransition] =
    useState({
      open: false,
      currentFloor: null,
      nextFloor: null,
      transitionId: null,
      transitionType: null,
    });

  // ==========================================
  // Pending Floor Transition
  // ==========================================

  const [
    pendingFloorTransition,
    setPendingFloorTransition,
  ] = useState(null);

  // ==========================================
  // Convert floor number to navigation stage
  //
  // 0 → Ground Floor
  // 1 → First Floor
  // 2 → Second Floor
  // 3 → Third Floor
  // ==========================================

  const getNavigationStageForFloor = (
    floor
  ) => {
    switch (Number(floor)) {
      case 0:
        return NAVIGATION_STAGE.GROUND_FLOOR;

      case 1:
        return NAVIGATION_STAGE.FIRST_FLOOR;

      case 2:
        return NAVIGATION_STAGE.SECOND_FLOOR;

      case 3:
        return NAVIGATION_STAGE.THIRD_FLOOR;

      default:
        console.warn(
          "Unknown floor selected:",
          floor
        );

        return NAVIGATION_STAGE.GROUND_FLOOR;
    }
  };

  // ==========================================
  // Confirm Initial Floor Selection
  //
  // Used when the user opens SmartNav while
  // already inside a building.
  // ==========================================

  const confirmInitialFloorSelection = (
    selectedFloor
  ) => {
    if (
      selectedFloor === null ||
      selectedFloor === undefined
    ) {
      console.warn(
        "No initial floor selected."
      );

      return;
    }

    const floor = Number(selectedFloor);

    const nextStage =
      getNavigationStageForFloor(floor);

    console.log(
      "========== INITIAL FLOOR SELECTION =========="
    );

    console.log(
      "Building:",
      initialFloorSelection.building
    );

    console.log(
      "Selected Floor:",
      floor
    );

    console.log(
      "Navigation Stage:",
      nextStage
    );

    console.log(
      "=============================================="
    );

    // ----------------------------------------
    // Store user's physical floor
    // ----------------------------------------

    setUserFloor(floor);

    // ----------------------------------------
    // Set active navigation floor
    // ----------------------------------------

    setCurrentFloor(floor);

    // ----------------------------------------
    // Set the selected building
    // ----------------------------------------

    if (
      initialFloorSelection.building
    ) {
      setSelectedBuilding(
        initialFloorSelection.building
      );
    }

    // ----------------------------------------
    // Switch to the selected indoor floor
    // ----------------------------------------

    setNavigationStage(nextStage);

    // ----------------------------------------
    // Close the floor-selection prompt
    // ----------------------------------------

    setInitialFloorSelection({
      open: false,
      building: null,
    });
  };

  // ==========================================
  // Cancel Initial Floor Selection
  // ==========================================

  const cancelInitialFloorSelection = () => {
    console.log(
      "Initial floor selection cancelled."
    );

    setInitialFloorSelection({
      open: false,
      building: null,
    });
  };

  // ==========================================
  // Confirm Floor Transition
  // ==========================================

  const confirmFloorTransition = () => {
    if (!pendingFloorTransition) {
      console.warn(
        "No pending floor transition."
      );

      return;
    }

    const {
      nextFloor,
      navigationStage: nextStage,
      targetStair: nextTargetStair,
      route: nextRoute,
    } = pendingFloorTransition;

    console.log(
      "========== FLOOR CONFIRMATION =========="
    );

    console.log(
      "Confirmed Floor:",
      nextFloor
    );

    console.log(
      "Navigation Stage:",
      nextStage
    );

    console.log(
      "Next Target Stair:",
      nextTargetStair
    );

    console.log(
      "========================================="
    );

    // ----------------------------------------
    // Update active floor
    // ----------------------------------------

    setCurrentFloor(
      nextFloor
    );

    // ----------------------------------------
    // Update user's physical floor
    // ----------------------------------------

    setUserFloor(
      nextFloor
    );

    // ----------------------------------------
    // Update navigation stage
    // ----------------------------------------

    setNavigationStage(
      nextStage
    );

    // ----------------------------------------
    // Update next transition target
    // ----------------------------------------

    setTargetStair(
      nextTargetStair ?? null
    );

    // ----------------------------------------
    // Update route
    // ----------------------------------------

    setRoute(
      nextRoute ?? []
    );

    // ----------------------------------------
    // Close confirmation UI
    // ----------------------------------------

    setFloorTransition({
      open: false,
      currentFloor: null,
      nextFloor: null,
      transitionId: null,
      transitionType: null,
    });

    // ----------------------------------------
    // Clear pending transition
    // ----------------------------------------

    setPendingFloorTransition(
      null
    );
  };

  return (
    <NavigationContext.Provider
      value={{
        // ======================================
        // Route
        // ======================================

        route,
        setRoute,

        // ======================================
        // Current Location
        // ======================================

        currentLocation,
        setCurrentLocation,

        // ======================================
        // Destination
        // ======================================

        destination,
        setDestination,

        // ======================================
        // Target Entrance
        // ======================================

        targetEntrance,
        setTargetEntrance,

        // ======================================
        // Target Stair
        // ======================================

        targetStair,
        setTargetStair,

        // ======================================
        // Navigation Stage
        // ======================================

        navigationStage,
        setNavigationStage,

        // ======================================
        // Current Building
        // ======================================

        currentBuilding,
        setCurrentBuilding,

        // ======================================
        // Destination Building
        // ======================================

        selectedBuilding,
        setSelectedBuilding,

        // ======================================
        // Floor
        // ======================================

        currentFloor,
        setCurrentFloor,

        userFloor,
        setUserFloor,

        // ======================================
        // Initial Indoor Floor Selection
        // ======================================

        initialFloorSelection,
        setInitialFloorSelection,

        confirmInitialFloorSelection,
        cancelInitialFloorSelection,

        // ======================================
        // Floor Transition Confirmation
        // ======================================

        floorTransition,
        setFloorTransition,

        pendingFloorTransition,
        setPendingFloorTransition,

        confirmFloorTransition,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}