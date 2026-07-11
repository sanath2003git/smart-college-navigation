import { Polyline } from "react-leaflet";

export default function RouteLayer({ path }) {
  if (!path || path.length < 2) return null;

  // Convert "lat,lng" strings into [lat, lng]
  const positions = path.map((node) => {
    const [lat, lng] = node.split(",").map(Number);
    return [lat, lng];
  });

  return (
    <Polyline
      positions={positions}
      pathOptions={{
        color: "blue",
        weight: 5,
      }}
    />
  );
}