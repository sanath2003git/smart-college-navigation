import { useState } from "react";
import NavigationContext from "./NavigationContext";
import { NAVIGATION_STAGE } from "../constants/navigationStages";

export function NavigationProvider({ children }) {
  // Current Navigation Route
  const [route, setRoute] = useState([]);

  // User GPS Location
  const [currentLocation, setCurrentLocation] = useState(null);

  // Selected Destination
  const [destination, setDestination] = useState(null);

  // Target Building Entrance
  const [targetEntrance, setTargetEntrance] = useState(null);

  // Target Staircase
  const [targetStair, setTargetStair] = useState(null);

  // Navigation Stage
  const [navigationStage, setNavigationStage] = useState(
    NAVIGATION_STAGE.OUTDOOR
  );

  // Current Building
  const [currentBuilding, setCurrentBuilding] = useState(null);

  // Destination Building
  const [selectedBuilding, setSelectedBuilding] = useState(null);

  // Current Destination Floor
  const [currentFloor, setCurrentFloor] = useState(0);

  return (
    <NavigationContext.Provider
      value={{
        // Route
        route,
        setRoute,

        // Current Location
        currentLocation,
        setCurrentLocation,

        // Destination
        destination,
        setDestination,

        // Target Entrance
        targetEntrance,
        setTargetEntrance,

        // Target Stair
        targetStair,
        setTargetStair,

        // Navigation Stage
        navigationStage,
        setNavigationStage,

        // Current Building
        currentBuilding,
        setCurrentBuilding,

        // Destination Building
        selectedBuilding,
        setSelectedBuilding,

        // Floor
        currentFloor,
        setCurrentFloor,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}