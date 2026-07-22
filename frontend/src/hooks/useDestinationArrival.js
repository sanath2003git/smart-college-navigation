import { useEffect, useRef } from "react";

import { useNavigation } from "./useNavigation";

import { hasReachedLocation } from "../navigation/navigationStageManager";
import { speak } from "../services/voiceService";

export function useDestinationArrival() {
  const {
    currentLocation,
    destination,
  } = useNavigation();

  // Prevent repeated announcements
  const hasAnnounced = useRef(false);

  useEffect(() => {
    if (!currentLocation) return;
    if (!destination) return;

    const [lng, lat] = destination.geometry.coordinates;

    const reached = hasReachedLocation(
      currentLocation,
      { lat, lng },
      3
    );
    console.log("========== DESTINATION ARRIVAL ==========");
    console.log("Current:", currentLocation);
    console.log("Destination:", { lat, lng });
    console.log("Reached:", reached);
    if (!reached) return;

    if (hasAnnounced.current) return;

    hasAnnounced.current = true;

    const room =
  destination.properties.room_no ??
  destination.properties.room ??
  destination.properties.id;

speak(`You have reached ${room}.`);
  }, [
    currentLocation,
    destination,
  ]);

  // Reset for the next navigation
  useEffect(() => {
    hasAnnounced.current = false;
  }, [destination]);
}