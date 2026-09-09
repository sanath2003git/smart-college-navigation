import { createContext, useEffect, useState } from "react";
import { snapToWalkway } from "../services/pathSnappingService";

// Export the context so custom hooks can use it
export const LocationContext = createContext();

const MAX_GPS_ACCURACY_FOR_SNAPPING = 25;
const MAX_SNAP_DISTANCE = 6;

export function LocationProvider({ children }) {
  // Location displayed on the map
  const [location, setLocation] = useState(null);

  // Original GPS location from the device
  const [rawLocation, setRawLocation] = useState(null);

  const [error, setError] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        const raw = {
          lat: latitude,
          lng: longitude,
          accuracy,
        };

        // Always preserve the real GPS location.
        setRawLocation(raw);

        // By default, display the raw GPS position.
        setLocation({
          ...raw,
          isSnapped: false,
          snapDistance: null,
        });

        /*
         * Only attempt path snapping when GPS accuracy
         * is good enough.
         */
        if (accuracy > MAX_GPS_ACCURACY_FOR_SNAPPING) {
          return;
        }

        try {
          const snapped = await snapToWalkway(
            latitude,
            longitude,
            MAX_SNAP_DISTANCE
          );

          /*
           * No suitable walkway nearby.
           * Keep the original GPS location.
           */
          if (!snapped) {
            return;
          }

          /*
           * Use the snapped point for display,
           * while preserving the original GPS accuracy.
           */
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
          console.error("Path snapping failed:", err);

          // If snapping fails, continue using raw GPS.
          setLocation({
            ...raw,
            isSnapped: false,
            snapDistance: null,
          });
        }
      },

      (err) => {
        setError(err.message);
      },

      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 10000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
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