import { Routes, Route } from "react-router-dom";

import CampusPage from "../pages/Campus/CampusPage";
import EventsPage from "../pages/Events/EventsPage";
import MechanicalPage from "../pages/Mechanical/MechanicalPage";
import ChemicalPage from "../pages/Chemical/ChemicalPage";
import MainBlockPage from "../pages/Main/MainBlockPage";
import LibraryPage from "../pages/Library/LibraryPage";
import BuildingFloorExplorer from "../components/building/BuildingFloorExplorer";
import AdminLandingPage from "../pages/Admin/AdminLandingPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<CampusPage />} />
      <Route path="/events" element={<EventsPage />} />
      <Route path="/admin" element={<AdminLandingPage />} />
      <Route path="/chemical" element={<ChemicalPage />} />

      <Route path="/mechanical" element={<MechanicalPage />} />
      <Route path="/main" element={<MainBlockPage />} />
      <Route path="/library" element={<LibraryPage />} />
      <Route
        path="/workshop"
        element={<BuildingFloorExplorer buildingName="Workshop Block" />}
      />
      <Route
        path="/electrical-workshop"
        element={
          <BuildingFloorExplorer buildingName="Workshop (Electrical)" />
        }
      />
      <Route
        path="/architecture"
        element={
          <BuildingFloorExplorer buildingName="Architecture Block" />
        }
      />
      <Route
        path="/research"
        element={
          <BuildingFloorExplorer buildingName="Interdisciplinary Research Block (RUSA)" />
        }
      />
    </Routes>
  );
}