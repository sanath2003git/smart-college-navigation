import { useEffect, useRef, useState } from "react";

export default function useDeviceHeading() {
  const [heading, setHeading] = useState(null);

  const headingRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // ------------------------------------------
    // Circular angle difference
    // Handles 359° → 0° correctly.
    // ------------------------------------------
    const shortestAngleDifference = (from, to) => {
      return ((to - from + 540) % 360) - 180;
    };

    const handleOrientation = (event) => {
      let nextHeading = null;

      // ------------------------------------------
      // iOS Safari
      // ------------------------------------------
      if (
        typeof event.webkitCompassHeading === "number" &&
        event.webkitCompassAccuracy !== -1
      ) {
        nextHeading = event.webkitCompassHeading;
      }

      // ------------------------------------------
      // Android / other browsers
      // ------------------------------------------
      else if (typeof event.alpha === "number") {
        nextHeading = 360 - event.alpha - 90;
      }

      if (nextHeading === null) {
        return;
      }

      nextHeading = (nextHeading + 360) % 360;

      // ------------------------------------------
      // First valid reading
      // ------------------------------------------
      if (headingRef.current === null) {
        headingRef.current = nextHeading;
        setHeading(nextHeading);
        return;
      }

      // ------------------------------------------
      // Circular smoothing
      // ------------------------------------------

      const currentHeading = headingRef.current;

      const difference = shortestAngleDifference(
        currentHeading,
        nextHeading
      );

      // Smoothing factor.
      // Lower = smoother but slower.
      // Higher = faster but more sensitive to noise.
      const SMOOTHING_FACTOR = 0.18;

      const smoothedHeading =
        currentHeading +
        difference * SMOOTHING_FACTOR;

      const normalizedHeading =
        (smoothedHeading + 360) % 360;

      headingRef.current = normalizedHeading;

      setHeading(normalizedHeading);
    };

    let orientationEvent = "deviceorientation";

    const addOrientationListener = () => {
      window.addEventListener(
        orientationEvent,
        handleOrientation,
        true
      );
    };

    const removeOrientationListener = () => {
      window.removeEventListener(
        orientationEvent,
        handleOrientation,
        true
      );
    };

    // ------------------------------------------
    // iOS requires explicit permission.
    // ------------------------------------------

    const requestPermission = async () => {
      if (
        typeof DeviceOrientationEvent !== "undefined" &&
        typeof DeviceOrientationEvent.requestPermission ===
          "function"
      ) {
        try {
          const permission =
            await DeviceOrientationEvent.requestPermission();

          if (permission === "granted") {
            addOrientationListener();
          }
        } catch (error) {
          console.error(
            "Device orientation permission failed:",
            error
          );
        }

        return;
      }

      // ------------------------------------------
      // Android / browsers
      // Prefer absolute orientation when available.
      // ------------------------------------------

      if ("ondeviceorientationabsolute" in window) {
        orientationEvent = "deviceorientationabsolute";
      }

      addOrientationListener();
    };

    requestPermission();

    return () => {
      removeOrientationListener();
    };
  }, []);

  return heading;
}