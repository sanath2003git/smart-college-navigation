import { Polyline, useMap } from "react-leaflet";

export default function RouteLayer({ path }) {
  const map = useMap();

  // Create dedicated route pane above building and room polygons (zIndex 620)
  if (map && !map.getPane("routePane")) {
    const pane = map.createPane("routePane");
    pane.style.zIndex = "620";
  }

  if (!path || path.length < 2) return null;

  // Convert "lat,lng" strings or coordinate arrays/objects into [lat, lng]
  const positions = path
    .map((node) => {
      if (typeof node === "string") {
        const [lat, lng] = node.split(",").map(Number);
        if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
      } else if (Array.isArray(node) && node.length >= 2) {
        const lat = Number(node[0]);
        const lng = Number(node[1]);
        if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
      } else if (node && typeof node === "object" && "lat" in node && "lng" in node) {
        const lat = Number(node.lat);
        const lng = Number(node.lng);
        if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
      }
      return null;
    })
    .filter(Boolean);

  if (positions.length < 2) return null;

  return (
    <Polyline
      pane="routePane"
      positions={positions}
      pathOptions={{
        pane: "routePane",
        color: "blue",
        weight: 5,
      }}
    />
  );
}