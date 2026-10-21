import json
import logging
from pathlib import Path
from django.core.management.base import BaseCommand
from django.db import transaction
from api.models import Building, Floor, Room, Venue

logger = logging.getLogger(__name__)

# Verified Building Definitions mapped to SmartNav's spatial data
VERIFIED_BUILDINGS = [
    {
        "name": "Mechanical Block",
        "code": "MECH",
        "building_type": "Academic",
        "floors_count": 4,
        "lat": 8.912886,
        "lng": 76.631817,
        "polygon_ref": "buildings.geojson:id=1",
        "geojson_id": 1,
        "description": "Mechanical Engineering Block housing labs, classrooms, and seminar halls.",
        "floors": [
            {"floor_number": 0, "name": "Ground Floor", "code": "GF", "floor_plan_path": "mechanical/ground_floor", "has_indoor_map": True},
            {"floor_number": 1, "name": "First Floor", "code": "FF", "floor_plan_path": "mechanical/first_floor", "has_indoor_map": True},
            {"floor_number": 2, "name": "Second Floor", "code": "SF", "floor_plan_path": "mechanical/second_floor", "has_indoor_map": True},
            {"floor_number": 3, "name": "Third Floor", "code": "TF", "floor_plan_path": "mechanical/top_floor", "has_indoor_map": True},
        ]
    },
    {
        "name": "Chemical Block",
        "code": "CHEM",
        "building_type": "Academic",
        "floors_count": 4,
        "lat": 8.912439,
        "lng": 76.63167,
        "polygon_ref": "buildings.geojson:id=2",
        "geojson_id": 2,
        "description": "Chemical Engineering Block with research labs and classrooms.",
        "floors": [
            {"floor_number": 0, "name": "Ground Floor", "code": "GF", "floor_plan_path": "chemical/ground_floor", "has_indoor_map": True},
            {"floor_number": 1, "name": "First Floor", "code": "FF", "floor_plan_path": "chemical/first_floor", "has_indoor_map": True},
        ]
    },
    {
        "name": "Main Block",
        "code": "MAIN",
        "building_type": "Administration",
        "floors_count": 2,
        "lat": 8.91412,
        "lng": 76.632101,
        "polygon_ref": "buildings.geojson:id=7",
        "geojson_id": 7,
        "description": "Central Administrative Block and Council Chambers.",
        "floors": [
            {"floor_number": 0, "name": "Ground Floor", "code": "GF", "floor_plan_path": "main-block/ground_floor", "has_indoor_map": False},
        ]
    },
    {
        "name": "Central Library",
        "code": "LIB",
        "building_type": "Library",
        "floors_count": 3,
        "lat": 8.91435,
        "lng": 76.632936,
        "polygon_ref": "buildings.geojson:id=8",
        "geojson_id": 8,
        "description": "Campus Central Library and reading facilities.",
        "floors": [
            {"floor_number": 0, "name": "Ground Floor", "code": "GF", "floor_plan_path": "central-library", "has_indoor_map": False},
        ]
    },
    {
        "name": "Auditorium",
        "code": "AUD",
        "building_type": "Common Facility",
        "floors_count": 1,
        "lat": 8.913771,
        "lng": 76.632078,
        "polygon_ref": "buildings.geojson:id=21",
        "geojson_id": 21,
        "description": "College Auditorium for cultural gatherings and conferences.",
        "floors": [
            {"floor_number": 0, "name": "Ground Floor", "code": "GF", "floor_plan_path": None, "has_indoor_map": False},
        ]
    },
    {
        "name": "Canteen",
        "code": "CAN",
        "building_type": "Common Facility",
        "floors_count": 1,
        "lat": 8.913751,
        "lng": 76.632469,
        "polygon_ref": "buildings.geojson:id=24",
        "geojson_id": 24,
        "description": "College Canteen and open quadrangle.",
        "floors": [
            {"floor_number": 0, "name": "Ground Floor", "code": "GF", "floor_plan_path": None, "has_indoor_map": False},
        ]
    },
    {
        "name": "Workshop Block",
        "code": "WS",
        "building_type": "Workshop",
        "floors_count": 1,
        "lat": 8.913766,
        "lng": 76.632987,
        "polygon_ref": "buildings.geojson:id=38",
        "geojson_id": 38,
        "description": "Central Engineering Workshop Block.",
        "floors": [
            {"floor_number": 0, "name": "Ground Floor", "code": "GF", "floor_plan_path": None, "has_indoor_map": False},
        ]
    },
    {
        "name": "Workshop (Electrical)",
        "code": "WSE",
        "building_type": "Workshop",
        "floors_count": 1,
        "lat": 8.912939,
        "lng": 76.632135,
        "polygon_ref": "buildings.geojson:id=3",
        "geojson_id": 3,
        "description": "Electrical Engineering Workshop.",
        "floors": [
            {"floor_number": 0, "name": "Ground Floor", "code": "GF", "floor_plan_path": None, "has_indoor_map": False},
        ]
    },
    {
        "name": "Architecture Block",
        "code": "ARCH",
        "building_type": "Academic",
        "floors_count": 3,
        "lat": 8.913343,
        "lng": 76.63227,
        "polygon_ref": "buildings.geojson:id=5",
        "geojson_id": 5,
        "description": "Department of Architecture.",
        "floors": [
            {"floor_number": 0, "name": "Ground Floor", "code": "GF", "floor_plan_path": None, "has_indoor_map": False},
        ]
    },
    {
        "name": "Interdisciplinary Research Block (RUSA)",
        "code": "RUSA",
        "building_type": "Research",
        "floors_count": 3,
        "lat": 8.9135,
        "lng": 76.633049,
        "polygon_ref": "buildings.geojson:id=6",
        "geojson_id": 6,
        "description": "Interdisciplinary Research Block (RUSA).",
        "floors": [
            {"floor_number": 0, "name": "Ground Floor", "code": "GF", "floor_plan_path": None, "has_indoor_map": False},
        ]
    },
]

# Verified Rooms mapped from campusVenues.js & indoor GeoJSON layers
VERIFIED_ROOMS = [
    {
        "room_no": "M108",
        "name": "CAD/CAM Seminar Hall (M108)",
        "space_type": "Seminar Hall",
        "building_name": "Mechanical Block",
        "floor_number": 0,
        "department": "Mechanical Engineering",
        "map_room_id": "M108",
        "lat": 8.912928,
        "lng": 76.631978,
    },
    {
        "room_no": "M203",
        "name": "Mechanical Lecture Hall (M203)",
        "space_type": "Classroom",
        "building_name": "Mechanical Block",
        "floor_number": 1,
        "department": "Mechanical Engineering",
        "map_room_id": "M203",
        "lat": 8.912698,
        "lng": 76.631719,
    },
    {
        "room_no": "M102",
        "name": "Heat Engines Laboratory (M102)",
        "space_type": "Laboratory",
        "building_name": "Mechanical Block",
        "floor_number": 0,
        "department": "Mechanical Engineering",
        "map_room_id": "M102",
        "lat": 8.912674,
        "lng": 76.631765,
    },
    {
        "room_no": "H102",
        "name": "Chemical Seminar Room (H102)",
        "space_type": "Seminar Hall",
        "building_name": "Chemical Block",
        "floor_number": 0,
        "department": "Chemical Engineering",
        "map_room_id": "H102",
        "lat": 8.912584,
        "lng": 76.631566,
    },
]

# Verified Venues from campusVenues.js (exactly preserving IDs and centroids)
VERIFIED_VENUES = [
    {
        "id": "venue-auditorium",
        "name": "College Auditorium",
        "venue_type": "BUILDING",
        "category": "Auditorium",
        "building_name": "Auditorium",
        "room_no": None,
        "lat": 8.913771,
        "lng": 76.632078,
        "landmark": "Central campus quadrangle, west of the Canteen",
        "directions": "From the Main Gate, walk north along the central avenue for ~120m. The Auditorium is directly ahead on the left.",
        "has_indoor_map": False,
    },
    {
        "id": "venue-canteen",
        "name": "College Canteen & Open Quadrangle",
        "venue_type": "BUILDING",
        "category": "Common Facility",
        "building_name": "Canteen",
        "room_no": None,
        "lat": 8.913751,
        "lng": 76.632469,
        "landmark": "Next to the Cooperative Store and Auditorium",
        "directions": "From the Main Gate, walk north for ~100m. The Canteen complex is on your right adjacent to the quadrangle.",
        "has_indoor_map": False,
    },
    {
        "id": "venue-library",
        "name": "Central Library Reading Hall",
        "venue_type": "BUILDING",
        "category": "Common Facility",
        "building_name": "Central Library",
        "room_no": None,
        "lat": 8.91436,
        "lng": 76.632862,
        "landmark": "East of Main Block, opposite the Workshop Block",
        "directions": "Walk east from the Main Block along the library walkway. Enter the Central Library through the front entrance doors.",
        "has_indoor_map": False,
    },
    {
        "id": "venue-main-block",
        "name": "Main Block Council Chamber",
        "venue_type": "BUILDING",
        "category": "Administrative",
        "building_name": "Main Block",
        "room_no": None,
        "lat": 8.914166,
        "lng": 76.632079,
        "landmark": "Main Administrative Block Ground Floor",
        "directions": "Walk straight north from the Main Gate to the central administrative building. Enter through the front portico.",
        "has_indoor_map": False,
    },
    {
        "id": "venue-mech-m108",
        "name": "CAD/CAM Seminar Hall (M108)",
        "venue_type": "INDOOR_ROOM",
        "category": "Seminar Hall",
        "building_name": "Mechanical Block",
        "room_no": "M108",
        "lat": 8.912928,
        "lng": 76.631978,
        "landmark": "Mechanical Block Ground Floor, North-East Corridor",
        "directions": "Enter Mechanical Block through the main entrance. Follow the main corridor to the right; Room M108 is on the left corridor.",
        "has_indoor_map": True,
    },
    {
        "id": "venue-mech-m203",
        "name": "Mechanical Lecture Hall (M203)",
        "venue_type": "INDOOR_ROOM",
        "category": "Classroom",
        "building_name": "Mechanical Block",
        "room_no": "M203",
        "lat": 8.912698,
        "lng": 76.631719,
        "landmark": "Mechanical Block First Floor, near Main Staircase",
        "directions": "Enter Mechanical Block, take the central stairs to the First Floor. Turn left into the main corridor; M203 is on your right.",
        "has_indoor_map": True,
    },
    {
        "id": "venue-mech-m102",
        "name": "Heat Engines Laboratory (M102)",
        "venue_type": "INDOOR_ROOM",
        "category": "Lab",
        "building_name": "Mechanical Block",
        "room_no": "M102",
        "lat": 8.912674,
        "lng": 76.631765,
        "landmark": "Mechanical Block Ground Floor, South Wing",
        "directions": "Enter Mechanical Block main entrance and proceed south along the ground floor corridor. Heat Engines Lab is on the left.",
        "has_indoor_map": True,
    },
    {
        "id": "venue-chem-h102",
        "name": "Chemical Seminar Room (H102)",
        "venue_type": "INDOOR_ROOM",
        "category": "Seminar Hall",
        "building_name": "Chemical Block",
        "room_no": "H102",
        "lat": 8.912584,
        "lng": 76.631566,
        "landmark": "Chemical Block Ground Floor, central corridor",
        "directions": "Enter Chemical Block via the front portico. H102 is adjacent to the main corridor opposite the central courtyard.",
        "has_indoor_map": True,
    },
    {
        "id": "venue-sports-ground",
        "name": "Football and Cricket Ground",
        "venue_type": "OUTDOOR",
        "category": "Sports Facility",
        "building_name": None,
        "room_no": None,
        "lat": 8.912996,
        "lng": 76.632785,
        "landmark": "Behind the hostel complex and eastern campus walkway",
        "directions": "From the central campus, follow the walkway east past the workshop area directly to the main sports ground.",
        "has_indoor_map": False,
    },
    {
        "id": "venue-basketball-court",
        "name": "Campus Basketball Court",
        "venue_type": "OUTDOOR",
        "category": "Sports Facility",
        "building_name": None,
        "room_no": None,
        "lat": 8.914358,
        "lng": 76.632243,
        "landmark": "Adjacent to the Main Block eastern courtyard",
        "directions": "Walk toward the Main Block; the basketball court is located on the eastern court open area.",
        "has_indoor_map": False,
    },
    {
        "id": "venue-tennis-court",
        "name": "Open Tennis Court",
        "venue_type": "OUTDOOR",
        "category": "Sports Facility",
        "building_name": None,
        "room_no": None,
        "lat": 8.915284,
        "lng": 76.632495,
        "landmark": "North campus sports zone near APJ Park",
        "directions": "Proceed north past the Main Block toward APJ Park. The tennis court is located along the northern path.",
        "has_indoor_map": False,
    },
    {
        "id": "venue-apj-park",
        "name": "APJ Park Open-Air Arena",
        "venue_type": "OUTDOOR",
        "category": "Outdoor Area",
        "building_name": None,
        "room_no": None,
        "lat": 8.915362,
        "lng": 76.632146,
        "landmark": "Northern end of campus near Volleyball and Tennis courts",
        "directions": "Follow the main campus road north past the Main Block to the landscaped APJ Park open area.",
        "has_indoor_map": False,
    },
]


class Command(BaseCommand):
    help = "Idempotently populates Buildings, Floors, Rooms, and Venues from verified SmartNav campus data."

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Simulate execution and log planned changes without modifying database.',
        )
        parser.add_argument(
            '--resync',
            action='store_true',
            help='Explicitly update existing records to match source data if differences are detected.',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        resync = options['resync']

        self.stdout.write(self.style.NOTICE(
            f"=== SmartNav Campus Data Seed [Dry-Run: {dry_run}, Resync: {resync}] ==="
        ))

        stats = {
            'buildings_created': 0, 'buildings_existing': 0, 'buildings_updated': 0,
            'floors_created': 0, 'floors_existing': 0, 'floors_updated': 0,
            'rooms_created': 0, 'rooms_existing': 0, 'rooms_updated': 0,
            'venues_created': 0, 'venues_existing': 0, 'venues_updated': 0,
            'conflicts': []
        }

        try:
            with transaction.atomic():
                self._seed_buildings_and_floors(stats, resync)
                self._seed_rooms(stats, resync)
                self._seed_venues(stats, resync)

                if dry_run:
                    self.stdout.write(self.style.WARNING("DRY RUN: Rolling back transaction. No records were written."))
                    transaction.set_rollback(True)

        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Seeding failed: {str(e)}"))
            raise e

        # Report results
        self.stdout.write(self.style.SUCCESS("\n=== Seeding Summary ==="))
        self.stdout.write(f"Buildings : {stats['buildings_created']} created, {stats['buildings_existing']} unchanged, {stats['buildings_updated']} updated")
        self.stdout.write(f"Floors    : {stats['floors_created']} created, {stats['floors_existing']} unchanged, {stats['floors_updated']} updated")
        self.stdout.write(f"Rooms     : {stats['rooms_created']} created, {stats['rooms_existing']} unchanged, {stats['rooms_updated']} updated")
        self.stdout.write(f"Venues    : {stats['venues_created']} created, {stats['venues_existing']} unchanged, {stats['venues_updated']} updated")

        if stats['conflicts']:
            self.stdout.write(self.style.WARNING(f"\nDetected {len(stats['conflicts'])} potential conflicts (run with --resync to overwrite):"))
            for conflict in stats['conflicts']:
                self.stdout.write(f" - {conflict}")
        else:
            self.stdout.write(self.style.SUCCESS("\nNo schema or data conflicts encountered."))

    def _seed_buildings_and_floors(self, stats, resync):
        for b_data in VERIFIED_BUILDINGS:
            floors_data = b_data.get('floors', [])
            building, created = Building.objects.get_or_create(
                name=b_data['name'],
                defaults={
                    'code': b_data['code'],
                    'building_type': b_data['building_type'],
                    'floors_count': b_data['floors_count'],
                    'lat': b_data['lat'],
                    'lng': b_data['lng'],
                    'polygon_ref': b_data['polygon_ref'],
                    'geojson_id': b_data['geojson_id'],
                    'description': b_data['description'],
                    'is_active': True,
                }
            )

            if created:
                stats['buildings_created'] += 1
                self.stdout.write(f"  + Building created: {building.name}")
            else:
                stats['buildings_existing'] += 1
                if resync:
                    building.code = b_data['code']
                    building.lat = b_data['lat']
                    building.lng = b_data['lng']
                    building.polygon_ref = b_data['polygon_ref']
                    building.geojson_id = b_data['geojson_id']
                    building.save()
                    stats['buildings_updated'] += 1

            # Seed Floors for this building
            for f_data in floors_data:
                floor, f_created = Floor.objects.get_or_create(
                    building=building,
                    floor_number=f_data['floor_number'],
                    defaults={
                        'name': f_data['name'],
                        'code': f_data['code'],
                        'floor_plan_path': f_data['floor_plan_path'],
                        'has_indoor_map': f_data['has_indoor_map'],
                        'is_active': True,
                    }
                )
                if f_created:
                    stats['floors_created'] += 1
                    self.stdout.write(f"    + Floor created: {building.name} - {floor.name}")
                else:
                    stats['floors_existing'] += 1
                    if resync:
                        floor.name = f_data['name']
                        floor.code = f_data['code']
                        floor.floor_plan_path = f_data['floor_plan_path']
                        floor.has_indoor_map = f_data['has_indoor_map']
                        floor.save()
                        stats['floors_updated'] += 1

    def _seed_rooms(self, stats, resync):
        for r_data in VERIFIED_ROOMS:
            try:
                building = Building.objects.get(name=r_data['building_name'])
                floor = Floor.objects.get(building=building, floor_number=r_data['floor_number'])
            except (Building.DoesNotExist, Floor.DoesNotExist):
                stats['conflicts'].append(f"Room {r_data['room_no']} references missing building/floor: {r_data['building_name']} Floor {r_data['floor_number']}")
                continue

            room, created = Room.objects.get_or_create(
                room_no=r_data['room_no'],
                floor=floor,
                defaults={
                    'name': r_data['name'],
                    'space_type': r_data['space_type'],
                    'department': r_data['department'],
                    'map_room_id': r_data['map_room_id'],
                    'lat': r_data['lat'],
                    'lng': r_data['lng'],
                    'is_accessible': True,
                    'is_active': True,
                }
            )

            if created:
                stats['rooms_created'] += 1
                self.stdout.write(f"  + Room created: {room.room_no} ({building.name})")
            else:
                stats['rooms_existing'] += 1
                if resync:
                    room.name = r_data['name']
                    room.space_type = r_data['space_type']
                    room.lat = r_data['lat']
                    room.lng = r_data['lng']
                    room.save()
                    stats['rooms_updated'] += 1

    def _seed_venues(self, stats, resync):
        for v_data in VERIFIED_VENUES:
            venue_id = v_data['id']

            linked_room = None
            linked_building = None

            if v_data.get('room_no'):
                linked_room = Room.objects.filter(room_no=v_data['room_no']).first()
                if linked_room and linked_room.floor:
                    linked_building = linked_room.floor.building
            elif v_data.get('building_name'):
                linked_building = Building.objects.filter(name=v_data['building_name']).first()

            venue, created = Venue.objects.get_or_create(
                id=venue_id,
                defaults={
                    'name': v_data['name'],
                    'venue_type': v_data['venue_type'],
                    'category': v_data['category'],
                    'room': linked_room,
                    'building': linked_building,
                    'lat': v_data['lat'],
                    'lng': v_data['lng'],
                    'landmark': v_data['landmark'],
                    'directions': v_data['directions'],
                    'has_indoor_map': v_data['has_indoor_map'],
                    'is_active': True,
                }
            )

            if created:
                stats['venues_created'] += 1
                self.stdout.write(f"  + Venue created: {venue.id} -> {venue.name}")
            else:
                stats['venues_existing'] += 1
                if resync:
                    venue.name = v_data['name']
                    venue.room = linked_room
                    venue.building = linked_building
                    venue.lat = v_data['lat']
                    venue.lng = v_data['lng']
                    venue.landmark = v_data['landmark']
                    venue.directions = v_data['directions']
                    venue.has_indoor_map = v_data['has_indoor_map']
                    venue.save()
                    stats['venues_updated'] += 1

# Populates the database with initial campus buildings, floors, rooms, and venues.