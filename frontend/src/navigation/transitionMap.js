// src/navigation/transitionMap.js

export const transitionMap = {
  "Mechanical Block": {
    // -----------------------------
    // Stair 1
    // -----------------------------
    MECH_STAIR_01_GF: {
      next: "MECH_STAIR_01_F1_START",
      floor: 1,
      type: "STAIR",
    },

    MECH_STAIR_01_F1_END: {
      next: "MECH_STAIR_01_F2_START",
      floor: 2,
      type: "STAIR",
    },

    // -----------------------------
    // Stair 2
    // -----------------------------
    MECH_STAIR_02_GF: {
      next: "MECH_STAIR_02_F1_START",
      floor: 1,
      type: "STAIR",
    },

    MECH_STAIR_02_F1_END: {
      next: "MECH_STAIR_02_F2_START",
      floor: 2,
      type: "STAIR",
    },

    MECH_STAIR_02_F2_END: {
      next: "MECH_STAIR_02_F3_START",
      floor: 3,
      type: "STAIR",
    },

    // -----------------------------
    // Stair 3
    // -----------------------------
    MECH_STAIR_03_GF: {
      next: "MECH_STAIR_03_F1_START",
      floor: 1,
      type: "STAIR",
    },

    MECH_STAIR_03_F1_END: {
      next: "MECH_STAIR_03_F2_START",
      floor: 2,
      type: "STAIR",
    },

    MECH_STAIR_03_F2_END: {
      next: "MECH_STAIR_03_F3_START",
      floor: 3,
      type: "STAIR",
    },

    // -----------------------------
    // Lift
    // -----------------------------
    MECH_LIFT_01_GF: {
      next: "MECH_LIFT_01_F1",
      floor: 1,
      type: "LIFT",
    },

    MECH_LIFT_01_F1: {
      next: "MECH_LIFT_01_F2",
      floor: 2,
      type: "LIFT",
    },

    MECH_LIFT_01_F2: {
      next: "MECH_LIFT_01_F3",
      floor: 3,
      type: "LIFT",
    },
  },

  "Chemical Block": {
    // We'll populate this later.
  },
};