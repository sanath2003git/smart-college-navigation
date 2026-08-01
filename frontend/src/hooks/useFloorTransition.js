import { useEffect } from "react";

import { useNavigation } from "./useNavigation";

import { NAVIGATION_STAGE } from "../constants/navigationStages";

import { shouldEnterBuilding } from "../navigation/navigationStageManager";

import { navigate } from "../navigation/navigationRouter";

import { getTransitionLocation } from "../navigation/graphConnector";

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
      console.log(
        "========== useFloorTransition =========="
      );

      console.log(
        "currentLocation:",
        currentLocation
      );

      console.log(
        "destination:",
        destination
      );

      console.log(
        "targetStair:",
        targetStair
      );

      console.log(
        "currentFloor:",
        currentFloor
      );

      console.log(
        "navigationStage:",
        navigationStage
      );

      // -----------------------------------
      // Required navigation state
      // -----------------------------------

      if (!currentLocation) return;
      if (!destination) return;
      if (!targetStair) return;

      // Destination must be First Floor.
      if (currentFloor !== 1) return;

      // User must currently be navigating
      // through the Ground Floor.
      if (
        navigationStage !==
        NAVIGATION_STAGE.GROUND_FLOOR
      ) {
        return;
      }

      // -----------------------------------
      // Check arrival at GF transition
      // -----------------------------------

      const [lng, lat] =
        targetStair.geometry.coordinates;

      console.log(
        "========== FLOOR TRANSITION =========="
      );

      console.log(
        "Destination Floor:",
        currentFloor
      );

      console.log(
        "Target Transition:",
        targetStair.properties.id
      );

      console.log(
        "Target Transition Coordinates:"
      );

      console.log("Latitude :", lat);
      console.log("Longitude:", lng);

      console.log(
        "Current Location:"
      );

      console.log(
        "Latitude :",
        currentLocation.lat
      );

      console.log(
        "Longitude:",
        currentLocation.lng
      );

      const reachedTransition =
        shouldEnterBuilding(
          currentLocation,
          {
            lat,
            lng,
          },
          3
        );

      console.log(
        "Reached Transition:",
        reachedTransition
      );

      if (!reachedTransition) return;

      // -----------------------------------
      // Determine building
      // -----------------------------------

      const building =
        destination.properties.building;

      if (!building) {
        console.error(
          "Destination building missing."
        );

        return;
      }

      // -----------------------------------
      // GF transition ID → FF transition ID
      // -----------------------------------

      const groundFloorTransitionId =
        targetStair.properties.id;

      const firstFloorTransitionId =
  groundFloorTransitionId.replace(
    "_GF",
    "_F1_START"
  );

      console.log(
        "GF Transition:",
        groundFloorTransitionId
      );

      console.log(
        "FF Transition:",
        firstFloorTransitionId
      );

      // -----------------------------------
      // Get FF graph start location
      // -----------------------------------

      const firstFloorStart =
        getTransitionLocation(
          building,
          firstFloorTransitionId
        );

      console.log(
        "First Floor Start:",
        firstFloorStart
      );

      if (!firstFloorStart) {
        console.error(
          "Unable to locate corresponding First Floor transition."
        );

        return;
      }

      // -----------------------------------
      // Generate First Floor route
      // -----------------------------------

      const result = await navigate({
        stage:
          NAVIGATION_STAGE.FIRST_FLOOR,

        building,

        start: firstFloorStart,

        destination,
      });

      console.log(
        "First Floor Navigation Result:"
      );

      console.log(result);

      if (
        !result ||
        !result.route ||
        result.route.length === 0
      ) {
        console.error(
          "First Floor route generation failed."
        );

        return;
      }

      // -----------------------------------
      // Switch navigation to FF
      // -----------------------------------

      speak("Go to First Floor.");

      console.log(
        "✅ Transition reached."
      );

      console.log(
        "Switching to First Floor..."
      );

      setNavigationStage(
        NAVIGATION_STAGE.FIRST_FLOOR
      );

      setRoute(result.route);

      console.log(
        "========== FIRST FLOOR ROUTE =========="
      );

      console.log(result.route);
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