import { useState } from "react";

export default function InitialFloorSelection({
  building,
  onConfirm,
}) {
  const [selectedFloor, setSelectedFloor] =
    useState(null);

  const floors = [
    {
      value: 0,
      label: "Ground Floor",
    },
    {
      value: 1,
      label: "First Floor",
    },
    {
      value: 2,
      label: "Second Floor",
    },
    {
      value: 3,
      label: "Third Floor",
    },
  ];

  const buildingName =
    typeof building === "string"
      ? building
      : building?.properties?.name ??
        "this building";

  const handleConfirm = () => {
    if (selectedFloor === null) {
      return;
    }

    onConfirm(selectedFloor);
  };

  return (
    <div
      className="
        fixed
        inset-0
        z-[3000]
        flex
        items-center
        justify-center
        bg-black/40
        px-4
      "
    >
      <div
        className="
          w-full
          max-w-md
          rounded-2xl
          bg-white
          p-6
          shadow-2xl
        "
      >
        {/* =====================================
            Header
        ====================================== */}

        <h2 className="text-xl font-bold text-gray-900">
          You're inside {buildingName}
        </h2>

        <p className="mt-2 text-sm text-gray-600">
          Select your current floor to start
          indoor navigation.
        </p>

        {/* =====================================
            Floor Options
        ====================================== */}

        <div className="mt-5 space-y-3">
          {floors.map((floor) => {
            const isSelected =
              selectedFloor === floor.value;

            return (
              <button
                key={floor.value}
                type="button"
                onClick={() =>
                  setSelectedFloor(
                    floor.value
                  )
                }
                className={`
                  flex
                  w-full
                  items-center
                  justify-between
                  rounded-xl
                  border
                  px-4
                  py-4
                  text-left
                  transition
                  ${
                    isSelected
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 bg-white hover:bg-gray-50"
                  }
                `}
              >
                <span
                  className={`
                    font-medium
                    ${
                      isSelected
                        ? "text-blue-700"
                        : "text-gray-800"
                    }
                  `}
                >
                  {floor.label}
                </span>

                <span
                  className={`
                    flex
                    h-5
                    w-5
                    items-center
                    justify-center
                    rounded-full
                    border-2
                    ${
                      isSelected
                        ? "border-blue-600"
                        : "border-gray-300"
                    }
                  `}
                >
                  {isSelected && (
                    <span
                      className="
                        h-2.5
                        w-2.5
                        rounded-full
                        bg-blue-600
                      "
                    />
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* =====================================
            Continue
        ====================================== */}

        <button
          type="button"
          onClick={handleConfirm}
          disabled={selectedFloor === null}
          className="
            mt-6
            w-full
            rounded-xl
            bg-blue-600
            px-4
            py-3
            font-semibold
            text-white
            transition
            disabled:cursor-not-allowed
            disabled:opacity-40
          "
        >
          Continue
        </button>
      </div>
    </div>
  );
}