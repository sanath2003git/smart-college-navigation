import { NavLink } from "react-router-dom";

const navItems = [
  { name: "Home", path: "/" },
  { name: "Campus Map", path: "/campus" },
  { name: "Chemical Block", path: "/building/chemical" },
  { name: "Mechanical Block", path: "/building/mechanical" },
];

export default function Navbar() {
  return (
    <header className="bg-blue-700 text-white shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <h1 className="text-xl font-bold">
          Smart College Navigation System
        </h1>

        <nav className="flex gap-6">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `transition ${
                  isActive
                    ? "font-semibold underline"
                    : "hover:text-blue-200"
                }`
              }
            >
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}