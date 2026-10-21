import {
  createContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { loadBuildings } from "../navigation/loadBuildings";
import { detectCurrentBuilding } from "../navigation/buildingDetection";

// Number of recent GPS readings used for outdoor smoothing.
const MAX_LOCATION_HISTORY = 3;

export const LocationContext = createContext();

export function LocationProvider({ children }) {
  const [location, setLocation] = useState(null);
  const [rawLocation, setRawLocation] = useState(null);
  const [error, setError] = useState(null);

  // Recent raw GPS readings used for outdoor display smoothing.
  const locationHistoryRef = useRef([]);

  // Prevent older async GPS processing from overwriting newer readings.
  const locationRequestId = useRef(0);

  // Track whether the user is currently inside a building.
  const insideBuildingRef = useRef(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported.");
      return;
    }

    let isMounted = true;

    // =========================================================
    // PRELOAD BUILDING DATA
    // =========================================================
    //
    // Start loading building GeoJSON immediately when the
    // LocationProvider starts.
    //
    // This means building detection does not have to wait
    // unnecessarily for the application to progress further.
    //
    loadBuildings().catch((err) => {
      console.error(
        "Building data preload failed:",
        err
      );
    });

    // =========================================================
    // PROCESS GPS LOCATION
    // =========================================================

    async function processLocation(position) {
      const requestId =
        ++locationRequestId.current;

      const {
        latitude,
        longitude,
        accuracy,
      } = position.coords;

      const raw = {
        lat: latitude,
        lng: longitude,
        accuracy,
      };

      if (!isMounted) {
        return;
      }

      /*
       * Always preserve the real GPS reading.
       *
       * Building detection and navigation use this value.
       */
      setRawLocation(raw);

      try {
        /*
         * Determine whether the RAW GPS position is inside
         * a mapped building.
         *
         * loadBuildings() is cached, so once the preload
         * has completed this should return the cached data.
         */
        const buildings =
          await loadBuildings();

        /*
         * Ignore this result if a newer GPS request has
         * already started.
         */
        if (
          !isMounted ||
          requestId !==
            locationRequestId.current
        ) {
          return;
        }

        const currentBuilding =
          detectCurrentBuilding(
            raw,
            buildings
          );

        const isInsideBuilding =
          Boolean(currentBuilding);

        /*
         * --------------------------------------------------
         * INDOOR / OUTDOOR STATE CHANGE
         * --------------------------------------------------
         *
         * Clear the previous smoothing history when the
         * user changes between indoor and outdoor.
         *
         * This prevents old outdoor readings from affecting
         * the first indoor position and vice versa.
         */
        if (
          isInsideBuilding !==
          insideBuildingRef.current
        ) {
          locationHistoryRef.current = [];

          insideBuildingRef.current =
            isInsideBuilding;
        }

        /*
         * --------------------------------------------------
         * INDOOR MODE
         * --------------------------------------------------
         *
         * Use the latest RAW GPS position directly.
         *
         * This keeps the indoor blue marker responsive
         * and prevents previous outdoor readings from
         * pulling the marker away from the actual position.
         */
        if (isInsideBuilding) {
          setLocation({
            lat: raw.lat,
            lng: raw.lng,
            accuracy: raw.accuracy,
          });

          return;
        }

        /*
         * --------------------------------------------------
         * OUTDOOR MODE
         * --------------------------------------------------
         *
         * Keep the existing 3-reading smoothing behavior.
         */
        locationHistoryRef.current.push(raw);

        if (
          locationHistoryRef.current.length >
          MAX_LOCATION_HISTORY
        ) {
          locationHistoryRef.current.shift();
        }

        /*
         * Calculate the weighted average of the
         * recent GPS readings.
         */
        const smoothed =
          getSmoothedLocation(
            locationHistoryRef.current
          );

        if (!smoothed) {
          return;
        }

        /*
         * Path snapping has been removed.
         *
         * Outdoor position uses GPS-based smoothing only.
         */
        setLocation({
          lat: smoothed.lat,
          lng: smoothed.lng,
          accuracy: raw.accuracy,
        });

      } catch (err) {
        console.error(
          "Location processing failed:",
          err
        );

        /*
         * If building detection/loading fails,
         * fall back to the existing outdoor smoothing
         * behavior instead of losing the GPS position.
         */
        if (
          isMounted &&
          requestId ===
            locationRequestId.current
        ) {
          locationHistoryRef.current.push(raw);

          if (
            locationHistoryRef.current.length >
            MAX_LOCATION_HISTORY
          ) {
            locationHistoryRef.current.shift();
          }

          const smoothed =
            getSmoothedLocation(
              locationHistoryRef.current
            );

          if (smoothed) {
            setLocation({
              lat: smoothed.lat,
              lng: smoothed.lng,
              accuracy: raw.accuracy,
            });
          }
        }
      }
    }

    // =========================================================
    // GPS WATCHER
    // =========================================================

    const watchId =
      navigator.geolocation.watchPosition(
        processLocation,

        (err) => {
          if (isMounted) {
            setError(err.message);
          }
        },

        {
          enableHighAccuracy: true,
          maximumAge: 1000,
          timeout: 10000,
        }
      );

    // =========================================================
    // CLEANUP
    // =========================================================

    return () => {
      isMounted = false;

      navigator.geolocation.clearWatch(
        watchId
      );
    };
  }, []);

  // ===========================================================
  // CONTEXT VALUE
  // ===========================================================

  return (
    <LocationContext.Provider
      value={{
        location,
        rawLocation,
        error,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

/**
 * Calculate a smoothed position from recent GPS readings.
 *
 * More accurate readings receive more weight.
 */
function getSmoothedLocation(readings) {
  if (!readings.length) {
    return null;
  }

  let totalWeight = 0;
  let weightedLat = 0;
  let weightedLng = 0;

  for (const reading of readings) {
    /*
     * Prevent extremely accurate readings from
     * dominating the calculation completely.
     */
    const accuracy =
      Math.max(
        reading.accuracy,
        5
      );

    const weight =
      1 /
      (accuracy * accuracy);

    weightedLat +=
      reading.lat *
      weight;

    weightedLng +=
      reading.lng *
      weight;

    totalWeight += weight;
  }

  return {
    lat:
      weightedLat /
      totalWeight,

    lng:
      weightedLng /
      totalWeight,
  };
}