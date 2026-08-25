// src/navigation/transitionMap.js

/**
 * ============================================================
 * SmartNav Transition Configuration
 * ============================================================
 *
 * Single source of truth for vertical navigation.
 *
 * START = Enter the stairs on the current floor.
 * END   = Exit the stairs on the destination floor.
 *
 * Candidate transitions:
 *   - User walks to the stair/lift entrance on the current floor.
 *
 * Transition mappings:
 *   - START (current floor) → END (destination floor)
 *
 * This file contains DATA ONLY.
 * No navigation logic belongs here.
 */

export const transitionMap = {
  "Mechanical Block": {
    // ==========================================================
    // Candidate transitions
    // ==========================================================

    candidateTransitions: {
      // --------------------------------------------------------
      // Destination: First Floor
      // User starts on Ground Floor
      // --------------------------------------------------------
      1: [
        "MECH_STAIR_01_GF",
        "MECH_STAIR_02_GF",
        "MECH_STAIR_03_GF",
        "MECH_LIFT_01_GF",
      ],

      // --------------------------------------------------------
      // Destination: Second Floor
      // User starts on First Floor
      // --------------------------------------------------------
      2: [
        "MECH_STAIR_01_F1_START",
        "MECH_STAIR_02_F1_START",
        "MECH_STAIR_03_F1_START",
        "MECH_LIFT_01_F1",
      ],

      // --------------------------------------------------------
      // Destination: Top Floor
      // Stair 1 DOES NOT continue to Top Floor
      // --------------------------------------------------------
      3: [
        "MECH_STAIR_02_F2_START",
        "MECH_STAIR_03_F2_START",
        "MECH_LIFT_01_F2",
      ],
    },

    // ==========================================================
    // Vertical transition mappings
    // ==========================================================

    transitions: {
      // ========================================================
      // Ground Floor → First Floor
      // ========================================================

      MECH_STAIR_01_GF: {
        next: "MECH_STAIR_01_F1_END",
        floor: 1,
        type: "STAIR",
      },

      MECH_STAIR_02_GF: {
        next: "MECH_STAIR_02_F1_END",
        floor: 1,
        type: "STAIR",
      },

      MECH_STAIR_03_GF: {
        next: "MECH_STAIR_03_F1_END",
        floor: 1,
        type: "STAIR",
      },

      // ========================================================
      // First Floor → Second Floor
      // ========================================================

      MECH_STAIR_01_F1_START: {
        next: "MECH_STAIR_01_F2_END",
        floor: 2,
        type: "STAIR",
      },

      MECH_STAIR_02_F1_START: {
        next: "MECH_STAIR_02_F2_END",
        floor: 2,
        type: "STAIR",
      },

      MECH_STAIR_03_F1_START: {
        next: "MECH_STAIR_03_F2_END",
        floor: 2,
        type: "STAIR",
      },

      // ========================================================
      // Second Floor → Top Floor
      // Stair 1 terminates at Second Floor
      // ========================================================

      MECH_STAIR_02_F2_START: {
        next: "MECH_STAIR_02_F3_END",
        floor: 3,
        type: "STAIR",
      },

      MECH_STAIR_03_F2_START: {
        next: "MECH_STAIR_03_F3_END",
        floor: 3,
        type: "STAIR",
      },

      // ========================================================
      // Lift
      // ========================================================

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

  // ============================================================
  // Chemical Block
  // ============================================================

  "Chemical Block": {
    candidateTransitions: {},

    transitions: {},
  },
};