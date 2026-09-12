import { useEffect, useRef } from "react";

import { useNavigation } from "./useNavigation";

import {
  loadBuildings,
} from "../navigation/loadBuildings";

import {
  detectCurrentBuilding,
} from "../navigation/buildingDetection";

// Number of confirmations required when
// changing buildings during normal navigation.
const REQUIRED_CONFIRMATIONS = 3;

export default function useCurrentBuilding() {
  const {
    currentLocation,
    currentBuilding,
    setCurrentBuilding,
  } = useNavigation();

  // ==========================================
  // Building candidate
  // ==========================================

  const candidateBuildingRef =
    useRef(null);

  const candidateCountRef =
    useRef(0);

  // ==========================================
  // Initial building detection
  //
  // Used only for the first meaningful GPS
  // detection after the app opens.
  //
  // This allows the floor-selection dialog
  // to appear quickly when the user starts
  // SmartNav inside a building.
  // ==========================================

  const initialDetectionCompletedRef =
    useRef(false);

  useEffect(() => {
    if (!currentLocation) {
      return;
    }

    async function detectBuilding() {
      try {
        const buildings =
          await loadBuildings();

        const building =
          detectCurrentBuilding(
            currentLocation,
            buildings
          );

        const detectedBuilding =
          building?.properties?.name ??
          null;

        // ======================================
        // No building detected
        // ======================================

        if (!detectedBuilding) {
          candidateBuildingRef.current =
            null;

          candidateCountRef.current =
            0;

          /*
           * Only mark initial detection as
           * completed after we have received
           * a meaningful building/outdoor
           * result.
           *
           * This prevents the first GPS reading
           * being outside from permanently
           * disabling initial indoor detection.
           */
          if (
            !initialDetectionCompletedRef.current
          ) {
            console.log(
              "Initial building detection: outside building"
            );
          } else {
            console.log(
              "Building detection: no building detected"
            );
          }

          return;
        }

        console.log(
          "Building detected:",
          detectedBuilding
        );

        // ======================================
        // INITIAL DETECTION
        // ======================================
        //
        // If SmartNav starts while the user is
        // already inside a building, confirm
        // immediately instead of waiting for
        // three GPS readings.
        // ======================================

        if (
          !initialDetectionCompletedRef.current
        ) {
          console.log(
            "========== INITIAL BUILDING DETECTION =========="
          );

          console.log(
            "Initial building:",
            detectedBuilding
          );

          console.log(
            "Confirming immediately."
          );

          setCurrentBuilding(
            detectedBuilding
          );

          initialDetectionCompletedRef.current =
            true;

          candidateBuildingRef.current =
            null;

          candidateCountRef.current =
            0;

          console.log(
            "Initial building confirmed:",
            detectedBuilding
          );

          console.log(
            "================================================="
          );

          return;
        }

        // ======================================
        // Same building
        // ======================================

        if (
          detectedBuilding ===
          currentBuilding
        ) {
          candidateBuildingRef.current =
            detectedBuilding;

          candidateCountRef.current =
            0;

          return;
        }

        // ======================================
        // New building candidate
        // ======================================

        if (
          candidateBuildingRef.current ===
          detectedBuilding
        ) {
          candidateCountRef.current += 1;
        } else {
          candidateBuildingRef.current =
            detectedBuilding;

          candidateCountRef.current =
            1;
        }

        console.log(
          `Building candidate: ${detectedBuilding} ` +
            `(${candidateCountRef.current}/${REQUIRED_CONFIRMATIONS})`
        );

        // ======================================
        // Confirm normal building change
        // ======================================

        if (
          candidateCountRef.current >=
          REQUIRED_CONFIRMATIONS
        ) {
          console.log(
            "Confirmed Current Building:",
            detectedBuilding
          );

          setCurrentBuilding(
            detectedBuilding
          );

          candidateBuildingRef.current =
            null;

          candidateCountRef.current =
            0;
        }

      } catch (error) {
        console.error(
          "Building detection failed:",
          error
        );
      }
    }

    detectBuilding();

  }, [
    currentLocation,
    currentBuilding,
    setCurrentBuilding,
  ]);
}