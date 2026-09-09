import {
  createContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { snapToWalkway } from "../services/pathSnappingService";
import { loadBuildings } from "../navigation/loadBuildings";
import { detectCurrentBuilding } from "../navigation/buildingDetection";

// Maximum GPS accuracy we accept for outdoor path snapping.
const MAX_GPS_ACCURACY_FOR_SNAPPING = 25;

// Maximum distance from a walkway at which snapping is allowed.
const MAX_SNAP_DISTANCE = 6;

export const LocationContext = createContext();

export function LocationProvider({ children }) {
  const [location, setLocation] = useState(null);
  const [rawLocation, setRawLocation] = useState(null);
  const [error, setError] = useState(null);
  const locationRequestId = useRef(0);

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

      // Always preserve the real GPS location.
      setRawLocation(raw);

      /*
       * Start with the raw GPS position.
       * This is also our fallback when snapping isn't appropriate.
       */
      const rawDisplayLocation = {
        ...raw,
        isSnapped: false,
        snapDistance: null,
      };

      setLocation(rawDisplayLocation);

      /*
       * Don't attempt walkway snapping when GPS accuracy
       * is too poor.
       */
      if (accuracy > MAX_GPS_ACCURACY_FOR_SNAPPING) {
        return;
      }

      try {
        /*
         * Check whether the RAW GPS position is inside
         * a mapped building.
         */
        const buildings = await loadBuildings();

        const currentBuilding = detectCurrentBuilding(
          raw,
          buildings
        );

        /*
         * IMPORTANT:
         * Never snap an indoor GPS position to an outdoor walkway.
         */
        if (currentBuilding) {
          console.log(
            "Inside building - walkway snapping disabled:",
            currentBuilding.properties.name
          );

          return;
        }

        /*
         * We are outside and GPS accuracy is acceptable,
         * so attempt walkway snapping.
         */
        const snapped = await snapToWalkway(
          latitude,
          longitude,
          MAX_SNAP_DISTANCE
        );

        if (
          !snapped ||
          !isMounted ||
          requestId !== locationRequestId.current
        ) {
          return;
        }

        setLocation({
          lat: snapped.lat,
          lng: snapped.lng,
          accuracy,
          isSnapped: true,
          snapDistance: snapped.distance,
          rawLat: latitude,
          rawLng: longitude,
        });
      } catch (err) {
        console.error(
          "Location processing failed:",
          err
        );
      }
    }

    const watchId = navigator.geolocation.watchPosition(
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
      navigator.geolocation.clearWatch(watchId);
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