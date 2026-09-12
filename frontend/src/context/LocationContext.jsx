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
      // Prevent extremely accurate readings from dominating completely.
      const accuracy = Math.max(reading.accuracy, 5);

      const weight = 1 / (accuracy * accuracy);

      weightedLat += reading.lat * weight;
      weightedLng += reading.lng * weight;
      totalWeight += weight;
    }

    return {
      lat: weightedLat / totalWeight,
      lng: weightedLng / totalWeight,
    };
  }

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported.");
      return;
    }

    let isMounted = true;

    async function processLocation(position) {
      const requestId = ++locationRequestId.current;

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

      if (!isMounted) return;

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
         */
        const buildings = await loadBuildings();

        if (
          !isMounted ||
          requestId !== locationRequestId.current
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
         * If the indoor/outdoor state changes,
         * clear previous GPS history.
         *
         * This prevents outdoor readings from affecting
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
         * This prevents the blue marker from being pulled
         * toward previous GPS readings by the smoothing
         * algorithm.
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
         * behavior rather than losing the GPS position.
         */
        if (
          isMounted &&
          requestId === locationRequestId.current
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

    return () => {
      isMounted = false;

      navigator.geolocation.clearWatch(
        watchId
      );
    };
  }, []);

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