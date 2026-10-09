import { useEffect, useRef } from "react";

import { useNavigation } from "./useNavigation";
import { NAVIGATION_STAGE } from "../constants/navigationStages";
import { hasReachedLocation } from "../navigation/navigationStageManager";
import { speak } from "../services/voiceService";

/**
 * Extract representative coordinate and point list from destination feature/object.
 * Handles Point, Polygon, MultiPolygon, or raw coordinates array.
 */
function getRepresentativeCoordinates(dest) {
  if (!dest) return null;

  const raw = dest.geometry?.coordinates ?? dest.coordinates;
  if (!raw) return null;

  // Single [lng, lat] coordinate pair
  if (
    Array.isArray(raw) &&
    raw.length >= 2 &&
    typeof raw[0] === "number" &&
    typeof raw[1] === "number"
  ) {
    return {
      centroid: { lng: raw[0], lat: raw[1] },
      points: [raw],
    };
  }

  // Nested coordinate arrays (Polygon / MultiPolygon)
  const points = [];
  function collect(val) {
    if (!Array.isArray(val)) return;
    if (
      val.length >= 2 &&
      typeof val[0] === "number" &&
      typeof val[1] === "number"
    ) {
      points.push(val);
      return;
    }
    val.forEach(collect);
  }
  collect(raw);

  if (points.length === 0) return null;

  const total = points.reduce(
    (acc, [lng, lat]) => ({
      lng: acc.lng + lng,
      lat: acc.lat + lat,
    }),
    { lng: 0, lat: 0 }
  );

  return {
    centroid: {
      lng: total.lng / points.length,
      lat: total.lat / points.length,
    },
    points,
  };
}

export function useDestinationArrival() {
  const {
    currentLocation,
    destination,
    route,
    navigationStage,
    currentFloor,
    selectedBuilding,
    targetStair,
    floorTransition,
    pendingFloorTransition,
    cancelNavigation,
    completeNavigation,
  } = useNavigation();

  // Prevent repeated arrival actions for the same destination
  const hasAnnounced = useRef(false);

  useEffect(() => {
    // Only check arrival during an active navigation session
    if (!route || route.length === 0) return;
    if (!currentLocation || !destination) return;
    if (hasAnnounced.current) return;

    // Safety guard:
    // If a floor transition is open/pending or targetStair is set,
    // the user is navigating to an intermediate transition, not the destination.
    if (targetStair || floorTransition?.open || pendingFloorTransition) {
      return;
    }

    const building =
      destination.properties?.building ?? selectedBuilding;

    const destinationFloor =
      destination.properties?.floor ?? destination.properties?.level;

    // Indoor building guards:
    if (building) {
      // Must not be still on the outdoor walkway approaching the entrance
      if (navigationStage === NAVIGATION_STAGE.OUTDOOR) {
        return;
      }

      // Must be on the final destination floor
      if (
        destinationFloor !== undefined &&
        destinationFloor !== null &&
        Number(currentFloor) !== Number(destinationFloor)
      ) {
        return;
      }
    }

    const coordsData = getRepresentativeCoordinates(destination);
    if (!coordsData) return;

    const { centroid, points } = coordsData;

    // Use existing hasReachedLocation with the established threshold of 3 meters
    let reached = hasReachedLocation(currentLocation, centroid, 3);
    if (!reached && points.length > 1) {
      reached = points.some(([pLng, pLat]) =>
        hasReachedLocation(currentLocation, { lat: pLat, lng: pLng }, 3)
      );
    }

    console.log("========== DESTINATION ARRIVAL ==========");
    console.log("Current:", currentLocation);
    console.log("Destination Centroid:", centroid);
    console.log("Reached:", reached);

    if (!reached) return;

    hasAnnounced.current = true;

    const room =
      destination.properties?.room_no ??
      destination.properties?.room ??
      destination.properties?.name ??
      destination.properties?.id ??
      "Destination";

    const isIndoor = Boolean(building);

    speak(`You have reached destination ${room}.`);

    // End active navigation session while preserving indoor building and floor
    if (typeof completeNavigation === "function") {
      completeNavigation({
        building: isIndoor ? building : null,
        floor: isIndoor ? (destinationFloor ?? currentFloor) : 0,
        stage: isIndoor ? navigationStage : NAVIGATION_STAGE.OUTDOOR,
      });
    } else if (typeof cancelNavigation === "function") {
      cancelNavigation();
    }
  }, [
    currentLocation,
    destination,
    route,
    navigationStage,
    currentFloor,
    selectedBuilding,
    targetStair,
    floorTransition?.open,
    pendingFloorTransition,
    cancelNavigation,
    completeNavigation,
  ]);

  // Reset guard when destination changes
  useEffect(() => {
    hasAnnounced.current = false;
  }, [destination]);
}