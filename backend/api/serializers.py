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