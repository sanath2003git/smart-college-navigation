import { Search } from "lucide-react";

export default function SearchBar() {
  return (
    <div className="w-full bg-slate-100 px-6 py-4 border-b">
      <div className="max-w-screen-2xl mx-auto">
        <div className="flex items-center bg-white rounded-xl shadow-md px-4 py-3">

          <Search
            size={20}
            className="text-gray-400 mr-3"
          />

          <input
            type="text"
            placeholder="Search buildings, rooms, labs..."
            className="flex-1 outline-none bg-transparent text-gray-700"
          />

          <button
            className="ml-3 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            Search
          </button>

        </div>
      </div>
    </div>
  );
}