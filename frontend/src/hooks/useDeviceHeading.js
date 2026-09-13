import { useEffect, useState } from "react";

export default function useDeviceHeading() {
  const [heading, setHeading] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOrientation = (event) => {
      let nextHeading = null;

      // iPhone / iPad
      if (
        typeof event.webkitCompassHeading === "number" &&
        event.webkitCompassAccuracy !== -1
      ) {
        nextHeading = event.webkitCompassHeading;
      }

      // Android / other browsers
      else if (typeof event.alpha === "number") {
        nextHeading = 360 - event.alpha;
      }

      if (nextHeading === null) return;

      nextHeading = (nextHeading + 360) % 360;

      setHeading(nextHeading);
    };

    const addListeners = () => {
      window.addEventListener(
        "deviceorientationabsolute",
        handleOrientation,
        true
      );

      window.addEventListener(
        "deviceorientation",
        handleOrientation,
        true
      );
    };

    // iOS requires permission.
    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission === "function"
    ) {
      DeviceOrientationEvent.requestPermission()
        .then((permission) => {
          if (permission === "granted") {
            addListeners();
          }
        })
        .catch((error) => {
          console.error(
            "Device orientation permission failed:",
            error
          );
        });
    } else {
      // Android and browsers without an explicit permission API
      addListeners();
    }

    return () => {
      window.removeEventListener(
        "deviceorientationabsolute",
        handleOrientation,
        true
      );

      window.removeEventListener(
        "deviceorientation",
        handleOrientation,
        true
      );
    };
  }, []);

  return heading;
}