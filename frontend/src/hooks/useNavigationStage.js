import { useEffect } from "react";

import { useNavigation } from "./useNavigation";

import { shouldEnterBuilding } from "../navigation/navigationStageManager";
import { NAVIGATION_STAGE } from "../constants/navigationStages";
import { navigate } from "../navigation/navigationRouter";
import { speak } from "../services/voiceService";
import { selectBestTransition } from "../navigation/transitionSelector";
import { findStairById } from "../services/stairService";

export function useNavigationStage() {
  const {
    currentLocation,

    destination,

    setRoute,

    targetEntrance,

    currentFloor,

    navigationStage,
    setNavigationStage,

    // IMPORTANT:
    // Store the selected stair/lift in navigation state
    // so useFloorTransition can use it.
    setTargetStair,
  } = useNavigation();

  useEffect(() => {
    async function handleStageTransition() {
      // -----------------------------------
      // Wait until everything is available
      // -----------------------------------

      if (!currentLocation) return;
      if (!destination) return;
      if (!targetEntrance) return;

      // Already inside the building
      if (
        navigationStage !==
        NAVIGATION_STAGE.OUTDOOR
      ) {
        return;
      }

      const [lng, lat] =
        targetEntrance.geometry.coordinates;

      // -----------------------------------
      // Destination floor
      // -----------------------------------

      const destinationFloor =
        destination.properties.floor ??
        destination.properties.level ??
        currentFloor;

      // -----------------------------------
      // Destination building
      // -----------------------------------

      const building =
        destination.properties.building;

      // -----------------------------------
      // Debug Logs
      // -----------------------------------

      console.log(
        "========== NAVIGATION STAGE =========="
      );

      console.log(
        "Stage:",
        navigationStage
      );

      console.log(
        "Destination Floor:",
        destinationFloor
      );

      console.log(
        "Current Floor:",
        currentFloor
      );

      console.log(
        "Building:",
        building
      );

      console.log("Destination:");

      console.log(
        destination.properties.room_no ??
          destination.properties.id
      );

      console.log(
        "========== TARGET ENTRANCE =========="
      );

      console.log(
        "Latitude :",
        lat
      );

      console.log(
        "Longitude:",
        lng
      );

      console.log(
        "========== CURRENT LOCATION =========="
      );

      console.log(
        "Latitude :",
        currentLocation.lat
      );

      console.log(
        "Longitude:",
        currentLocation.lng
      );

      // -----------------------------------
      // Check entrance
      // -----------------------------------

      const reachedEntrance =
        shouldEnterBuilding(
          currentLocation,
          { lat, lng },
          5
        );

      console.log(
        "Reached Entrance:",
        reachedEntrance
      );

      if (!reachedEntrance) {
        return;
      }

      // -----------------------------------
      // Entrance reached
      // -----------------------------------

      speak(
        `You have reached the entrance. Enter ${building}.`
      );

      console.log(
        "✅ Building entrance reached. Calculating Ground Floor route..."
      );

      let result = null;

      // Keep the selected transition
      // so we can use it for voice guidance
      // and store it for useFloorTransition.
      let selectedTransition = null;

      // ===================================
      // Ground Floor Destination
      // ===================================

      if (destinationFloor === 0) {
        console.log(
          "Destination is on Ground Floor."
        );

        // No stair/lift is required.
        setTargetStair(null);

        result = await navigate({
          stage:
            NAVIGATION_STAGE.GROUND_FLOOR,

          start: currentLocation,

          destination,

          building,
        });
      }

      // ===================================
      // Upper Floor Destination
      // ===================================

      else {
        console.log(
          "Destination is on an upper floor."
        );

        console.log(
          "Selecting transition from current floor..."
        );

        selectedTransition =
          await selectBestTransition({
            building,

            // IMPORTANT:
            // currentFloor = the floor the user
            // is physically navigating on.
            currentFloor,

            // destinationFloor = final destination.
            destinationFloor,

            start: currentLocation,
          });

        if (!selectedTransition) {
          console.error(
            "No floor transition available."
          );

          return;
        }

        console.log(
          "Selected Transition:",
          selectedTransition.id
        );

        console.log(
          "Transition Candidates:",
          selectedTransition.candidates
        );

        console.log(
          "Transition Strategy:",
          selectedTransition.strategy
        );

        // -----------------------------------
        // Resolve actual stair/lift feature
        // -----------------------------------

        const stairId =
          selectedTransition.id;

        console.log(
          "Resolving stair/lift:",
          stairId
        );

        const selectedStair =
          await findStairById(stairId);

        if (!selectedStair) {
          console.error(
            "Selected stair/lift not found:",
            stairId
          );

          setTargetStair(null);

          return;
        }

        console.log(
          "Resolved Stair/Lift:",
          selectedStair
        );

        // -----------------------------------
        // IMPORTANT HANDOFF
        //
        // Store the actual stair/lift feature
        // in NavigationContext.
        //
        // useFloorTransition.js will now receive:
        //
        // targetStair = MECH_STAIR_01_GF
        // -----------------------------------

        setTargetStair(
          selectedStair
        );

        console.log(
          "✅ Target stair stored:",
          selectedStair.properties?.id
        );

        // -----------------------------------
        // Calculate Ground Floor route
        // -----------------------------------

        result = await navigate({
          stage:
            NAVIGATION_STAGE.GROUND_FLOOR,

          start: currentLocation,

          stairId,

          transitionCandidates:
            selectedTransition.candidates,

          transitionStrategy:
            selectedTransition.strategy,

          building,
        });
      }

      // ===================================
      // Routing failed
      // ===================================

      if (!result) {
        console.error(
          "Failed to calculate Ground Floor route."
        );

        return;
      }

      // ===================================
      // Draw route
      // ===================================

      setRoute(
        result.route
      );

      console.log(
        "Ground Floor route set:",
        result.route
      );

      // ===================================
      // Voice guidance
      // ===================================

      speak(
        `You have reached the entrance. Enter ${building}.`
      );

      if (
        destinationFloor > 0 &&
        selectedTransition
      ) {
        const transitionName =
          selectedTransition.id ||
          "the selected stair or lift";

        setTimeout(() => {
          speak(
            `Proceed to ${transitionName}.`
          );
        }, 4000);
      }

      // ===================================
      // Change navigation stage
      // ===================================

      setNavigationStage(
        NAVIGATION_STAGE.GROUND_FLOOR
      );

      console.log(
        "Navigation stage changed to GROUND_FLOOR"
      );
    }

    handleStageTransition();
  }, [
    currentLocation,
    destination,
    targetEntrance,
    currentFloor,
    navigationStage,
    setNavigationStage,
    setRoute,
    setTargetStair,
  ]);
}