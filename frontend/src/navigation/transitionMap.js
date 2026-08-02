// src/navigation/transitionMap.js

/**
 * ============================================================
 * SmartNav Transition Configuration
 * ============================================================
 *
 * Single source of truth for vertical navigation.
 *
 * Contains:
 * 1. Candidate transitions for each destination floor.
 * 2. Vertical transition mappings between floors.
 *
 * No navigation logic should be placed here.
 */

export const transitionMap = {
  "Mechanical Block": {
    // ==========================================================
    // Candidate transitions
    // ==========================================================

    candidateTransitions: {
      // Destination: First Floor
      1: [
        "MECH_STAIR_01_GF",
        "MECH_STAIR_02_GF",
        "MECH_STAIR_03_GF",
        "MECH_LIFT_01_GF",
      ],

      // Destination: Second Floor
      2: [
        "MECH_STAIR_02_F1_END",
        "MECH_STAIR_03_F1_END",
        "MECH_LIFT_01_F1",
      ],

      // Destination: Top Floor
      3: [
        "MECH_STAIR_02_F2_END",
        "MECH_STAIR_03_F2_END",
        "MECH_LIFT_01_F2",
      ],
    },

    // ==========================================================
    // Transition mappings
    // ==========================================================

    transitions: {
      // Stair 1
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

      // Stair 2
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

      // Stair 3
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

      // Lift
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
  },

  "Chemical Block": {
    candidateTransitions: {},

    transitions: {},
  },
};