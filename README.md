# 🧭 SmartNav – Smart College Navigation System

SmartNav is a web-based indoor and outdoor navigation system designed for college campuses. It enables students, faculty, staff, and visitors to navigate seamlessly across the campus using GIS-based maps, interactive floor plans, and shortest-path routing.

> 🎓 MCA Semester 3 Mini Project – TKM College of Engineering

---

# 📖 Overview

Finding classrooms, laboratories, offices, and other facilities inside large educational campuses can be challenging, especially for newcomers.

SmartNav combines outdoor campus navigation with indoor building navigation to provide a seamless navigation experience. Using interactive maps and graph-based pathfinding, users can search for a destination and receive the shortest route from their current location.

The project currently focuses on the Mechanical Block and Chemical Block of TKM College of Engineering and is designed to be easily extended to additional campus buildings.

---

# ✨ Features

## 🌍 Outdoor Navigation

- Interactive campus map
- Campus boundary visualization
- Building polygons
- Outdoor walkway network
- Building entrances
- Current user location
- Automatic building detection
- Building selection

---

## 🏢 Indoor Navigation

- Mechanical Block navigation
  - Ground Floor
  - First Floor
  - Second Floor
  - Third Floor

- Chemical Block navigation
  - Ground Floor
  - First Floor

- Interactive floor plans
- Indoor corridor routing
- Door-based navigation
- Multiple entrance support
- Stair connectors
- Floor transition support

---

## 🔍 Smart Search

- Search by room number
- Search across supported buildings
- Automatic building identification
- Automatic floor selection
- Nearest room entrance detection

---

## 🧠 Navigation Engine

- Graph-based routing
- A* (A-Star) Pathfinding Algorithm
- GeoJSON-based navigation graph
- Outdoor-to-indoor navigation
- Indoor shortest-path routing
- Dynamic route visualization

---

# 🗺 GIS & Mapping

- OpenStreetMap
- QGIS
- GeoJSON
- Leaflet
- React Leaflet

---

# 🛠️ Technology Stack

## Frontend

- React
- Vite
- React Router
- Leaflet
- React Leaflet
- JavaScript
- HTML5
- CSS3

---

## Backend *(Upcoming)*

- Django
- Django REST Framework

---

## Navigation & GIS

- GeoJSON
- Graph Data Structure
- A* Pathfinding Algorithm
- Turf.js
- QGIS

---

# 👥 Project Team & Module Responsibilities

SmartNav is being developed as a collaborative MCA Mini Project. The system is divided into two major modules to enable parallel development and easier integration.

---

## 👨 Brian — Campus Information & Exploration

**Goal:** Enable users to discover, explore, and understand the campus and its facilities.

### Responsibilities

#### Frontend

- Home page
- Campus map
- Building explorer
- Floor viewer
- Room details
- Department information
- Building information pages
- Search UI
- Interactive map markers

#### Backend

- Building APIs
- Floor APIs
- Room APIs
- Department APIs
- Search APIs
- Campus information services

#### Database

- Buildings
- Floors
- Rooms
- Departments
- Points of Interest (POIs)
- Building metadata
- Search indexing

#### GIS

- Campus base map
- Building polygons
- Floor plans
- Room polygons
- Department locations
- Landmarks and POIs

#### Module Responsibilities

- Manage campus information
- Maintain building and room data
- Create and update GIS datasets
- Develop search functionality
- Maintain searchable campus information
- Display campus information on the map

---

## 👨 Sanath Sreekumar — Navigation & Routing

**Goal:** Enable users to navigate efficiently from their current location to any destination.

### Responsibilities

#### Frontend

- Navigation screen
- Route visualization
- Navigation controls
- Navigation status panel
- Floor transition UI
- Route instructions
- Search integration with navigation

#### Backend

- Navigation APIs
- A* Pathfinding Engine
- Building detection
- GPS and location services
- Route generation
- Route recalculation
- Destination selection
- Navigation initialization

#### Database

- Navigation graph
- Nodes
- Edges
- Route metadata
- Navigation configuration

#### GIS

- Outdoor walkways
- Indoor pathways
- Entrances
- Staircases
- Lifts
- Floor transition points
- Routing network

#### Module Responsibilities

- Develop the routing engine
- Handle indoor and outdoor navigation
- Integrate GPS and live location tracking
- Generate shortest paths
- Optimize navigation routes
- Integrate search results with navigation
- Handle destination selection
- Start navigation
- Highlight calculated routes on the map

---

## 🤝 Shared Responsibilities

Both team members collaborate on:

- Module integration
- API integration
- End-to-end testing
- Bug fixing
- Deployment
- Documentation
- Git branch management
- Scrum reviews
- Final project presentation

---

# 📂 Current Project Structure

```
src/
│
├── components/
├── pages/
├── navigation/
├── hooks/
├── services/
├── context/
├── config/
├── data/
├── assets/
└── utils/
```

---

# 🚀 Current Progress

✅ Interactive Campus Map

✅ Outdoor Navigation

✅ Building Detection

✅ Multi-Building Support

✅ Mechanical Block Indoor Navigation

✅ Chemical Block Indoor Navigation

✅ Stair Connections

✅ Floor Transition Logic

✅ Room Search

🚧 Indoor-to-Indoor Navigation

🚧 Voice Navigation

🚧 Backend API Integration

🚧 Real-time GPS Improvements

---

# 🎯 Future Enhancements

- Voice-guided navigation
- Live indoor positioning
- Accessibility-aware routing
- QR code based navigation
- Admin dashboard
- Room information management
- Event navigation
- Multi-campus support

---

This project is for **educational purposes** as part of an academic mini project.

---

## ⭐ If you like this project, consider giving it a star!
