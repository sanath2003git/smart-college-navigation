import { useEffect, useState } from "react";
import { Search, MapPin } from "lucide-react";

import { useNavigation } from "../../hooks/useNavigation";

import { navigate } from "../../navigation/navigationRouter";
import { NAVIGATION_STAGE } from "../../constants/navigationStages";

import { findStairById } from "../../services/stairService";
import { selectBestTransition } from "../../navigation/transitionSelector";

import { findRooms } from "../../services/roomService";
import { getBuildingFromRoom } from "../../services/buildingRoomLookup";
import { searchDestinations } from "../../services/searchService";

import { speak } from "../../services/voiceService";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const {
    setRoute,
    currentLocation,

    currentBuilding,
    currentFloor,
    navigationStage,

    setDestination,
    setSelectedBuilding,
    setCurrentFloor,
    setTargetEntrance,
    setTargetStair,
    setNavigationStage,
  } = useNavigation();

  // -----------------------------------
  // Live search suggestions
  // -----------------------------------

  useEffect(() => {
    const searchQuery = query.trim();

    if (!searchQuery) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    let cancelled = false;

    const loadSuggestions = async () => {
      try {
        setIsSearching(true);

        const results = await searchDestinations(
          searchQuery,
          {
            limit: 6,
          }
        );

        if (!cancelled) {
          setSuggestions(results);
          setShowSuggestions(results.length > 0);
        }
      } catch (error) {
        console.error(
          "Search suggestions error:",
          error
        );

        if (!cancelled) {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } finally {
        if (!cancelled) {
          setIsSearching(false);
        }
      }
    };

    loadSuggestions();

    return () => {
      cancelled = true;
    };
  }, [query]);

  // -----------------------------------
  // Select suggestion
  // -----------------------------------

  const handleSuggestionClick = (destination) => {
    setQuery(destination.roomNo);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  // -----------------------------------
  // Main navigation search
  // -----------------------------------

  const handleSearch = async () => {
    const room = query.trim().toUpperCase();

    if (!room) return;

    setShowSuggestions(false);

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

      const destinationFeature =
        rooms[0];

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
        "Current Floor:",
        currentFloor
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
        currentBuilding ===
        destinationBuilding;

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
          stage:
            NAVIGATION_STAGE.GROUND_FLOOR,

          start: {
            lat: currentLat,
            lng: currentLng,
          },

          destination:
            destinationFeature,

          building:
            destinationBuilding,
        });

        if (!result) {
          alert(
            "Unable to calculate indoor route."
          );
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
            building:
              destinationBuilding,

            // IMPORTANT:
            // This is the user's actual floor,
            // NOT the destination floor.
            currentFloor,

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

        const stairId =
          transition.id;

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
          await findStairById(
            stairId
          );

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
        // ---------------------------------

        setDestination(
          destinationFeature
        );

        setSelectedBuilding(
          destinationBuilding
        );

        /*
         * IMPORTANT:
         *
         * Do NOT do:
         *
         * setCurrentFloor(destinationFloor)
         *
         * The user is still physically on GF.
         *
         * currentFloor must remain 0 until the
         * actual floor transition happens.
         */

        setTargetEntrance(null);

        // ---------------------------------
        // Route current GF position → stair
        // ---------------------------------

        result = await navigate({
          stage:
            NAVIGATION_STAGE.GROUND_FLOOR,

          start: {
            lat: currentLat,
            lng: currentLng,
          },

          stairId,

          transitionCandidates:
            transition.candidates,

          transitionStrategy:
            transition.strategy,

          building:
            destinationBuilding,
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
            result.selectedTransition
              .properties.id
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
      // OUTDOOR → entrance → GF
      // ===================================

      else {
        console.log(
          "Routing mode: EXISTING OUTDOOR FLOW"
        );

        /*
         * IMPORTANT:
         *
         * When navigation starts outside,
         * the first indoor floor is Ground Floor.
         *
         * Therefore:
         *
         * currentFloor = 0
         *
         * destinationFloor may be 1, 2 or 3.
         *
         * Example:
         *
         * M402:
         * currentFloor = 0
         * destinationFloor = 3
         */

        if (
          navigationStage ===
          NAVIGATION_STAGE.OUTDOOR
        ) {
          setCurrentFloor(0);

          console.log(
            "Outdoor navigation: currentFloor set to 0"
          );
        }

        setNavigationStage(
          NAVIGATION_STAGE.OUTDOOR
        );

        result = await navigate({
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
      // Final destination
      // -----------------------------------

      const finalDestination =
        sameBuilding &&
        alreadyOnGroundFloor &&
        destinationFloor === 1
          ? destinationFeature
          : result.destination;

      const building =
        finalDestination
          .properties
          .building;

      const floor =
        finalDestination
          .properties
          .floor;

      // -----------------------------------
      // Destination building
      // -----------------------------------

      setSelectedBuilding(
        building
      );

      /*
       * IMPORTANT:
       *
       * Do NOT set currentFloor here.
       *
       * floor = destination floor.
       *
       * currentFloor = user's physical floor.
       *
       * They are different concepts.
       */

      // -----------------------------------
      // Configure floor transition
      //
      // Only prepare the GF → FF transition
      // for the existing same-building flow.
      //
      // Outdoor navigation will select the
      // appropriate transition when the user
      // actually reaches the building entrance.
      // -----------------------------------

      if (
        sameBuilding &&
        alreadyOnGroundFloor &&
        floor === 1 &&
        !preparedTargetStair
      ) {
        const transition =
          await selectBestTransition({
            building,

            currentFloor,

            destinationFloor:
              floor,

            start: {
              lat: currentLat,
              lng: currentLng,
            },
          });

        const stairId =
          transition?.id;

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
        "Destination Floor:",
        floor
      );

      console.log(
        "Current Floor:",
        currentFloor
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
    <div className="smartnav-search-shell">
      <div className="smartnav-search-container">

        <div className="smartnav-search-bar">

          {/* Search icon */}
          <div className="smartnav-search-icon">
            <Search
              size={20}
              strokeWidth={2.2}
            />
          </div>

          {/* Input */}
          <div className="smartnav-search-input-wrapper">

            <input
              type="text"
              placeholder="Where do you want to go?"
              value={query}
              onChange={(e) =>
                setQuery(e.target.value)
              }
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (
                  suggestions.length > 0
                ) {
                  setShowSuggestions(true);
                }
              }}
              className="smartnav-search-input"
            />

            {!query && (
              <span className="smartnav-search-hint hidden md:inline">
                Search rooms, labs, classrooms...
              </span>
            )}

            {/* -----------------------------------
                Search Suggestions
            ----------------------------------- */}

            {showSuggestions && (
              <div className="smartnav-search-suggestions">

                {isSearching && (
                  <div className="smartnav-search-loading">
                    Searching...
                  </div>
                )}

                {!isSearching &&
                  suggestions.map(
                    (destination) => (
                      <button
                        key={
                          destination.id
                        }
                        type="button"
                        className="smartnav-search-suggestion"
                        onClick={() =>
                          handleSuggestionClick(
                            destination
                          )
                        }
                      >

                        <div className="smartnav-suggestion-icon">
                          <MapPin
                            size={18}
                          />
                        </div>

                        <div className="smartnav-suggestion-content">

                          <div className="smartnav-suggestion-title">
                            {destination.roomNo}
                            {destination.name &&
                              ` — ${destination.name}`}
                          </div>

                          <div className="smartnav-suggestion-meta">
                            {destination.building}

                            {destination.floorLabel &&
                              ` · ${destination.floorLabel}`}

                            {destination.category &&
                              ` · ${destination.category}`}
                          </div>

                        </div>

                      </button>
                    )
                  )}

              </div>
            )}

          </div>

          {/* Search button */}
          <button
            onClick={handleSearch}
            aria-label="Start navigation"
            className="smartnav-search-button"
          >
            <Search size={19} />

            <span className="hidden sm:inline">
              Search
            </span>
          </button>

        </div>

      </div>
    </div>
  );
}