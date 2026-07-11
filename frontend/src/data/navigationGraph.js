export const navigationGraph = {
  MECH_M101: [
    { node: "MECH_CORRIDOR", cost: 1 },
  ],

  MECH_CORRIDOR: [
    { node: "MECH_M101", cost: 1 },
    { node: "MECH_ENTRANCE", cost: 1 },
  ],

  MECH_ENTRANCE: [
    { node: "MECH_CORRIDOR", cost: 1 },
    { node: "OUTDOOR_01", cost: 5 },
  ],

  OUTDOOR_01: [
    { node: "MECH_ENTRANCE", cost: 5 },
    { node: "CHEM_ENTRANCE", cost: 5 },
  ],

  CHEM_ENTRANCE: [
    { node: "OUTDOOR_01", cost: 5 },
    { node: "CHEM_PATH1", cost: 1 },
    { node: "CHEM_PATH2", cost: 2 },
  ],

  CHEM_PATH1: [
    { node: "CHEM_ENTRANCE", cost: 1 },
    { node: "CHEM_H107", cost: 1 },
  ],

  CHEM_PATH2: [
    { node: "CHEM_ENTRANCE", cost: 2 },
    { node: "CHEM_H107", cost: 2 },
  ],

  CHEM_H107: [
    { node: "CHEM_PATH1", cost: 1 },
    { node: "CHEM_PATH2", cost: 2 },
  ],
};