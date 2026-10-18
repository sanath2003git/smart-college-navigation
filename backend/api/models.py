from django.db import models
from django.core.exceptions import ValidationError


class Building(models.Model):
    """
    Campus Building representation mapped to SmartNav's spatial data.
    Preserves references to buildings.geojson and indoor map directory structure.
    """
    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=150, unique=True, help_text="Building name, e.g. 'Mechanical Block'")
    code = models.CharField(max_length=50, blank=True, null=True, help_text="Short identifier or acronym, e.g. 'MECH'")
    building_type = models.CharField(max_length=50, blank=True, default='Academic')
    floors_count = models.PositiveIntegerField(default=1, help_text="Total number of floors")
    lat = models.FloatField(null=True, blank=True, help_text="Centroid latitude")
    lng = models.FloatField(null=True, blank=True, help_text="Centroid longitude")
    polygon_ref = models.CharField(max_length=100, blank=True, null=True, help_text="Reference to building polygon in buildings.geojson")
    geojson_id = models.IntegerField(null=True, blank=True, help_text="Feature ID in buildings.geojson")
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True, help_text="Active status for display and routing")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Building'
        verbose_name_plural = 'Buildings'

    def __str__(self):
        return self.name


class Floor(models.Model):
    """
    Building floor level. Every floor belongs to a verified building.
    Floor numbers follow SmartNav standard: 0 = Ground Floor, 1 = First Floor, etc.
    """
    id = models.BigAutoField(primary_key=True)
    building = models.ForeignKey(
        Building,
        on_delete=models.PROTECT,
        related_name='floors',
        help_text="Parent building"
    )
    floor_number = models.IntegerField(help_text="Floor index: 0 for GF, 1 for 1F, 2 for 2F, 3 for 3F")
    name = models.CharField(max_length=100, help_text="Display name, e.g. 'Ground Floor', 'First Floor'")
    code = models.CharField(max_length=20, blank=True, help_text="Short code: 'GF', 'FF', 'SF', 'TF'")
    floor_plan_path = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Relative directory for indoor GeoJSON, e.g. 'mechanical/ground_floor'"
    )
    has_indoor_map = models.BooleanField(default=False, help_text="Whether mapped indoor routing data exists")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('building', 'floor_number')
        ordering = ['building', 'floor_number']
        verbose_name = 'Floor'
        verbose_name_plural = 'Floors'

    def __str__(self):
        return f"{self.building.name} - {self.name} ({self.floor_number})"


class Room(models.Model):
    """
    Physical room, lab, office, or space inside a building floor.
    Uses an independent database ID so room numbers can be renamed by admins
    without breaking foreign keys or existing event associations.
    """
    id = models.BigAutoField(primary_key=True)
    room_no = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Room number or code, e.g. 'M108', 'M203', 'H102'"
    )
    name = models.CharField(max_length=150, help_text="Descriptive display name, e.g. 'CAD/CAM Seminar Hall'")
    space_type = models.CharField(
        max_length=50,
        default='Classroom',
        help_text="Space category: Classroom, Laboratory, Office, Seminar Hall, Auditorium, Common Facility, etc."
    )
    floor = models.ForeignKey(
        Floor,
        on_delete=models.PROTECT,
        related_name='rooms',
        null=True,
        blank=True,
        help_text="Floor this room belongs to (null for unassigned or outdoor spaces)"
    )
    department = models.CharField(max_length=100, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    capacity = models.PositiveIntegerField(null=True, blank=True)
    map_room_id = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Corresponding room ID in indoor GeoJSON rooms layer"
    )
    routing_node_id = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Nearest indoor graph routing node ID"
    )
    lat = models.FloatField(null=True, blank=True, help_text="Room centroid latitude")
    lng = models.FloatField(null=True, blank=True, help_text="Room centroid longitude")
    is_accessible = models.BooleanField(default=True, help_text="Wheelchair / mobility accessible")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['room_no', 'name']
        verbose_name = 'Room / Space'
        verbose_name_plural = 'Rooms / Spaces'

    def __str__(self):
        floor_label = f"[{self.floor.building.name} {self.floor.code}]" if self.floor else "[Unassigned]"
        if self.room_no:
            return f"{self.room_no} - {self.name} {floor_label}"
        return f"{self.name} {floor_label}"


class Venue(models.Model):
    """
    Campus Venue abstraction for events and wayfinding.
    Preserves exact stable frontend venue IDs (e.g. 'venue-auditorium', 'venue-mech-m108', 'venue-sports-ground').
    Polymorphically links to an indoor Room, standalone Building, or standalone Outdoor location.
    """
    VENUE_TYPE_CHOICES = [
        ('INDOOR_ROOM', 'Indoor Room'),
        ('BUILDING', 'Standalone Building'),
        ('OUTDOOR', 'Outdoor Facility / Area'),
    ]

    id = models.CharField(
        max_length=64,
        primary_key=True,
        help_text="Stable venue ID matching frontend campusVenues.js, e.g. 'venue-mech-m108'"
    )
    name = models.CharField(max_length=150, help_text="Venue display name")
    venue_type = models.CharField(max_length=30, choices=VENUE_TYPE_CHOICES, default='INDOOR_ROOM')
    category = models.CharField(max_length=64, help_text="Auditorium, Seminar Hall, Lab, Sports Facility, Outdoor Area, etc.")

    # Relationships avoiding duplicate data
    room = models.ForeignKey(
        Room,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='venues',
        help_text="Linked indoor room (if venue is an indoor space)"
    )
    building = models.ForeignKey(
        Building,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='venues',
        help_text="Linked building (for standalone buildings or when room is not yet mapped)"
    )

    # Geographic and Navigation coordinates (centroid)
    lat = models.FloatField(help_text="WGS84 Latitude centroid")
    lng = models.FloatField(help_text="WGS84 Longitude centroid")
    landmark = models.CharField(max_length=255, blank=True, null=True, help_text="Visible landmark reference")
    directions = models.TextField(blank=True, null=True, help_text="Walking directions from campus gate/central walkway")
    has_indoor_map = models.BooleanField(default=False, help_text="Whether indoor room routing is supported")

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Venue'
        verbose_name_plural = 'Venues'

    def __str__(self):
        return f"{self.name} ({self.id})"

    @property
    def resolved_building_name(self):
        if self.room and self.room.floor and self.room.floor.building:
            return self.room.floor.building.name
        if self.building:
            return self.building.name
        return None

    @property
    def resolved_floor_number(self):
        if self.room and self.room.floor:
            return self.room.floor.floor_number
        return None

    @property
    def resolved_room_no(self):
        if self.room:
            return self.room.room_no
        return None


class Event(models.Model):
    """
    Campus Event model with foreign key relationship to Venue.
    Enforces relational integrity, prevents cascading deletion of referenced venues,
    and supports future Clerk admin creator tracking.
    """
    CATEGORY_CHOICES = [
        ('Tech', 'Tech'),
        ('Cultural', 'Cultural'),
        ('Sports', 'Sports'),
        ('Workshop', 'Workshop'),
        ('Seminar', 'Seminar'),
        ('Other', 'Other'),
    ]

    id = models.CharField(
        max_length=64,
        primary_key=True,
        help_text="Stable event ID, e.g. 'evt-1718293-abc' or demo ID 'demo-evt-live-1'"
    )
    title = models.CharField(max_length=200, help_text="Event title")
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='Other')
    venue = models.ForeignKey(
        Venue,
        on_delete=models.PROTECT,
        related_name='events',
        help_text="Venue where event takes place. Protected from accidental deletion."
    )
    start_time = models.DateTimeField(help_text="Start date and time")
    end_time = models.DateTimeField(help_text="End date and time")
    organizer = models.CharField(max_length=150, help_text="Organizing club, department, or committee")
    description = models.TextField(blank=True, help_text="Event details and instructions")
    is_demo = models.BooleanField(default=False, help_text="Indicates sample/demonstration event")
    created_by_clerk_id = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Clerk user ID of the admin who created the event"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['start_time']
        indexes = [
            models.Index(fields=['start_time', 'end_time']),
            models.Index(fields=['category']),
            models.Index(fields=['is_demo']),
        ]
        verbose_name = 'Event'
        verbose_name_plural = 'Events'

    def __str__(self):
        return f"{self.title} ({self.start_time:%Y-%m-%d %H:%M})"

    def clean(self):
        super().clean()
        if self.start_time and self.end_time and self.start_time >= self.end_time:
            raise ValidationError("Event end time must be after start time.")
