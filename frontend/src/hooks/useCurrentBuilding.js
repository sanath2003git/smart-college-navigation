import { useEffect, useRef } from "react";
import { useNavigation } from "./useNavigation";
import { loadBuildings } from "../navigation/loadBuildings";
import { detectCurrentBuilding } from "../navigation/buildingDetection";

const REQUIRED_CONFIRMATIONS = 3;

export default function useCurrentBuilding() {
  const {
    currentLocation,
    currentBuilding,
    setCurrentBuilding,
  } = useNavigation();

  // Keeps track of consecutive detections.
  const candidateBuildingRef = useRef(null);
  const candidateCountRef = useRef(0);

  useEffect(() => {
    if (!currentLocation) return;

    async function detectBuilding() {
      try {
        const buildings = await loadBuildings();

        const building = detectCurrentBuilding(
          currentLocation,
          buildings
        );

        const detectedBuilding =
          building?.properties.name ?? null;

        /*
         * No building detected.
         *
         * Do not immediately switch outside because
         * a single bad GPS reading can occur indoors.
         */
        if (!detectedBuilding) {
          candidateBuildingRef.current = null;
          candidateCountRef.current = 0;

          console.log(
            "Building detection: no building detected"
          );

          return;
        }

        /*
         * Same building as the current confirmed building.
         */
        if (detectedBuilding === currentBuilding) {
          candidateBuildingRef.current = detectedBuilding;
          candidateCountRef.current = 0;

          return;
        }

        /*
         * New building candidate.
         */
        if (
          candidateBuildingRef.current === detectedBuilding
        ) {
          candidateCountRef.current += 1;
        } else {
          candidateBuildingRef.current = detectedBuilding;
          candidateCountRef.current = 1;
        }

        console.log(
          `Building candidate: ${detectedBuilding} ` +
            `(${candidateCountRef.current}/${REQUIRED_CONFIRMATIONS})`
        );

        /*
         * Confirm the building only after several
         * consecutive GPS readings agree.
         */
        if (
          candidateCountRef.current >=
          REQUIRED_CONFIRMATIONS
        ) {
          console.log(
            "Confirmed Current Building:",
            detectedBuilding
          );

          setCurrentBuilding(detectedBuilding);

          candidateBuildingRef.current = null;
          candidateCountRef.current = 0;
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