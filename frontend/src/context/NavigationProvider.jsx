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
  //
  // Stores the route/state that should be
  // applied AFTER the user confirms.
  // ==========================================

  const [
    pendingFloorTransition,
    setPendingFloorTransition,
  ] = useState(null);

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