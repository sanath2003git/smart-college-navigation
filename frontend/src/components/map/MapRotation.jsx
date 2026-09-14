import { useEffect } from "react";
import { useMap } from "react-leaflet";

import useDeviceHeading from "../../hooks/useDeviceHeading";

export default function MapRotation({ active }) {
  const map = useMap();

  const heading = useDeviceHeading();

  // ==========================================
  // Heading → Map Orientation
  // ==========================================

  useEffect(() => {
    if (!active) {
      if (
        typeof map.stopHeadingUp === "function"
      ) {
        map.stopHeadingUp();
      }

      if (typeof map.setBearing === "function") {
        map.setBearing(0);
      }

      return;
    }

    if (heading === null) {
      return;
    }

    if (typeof map.setHeading !== "function") {
      console.warn(
        "Leaflet rotation plugin is not available."
      );
      return;
    }

    map.setHeading(heading, {
      ease: 0.12,
      deadzone: 0.5,
    });
  }, [map, heading, active]);

  // ==========================================
  // Stop heading-up mode on unmount
  // ==========================================

  useEffect(() => {
    return () => {
      if (
        typeof map.stopHeadingUp === "function"
      ) {
        map.stopHeadingUp();
      }
    };
  }, [map]);

  return null;
}
