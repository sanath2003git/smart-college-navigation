import { useEffect, useRef, useState } from "react";
import { useMap } from "react-leaflet";
import { Crosshair } from "lucide-react";

import { useLocation } from "../../hooks/useLocation";
import useDeviceHeading from "../../hooks/useDeviceHeading";

export default function LocateButton() {
  const map = useMap();

  const { location } = useLocation();

  const heading = useDeviceHeading();

  const [isCentered, setIsCentered] = useState(true);

  // Heading when the user last re-centered
  const centeredHeadingRef = useRef(null);

  // ==========================================
  // Calculate shortest heading difference
  // ==========================================

  const getHeadingDifference = (from, to) => {
    return Math.abs(
      ((to - from + 540) % 360) - 180
    );
  };

  // ==========================================
  // Check map + heading state
  // ==========================================

  const checkCentered = () => {
    if (!location) return;

    // ----------------------------------------
    // 1. Check map position
    // ----------------------------------------

    const center = map.getCenter();

    const distance = map.distance(
      center,
      [location.lat, location.lng]
    );

    const mapIsCentered = distance <= 30;

    // ----------------------------------------
    // 2. Check device heading
    // ----------------------------------------

    let headingIsCentered = true;

    if (
      heading !== null &&
      centeredHeadingRef.current !== null
    ) {
      const headingDifference =
        getHeadingDifference(
          centeredHeadingRef.current,
          heading
        );

      // Allow up to 20° heading change
      headingIsCentered =
        headingDifference <= 20;
    }

    // ----------------------------------------
    // 3. Final state
    // ----------------------------------------

    setIsCentered(
      mapIsCentered &&
      headingIsCentered
    );
  };

  // ==========================================
  // Initialize heading baseline
  // ==========================================

  useEffect(() => {
    if (
      heading !== null &&
      centeredHeadingRef.current === null
    ) {
      centeredHeadingRef.current = heading;
    }

    checkCentered();
  }, [heading, location]);

  // ==========================================
  // Detect map movement
  // ==========================================

  useEffect(() => {
    if (!location) return;

    const handleMapMove = () => {
      checkCentered();
    };

    map.on("moveend", handleMapMove);

    return () => {
      map.off("moveend", handleMapMove);
    };
  }, [map, location, heading]);

  // ==========================================
  // Re-center
  // ==========================================

  const handleLocate = () => {
    if (!location) return;

    // Update heading baseline
    if (heading !== null) {
      centeredHeadingRef.current = heading;
    }

    map.flyTo(
      [location.lat, location.lng],
      21.5,
      {
        animate: true,
        duration: 1.2,
      }
    );
  };

  return (
    <button
      type="button"
      onClick={handleLocate}
      title={
        isCentered
          ? "Locate Me"
          : "Re-center on your location"
      }
      aria-label={
        isCentered
          ? "Locate Me"
          : "Re-center on your location"
      }
      className={`
        absolute
        bottom-5
        right-5
        z-[1000]

        flex
        h-11
        w-11
        items-center
        justify-center

        rounded-xl
        border

        bg-white

        transition-all
        duration-200

        active:scale-95

        focus:outline-none
        focus:ring-2
        focus:ring-blue-500
        focus:ring-offset-2

        ${
          isCentered
            ? `
              border-slate-200
              shadow-[0_4px_14px_rgba(20,33,55,0.18)]
            `
            : `
              border-blue-200
              shadow-[0_5px_16px_rgba(37,99,235,0.25)]
            `
        }

        hover:bg-slate-50
        hover:shadow-[0_6px_18px_rgba(20,33,55,0.22)]
      `}
    >
      <Crosshair
        size={isCentered ? 20 : 22}
        strokeWidth={isCentered ? 2.2 : 2.5}
        className="text-blue-600"
      />
    </button>
  );
}