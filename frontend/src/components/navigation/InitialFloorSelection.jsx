import FloorSelector from "./FloorSelector";

/**
 * Backward compatibility wrapper.
 * Initial floor selection has been unified into FloorSelector.jsx.
 */
export default function InitialFloorSelection(props) {
  return <FloorSelector {...props} />;
}