export default function FloorTransitionPrompt({
  nextFloor,
  transitionType,
  onConfirm,
}) {
  const floorName =
    getFloorName(nextFloor);

  const transitionName =
    transitionType === "LIFT"
      ? "lift"
      : "stairs";

  return (
    <div
      className="
        fixed
        bottom-6
        left-1/2
        z-[2000]
        w-[90%]
        max-w-md
        -translate-x-1/2
        rounded-xl
        bg-white
        p-5
        shadow-xl
      "
    >
      {/* =====================================
          Title
          ===================================== */}

      <h2 className="text-lg font-semibold">
        Floor Transition
      </h2>

      {/* =====================================
          Instruction
          ===================================== */}

      <p className="mt-2">
        You have reached the{" "}
        {transitionName}.
      </p>

      <p className="mt-2">
        Please go to the{" "}
        <strong>
          {floorName}
        </strong>
        .
      </p>

      {/* =====================================
          Confirmation
          ===================================== */}

      <button
        type="button"
        onClick={onConfirm}
        className="
          mt-4
          w-full
          rounded-lg
          px-4
          py-3
          font-semibold
        "
      >
        I've reached {floorName}
      </button>
    </div>
  );
}

// ======================================================
// FLOOR NAME
// ======================================================

function getFloorName(floor) {
  switch (floor) {
    case 0:
      return "Ground Floor";

    case 1:
      return "First Floor";

    case 2:
      return "Second Floor";

    case 3:
      return "Third Floor";

    default:
      return `Floor ${floor}`;
  }
}