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
