from django.contrib import admin
from .models import Building, Floor, Room, Venue, Event


@admin.register(Building)
class BuildingAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'building_type', 'floors_count', 'is_active')
    search_fields = ('name', 'code')
    list_filter = ('building_type', 'is_active')


@admin.register(Floor)
class FloorAdmin(admin.ModelAdmin):
    list_display = ('building', 'floor_number', 'name', 'code', 'has_indoor_map', 'is_active')
    list_filter = ('building', 'floor_number', 'has_indoor_map', 'is_active')
    search_fields = ('name', 'building__name')


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ('room_no', 'name', 'space_type', 'floor', 'department', 'is_active')
    search_fields = ('room_no', 'name', 'department')
    list_filter = ('space_type', 'floor__building', 'is_active')


@admin.register(Venue)
class VenueAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'venue_type', 'category', 'building', 'room', 'has_indoor_map', 'is_active')
    search_fields = ('id', 'name', 'landmark')
    list_filter = ('venue_type', 'category', 'has_indoor_map', 'is_active')


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'venue', 'start_time', 'end_time', 'organizer', 'is_demo')
    search_fields = ('title', 'organizer', 'description')
    list_filter = ('category', 'is_demo', 'start_time')
    date_hierarchy = 'start_time'
