import { useContext } from "react";
import NavigationContext from "../context/NavigationContext";

export function useNavigation() {
  return useContext(NavigationContext);
}