export default function FloorTransitionPrompt({
  currentFloor = 0,
  nextFloor = 1,
  transitionType = "STAIR",
  onConfirm,
  onCancel,
}) {
  const currentFloorCode = getFloorCode(currentFloor);
  const nextFloorCode = getFloorCode(nextFloor);
  const nextFloorName = getFloorName(nextFloor);

  const isLift = transitionType === "LIFT";
  const transitionName = isLift ? "lift" : "stairs";

  return (
    <>
      {/* =========================================================
          DESKTOP MODAL CARD (Screen 5 Desktop)
      ========================================================= */}
      <div
        className="ft-overlay smartnav-desktop-ft"
        onClick={(e) => {
          if (e.target === e.currentTarget && onCancel) {
            onCancel();
          }
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ft-title-desktop"
      >
        <div className="ft-card">
          {/* Header row with icon & optional dismiss button */}
          <div className="ft-card-header">
            <div className="ft-icon" aria-hidden="true">
              {isLift ? <LiftIcon /> : <StairsIcon />}
            </div>
            {onCancel && (
              <button
                type="button"
                className="ft-close-btn"
                onClick={onCancel}
                aria-label="Close floor transition prompt"
              >
                <CloseIcon />
              </button>
            )}
          </div>

          <div id="ft-title-desktop" className="ft-title">
            Floor Transition
          </div>

          <p className="ft-p">
            You have reached the {transitionName}.
          </p>
          <p className="ft-p">
            Please go to the <strong>{nextFloorName}</strong>.
          </p>

          <div className="ft-preview">
            <div className="fp-box">{currentFloorCode}</div>
            <ArrowRightIcon />
            <div className="fp-box next">{nextFloorCode}</div>
            <div className="fp-note">
              Route resumes<br />on arrival
            </div>
          </div>

          <button
            type="button"
            className="ft-btn"
            onClick={onConfirm}
          >
            I've reached {nextFloorName}
          </button>
        </div>
      </div>

      {/* =========================================================
          MOBILE BOTTOM SHEET (Screen 5 Mobile)
      ========================================================= */}
      <div
        className="m-ft-overlay smartnav-mobile-ft"
        onClick={(e) => {
          if (e.target === e.currentTarget && onCancel) {
            onCancel();
          }
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ft-title-mobile"
      >
        <div className="m-ft-sheet">
          <div className="m-handle" />

          <div className="ft-sheet-header">
            <div className="ft-icon" aria-hidden="true">
              {isLift ? <LiftIcon /> : <StairsIcon />}
            </div>
            {onCancel && (
              <button
                type="button"
                className="ft-close-btn"
                onClick={onCancel}
                aria-label="Close floor transition sheet"
              >
                <CloseIcon />
              </button>
            )}
          </div>

          <div id="ft-title-mobile" className="ft-title">
            Floor Transition
          </div>

          <p className="ft-p">
            You have reached the {transitionName}.
          </p>
          <p className="ft-p">
            Please go to the <strong>{nextFloorName}</strong>.
          </p>

          <div className="ft-preview">
            <div className="fp-box">{currentFloorCode}</div>
            <ArrowRightIcon />
            <div className="fp-box next">{nextFloorCode}</div>
            <div className="fp-note">
              Route resumes<br />on arrival
            </div>
          </div>

          <button
            type="button"
            className="ft-btn"
            onClick={onConfirm}
          >
            I've reached {nextFloorName}
          </button>
        </div>
      </div>
    </>
  );
}

// ======================================================
// HELPER FUNCTIONS
// ======================================================

function getFloorName(floor) {
  switch (Number(floor)) {
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

function getFloorCode(floor) {
  switch (Number(floor)) {
    case 0:
      return "GF";
    case 1:
      return "FF";
    case 2:
      return "SF";
    case 3:
      return "TF";
    default:
      return `F${floor}`;
  }
}

// ======================================================
// ICONS (Pixel-perfect matching mockup SVGs)
// ======================================================

function StairsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 21h4v-4h4v-4h4V9h4V3" />
    </svg>
  );
}

function LiftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="12" y1="2" x2="12" y2="22" />
      <polyline points="7 9 9 7 11 9" />
      <polyline points="13 15 15 17 17 15" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="13 6 19 12 13 18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="18"
      height="18"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}