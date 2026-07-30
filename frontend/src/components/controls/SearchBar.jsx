import { useState } from "react";
import { Search } from "lucide-react";

import { useNavigation } from "../../hooks/useNavigation";

import { navigate } from "../../navigation/navigationRouter";
import { NAVIGATION_STAGE } from "../../constants/navigationStages";

import {
  getTargetStair,
  findStairById,
} from "../../services/stairService";

import { speak } from "../../services/voiceService";

export default function SearchBar() {
  const [query, setQuery] = useState("");

  const {
    setRoute,
    currentLocation,
    setDestination,
    setSelectedBuilding,
    setCurrentFloor,
    setTargetEntrance,
    setTargetStair,
    setNavigationStage,
  } = useNavigation();

  const handleSearch = async () => {
    const room =
      query.trim().toUpperCase();

    if (!room) return;

    try {
      if (!currentLocation) {
        alert(
          "Waiting for your current location..."
        );

        return;
      }

      const currentLat =
        currentLocation.lat;

      const currentLng =
        currentLocation.lng;

      // -----------------------------------
      // Reset previous navigation
      // -----------------------------------

      setNavigationStage(
        NAVIGATION_STAGE.OUTDOOR
      );

      setRoute([]);

      setTargetEntrance(null);

      setTargetStair(null);

      // -----------------------------------
      // Navigation Engine V2
      // -----------------------------------

      const result = await navigate({
        stage:
          NAVIGATION_STAGE.OUTDOOR,

        start: {
          lat: currentLat,
          lng: currentLng,
        },

        destination: room,
      });

      if (!result) {
        alert(
          "Destination not found."
        );

        return;
      }

      // -----------------------------------
      // Route
      // -----------------------------------

      setRoute(result.route);

      // -----------------------------------
      // Destination
      // -----------------------------------

      setDestination(
        result.destination
      );

      const building =
        result.destination.properties
          .building;

      const floor =
        result.destination.properties
          .floor;

      // -----------------------------------
      // Building
      // -----------------------------------

      setSelectedBuilding(
        building
      );

      // -----------------------------------
      // Destination Floor
      // -----------------------------------

      setCurrentFloor(
        floor
      );

      // -----------------------------------
      // Target Entrance
      //
      // IMPORTANT:
      // This is the same entrance that
      // navigationRouter used to create
      // the outdoor route.
      // -----------------------------------

      setTargetEntrance(
        result.entrance
      );

      console.log(
        "Target Entrance:",
        result.entrance
      );

      // -----------------------------------
      // Target Stair
      // First Floor destinations only
      // -----------------------------------

      if (floor === 1) {
        const stairId =
          getTargetStair(
            building,
            floor
          );

        console.log(
          "Target Stair ID:",
          stairId
        );

        if (stairId) {
          const stair =
            await findStairById(
              stairId
            );

          setTargetStair(
            stair
          );

          console.log(
            "Target Stair:",
            stair
          );
        } else {
          setTargetStair(null);
        }
      } else {
        setTargetStair(null);
      }

      // -----------------------------------
      // Voice
      // -----------------------------------

      speak(
        "Navigation started."
      );

      // -----------------------------------
      // Debug
      // -----------------------------------

      console.log(
        "Search:",
        room
      );

      console.log(
        "Building:",
        building
      );

      console.log(
        "Floor:",
        floor
      );

      console.log(
        "Route:",
        result.route
      );

      console.log(
        "Destination:",
        result.destination
      );
    } catch (err) {
      console.error(
        "Search navigation error:",
        err
      );

      alert(
        "Room not found."
      );
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
            onChange={(e) =>
              setQuery(e.target.value)
            }
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