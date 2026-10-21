# 🧭 SmartNav – Smart College Navigation System

SmartNav is a web-based campus navigation and information system designed for college campuses. It combines a dual-mode 2D/3D outdoor campus map, architectural indoor floor plans, and a graph-based A* pathfinding engine to enable students, faculty, staff, and visitors to navigate seamlessly across campus buildings, rooms, and event venues.

> 🎓 **MCA Mini Project** – TKM College of Engineering, Kollam<br>
> 👥 **Developed by:** Brian & Sanath Sreekumar

---

## 📖 Table of Contents

1. [Overview](#-overview)
2. [Project Structure](#-project-structure)
3. [Key Features](#-key-features)
4. [Map & Navigation Architecture](#-map--navigation-architecture)
5. [Technology Stack](#-technology-stack)
6. [GIS & Spatial Data Organization](#-gis--spatial-data-organization)
7. [Team Responsibilities & Ownership](#-team-responsibilities--ownership)
8. [Installation & Setup](#-installation--setup)
9. [Testing & Validation](#-testing--validation)
10. [Development Status & Limitations](#-development-status--limitations)
11. [Future Enhancements](#-future-enhancements)

---

## 📖 Overview

Navigating large higher-education campuses—locating specific department blocks, classrooms, laboratories, administrative offices, seminar halls, and event venues—is often challenging for newcomers, visitors, and even current students.

SmartNav bridges outdoor campus-scale navigation with granular, multi-floor indoor wayfinding:
- Users can view the entire campus in either **interactive 2D** or **hardware-accelerated 3D** with realistic building extrusions and readable labels.
- Live GPS tracking smoothly indicates the user's real-time position with device heading orientation.
- Searching for any room number or facility automatically identifies the host building, selects the appropriate floor, highlights the destination room, and plots an optimized walking path from the nearest outdoor walkway or entrance.
- An integrated **Event Map** helps discover live and upcoming campus events and effortlessly routes attendees directly to event venues.

---

## 📂 Project Structure

```
Smart College Navigation/
├── frontend/                         # Vite + React 19 Frontend
│   ├── public/
│   │   └── data/                     # GIS spatial datasets (GeoJSON)
│   │       ├── campus/               # Campus outline, areas, buildings, walkways, entrances, gates
│   │       ├── mechanical/           # Mechanical Block indoor data (4 floors: GF, FF, SF, TF)
│   │       ├── chemical/             # Chemical Block indoor data (GF, FF; SF rooms)
│   │       ├── main-block/           # Main Administrative Block layout
│   │       └── architecture/         # Architecture Block architectural plans
│   ├── src/
│   │   ├── components/               # Map, navigation, floor viewer, events & layout components
│   │   ├── config/                   # 3D building configuration & heights
│   │   ├── constants/                # Navigation stages & map constants
│   │   ├── context/                  # LocationContext & NavigationProvider
│   │   ├── data/                     # Static campus venues & building metadata
│   │   ├── hooks/                    # Custom React hooks (useLocation, useNavigation)
│   │   ├── navigation/               # A* pathfinding, graph construction, routing logic
│   │   ├── pages/                    # CampusPage, EventsPage, Admin & Building views
│   │   ├── routes/                   # React Router route configuration
│   │   ├── services/                 # API client, venue navigation & room lookup services
│   │   └── utils/                    # Time calculation, coordinate, and math utilities
│   ├── package.json
│   └── vite.config.js
│
├── backend/                          # Django 6.0 + Django REST Framework API
│   ├── api/                          # Primary API application
│   │   ├── authentication.py         # Clerk JWT Bearer token authentication middleware
│   │   ├── models.py                 # Building, Floor, Room, Venue, and Event models
│   │   ├── serializers.py            # DRF serializers with venue relationship resolution
│   │   ├── tests.py                  # 31 automated unit tests
│   │   ├── urls.py                   # API routes (/api/events/, /api/venues/, /api/admin/*)
│   │   └── views.py                  # Public and Admin ViewSets
│   ├── core/                         # Django project core settings & root URLconf
│   │   ├── settings.py
│   │   └── urls.py
│   ├── manage.py
│   └── requirements.txt
│
└── README.md
```

---

## ✨ Key Features

### 🌍 Dual-Mode Outdoor Campus Map
- **2D Campus Map:** Powered by Leaflet with OpenStreetMap base tiles, campus boundaries, grounds, outdoor walkway networks, building footprints, and entry points.
- **True 3D Campus Map:** Powered by MapLibre GL JS with WebGL extrusion rendering, configurable building heights based on floor counts (5m/floor visual rule), 100% solid opacity walls, base outlines, directional lighting, and camera pitch/bearing controls.
- **Screen-Oriented Labels:** Hardware-accelerated building and area labels with contrasting halos (`Open Sans Semibold` via MapLibre glyphs) that billboard facing the viewport across tilt and rotation angles.
- **Compact View Toggle:** A standardized 2D/3D switch button positioned below the navigation/zoom controls with a uniform 11 px vertical gap, accessible 44 px mobile touch target, and clean edge alignment.

### 📍 GPS Tracking & Building Detection
- Real-time GPS location marker with an animated device heading orientation arrow.
- Calibrated 4-metre visual accuracy circle powered by Turf.js geospatial calculations.
- Automatic building detection (`turf.booleanPointInPolygon`) detecting when a user enters a building footprint.
- Quick re-center "Locate Me" floating control button.

### 🏢 Indoor Multi-Floor Navigation
- **Mechanical Block:** Complete 4-floor multi-level navigation across Ground Floor (GF), First Floor (FF), Second Floor (SF), and Third Floor (TF).
- **Chemical Block:** Indoor floor routing for Ground Floor and First Floor.
- **Main Block & Workshop:** Ground floor spatial layouts and room footprints.
- Door-level routing with nearest room entrance resolution.
- Multi-floor vertical transitions via mapped staircases and connectors.
- Interactive floor selector allowing manual level switching.

### 🔍 Smart Search & Destination Routing
- Instant room search across all mapped campus buildings.
- Automatic building identification and target floor switching upon selection.
- Pathfinding using an **A* (A-Star) Algorithm** operating over GeoJSON corridor networks and outdoor walkways.
- Dynamic route rendering with step-by-step turn guidance and entrance handoffs.

### 🎪 Event Map & Campus Discovery
- Dedicated Event Map view for discovering campus events, workshops, technical fests, and cultural activities.
- Categorized event cards with venue badges and timing details.
- Direct venue routing: selecting an event plots a navigation path directly to its venue.

---

## 🗺 Map & Navigation Architecture

SmartNav separates outdoor campus mapping from indoor floor navigation while maintaining unified state across view modes:

```
                          ┌───────────────────────────┐
                          │     SmartNav App Shell    │
                          │   (Location & Nav State)  │
                          └─────────────┬─────────────┘
                                        │
                 ┌──────────────────────┴──────────────────────┐
                 ▼                                             ▼
    ┌─────────────────────────┐                   ┌─────────────────────────┐
    │     Campus Page         │                   │ Building Floor Explorer │
    │   (Outdoor View)        │                   │     (Indoor View)       │
    └────────────┬────────────┘                   └────────────┬────────────┘
                 │                                             │
        ┌────────┴────────┐                                    ▼
        ▼                 ▼                        ┌────────────────────────┐
┌──────────────┐   ┌──────────────┐                │   Leaflet Indoor Map   │
│ Leaflet (2D) │   │MapLibre (3D) │                │ • Custom Floor Plan CRS│
│ • OSM Tiles  │   │ • 3D Meshes  │                │ • Room Polygons        │
│ • Footprints │   │ • Extrusions │                │ • Corridor Paths       │
│ • Walkways   │   │ • 3D Labels  │                │ • Stair Connectors     │
└──────────────┘   └──────────────┘                └────────────────────────┘
```

### Component Breakdown
- **`CampusPage.jsx`**: Manages the outdoor campus experience. Hosts both the 2D Leaflet map container and the 3D MapLibre view with a persistent 2D/3D toggle button.
- **`OutdoorMap3D.jsx`**: WebGL-accelerated 3D MapLibre component. Renders building extrusions from `buildings.geojson` via paint expressions (`fill-extrusion-height`, `fill-extrusion-color`), ground perimeters (`buildings-base-line`), outdoor routes (`outdoor-route`), and symbol label layers (`campus-building-labels`, `campus-area-labels`).
- **`building3DConfig.js`**: Central configuration mapping campus buildings to visual extrusion heights (e.g., Mechanical Block: 20m, Chemical Block: 20m, Main Block: 15m, Workshop Block: 15m, Architecture Block: 20m, Library: 10m, RUSA: 15m, Badminton Court: 0m).
- **`BuildingFloorExplorer.jsx`**: Leaflet-based indoor floor plan renderer utilizing custom planar coordinate systems for architectural floor blueprints, room polygon overlays, and floor selectors.
- **`astar.js` / `buildGraph.js`**: Constructs unified topological graphs from GeoJSON path networks and calculates optimal routes using the A* heuristic.
- **`LocationContext.jsx` & `NavigationProvider.jsx`**: Global React context providers synchronizing real-time GPS coordinates, heading, active destinations, calculated routes, and current building detection.

### 3D Building Height Configuration Reference

Building extrusions in MapLibre GL JS follow a visual height estimation rule defined in `frontend/src/config/building3DConfig.js`:<br>
`Extrusion Height = Floor Count × 5 metres` (Ground Floor counts as 1 floor; no arbitrary roof or parapet addition).

| Building | Floors | Height | Visual Rule / Source Rationale |
| :--- | :---: | :---: | :--- |
| **Architecture Block** | 4 | 20 m | 4 primary floor levels (excluding internal mezzanines) |
| **Interdisciplinary Research Block (RUSA)** | 3 | 15 m | Research facility; matched to Workshop Block height (15 m) |
| **Workshop (Electrical)** | 4 | 20 m | High-bay electrical workshop facility; matched to Mechanical Block height (20 m) |
| **Mechanical Block** | 4 | 20 m | 4 floors verified from architectural floor plans (GF, FF, SF, TF) |
| **Chemical Block** | 4 | 20 m | 4 floors identified from campus datasets (GF, FF, SF, TF) |
| **Workshop Block** | 3 | 15 m | 3-floor mechanical workshop complex |
| **Main Administrative Block** | 3 | 15 m | 3-floor administrative and academic complex |
| **Central Library** | 2 | 10 m | 2 floors (reading hall GF + book stacks FF) |
| **Badminton Court** | 0 | 0 m | Open-air sports surface (retained as flat 2D ground perimeter) |
| *Unconfigured Buildings (Fallback)* | 1 | 5 m | Standard default visual extrusion fallback for unmapped structures |

---

## 🛠️ Technology Stack

### Frontend
- **Framework:** React 19 (`react` 19.2, `react-dom` 19.2)
- **Build Tool:** Vite 8 (`vite` 8.1)
- **Routing:** React Router 7 (`react-router-dom` 7.18)
- **3D Geospatial Engine:** MapLibre GL JS 6 (`maplibre-gl` 6.14)
- **2D Geospatial Engine:** Leaflet 1.9 (`leaflet` 1.9.4) & React-Leaflet 5 (`react-leaflet` 5.0.0)
- **Map Rotation:** `@tomickigrzegorz/leaflet-rotate` 0.2.4
- **Spatial Analysis:** Turf.js (`@turf/turf` 7.3.5)
- **Icons:** Lucide React (`lucide-react` 1.23)
- **Styling:** Tailwind CSS v4 (`tailwindcss` 4.3.2, `@tailwindcss/vite` 4.3.2) & Custom Responsive CSS
- **Authentication:** Clerk React SDK (`@clerk/react` 6.17)
- **HTTP Client:** Axios (`axios` 1.18)

### Backend
- **Framework:** Python 3.10+ & Django 6.0 (`Django>=6.0.0,<7.0.0`)
- **API Engine:** Django REST Framework (`djangorestframework>=3.17.0,<4.0.0`)
- **Database:** MySQL 8.0 (`mysqlclient>=2.3.0,<3.0.0`) in production; SQLite supported for development/testing
- **Auth Verification:** Clerk JWT verification (`PyJWT[crypto]>=2.15.0`, `requests>=2.34.0`)
- **CORS Handling:** `django-cors-headers>=4.9.0`
- **Environment Management:** `python-dotenv>=1.2.0`

### GIS & Spatial Tools
- **Digitization & Preprocessing:** QGIS 3.x
- **Coordinate Reference System:** WGS 84 (EPSG:4326)
- **Format:** GeoJSON FeatureCollections

---

## 📂 GIS & Spatial Data Organization

All spatial datasets reside in `frontend/public/data/` and are fetched asynchronously during map initialization:

```
frontend/public/data/
├── campus/                           # Outdoor campus datasets
│   ├── campus_outline.geojson        # Campus perimeter boundary polygon
│   ├── areas.geojson                 # Named grounds, sports courts, and parks
│   ├── buildings.geojson             # 31 verified building footprints & metadata
│   ├── walkways.geojson              # Outdoor pedestrian walkway network
│   ├── entrances.geojson             # Outdoor building entrance anchor points
│   └── gates.geojson                 # Campus boundary entry/exit gates
│
├── mechanical/                       # Mechanical Block indoor data (4 Floors)
│   ├── ground_floor/                 # doors.geojson, paths.geojson, rooms.geojson, stairs.geojson
│   ├── first_floor/                  # doors.geojson, paths.geojson, rooms.geojson, stairs.geojson
│   ├── second_floor/                 # doors.geojson, paths.geojson, rooms.geojson, stairs.geojson
│   └── top_floor/                    # doors.geojson, paths.geojson, rooms.geojson, stairs.geojson
│
├── chemical/                         # Chemical Block indoor data
│   ├── ground_floor/                 # doors.geojson, paths.geojson, rooms.geojson, stairs.geojson
│   ├── first_floor/                  # doors.geojson, paths.geojson, rooms.geojson, stairs.geojson
│   └── second_floor/                 # rooms.geojson (paths/stairs planned)
│
├── main-block/                       # Main Administrative Block
│   └── ground_floor/                 # doors.geojson, paths.geojson, rooms.geojson, stairs.geojson
│
└── architecture/                     # Architecture Block architectural plans
```

### Dataset Structure
- **`buildings.geojson`**: Polygon geometry defining building footprints. Contains properties `id`, `name`, `building_type`, `floors`, and `description`. Used directly for 3D extrusion heights and base styling.
- **`rooms.geojson`**: Polygon geometry representing individual rooms, laboratories, and offices with properties `room_no`, `name`, `department`, and `capacity`.
- **`doors.geojson`**: Point geometry marking room door locations connecting rooms to corridor paths.
- **`paths.geojson`**: LineString geometry representing navigable corridor networks with connected vertices for graph generation.
- **`stairs.geojson`**: Point geometry linking vertical floor connectors across levels.

### Chemical Block Indoor Routing Data: Existing vs. Planned

| Floor Level | File Name | Status | Description |
| :--- | :--- | :---: | :--- |
| **Ground Floor** | `doors.geojson` | ✅ Existing | Door anchor points connecting rooms to corridors |
| **Ground Floor** | `paths.geojson` | ✅ Existing | Navigable corridor path network for A* graph |
| **Ground Floor** | `rooms.geojson` | ✅ Existing | Room boundaries, room numbers, and labels |
| **Ground Floor** | `stairs.geojson` | ✅ Existing | Vertical staircase connection points |
| **First Floor** | `doors.geojson` | ✅ Existing | Door anchor points connecting rooms to corridors |
| **First Floor** | `paths.geojson` | ✅ Existing | Navigable corridor path network for A* graph |
| **First Floor** | `rooms.geojson` | ✅ Existing | Room boundaries, room numbers, and labels |
| **First Floor** | `stairs.geojson` | ✅ Existing | Vertical staircase connection points |
| **Second Floor** | `rooms.geojson` | ✅ Existing | Room boundary polygons and room numbers |
| **Second Floor** | `paths.geojson` | ⏳ Planned | Navigable corridor network (scheduled for next phase) |
| **Second Floor** | `doors.geojson` | ⏳ Planned | Door anchor nodes (scheduled for next phase) |
| **Second Floor** | `stairs.geojson` | ⏳ Planned | Vertical staircase connectors (scheduled for next phase) |
| **Top Floor (3F)** | *All layers* | ⏳ Planned | Floor plan digitization scheduled for future phase |

---

## 👥 Team Responsibilities & Ownership

SmartNav is developed collaboratively as an MCA Mini Project. The system is architected into two distinct modules with explicit feature ownership.

---

### 👨 Brian — Campus Information & Exploration

**Goal:** Enable users to discover, explore, and understand campus buildings, facilities, rooms, departments, and events.

#### Frontend
- Home page and welcome flow
- Campus information and exploration UI
- Building explorer and floor viewer
- Room details and department information cards
- Building information pages
- Search UI layout and presentation
- Interactive map markers
- **Event Map feature:**
  - Live and upcoming event discovery and filtering
  - Event details, timings, and category tags
  - Event venue display and venue-finding UI

#### Backend
- Public Event and Venue REST APIs:
  - `GET /api/events/` (list/filter public events with category, status, and search filters)
  - `GET /api/events/{id}/` (retrieve event details)
  - `GET /api/venues/` (list public venues)
  - `GET /api/venues/{id}/` (retrieve venue details)
- Admin CRUD REST APIs (secured via Clerk JWT):
  - `/api/admin/events/`
  - `/api/admin/buildings/`
  - `/api/admin/floors/`
  - `/api/admin/rooms/`
  - `/api/admin/venues/`
- Data models and serializers for `Building`, `Floor`, `Room`, `Venue`, and `Event` *(Note: Department is stored as a room attribute rather than a separate table)*

#### Database
- Relational schema for Buildings, Floors, Rooms, Venues, and Events
- Points of Interest (POIs) and building metadata
- Search indexes and event categorization

#### GIS
- Campus base-map data digitization
- Building footprints and room polygon datasets
- Landmarks, POIs, and event venue spatial anchors

#### Module Responsibilities
- Maintain campus information and searchable spatial data.
- Develop and maintain the **Event Map** feature.
- Curate and display live and upcoming events.
- Guide users to event venues.
- Maintain campus exploration GIS datasets.

---

### 👨 Sanath Sreekumar — Navigation, Routing & 2D/3D Campus Map

**Goal:** Implement the new 2D/3D campus-map experience and enable users to navigate from their current location to selected destinations.

#### Frontend
- **New 2D/3D Campus Map Experience:**
  - MapLibre GL JS integration for hardware-accelerated 3D campus rendering
  - Configurable 3D building extrusions, heights, opacity, and base outlines
  - 3D building and area symbol label layers with contrasting halos (`demotiles` open glyphs)
  - Compact 2D/3D view mode toggle button with uniform 11 px vertical gap below map controls
- Navigation screen, status drawer, and active navigation panel
- Real-time GPS location marker, heading rotation arrow, and calibrated 4-metre accuracy circle
- Route visualization on 2D Leaflet and 3D MapLibre maps
- Multi-floor transition UI, staircase handoffs, and walking instructions
- Integration of search selection into routing workflows

#### Backend
- Navigation pathfinding engine and graph construction services
- Building detection logic (`turf.booleanPointInPolygon`) and entrance handoff algorithms
- GPS smoothing, live location tracking, and heading services
- Route generation and dynamic route recalculation APIs
- Navigation initialization and destination resolution

#### Database
- Navigation topological graph structure (nodes, edges, weights)
- Route metadata and traversal cost matrices
- Navigation configuration parameters

#### GIS
- Outdoor walkway networks (`walkways.geojson`) and indoor corridor pathways (`paths.geojson`)
- Building entrance nodes (`entrances.geojson`) and handoff threshold points
- Staircase vertical transition nodes (`stairs.geojson`)
- Room door anchor nodes (`doors.geojson`)
- Indoor-routing GeoJSON networks for multi-floor wayfinding

#### Module Responsibilities
- Maintain the graph routing engine (A* pathfinding).
- Implement and optimize the **2D/3D campus map**.
- Handle seamless outdoor and indoor navigation.
- Integrate GPS tracking and live heading orientation.
- Calculate shortest paths and dynamic route updates.
- Connect search queries to active navigation routes.
- Manage building entrance detection and indoor/outdoor transitions.

---

### 🤝 Shared Responsibilities

Both team members actively collaborate on:
- **Module & API Integration:** Connecting Brian's campus venues and events with Sanath's navigation engine.
- **Cross-Module Verification:** Verifying integration between campus event discovery and navigation wayfinding across mobile and desktop viewports.
- **Deployment & Documentation:** Technical documentation, deployment guides, and README maintenance.
- **Git & Code Quality:** Branch management, PR reviews, and code quality.
- **Scrum Reviews:** Sprint planning, progress demos, and academic presentations.

#### Ownership Clarification
- **Brian owns Campus Information & Exploration and Event Map.**
- **Sanath owns the new 2D/3D campus map and Navigation & Routing.**
- Event venue selection integrates directly with Sanath's navigation routing service.
- Changes to shared components (such as global layouts, navigation state, and database models) are coordinated collaboratively.

---

## 💻 Installation & Setup

### Prerequisites
- **Node.js:** v18.0.0 or higher (v20+ recommended)
- **npm:** v9.0.0 or higher
- **Python:** v3.10 or higher
- **MySQL:** v8.0 or higher (optional for frontend-only or SQLite testing)

---

### 1. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```
5. To build for production:
   ```bash
   npm run build
   ```

---

### 2. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   # Windows (PowerShell)
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # Linux / macOS
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` to configure your database connection and Clerk keys:
   ```ini
   DJANGO_SECRET_KEY=your-secret-key-here
   DJANGO_DEBUG=True
   DB_NAME=smartnav_dev
   DB_USER=smartnav_user
   DB_PASSWORD=your_password
   DB_HOST=127.0.0.1
   DB_PORT=3306
   CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
   CLERK_ISSUER=https://your-app.clerk.accounts.dev
   CLERK_JWKS_URL=https://your-app.clerk.accounts.dev/.well-known/jwks.json
   ```
5. Apply database migrations:
   ```bash
   python manage.py migrate
   ```
6. Start the Django development server:
   ```bash
   python manage.py runserver
   ```
   The API will be available at `http://127.0.0.1:8000/api/`.

---

## 🧪 Testing & Validation

### Frontend Verification
Run the production build check to ensure all JSX components, Tailwind v4 styles, MapLibre/Leaflet modules, and static assets compile cleanly with zero bundling errors:
```bash
cd frontend
npm run build
```

### Backend Automated Test Suite
Run the Django REST API automated test suite:
```bash
cd backend
python manage.py test api
```
*Current test suite: **31 unit tests** covering Clerk JWT authentication, venue serializers, public event feeds, admin CRUD permissions, model validations, and pagination.*

> [!NOTE]
> Successful production builds (`npm run build`) and passing backend unit tests (`python manage.py test`) verify code compilation, module resolution, and individual service contracts. Full end-to-end multi-device testing (such as physical on-campus GPS field walks and live mobile device validation) is an ongoing process.

---

## 📊 Development Status & Limitations

### Status Overview

| Capability | Module | Status | Notes |
| :--- | :--- | :---: | :--- |
| **2D Campus Map** | Sanath | ✅ Implemented | Leaflet map with campus boundaries, walkways, footprints, and rotatable canvas |
| **3D MapLibre Map** | Sanath | ✅ Implemented | Hardware-accelerated 3D extrusions, solid walls, base lines, lighting |
| **3D Building & Area Labels** | Sanath | ✅ Implemented | Screen-facing symbol layers with white halos via demotiles open glyphs |
| **2D/3D Mode Toggle** | Sanath | ✅ Implemented | Compact 36px–38px toggle with uniform 11px gap below controls on mobile & desktop |
| **GPS & Heading Tracking** | Sanath | ✅ Implemented | Turf-based 4m accuracy circle, device orientation arrow, re-center control |
| **Building Detection** | Sanath | ✅ Implemented | Point-in-polygon entrance handoff triggers (`turf.booleanPointInPolygon`) |
| **Mechanical Block Routing** | Sanath | ✅ Implemented | All 4 floors (GF, FF, SF, TF) mapped with corridors and staircase connectors |
| **Chemical Block Routing** | Sanath | 🟡 Partially Implemented | GF and FF mapped; SF has rooms mapped, corridor & stair graphs planned |
| **Event Map & Venues** | Brian | ✅ Implemented | Event feed, category filter chips, venue details modal, and direct route action |
| **Backend REST APIs** | Brian | ✅ Implemented | Public events/venues, Clerk JWT auth, and admin CRUD (31 unit tests passing) |
| **Search UI** | Brian | ✅ Implemented | Instant room and venue search with auto-selection |

### Known Limitations
- **Chemical Block Upper Floors:** Chemical Block currently has indoor routing data for Ground Floor and First Floor. Second Floor has room boundary geometries (`rooms.geojson`), but corridor paths (`paths.geojson`), door nodes (`doors.geojson`), and vertical staircase connectors (`stairs.geojson`) are scheduled for the next development phase. Third Floor (TF) data has not yet been digitized.
- **Direct Indoor-to-Indoor Transfers:** Navigation between rooms in different buildings currently routes down to the building entrance, traverses the outdoor walkway network, and enters the destination building. Direct skyway bridges (where applicable) are not yet modeled.
- **Indoor Positioning:** Indoor wayfinding currently relies on outdoor entrance handoff and manual floor selection. Beacon/Wi-Fi/QR-based indoor positioning is planned as a future enhancement.

---

## 🎯 Future Enhancements

- **Complete Campus Coverage:** Extend indoor routing GeoJSON datasets to the Central Library, Architecture Block, and Workshop complexes.
- **Chemical Block 2F Routing:** Digitize remaining corridor networks and stair nodes for Chemical Block Second Floor.
- **Turn-by-Turn Voice Navigation:** Audio walking prompts for hands-free outdoor and indoor wayfinding.
- **Accessibility Routing:** Accessible path preferences avoiding staircases for wheelchair users and service carts.
- **QR Code Navigation:** Floor-mounted QR codes allowing instant indoor location calibration.

---

*This project is developed for educational purposes as part of the MCA degree program at TKM College of Engineering, Kollam.*
