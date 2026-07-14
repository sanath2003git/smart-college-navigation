import { useState } from "react";
import { Search } from "lucide-react";

import { useNavigation } from "../../hooks/useNavigation";
import { loadGraph } from "../../navigation/loadGraph";
import { navigateToRoom } from "../../navigation/navigationService";

import { findNearestEntrance } from "../../services/entranceService";
import {
  getTargetStair,
  findStairById,
} from "../../services/stairService";

export default function SearchBar() {
  const [query, setQuery] = useState("");

  const {
    graph,
    setGraph,
    setRoute,

    currentLocation,

    setDestination,
    setSelectedBuilding,
    setCurrentFloor,

    setTargetEntrance,
    setTargetStair,
  } = useNavigation();

  const handleSearch = async () => {
    const room = query.trim().toUpperCase();

    if (!room) return;

    try {
      let navigationGraph = graph;

      if (!navigationGraph) {
        navigationGraph = await loadGraph();
        setGraph(navigationGraph);
      }

      if (!currentLocation) {
        alert("Waiting for your current location...");
        return;
      }

      const currentLat = currentLocation.lat;
      const currentLng = currentLocation.lng;

      const result = await navigateToRoom(
        navigationGraph,
        currentLat,
        currentLng,
        room
      );

      if (!result) {
        alert("Destination not found.");
        return;
      }

      // Route
      setRoute(result.route);

      // Destination
      setDestination(result.destination);

      // Building
      setSelectedBuilding(
        result.destination.properties.building
      );

      // Floor
      const floor = result.destination.properties.floor;

      setCurrentFloor(floor);

      // Target Entrance
      const entrance = await findNearestEntrance(
        result.destination.properties.building,
        currentLat,
        currentLng
      );

      setTargetEntrance(entrance);

      console.log("Target Entrance:", entrance);

      // Target Stair (Only for First Floor)
      if (floor === 1) {
        const stairId = getTargetStair(
          result.destination.properties.building,
          floor
        );

        if (stairId) {
          const stair = await findStairById(stairId);

          setTargetStair(stair);

          console.log("Target Stair:", stair);
        }
      } else {
        setTargetStair(null);
      }

      console.log("Search:", room);
      console.log("Route:", result.route);
      console.log("Destination:", result.destination);
    } catch (err) {
      console.error(err);
      alert("Room not found.");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="w-full bg-slate-100 px-6 py-4 border-b">
      <div className="max-w-screen-2xl mx-auto">
        <div className="flex items-center bg-white rounded-xl shadow-md px-4 py-3">
          <Search
            size={20}
            className="text-gray-400 mr-3"
          />

          <input
            type="text"
            placeholder="Search buildings, rooms, labs..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 outline-none bg-transparent text-gray-700"
          />

          <button
            onClick={handleSearch}
            className="ml-3 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            Search
          </button>
        </div>
      </div>
    </div>
  );
}