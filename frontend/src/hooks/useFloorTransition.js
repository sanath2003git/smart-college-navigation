import {
  useEffect,
  useRef,
} from "react";

import { useNavigation } from "./useNavigation";

import { NAVIGATION_STAGE } from "../constants/navigationStages";

import { shouldEnterBuilding } from "../navigation/navigationStageManager";

import { navigate } from "../navigation/navigationRouter";

import { getTransitionLocation } from "../navigation/graphConnector";

import { speak } from "../services/voiceService";

import { getNextTransition } from "../navigation/transitionService";

import { selectBestTransition } from "../navigation/transitionSelector";

import { findStairById } from "../services/stairService";

export function useFloorTransition() {
  const {
    currentLocation,

    destination,

    currentFloor,

    navigationStage,
    setNavigationStage,

    targetStair,
    setTargetStair,

    setRoute,
    setCurrentFloor,

    floorTransition,
    setFloorTransition,

    pendingFloorTransition,
    setPendingFloorTransition,
  } = useNavigation();

  // ==================================================
  // Prevent repeated processing while the user is
  // confirming a floor transition.
  // ==================================================

  const processingRef =
    useRef(false);

  // ==================================================
  // After the user confirms a floor, the GPS may still
  // report the old stair coordinates.
  //
  // We therefore wait until the user moves away from
  // the confirmation point before allowing the next
  // stair detection.
  // ==================================================

  const waitingForDepartureRef =
    useRef(false);

  const confirmationLocationRef =
    useRef(null);

  useEffect(() => {
    async function handleFloorTransition() {
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

      // ==================================================
      // Required state
      // ==================================================

      if (!currentLocation) {
        return;
      }

      if (!destination) {
        return;
      }

      if (!targetStair) {
        return;
      }

      // ==================================================
      // Don't process while confirmation dialog is open
      // ==================================================

      if (floorTransition?.open) {
        console.log(
          "Waiting for floor confirmation."
        );

        return;
      }

      // ==================================================
      // Don't process while another transition is pending
      // ==================================================

      if (pendingFloorTransition) {
        console.log(
          "Pending floor transition exists."
        );

        return;
      }

      // ==================================================
      // Don't process duplicate async executions
      // ==================================================

      if (processingRef.current) {
        return;
      }

      // ==================================================
      // Destination floor
      // ==================================================

      const destinationFloor =
        destination.properties.floor ??
        destination.properties.level;

      if (
        destinationFloor === undefined ||
        destinationFloor === null
      ) {
        console.error(
          "Destination floor missing."
        );

        return;
      }

      // ==================================================
      // Only handle upward navigation
      // ==================================================

      if (
        currentFloor >= destinationFloor
      ) {
        return;
      }

      // ==================================================
      // Expected navigation stage
      // ==================================================

      const expectedStage =
        getFloorStage(currentFloor);

      if (!expectedStage) {
        console.error(
          "No navigation stage found for floor:",
          currentFloor
        );

        return;
      }

      if (
        navigationStage !== expectedStage
      ) {
        return;
      }

      // ==================================================
      // Target transition coordinates
      // ==================================================

      const coordinates =
        targetStair.geometry?.coordinates;

      if (
        !coordinates ||
        coordinates.length < 2
      ) {
        console.error(
          "Invalid target transition coordinates."
        );

        return;
      }

      const [lng, lat] =
        coordinates;

      // ==================================================
      // Departure guard
      //
      // After confirming a floor, the user's GPS may
      // still be at the same physical stair coordinate.
      //
      // Do not immediately detect the next transition.
      // First require the user to move away.
      // ==================================================

      if (
        waitingForDepartureRef.current &&
        confirmationLocationRef.current
      ) {
        const movedAway =
          !shouldEnterBuilding(
            currentLocation,
            confirmationLocationRef.current,
            1.5
          );

        if (!movedAway) {
          console.log(
            "Waiting for user to move away from previous stair."
          );

          return;
        }

        console.log(
          "User moved away from previous stair."
        );

        waitingForDepartureRef.current =
          false;

        confirmationLocationRef.current =
          null;
      }

      // ==================================================
      // Check whether user reached current transition
      // ==================================================

      const reachedTransition =
        shouldEnterBuilding(
          currentLocation,
          {
            lat,
            lng,
          },
          1.5
        );

      console.log(
        "Target Transition:",
        targetStair.properties?.id
      );

      console.log(
        "Reached Transition:",
        reachedTransition
      );

      if (!reachedTransition) {
        return;
      }

      console.log(
        "✅ Current floor transition reached."
      );

      processingRef.current =
        true;

      try {
        // ==================================================
        // Building
        // ==================================================

        const building =
          destination.properties.building;

        if (!building) {
          console.error(
            "Destination building missing."
          );

          return;
        }

        // ==================================================
        // Current transition
        // ==================================================

        const currentTransitionId =
          targetStair.properties.id;

        console.log(
          "Current Transition ID:",
          currentTransitionId
        );

        // ==================================================
        // Find transition mapping
        // ==================================================

        const transition =
          getNextTransition(
            building,
            currentTransitionId
          );

        if (!transition) {
          console.error(
            `No transition mapping found for ${currentTransitionId}`
          );

          return;
        }

        const nextTransitionId =
          transition.next;

        console.log(
          "Transition Mapping:"
        );

        console.log(
          "Current:",
          currentTransitionId
        );

        console.log(
          "Next:",
          nextTransitionId
        );

        console.log(
          "Transition Info:",
          transition
        );

        if (!nextTransitionId) {
          console.error(
            "Next transition ID missing."
          );

          return;
        }

        // ==================================================
        // Find END point on next floor
        // ==================================================

        const nextFloorEnd =
          getTransitionLocation(
            building,
            nextTransitionId
          );

        console.log(
          "Next Floor END:",
          nextFloorEnd
        );

        if (!nextFloorEnd) {
          console.error(
            "Unable to locate next-floor END transition."
          );

          return;
        }

        // ==================================================
        // Determine next floor
        // ==================================================

        const nextFloor =
          currentFloor + 1;

        console.log(
          "Next Floor:",
          nextFloor
        );

        const nextStage =
          getFloorStage(nextFloor);

        if (!nextStage) {
          console.error(
            "No navigation stage for next floor:",
            nextFloor
          );

          return;
        }

        // ==================================================
        // CASE 1
        //
        // Destination is on next floor.
        //
        // Example:
        //
        // GF
        // ↓
        // F1
        // ↓
        // M203
        // ==================================================

        if (
          nextFloor === destinationFloor
        ) {
          console.log(
            "Destination is on the next floor."
          );

          const result =
            await navigate({
              stage: nextStage,

              building,

              start: nextFloorEnd,

              destination,
            });

          console.log(
            "Next Floor Navigation Result:",
            result
          );

          if (
            !result ||
            !result.route ||
            result.route.length === 0
          ) {
            console.error(
              "Next floor route generation failed."
            );

            return;
          }

          // ----------------------------------------------
          // Store the transition.
          //
          // DO NOT switch floors yet.
          // ----------------------------------------------

          setPendingFloorTransition({
            nextFloor,

            navigationStage:
              nextStage,

            targetStair: null,

            route:
              result.route,

            transitionId:
              currentTransitionId,

            transitionType:
              transition.type === "LIFT"
                ? "LIFT"
                : "STAIR",
          });

          // ----------------------------------------------
          // Store location where confirmation happened.
          // ----------------------------------------------

          confirmationLocationRef.current = {
            lat:
              currentLocation.lat,

            lng:
              currentLocation.lng,
          };

          // ----------------------------------------------
          // Show confirmation UI
          // ----------------------------------------------

          setFloorTransition({
            open: true,

            currentFloor,

            nextFloor,

            transitionId:
              currentTransitionId,

            transitionType:
              transition.type === "LIFT"
                ? "LIFT"
                : "STAIR",
          });

          speak(
            `You have reached the ${
              transition.type === "LIFT"
                ? "lift"
                : "stairs"
            }. Please go to floor ${nextFloor}.`
          );

          console.log(
            "⏸️ Waiting for floor confirmation."
          );

          return;
        }

        // ==================================================
        // CASE 2
        //
        // Destination is above next floor.
        //
        // Example:
        //
        // M302
        //
        // GF
        // ↓
        // F1
        // ↓
        // F2
        // ↓
        // M302
        // ==================================================

        console.log(
          "Destination is above the next floor."
        );

        console.log(
          "Selecting next floor transition..."
        );

        // ==================================================
        // Select transition on next floor
        // ==================================================

        const nextTransition =
          await selectBestTransition({
            building,

            currentFloor:
              nextFloor,

            destinationFloor,

            start:
              nextFloorEnd,
          });

        if (!nextTransition) {
          console.error(
            "No transition available on next floor."
          );

          return;
        }

        console.log(
          "Next Floor Transition:",
          nextTransition
        );

        const nextStartId =
          nextTransition.id;

        if (!nextStartId) {
          console.error(
            "Next transition ID missing."
          );

          return;
        }

        // ==================================================
        // Resolve START feature
        // ==================================================

        const nextStartStair =
          await findStairById(
            nextStartId
          );

        if (!nextStartStair) {
          console.error(
            "Unable to find next-floor transition:",
            nextStartId
          );

          return;
        }

        console.log(
          "Next Floor START:",
          nextStartStair
        );

        // ==================================================
        // Route END → START on next floor
        // ==================================================

        const result =
          await navigate({
            stage:
              nextStage,

            building,

            start:
              nextFloorEnd,

            destination:
              nextStartStair,
          });

        console.log(
          "Next Floor Transition Route:",
          result
        );

        if (
          !result ||
          !result.route ||
          result.route.length === 0
        ) {
          console.error(
            "Unable to generate route to next transition."
          );

          return;
        }

        // ==================================================
        // Store pending transition.
        //
        // IMPORTANT:
        //
        // We do NOT switch to the next floor yet.
        // ==================================================

        setPendingFloorTransition({
          nextFloor,

          navigationStage:
            nextStage,

          targetStair:
            nextStartStair,

          route:
            result.route,

          transitionId:
            currentTransitionId,

          transitionType:
            transition.type === "LIFT"
              ? "LIFT"
              : "STAIR",
        });

        // ==================================================
        // Store current confirmation location
        // ==================================================

        confirmationLocationRef.current = {
          lat:
            currentLocation.lat,

          lng:
            currentLocation.lng,
        };

        // ==================================================
        // Show confirmation
        // ==================================================

        setFloorTransition({
          open: true,

          currentFloor,

          nextFloor,

          transitionId:
            currentTransitionId,

          transitionType:
            transition.type === "LIFT"
              ? "LIFT"
              : "STAIR",
        });

        speak(
          `You have reached the ${
            transition.type === "LIFT"
              ? "lift"
              : "stairs"
          }. Please go to floor ${nextFloor}.`
        );

        console.log(
          "⏸️ Waiting for floor confirmation."
        );

        console.log(
          "Pending next floor:",
          nextFloor
        );

        console.log(
          "Next target START:",
          nextStartId
        );

        return;
      } finally {
        processingRef.current =
          false;
      }
    }

    handleFloorTransition();
  }, [
    currentLocation,
    destination,
    currentFloor,
    navigationStage,
    targetStair,

    floorTransition?.open,
    pendingFloorTransition,

    setNavigationStage,
    setRoute,
    setCurrentFloor,
    setTargetStair,

    setFloorTransition,
    setPendingFloorTransition,
  ]);
}

// ======================================================
// FLOOR → NAVIGATION STAGE
// ======================================================

function getFloorStage(floor) {
  switch (floor) {
    case 0:
      return NAVIGATION_STAGE.GROUND_FLOOR;

    case 1:
      return NAVIGATION_STAGE.FIRST_FLOOR;

    case 2:
      return NAVIGATION_STAGE.SECOND_FLOOR;

    case 3:
      return NAVIGATION_STAGE.THIRD_FLOOR;

    default:
      return null;
  }
}