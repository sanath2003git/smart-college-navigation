import uuid
from rest_framework import serializers
from api.models import Building, Floor, Room, Venue, Event


# =====================================================================
# PUBLIC READ-ONLY SERIALIZERS
# =====================================================================

class PublicBuildingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Building
        fields = [
            'id', 'name', 'code', 'building_type', 'floors_count',
            'lat', 'lng', 'polygon_ref', 'geojson_id', 'description', 'is_active'
        ]
        read_only_fields = fields


class PublicFloorSerializer(serializers.ModelSerializer):
    building_name = serializers.CharField(source='building.name', read_only=True)
    building_id = serializers.PrimaryKeyRelatedField(source='building', read_only=True)

    class Meta:
        model = Floor
        fields = [
            'id', 'building_id', 'building_name', 'floor_number', 'name',
            'code', 'floor_plan_path', 'has_indoor_map', 'is_active'
        ]
        read_only_fields = fields


class PublicRoomSerializer(serializers.ModelSerializer):
    floor_number = serializers.IntegerField(source='floor.floor_number', read_only=True)
    floor_id = serializers.PrimaryKeyRelatedField(source='floor', read_only=True)
    building_id = serializers.PrimaryKeyRelatedField(source='floor.building', read_only=True)
    building_name = serializers.CharField(source='floor.building.name', read_only=True)

    class Meta:
        model = Room
        fields = [
            'id', 'room_no', 'name', 'space_type', 'floor_id', 'floor_number',
            'building_id', 'building_name', 'department', 'description',
            'capacity', 'map_room_id', 'routing_node_id', 'lat', 'lng',
            'is_accessible', 'is_active'
        ]
        read_only_fields = fields


class PublicVenueSerializer(serializers.ModelSerializer):
    building_name = serializers.CharField(source='resolved_building_name', read_only=True)
    floor_number = serializers.IntegerField(source='resolved_floor_number', read_only=True)
    room_no = serializers.CharField(source='resolved_room_no', read_only=True)
    building_id = serializers.PrimaryKeyRelatedField(source='building', read_only=True)
    room_id = serializers.PrimaryKeyRelatedField(source='room', read_only=True)

    class Meta:
        model = Venue
        fields = [
            'id', 'name', 'venue_type', 'category', 'lat', 'lng',
            'landmark', 'directions', 'has_indoor_map', 'is_active',
            'building_name', 'floor_number', 'room_no', 'building_id', 'room_id'
        ]
        read_only_fields = fields


class PublicEventSerializer(serializers.ModelSerializer):
    venue_id = serializers.CharField(source='venue.id', read_only=True)
    venue = PublicVenueSerializer(read_only=True)

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'category', 'venue_id', 'venue', 'start_time',
            'end_time', 'organizer', 'description', 'is_demo',
            'created_at', 'updated_at'
        ]
        read_only_fields = fields


# =====================================================================
# ADMIN CRUD SERIALIZERS
# =====================================================================

class AdminBuildingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Building
        fields = [
            'id', 'name', 'code', 'building_type', 'floors_count',
            'lat', 'lng', 'polygon_ref', 'geojson_id', 'description',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_lat(self, value):
        if value is not None and not (-90.0 <= value <= 90.0):
            raise serializers.ValidationError("Latitude must be between -90.0 and 90.0 degrees.")
        return value

    def validate_lng(self, value):
        if value is not None and not (-180.0 <= value <= 180.0):
            raise serializers.ValidationError("Longitude must be between -180.0 and 180.0 degrees.")
        return value


class AdminFloorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Floor
        fields = [
            'id', 'building', 'floor_number', 'name', 'code',
            'floor_plan_path', 'has_indoor_map', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, attrs):
        building = attrs.get('building') or (self.instance.building if self.instance else None)
        floor_number = attrs.get('floor_number') if 'floor_number' in attrs else (self.instance.floor_number if self.instance else None)

        if building and floor_number is not None:
            existing = Floor.objects.filter(building=building, floor_number=floor_number)
            if self.instance:
                existing = existing.exclude(pk=self.instance.pk)
            if existing.exists():
                raise serializers.ValidationError({
                    "floor_number": f"Floor {floor_number} already exists for building '{building.name}'."
                })
        return attrs


class AdminRoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = [
            'id', 'room_no', 'name', 'space_type', 'floor', 'department',
            'description', 'capacity', 'map_room_id', 'routing_node_id',
            'lat', 'lng', 'is_accessible', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_lat(self, value):
        if value is not None and not (-90.0 <= value <= 90.0):
            raise serializers.ValidationError("Latitude must be between -90.0 and 90.0 degrees.")
        return value

    def validate_lng(self, value):
        if value is not None and not (-180.0 <= value <= 180.0):
            raise serializers.ValidationError("Longitude must be between -180.0 and 180.0 degrees.")
        return value


class AdminVenueSerializer(serializers.ModelSerializer):
    id = serializers.CharField(required=False, max_length=64)

    class Meta:
        model = Venue
        fields = [
            'id', 'name', 'venue_type', 'category', 'room', 'building',
            'lat', 'lng', 'landmark', 'directions', 'has_indoor_map',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate_lat(self, value):
        if value is not None and not (-90.0 <= value <= 90.0):
            raise serializers.ValidationError("Latitude must be between -90.0 and 90.0 degrees.")
        return value

    def validate_lng(self, value):
        if value is not None and not (-180.0 <= value <= 180.0):
            raise serializers.ValidationError("Longitude must be between -180.0 and 180.0 degrees.")
        return value

    def validate(self, attrs):
        instance = self.instance
        room = attrs.get('room') if 'room' in attrs else (instance.room if instance else None)
        building = attrs.get('building') if 'building' in attrs else (instance.building if instance else None)
        venue_type = attrs.get('venue_type') if 'venue_type' in attrs else (instance.venue_type if instance else 'INDOOR_ROOM')

        # Relationship consistency check:
        # If room is supplied and building is also explicitly specified, they must match
        if room and building and room.floor and room.floor.building:
            if room.floor.building.id != building.id:
                raise serializers.ValidationError({
                    "room": f"Room '{room.room_no}' belongs to building '{room.floor.building.name}', which does not match specified building '{building.name}'."
                })

        # Indoor room venues must reference a room or parent building
        if venue_type == 'INDOOR_ROOM' and not room and not building:
            raise serializers.ValidationError({
                "room": "Indoor room venues must be linked to a room or building."
            })

        return attrs

    def create(self, validated_data):
        if not validated_data.get('id'):
            validated_data['id'] = f"venue-{uuid.uuid4().hex[:10]}"
        return super().create(validated_data)


class AdminEventSerializer(serializers.ModelSerializer):
    id = serializers.CharField(required=False, max_length=64)
    created_by_clerk_id = serializers.CharField(read_only=True)

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'category', 'venue', 'start_time', 'end_time',
            'organizer', 'description', 'is_demo', 'created_by_clerk_id',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_by_clerk_id', 'created_at', 'updated_at']

    def validate(self, attrs):
        instance = self.instance
        start_time = attrs.get('start_time') or (instance.start_time if instance else None)
        end_time = attrs.get('end_time') or (instance.end_time if instance else None)

        if not start_time:
            raise serializers.ValidationError({"start_time": "Event start time is required."})
        if not end_time:
            raise serializers.ValidationError({"end_time": "Event end time is required."})

        if start_time >= end_time:
            raise serializers.ValidationError({
                "end_time": "Event end time must be after start time."
            })

        venue = attrs.get('venue') or (instance.venue if instance else None)
        if venue and not venue.is_active:
            raise serializers.ValidationError({
                "venue": f"Venue '{venue.name}' is inactive and cannot host new events."
            })

        return attrs

    def create(self, validated_data):
        if not validated_data.get('id'):
            validated_data['id'] = f"evt-{uuid.uuid4().hex[:12]}"
        return super().create(validated_data)

# Serializes campus models for API responses and validates incoming data.