import { BrowserRouter, Routes, Route } from "react-router-dom";

import CampusPage from "../pages/Campus/CampusPage";
import MechanicalPage from "../pages/Mechanical/MechanicalPage";
import ChemicalPage from "../pages/Chemical/ChemicalPage";
import MainBlockPage from "../pages/Main/MainBlockPage";
import LibraryPage from "../pages/Library/LibraryPage";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CampusPage />} />
        <Route path="/campus" element={<CampusPage />} />

        <Route path="/mechanical" element={<MechanicalPage />} />
        <Route path="/chemical" element={<ChemicalPage />} />
        <Route path="/main" element={<MainBlockPage />} />
        <Route path="/library" element={<LibraryPage />} />
      </Routes>
    </BrowserRouter>
  );
}