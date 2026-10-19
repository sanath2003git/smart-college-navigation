import { useEffect, useState } from "react";

import {
  Marker,
  Popup,
  Circle,
  useMap,
} from "react-leaflet";

import L from "leaflet";

import { useLocation } from "../../hooks/useLocation";
import useDeviceHeading from "../../hooks/useDeviceHeading";

// ==========================================
// SmartNav Current Location Icon
// Adaptive Compass / Navigation Arrow
// ==========================================

const createUserIcon = (heading, zoom) => {
  const rotation = heading ?? 0;

  // ------------------------------------------
  // Adaptive marker sizing
  // ------------------------------------------

  let iconSize;
  let arrowWidth;
  let arrowHeight;
  let dotSize;
  let ringSize;

  if (zoom >= 20) {
    // High zoom
    iconSize = 70;
    arrowWidth = 38;
    arrowHeight = 48;
    dotSize = 10;
    ringSize = 16;
  } else if (zoom >= 15) {
    // Medium zoom
    iconSize = 50;
    arrowWidth = 25;
    arrowHeight = 33;
    dotSize = 9;
    ringSize = 15;
  } else {
    // Low zoom
    iconSize =  38;
    arrowWidth = 18;
    arrowHeight = 24;
    dotSize = 9;
    ringSize = 15;
  }

  const center = iconSize / 2;

  return L.divIcon({
    className: "smartnav-current-location-icon",

    html: `
      <div
        style="
          position: relative;
          width: ${iconSize}px;
          height: ${iconSize}px;
          display: flex;
          align-items: center;
          justify-content: center;
        "
      >

        <!-- =================================
             Compass / Direction Arrow
             ================================= -->

        <div
          style="
            position: absolute;
            width: ${arrowWidth}px;
            height: ${arrowHeight}px;
            left: 50%;
            top: 50%;

            transform:
              translate(-50%, -88%)
              rotate(${rotation}deg);

            transform-origin: 50% 88%;

            z-index: 1;
            pointer-events: none;

            filter:
              drop-shadow(
                0 2px 4px
                rgba(20, 33, 55, 0.18)
              );
          "
        >

          <!-- White outline -->

          <div
            style="
              position: absolute;
              inset: 0;

              background: #FFFFFF;

              clip-path: polygon(
                50% 0%,
                100% 100%,
                50% 76%,
                0% 100%
              );
            "
          ></div>

          <!-- Blue compass arrow -->

          <div
            style="
              position: absolute;

              left: 3px;
              right: 3px;
              top: 3px;
              bottom: 3px;

              background: #2563EB;

              clip-path: polygon(
                50% 0%,
                100% 100%,
                50% 76%,
                0% 100%
              );
            "
          ></div>

        </div>


        <!-- =================================
             Outer Location Halo
             ================================= -->

        <div
          style="
            position: absolute;

            width: 24px;
            height: 24px;

            border-radius: 50%;

            background:
              rgba(37, 99, 235, 0.14);

            z-index: 2;
          "
        ></div>


        <!-- =================================
             White Location Ring
             ================================= -->

        <div
          style="
            position: relative;

            width: ${ringSize}px;
            height: ${ringSize}px;

            border-radius: 50%;

            background: #FFFFFF;

            display: flex;
            align-items: center;
            justify-content: center;

            box-shadow:
              0 2px 8px
              rgba(20, 33, 55, 0.28);

            z-index: 3;
          "
        >

          <!-- Blue GPS Dot -->

          <div
            style="
              width: ${dotSize}px;
              height: ${dotSize}px;

              border-radius: 50%;

              background: #2563EB;
            "
          ></div>

        </div>

      </div>
    `,

    iconSize: [iconSize, iconSize],
    iconAnchor: [center, center],
  });
};


// ==========================================
// SmartNav Current Location
// ==========================================

export default function CurrentLocation() {
  const {
    location,
  } = useLocation();

  const heading = useDeviceHeading();

  const map = useMap();

  const [zoom, setZoom] = useState(
    () => map.getZoom()
  );


  // ========================================
  // Track Leaflet zoom level
  // ========================================

  useEffect(() => {
    const handleZoomChange = () => {
      setZoom(map.getZoom());
    };

    map.on("zoomend", handleZoomChange);

    return () => {
      map.off("zoomend", handleZoomChange);
    };
  }, [map]);


  if (!location) {
    return null;
  }


  // ========================================
  // Visual accuracy radius
  // ========================================

  const displayAccuracyRadius = 4;
  const accuracyOpacity = 0.10;
  const accuracyWeight = 1.5;


  return (
    <>
      {/* ====================================
          Adaptive GPS visual radius
          ==================================== */}

      <Circle
        center={[
          location.lat,
          location.lng,
        ]}
        radius={displayAccuracyRadius}
        pane="markerPane"
        pathOptions={{
          color: "#2563EB",
          fillColor: "#2563EB",
          fillOpacity: accuracyOpacity,
          weight: accuracyWeight,
        }}
      />


      {/* ====================================
          Adaptive GPS marker
          ==================================== */}

      <Marker
        position={[
          location.lat,
          location.lng,
        ]}
        icon={createUserIcon(
          heading,
          zoom
        )}
        pane="markerPane"
        zIndexOffset={10000}
      >

        <Popup>

          <b>Your Current Location</b>

          <br />
          <br />

          Latitude:
          <br />
          {location.lat}

          <br />
          <br />

          Longitude:
          <br />
          {location.lng}

          <br />
          <br />

          GPS Accuracy:
          <br />
          {Math.round(location.accuracy)} m

          <br />
          <br />

          Display Radius:
          <br />
          {displayAccuracyRadius} m

          <br />
          <br />

          Device Heading:
          <br />
          {heading !== null
            ? `${Math.round(heading)}°`
            : "Unavailable"}

          <br />
          <br />

          Map Zoom:
          <br />
          {zoom.toFixed(1)}

        </Popup>

      </Marker>
    </>
  );
}