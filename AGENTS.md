Smart College Navigation
========================

This is a collaborative MCA Mini Project.

MODULE OWNERSHIP
----------------

Brian:
Campus Information & Exploration

Sanath:
Navigation & Routing

SHARED:
Integration, APIs, testing, bug fixing, deployment, documentation,
Git branch management, Scrum reviews, final presentation.

ARCHITECTURAL RULE
------------------

Before modifying code, determine its module ownership.

Navigation-related changes should primarily modify Sanath's
Navigation & Routing code.

Do not unnecessarily modify Brian's Campus Information &
Exploration functionality.

Preserve working functionality.

Use the smallest targeted change necessary.

Do not rewrite existing components unless required.

Do not change unrelated:
- GPS smoothing
- Building detection
- A* routing
- Floor detection
- Campus information
- Search
- Building/floor/room data
- GIS data

Do not commit or push unless explicitly requested by Sanath.