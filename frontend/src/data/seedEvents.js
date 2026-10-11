/**
 * seedEvents.js
 *
 * Demonstration campus events dataset with dynamic, relative timestamps.
 *
 * All events reference valid, verified venue IDs defined in `campusVenues.js`:
 * - venue-auditorium
 * - venue-mech-m108
 * - venue-mech-m203
 * - venue-mech-m102
 * - venue-chem-h102
 * - venue-library
 * - venue-sports-ground
 * - venue-basketball-court
 * - venue-tennis-court
 * - venue-canteen
 * - venue-apj-park
 * - venue-main-block
 *
 * Timestamps are computed dynamically relative to execution time so that:
 * - Live events are always currently ongoing.
 * - Today events start later on the current calendar day.
 * - Upcoming events start over the next 1–5 days.
 * - Ended events are sorted to the bottom.
 *
 * Each record is explicitly flagged with `isDemo: true`.
 */

function inMinutes(offset) {
  return Date.now() + offset * 60 * 1000;
}

function futureDate(dayOffset, hour = 10, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d.getTime();
}

export function seedEvents() {
  return [
    // ════════════════════════════════════════════════════════════════════════
    // 1. LIVE NOW (Ongoing across diverse campus venues)
    // ════════════════════════════════════════════════════════════════════════
    {
      id: "demo-evt-live-1",
      title: "Smart Campus Hackathon: 24h Sprint",
      category: "Tech",
      venueId: "venue-mech-m108",
      start: inMinutes(-45),
      end: inMinutes(75),
      organizer: "IEEE TKMCE Student Branch",
      description:
        "[DEMO EVENT] Student teams are actively developing navigation, IoT, and AI solutions. Mentors and evaluators are on site.",
      isDemo: true,
    },
    {
      id: "demo-evt-live-2",
      title: "Acoustic Jam Session & Unplugged",
      category: "Cultural",
      venueId: "venue-apj-park",
      start: inMinutes(-30),
      end: inMinutes(60),
      organizer: "College Music Club",
      description:
        "[DEMO EVENT] Open-air acoustic performances and casual jamming under the trees. Bring your instrument or listen along.",
      isDemo: true,
    },
    {
      id: "demo-evt-live-3",
      title: "Inter-Department Football League: Semi-Final",
      category: "Sports",
      venueId: "venue-sports-ground",
      start: inMinutes(-20),
      end: inMinutes(80),
      organizer: "Physical Education Dept",
      description:
        "[DEMO EVENT] Fast-paced 7-a-side clash between Mechanical and Civil Engineering. Spectator stands open.",
      isDemo: true,
    },
    {
      id: "demo-evt-live-4",
      title: "Figma Design Systems & UI Prototyping",
      category: "Workshop",
      venueId: "venue-mech-m203",
      start: inMinutes(-15),
      end: inMinutes(50),
      organizer: "Developer Student Club",
      description:
        "[DEMO EVENT] Hands-on masterclass on building reusable component libraries, responsive grids, and design tokens.",
      isDemo: true,
    },

    // ════════════════════════════════════════════════════════════════════════
    // 2. TODAY (Starting later today)
    // ════════════════════════════════════════════════════════════════════════
    {
      id: "demo-evt-today-1",
      title: "Generative AI & Autonomous Robotics Demo",
      category: "Tech",
      venueId: "venue-auditorium",
      start: inMinutes(60),
      end: inMinutes(150),
      organizer: "Dept of Computer Science",
      description:
        "[DEMO EVENT] Live presentation of edge robotics, computer vision pipelines, and deep learning research projects.",
      isDemo: true,
    },
    {
      id: "demo-evt-today-2",
      title: "3-on-3 Half-Court Basketball Tournament",
      category: "Sports",
      venueId: "venue-basketball-court",
      start: inMinutes(110),
      end: inMinutes(220),
      organizer: "Sports Council",
      description:
        "[DEMO EVENT] High-intensity knockout games featuring department teams. Fast 10-minute running halves.",
      isDemo: true,
    },
    {
      id: "demo-evt-today-3",
      title: "Higher Studies & Research Fellowships Seminar",
      category: "Seminar",
      venueId: "venue-chem-h102",
      start: inMinutes(140),
      end: inMinutes(230),
      organizer: "Career Guidance & Placement Cell",
      description:
        "[DEMO EVENT] Guidance on GATE, GRE, DAAD, and international fellowship applications from alumni researchers.",
      isDemo: true,
    },
    {
      id: "demo-evt-today-4",
      title: "Standup Comedy & Campus Open Mic",
      category: "Cultural",
      venueId: "venue-canteen",
      start: inMinutes(180),
      end: inMinutes(270),
      organizer: "Arts Committee",
      description:
        "[DEMO EVENT] An evening of student standup acts, humorous campus sketches, and beatboxing at the central quadrangle.",
      isDemo: true,
    },

    // ════════════════════════════════════════════════════════════════════════
    // 3. UPCOMING (Tomorrow and throughout the week)
    // ════════════════════════════════════════════════════════════════════════
    {
      id: "demo-evt-up-1",
      title: "Hands-on Microcontrollers & Sensors Lab",
      category: "Workshop",
      venueId: "venue-mech-m102",
      start: futureDate(1, 10, 0),
      end: futureDate(1, 13, 0),
      organizer: "Robotics & Automation Club",
      description:
        "[DEMO EVENT] Hardware interfacing with ESP32, IMU sensors, and CAN-bus telemetry in the Heat Engines Laboratory.",
      isDemo: true,
    },
    {
      id: "demo-evt-up-2",
      title: "Annual Campus Tennis Doubles Championship",
      category: "Sports",
      venueId: "venue-tennis-court",
      start: futureDate(1, 15, 30),
      end: futureDate(1, 18, 0),
      organizer: "Sports Council",
      description:
        "[DEMO EVENT] Outdoor doubles tournament matches on the north campus court. All students and staff welcome.",
      isDemo: true,
    },
    {
      id: "demo-evt-up-3",
      title: "Digital Research Portals & IEEE Xplore Orientation",
      category: "Seminar",
      venueId: "venue-library",
      start: futureDate(2, 11, 0),
      end: futureDate(2, 13, 0),
      organizer: "Central Library Division",
      description:
        "[DEMO EVENT] Orientation for UG and PG students on navigating scientific journals, citation indexes, and remote access.",
      isDemo: true,
    },
    {
      id: "demo-evt-up-4",
      title: "Student Senate All-Department Assembly",
      category: "Other",
      venueId: "venue-main-block",
      start: futureDate(3, 14, 0),
      end: futureDate(3, 16, 30),
      organizer: "Student Union",
      description:
        "[DEMO EVENT] General assembly discussing campus facilities, cultural fest planning, and committee initiatives.",
      isDemo: true,
    },
    {
      id: "demo-evt-up-5",
      title: "Sustainable Campus Energy Symposium",
      category: "Tech",
      venueId: "venue-auditorium",
      start: futureDate(4, 9, 30),
      end: futureDate(4, 16, 0),
      organizer: "Energy & Environment Committee",
      description:
        "[DEMO EVENT] Industry keynote talks on solar microgrids, green hydrogen production, and energy conservation on campus.",
      isDemo: true,
    },
    {
      id: "demo-evt-up-6",
      title: "Rapid Prototyping & 3D Printing Masterclass",
      category: "Workshop",
      venueId: "venue-mech-m108",
      start: futureDate(5, 10, 0),
      end: futureDate(5, 14, 0),
      organizer: "FabLab TKMCE",
      description:
        "[DEMO EVENT] CAD modeling to slicing and resin/FDM 3D printing. Participants fabricate custom prototype casings.",
      isDemo: true,
    },

    // ════════════════════════════════════════════════════════════════════════
    // 4. RECENTLY ENDED (Finished in past few hours; sorted last)
    // ════════════════════════════════════════════════════════════════════════
    {
      id: "demo-evt-ended-1",
      title: "Morning Yoga & Mindfulness Circle",
      category: "Other",
      venueId: "venue-apj-park",
      start: inMinutes(-200),
      end: inMinutes(-40),
      organizer: "NSS & Wellness Cell",
      description:
        "[DEMO EVENT] Guided breathing exercises, yoga asanas, and meditation session on the morning lawn.",
      isDemo: true,
    },
    {
      id: "demo-evt-ended-2",
      title: "Thermal Simulation & CFD Seminar",
      category: "Seminar",
      venueId: "venue-mech-m108",
      start: inMinutes(-260),
      end: inMinutes(-70),
      organizer: "Mechanical Engineering Association",
      description:
        "[DEMO EVENT] Practical introduction to computational fluid dynamics analysis and mesh generation techniques.",
      isDemo: true,
    },
  ];
}
