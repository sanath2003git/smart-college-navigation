import logging
from datetime import timedelta
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from django.db import transaction
from django.utils import timezone

from api.models import Venue, Event

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Safely seeds diverse synthetic test campus events for live map, event feed, and status testing."

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Simulate seeding without committing database transactions.',
        )

    def handle(self, *args, **options):
        dry_run = options.get('dry_run', False)

        # -------------------------------------------------------------
        # 1. Environment & Database Safety Check
        # -------------------------------------------------------------
        db_conf = settings.DATABASES.get('default', {})
        db_name = str(db_conf.get('NAME', ''))
        db_host = str(db_conf.get('HOST', ''))

        is_local_host = db_host in ('127.0.0.1', 'localhost', '')
        is_dev_name = any(kw in db_name.lower() for kw in ('dev', 'test', 'local'))

        if not (is_local_host and is_dev_name):
            raise CommandError(
                f"SAFETY CHECK REJECTED: Refusing to seed non-development database.\n"
                f"Configured: DB_NAME='{db_name}', DB_HOST='{db_host}'\n"
                f"Seeding is only permitted on local development databases."
            )

        self.stdout.write(
            self.style.NOTICE(f"Connecting to verified local development database: '{db_name}' on {db_host or 'localhost'}")
        )

        # -------------------------------------------------------------
        # 2. Verify Available Venues
        # -------------------------------------------------------------
        venues_count = Venue.objects.count()
        if venues_count == 0:
            raise CommandError(
                "No venues found in database. Please run 'python manage.py seed_campus_data' first."
            )

        self.stdout.write(f"Verified {venues_count} existing venues in database.")

        # -------------------------------------------------------------
        # 3. Compute Dynamic Timestamps (Relative to execution time)
        # -------------------------------------------------------------
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = now.replace(hour=23, minute=59, second=59, microsecond=999999)

        # Helper to calculate an upcoming time today that falls before today_end
        def get_today_time(start_offset_minutes, duration_minutes):
            calc_start = now + timedelta(minutes=start_offset_minutes)
            calc_end = calc_start + timedelta(minutes=duration_minutes)
            # Ensure it starts and ends within today
            if calc_end >= today_end:
                # If late at night, fit into the remaining time today
                remaining_seconds = max(60, (today_end - now).total_seconds())
                calc_start = now + timedelta(seconds=min(300, remaining_seconds * 0.2))
                calc_end = calc_start + timedelta(seconds=min(1800, remaining_seconds * 0.6))
            return calc_start, calc_end

        # Helper to calculate future date times
        def get_future_time(day_offset, hour, minute, duration_hours):
            target_date = (now + timedelta(days=day_offset)).replace(
                hour=hour, minute=minute, second=0, microsecond=0
            )
            return target_date, target_date + timedelta(hours=duration_hours)

        # Helper to calculate past ended times
        def get_past_time(end_offset_hours, duration_hours):
            calc_end = now - timedelta(hours=end_offset_hours)
            calc_start = calc_end - timedelta(hours=duration_hours)
            return calc_start, calc_end

        # -------------------------------------------------------------
        # 4. Define Synthetic Event Specifications
        # -------------------------------------------------------------
        # 15 events covering all categories and status transitions
        event_specs = [
            # ── GROUP A: ONGOING / LIVE EVENTS (start <= now < end) ──
            {
                "id": "evt-seed-live-hackathon",
                "title": "[DEMO] Smart Campus Hackathon: 24h Sprint",
                "category": "Tech",
                "venue_id": "venue-mech-m108",
                "start_time": now - timedelta(minutes=60),
                "end_time": now + timedelta(minutes=120),
                "organizer": "IEEE TKMCE Student Branch & Dept of Mechanical Engineering",
                "description": "[DEMO EVENT] Interdisciplinary student teams developing autonomous IoT, computer vision, and geospatial routing systems. Mentors on site.",
                "is_demo": True,
            },
            {
                "id": "evt-seed-live-cad-demo",
                "title": "[DEMO] Generative Design in CAD/CAM Masterclass",
                "category": "Seminar",
                "venue_id": "venue-mech-m108",  # OVERLAPPING with Hackathon at venue-mech-m108 to test indoor multi-event grouping
                "start_time": now - timedelta(minutes=30),
                "end_time": now + timedelta(minutes=90),
                "organizer": "Mechanical Engineering Association (MEA)",
                "description": "[DEMO EVENT] Demonstrating topology optimization, lightweight lattice structures, and automated CNC toolpath synthesis.",
                "is_demo": True,
            },
            {
                "id": "evt-seed-live-acoustic",
                "title": "[DEMO] Open-Air Acoustic Jam Session & Unplugged",
                "category": "Cultural",
                "venue_id": "venue-apj-park",
                "start_time": now - timedelta(minutes=45),
                "end_time": now + timedelta(minutes=45),
                "organizer": "College Music Club & Cultural Committee",
                "description": "[DEMO EVENT] Casual open-air acoustic performances and instrumental jam session under the trees. Bring instruments or listen along.",
                "is_demo": True,
            },
            {
                "id": "evt-seed-live-football",
                "title": "[DEMO] Inter-Department Football League: Semi-Final",
                "category": "Sports",
                "venue_id": "venue-sports-ground",
                "start_time": now - timedelta(minutes=35),
                "end_time": now + timedelta(minutes=55),
                "organizer": "Dept of Physical Education",
                "description": "[DEMO EVENT] Fast-paced 7-a-side semi-final clash between Mechanical and Civil Engineering. Spectator stands open.",
                "is_demo": True,
            },
            {
                "id": "evt-seed-live-web3-workshop",
                "title": "[DEMO] Web3 & Smart Contracts Hands-On Workshop",
                "category": "Workshop",
                "venue_id": "venue-auditorium",
                "start_time": now - timedelta(minutes=80),
                "end_time": now + timedelta(minutes=100),
                "organizer": "Developer Student Club (DSC TKMCE)",
                "description": "[DEMO EVENT] Live coding session on Solidity, smart contracts, decentralized identity protocols, and wallet integrations.",
                "is_demo": True,
            },
            {
                "id": "evt-seed-live-ai-summit",
                "title": "[DEMO] Kerala Student AI & Robotics Summit",
                "category": "Tech",
                "venue_id": "venue-auditorium",  # OVERLAPPING with Web3 Workshop at venue-auditorium to test auditorium grouping
                "start_time": now - timedelta(minutes=40),
                "end_time": now + timedelta(minutes=80),
                "organizer": "Robotics & AI Research Forum",
                "description": "[DEMO EVENT] Keynote addresses and interactive project exhibits highlighting autonomous mobile robots and computer vision systems.",
                "is_demo": True,
            },

            # ── GROUP B: TODAY UPCOMING (start > now, same calendar day) ──
            {
                "id": "evt-seed-today-cloud-talk",
                "title": "[DEMO] Cloud Infrastructure & Kubernetes Tech Talk",
                "category": "Tech",
                "venue_id": "venue-mech-m203",
                "start_time": get_today_time(60, 90)[0],
                "end_time": get_today_time(60, 90)[1],
                "organizer": "Computer Science & Engineering Society",
                "description": "[DEMO EVENT] Deep-dive into microservices architecture, container orchestration with Kubernetes, and production CI/CD pipelines.",
                "is_demo": True,
            },
            {
                "id": "evt-seed-today-basketball",
                "title": "[DEMO] Evening 3v3 Basketball Friendly Tournament",
                "category": "Sports",
                "venue_id": "venue-basketball-court",
                "start_time": get_today_time(120, 60)[0],
                "end_time": get_today_time(120, 60)[1],
                "organizer": "Campus Basketball Association",
                "description": "[DEMO EVENT] High-energy 3-on-3 student knockout matches. Open to all semester teams.",
                "is_demo": True,
            },
            {
                "id": "evt-seed-today-entrepreneurship",
                "title": "[DEMO] Student Innovation & Startup Pitch Session",
                "category": "Seminar",
                "venue_id": "venue-main-block",
                "start_time": get_today_time(180, 90)[0],
                "end_time": get_today_time(180, 90)[1],
                "organizer": "Innovation & Entrepreneurship Development Centre (IEDC)",
                "description": "[DEMO EVENT] Pitch session for student startup founders presenting business models to angel investors and faculty mentors.",
                "is_demo": True,
            },

            # ── GROUP C: FUTURE UPCOMING (starts on subsequent days) ──
            {
                "id": "evt-seed-future-iot-bootcamp",
                "title": "[DEMO] Embedded IoT & Microcontroller Bootcamp",
                "category": "Workshop",
                "venue_id": "venue-mech-m102",
                "start_time": get_future_time(1, 10, 0, 4)[0],
                "end_time": get_future_time(1, 10, 0, 4)[1],
                "organizer": "Electronics & Mechanical Interdisciplinary Club",
                "description": "[DEMO EVENT] Hands-on interfacing of ESP32, MQTT brokers, sensor telemetry, and low-power wireless networking.",
                "is_demo": True,
            },
            {
                "id": "evt-seed-future-cultural-fest",
                "title": "[DEMO] Rhythms: Annual Inter-College Cultural Fest",
                "category": "Cultural",
                "venue_id": "venue-auditorium",
                "start_time": get_future_time(2, 9, 30, 8)[0],
                "end_time": get_future_time(2, 9, 30, 8)[1],
                "organizer": "College Union & Fine Arts Club",
                "description": "[DEMO EVENT] Flagship annual cultural fest featuring choreography competitions, classical music, drama, and literary events.",
                "is_demo": True,
            },
            {
                "id": "evt-seed-future-book-exhibition",
                "title": "[DEMO] National Science Day Book & Research Exhibition",
                "category": "Other",
                "venue_id": "venue-library",
                "start_time": get_future_time(3, 10, 0, 6)[0],
                "end_time": get_future_time(3, 10, 0, 6)[1],
                "organizer": "Central Library Committee & Faculty of Science",
                "description": "[DEMO EVENT] Curated exhibition of peer-reviewed engineering journals, classic science monographs, and student research publications.",
                "is_demo": True,
            },

            # ── GROUP D: ENDED EVENTS (end_time < now) ──
            {
                "id": "evt-seed-ended-polymer-seminar",
                "title": "[DEMO] Green Chemistry & Polymer Nanomaterials Seminar",
                "category": "Seminar",
                "venue_id": "venue-chem-h102",
                "start_time": get_past_time(2, 2)[0],
                "end_time": get_past_time(2, 2)[1],
                "organizer": "Dept of Chemical Engineering",
                "description": "[DEMO EVENT] Guest lecture on bio-derived sustainable polymers, membrane separation technologies, and environmental catalysis.",
                "is_demo": True,
            },
            {
                "id": "evt-seed-ended-tennis-trials",
                "title": "[DEMO] Morning Tennis Team Selection Trials",
                "category": "Sports",
                "venue_id": "venue-tennis-court",
                "start_time": get_past_time(4, 2)[0],
                "end_time": get_past_time(4, 2)[1],
                "organizer": "TKMCE Tennis Club",
                "description": "[DEMO EVENT] Selection trials for the college tennis squad for the upcoming inter-collegiate tournament.",
                "is_demo": True,
            },
            {
                "id": "evt-seed-ended-food-carnival",
                "title": "[DEMO] Campus Culinary Fair & Food Carnival",
                "category": "Other",
                "venue_id": "venue-canteen",
                "start_time": get_past_time(26, 6)[0],
                "end_time": get_past_time(26, 6)[1],
                "organizer": "Student Welfare Committee",
                "description": "[DEMO EVENT] Charity food festival organized by student volunteers supporting community welfare initiatives.",
                "is_demo": True,
            },
        ]

        # -------------------------------------------------------------
        # 5. Execute Seeding Transaction
        # -------------------------------------------------------------
        created_count = 0
        updated_count = 0

        with transaction.atomic():
            for spec in event_specs:
                venue_id = spec.pop("venue_id")
                try:
                    venue = Venue.objects.get(id=venue_id)
                except Venue.DoesNotExist:
                    self.stdout.write(
                        self.style.ERROR(f"Skipping event '{spec['id']}': Venue '{venue_id}' does not exist.")
                    )
                    continue

                event_id = spec.pop("id")
                event_defaults = {
                    "title": spec["title"],
                    "category": spec["category"],
                    "venue": venue,
                    "start_time": spec["start_time"],
                    "end_time": spec["end_time"],
                    "organizer": spec["organizer"],
                    "description": spec["description"],
                    "is_demo": spec["is_demo"],
                }

                if dry_run:
                    self.stdout.write(f"[DRY RUN] Would seed: {event_id} -> {spec['title']} ({spec['category']}) at {venue.name}")
                    continue

                event, created = Event.objects.update_or_create(
                    id=event_id,
                    defaults=event_defaults,
                )

                if created:
                    created_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(f"Created: {event.id} | {event.title} ({event.category}) at {venue.name}")
                    )
                else:
                    updated_count += 1
                    self.stdout.write(
                        self.style.WARNING(f"Updated timestamps: {event.id} | {event.title} ({event.category}) at {venue.name}")
                    )

            if dry_run:
                self.stdout.write(self.style.NOTICE("DRY RUN completed. No records modified."))
                return

        total_seeded = created_count + updated_count
        self.stdout.write(
            self.style.SUCCESS(
                f"\nSeeding complete: {created_count} created, {updated_count} updated ({total_seeded} total test events)."
            )
        )

# Seeds sample campus events for testing and demonstration.