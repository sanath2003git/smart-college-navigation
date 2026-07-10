import { useContext } from "react";
import { LocationContext } from "../context/LocationContext";

export function useLocation() {
  return useContext(LocationContext);
}