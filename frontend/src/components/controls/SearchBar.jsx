import { useState } from "react";
import { Search } from "lucide-react";

import { useNavigation } from "../../hooks/useNavigation";

import { navigate } from "../../navigation/navigationRouter";
import { NAVIGATION_STAGE } from "../../constants/navigationStages";

import { findStairById } from "../../services/stairService";
import { selectBestTransition } from "../../navigation/transitionSelector";

import { findRooms } from "../../services/roomService";
import { getBuildingFromRoom } from "../../services/buildingRoomLookup";

import { speak } from "../../services/voiceService";

export default function SearchBar() {
  const [query, setQuery] = useState("");

  const {
    setRoute,
    currentLocation,

    currentBuilding,
    navigationStage,

    setDestination,
    setSelectedBuilding,
    setCurrentFloor,
    setTargetEntrance,
    setTargetStair,
    setNavigationStage,
  } = useNavigation();

  const handleSearch = async () => {
    const room = query.trim().toUpperCase();

    if (!room) return;

    try {
      if (!currentLocation) {
        alert("Waiting for your current location...");
        return;
      }

      const currentLat = currentLocation.lat;
      const currentLng = currentLocation.lng;

      // -----------------------------------
      // Clear previous navigation data
      // -----------------------------------

      setRoute([]);
      setTargetEntrance(null);
      setTargetStair(null);

      // -----------------------------------
      // Determine destination building
      // -----------------------------------

      const destinationBuilding =
        getBuildingFromRoom(room);

      if (!destinationBuilding) {
        alert("Destination not found.");
        return;
      }

      // -----------------------------------
      // Find destination room
      // -----------------------------------

      const rooms = await findRooms(
        destinationBuilding,
        room
      );

      if (rooms.length === 0) {
        alert("Destination not found.");
        return;
      }

      const destinationFeature = rooms[0];

      const destinationFloor =
        destinationFeature.properties.floor;

      console.log(
        "========== SEARCH ROUTING DECISION =========="
      );

      console.log(
        "Current Building:",
        currentBuilding
      );

      console.log(
        "Current Stage:",
        navigationStage
      );

      console.log(
        "Destination Building:",
        destinationBuilding
      );

      console.log(
        "Destination Floor:",
        destinationFloor
      );

      // -----------------------------------
      // Determine current navigation state
      // -----------------------------------

      const sameBuilding =
        currentBuilding === destinationBuilding;

      const alreadyOnGroundFloor =
        navigationStage ===
        NAVIGATION_STAGE.GROUND_FLOOR;

      let result;
      let preparedTargetStair = null;

      // ===================================
      // CASE 1
      // Same building: GF → GF
      // ===================================

      if (
        sameBuilding &&
        alreadyOnGroundFloor &&
        destinationFloor === 0
      ) {
        console.log(
          "Routing mode: SAME BUILDING GF → GF"
        );

        result = await navigate({
          stage: NAVIGATION_STAGE.GROUND_FLOOR,

          start: {
            lat: currentLat,
            lng: currentLng,
          },

          destination: destinationFeature,

          building: destinationBuilding,
        });

        if (!result) {
          alert("Unable to calculate indoor route.");
          return;
        }

        setNavigationStage(
          NAVIGATION_STAGE.GROUND_FLOOR
        );

        setTargetEntrance(null);
        setTargetStair(null);
      }

      // ===================================
      // CASE 2
      // Same building: GF → FF
      // ===================================

      else if (
        sameBuilding &&
        alreadyOnGroundFloor &&
        destinationFloor === 1
      ) {
        console.log(
          "Routing mode: SAME BUILDING GF → FF"
        );

        // ---------------------------------
        // Determine GF transition
        // ---------------------------------

        const transition =
  await selectBestTransition({
    building: destinationBuilding,
    destinationFloor,
    start: {
      lat: currentLat,
      lng: currentLng,
    },
  });

if (!transition) {
  alert(
    "No floor transition is available for this destination."
  );
  return;
}

const stairId = transition.id;

        console.log(
          "Target Stair ID:",
          stairId
        );

        if (!stairId) {
          alert(
            "No floor transition is available for this destination."
          );
          return;
        }

        // ---------------------------------
        // Load actual GF stair/lift
        // ---------------------------------

        preparedTargetStair =
          await findStairById(stairId);

        if (!preparedTargetStair) {
          console.error(
            "Target stair not found:",
            stairId
          );

          alert(
            "Unable to find the floor transition."
          );
          return;
        }

        console.log(
          "Target Stair:",
          preparedTargetStair
        );

        // ---------------------------------
        // Store FINAL destination
        //
        // M203 remains the final destination.
        // The GF router will separately route
        // to stairId.
        // ---------------------------------

        setDestination(
          destinationFeature
        );

        setSelectedBuilding(
          destinationBuilding
        );

        setCurrentFloor(
          destinationFloor
        );

        setTargetEntrance(null);

        // ---------------------------------
        // Route current GF position → stair
        //
        // IMPORTANT:
        // Do NOT pass destinationFeature here.
        //
        // navigateGroundFloor() already uses
        // stairId to load the correct stair
        // and choose its nearest graph node.
        // ---------------------------------

        result = await navigate({
          stage: NAVIGATION_STAGE.GROUND_FLOOR,

          start: {
            lat: currentLat,
            lng: currentLng,
          },

          stairId,
          transitionCandidates: transition.candidates,
          transitionStrategy: transition.strategy,

          building: destinationBuilding,
        });

        if (!result) {
          alert(
            "Unable to calculate route to the floor transition."
          );
          return;
        }

        if (result.selectedTransition) {
  console.log(
    "Router Selected Transition:",
    result.selectedTransition.properties.id
  );

  setTargetStair(
    result.selectedTransition
  );
}

        // User is physically still on GF.
        setNavigationStage(
          NAVIGATION_STAGE.GROUND_FLOOR
        );
      }

      // ===================================
      // CASE 3
      // Existing outdoor flow
      //
      // Preserve:
      // OUTDOOR → entrance → GF
      // OUTDOOR → entrance → GF → FF
      // ===================================

      else {
        console.log(
          "Routing mode: EXISTING OUTDOOR FLOW"
        );

        setNavigationStage(
          NAVIGATION_STAGE.OUTDOOR
        );

        result = await navigate({
          stage: NAVIGATION_STAGE.OUTDOOR,

          start: {
            lat: currentLat,
            lng: currentLng,
          },

          destination: room,
        });

        if (!result) {
          alert("Destination not found.");
          return;
        }

        // Use exactly the entrance selected
        // by navigationRouter.
        setTargetEntrance(
          result.entrance
        );

        console.log(
          "Target Entrance:",
          result.entrance
        );
      }

      // -----------------------------------
      // Store route
      // -----------------------------------

      setRoute(
        result.route
      );

      // -----------------------------------
      // Store FINAL destination
      //
      // For GF → FF, navigateGroundFloor()
      // returns the original destination that
      // was already stored above by SearchBar.
      // -----------------------------------

      if (
        sameBuilding &&
        alreadyOnGroundFloor &&
        destinationFloor === 1
      ) {
        setDestination(
          destinationFeature
        );
      } else {
        setDestination(
          result.destination
        );
      }

      // -----------------------------------
      // Final destination building/floor
      // -----------------------------------

      const finalDestination =
        sameBuilding &&
        alreadyOnGroundFloor &&
        destinationFloor === 1
          ? destinationFeature
          : result.destination;

      const building =
        finalDestination.properties.building;

      const floor =
        finalDestination.properties.floor;

      // -----------------------------------
      // Destination building
      // -----------------------------------

      setSelectedBuilding(
        building
      );

      // -----------------------------------
      // Destination floor
      // -----------------------------------

      setCurrentFloor(
        floor
      );

      // -----------------------------------
      // Configure floor transition
      //
      // GF → FF already loaded the stair
      // above, so don't load it twice.
      // -----------------------------------

      if (
        floor === 1 &&
        !preparedTargetStair
      ) {
       const transition =
  await selectBestTransition({
    building,
    destinationFloor: floor,
    start: {
      lat: currentLat,
      lng: currentLng,
    },
  });

const stairId = transition?.id;

        console.log(
          "Target Stair ID:",
          stairId
        );

        if (stairId) {
          const stair =
            await findStairById(
              stairId
            );

          if (stair) {
            setTargetStair(
              stair
            );

            console.log(
              "Target Stair:",
              stair
            );
          } else {
            console.error(
              "Target stair not found:",
              stairId
            );

            setTargetStair(null);
          }
        } else {
          setTargetStair(null);
        }
      } else if (floor !== 1) {
        setTargetStair(null);
      }

      // -----------------------------------
      // Voice
      // -----------------------------------

      speak("Navigation started.");

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
        finalDestination
      );

      console.log(
        "============================================"
      );
    } catch (err) {
      console.error(
        "Search navigation error:",
        err
      );

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