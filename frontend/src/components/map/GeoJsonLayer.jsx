import { useEffect, useState } from "react";
import { GeoJSON } from "react-leaflet";
import L from "leaflet";

export default function GeoJsonLayer({
  url,
  style,
  pointToLayer,
  onEachFeature,
  interactive = true,
  labelProperty = null,
}) {
  const [data, setData] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(
            `Failed to load ${url}: ${response.status}`
          );
        }

        const geojson = await response.json();

        if (mounted) {
          setData(geojson);
        }
      } catch (err) {
        console.error(
          `Error loading ${url}`,
          err
        );
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [url]);

  if (!data) {
    return null;
  }

  // ==========================================
  // Default point renderer
  // ==========================================

  const defaultPointToLayer = (
    feature,
    latlng
  ) =>
    L.circleMarker(latlng, {
      radius: 6,
      color: "#E9A400",
      fillColor: "#E9A400",
      fillOpacity: 1,
      weight: 2,
      interactive,
    });

  // ==========================================
  // Feature handler
  //
  // Keeps the existing building click/hover
  // behavior and optionally adds labels.
  // ==========================================

  const handleFeature = (
    feature,
    layer
  ) => {
    // ----------------------------------------
    // Existing feature interaction
    // ----------------------------------------

    if (onEachFeature) {
      onEachFeature(
        feature,
        layer
      );
    }

    // ----------------------------------------
    // Building label
    // ----------------------------------------

    if (labelProperty) {
      const label =
        feature?.properties?.[
          labelProperty
        ];

      if (label) {
        layer.bindTooltip(
          String(label),
          {
            permanent: true,
            direction: "center",
            className:
              "smartnav-building-label",
            interactive: false,
            opacity: 1,
          }
        );
      }
    }
  };

  return (
    <GeoJSON
      data={data}
      style={style}
      interactive={interactive}
      pointToLayer={
        pointToLayer ||
        defaultPointToLayer
      }
      onEachFeature={
        handleFeature
      }
    />
  );
}