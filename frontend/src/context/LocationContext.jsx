import {
  createContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { loadBuildings } from "../navigation/loadBuildings";
import { detectCurrentBuilding } from "../navigation/buildingDetection";

// Number of recent GPS readings used for smoothing.
const MAX_LOCATION_HISTORY = 3;

export const LocationContext = createContext();

export function LocationProvider({ children }) {
  const [location, setLocation] = useState(null);
  const [rawLocation, setRawLocation] = useState(null);
  const [error, setError] = useState(null);

  // Recent raw GPS readings used for display smoothing.
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
       * Always preserve the real phone GPS reading.
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
         * Add the latest raw GPS reading.
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
         * IMPORTANT:
         *
         * Path snapping has been removed.
         *
         * Both indoor and outdoor positions now
         * use the GPS-based smoothed position.
         */
        setLocation({
          lat: smoothed.lat,
          lng: smoothed.lng,
          accuracy,
        });

      } catch (err) {
        console.error(
          "Location processing failed:",
          err
        );

        /*
         * If building detection/loading fails,
         * still display the GPS position.
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
              accuracy,
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