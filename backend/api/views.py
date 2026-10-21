from django.db import transaction
from django.db.models import Q, ProtectedError
from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response

from api.models import Building, Floor, Room, Venue, Event
from api.serializers import (
    PublicBuildingSerializer,
    PublicFloorSerializer,
    PublicRoomSerializer,
    PublicVenueSerializer,
    PublicEventSerializer,
    AdminBuildingSerializer,
    AdminFloorSerializer,
    AdminRoomSerializer,
    AdminVenueSerializer,
    AdminEventSerializer,
)
from api.permissions import IsClerkAdmin


# =====================================================================
# PUBLIC READ-ONLY VIEWSETS
# =====================================================================

class EventViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public read-only API for campus events.
    Supports filtering by category, venue, live/upcoming/today/ended status, and text search.
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = PublicEventSerializer
    lookup_field = 'id'

    def get_queryset(self):
        queryset = Event.objects.select_related(
            'venue',
            'venue__building',
            'venue__room__floor__building'
        ).all()

        params = self.request.query_params

        # Filter by category
        category = params.get('category')
        if category:
            queryset = queryset.filter(category__iexact=category.strip())

        # Filter by venue ID
        venue_id = params.get('venue')
        if venue_id:
            queryset = queryset.filter(venue_id=venue_id.strip())

        # Filter by demo status
        is_demo = params.get('is_demo')
        if is_demo is not None:
            queryset = queryset.filter(is_demo=is_demo.lower() in ('true', '1', 'yes'))

        # Filter by time status (live, upcoming, today, ended)
        status_filter = params.get('status', '').lower()
        now = timezone.now()
        if status_filter == 'live':
            queryset = queryset.filter(start_time__lte=now, end_time__gte=now)
        elif status_filter == 'upcoming':
            queryset = queryset.filter(start_time__gt=now)
        elif status_filter == 'today':
            today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            today_end = now.replace(hour=23, minute=59, second=59, microsecond=999999)
            queryset = queryset.filter(start_time__lte=today_end, end_time__gte=today_start)
        elif status_filter == 'ended':
            queryset = queryset.filter(end_time__lt=now)

        # Full-text search
        search_query = params.get('search')
        if search_query:
            q = search_query.strip()
            queryset = queryset.filter(
                Q(title__icontains=q) |
                Q(description__icontains=q) |
                Q(organizer__icontains=q)
            )

        return queryset.order_by('start_time')


class VenueViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public read-only API for campus venues.
    Supports filtering by category, venue_type, building, indoor map support, and search.
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = PublicVenueSerializer
    lookup_field = 'id'

    def get_queryset(self):
        queryset = Venue.objects.select_related(
            'building',
            'room__floor__building'
        ).all()

        params = self.request.query_params

        # Active filter (default to active for public, or allow filtering)
        is_active = params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() in ('true', '1', 'yes'))
        else:
            queryset = queryset.filter(is_active=True)

        # Category filter
        category = params.get('category')
        if category:
            queryset = queryset.filter(category__iexact=category.strip())

        # Venue type filter (INDOOR_ROOM, BUILDING, OUTDOOR)
        venue_type = params.get('venue_type')
        if venue_type:
            queryset = queryset.filter(venue_type__iexact=venue_type.strip())

        # Indoor map support filter
        has_indoor_map = params.get('has_indoor_map')
        if has_indoor_map is not None:
            queryset = queryset.filter(has_indoor_map=has_indoor_map.lower() in ('true', '1', 'yes'))

        # Building filter
        building = params.get('building')
        if building:
            b = building.strip()
            queryset = queryset.filter(
                Q(building__name__icontains=b) |
                Q(building__code__iexact=b) |
                Q(room__floor__building__name__icontains=b) |
                Q(room__floor__building__code__iexact=b)
            )

        # Search query
        search_query = params.get('search')
        if search_query:
            q = search_query.strip()
            queryset = queryset.filter(
                Q(name__icontains=q) |
                Q(id__icontains=q) |
                Q(landmark__icontains=q) |
                Q(directions__icontains=q) |
                Q(room__room_no__icontains=q) |
                Q(building__name__icontains=q)
            )

        return queryset.order_by('name')


# =====================================================================
# PROTECTED ADMIN VIEWSETS
# =====================================================================

class SafeDeleteAdminViewSet(viewsets.ModelViewSet):
    """
    Base viewset for Admin CRUD operations.
    Requires Clerk authentication and explicit admin authorization.
    Protects against foreign key reference deletion errors.
    """
    permission_classes = [IsClerkAdmin]

    def destroy(self, request, *args, **kwargs):
        try:
            with transaction.atomic():
                return super().destroy(request, *args, **kwargs)
        except ProtectedError as e:
            return Response(
                {
                    "error": "PROTECTED_RECORD",
                    "detail": "Cannot delete this record because it is referenced by active events, spaces, or campus navigation records. Reassign or delete dependent records first, or deactivate this record instead."
                },
                status=status.HTTP_400_BAD_REQUEST
            )


class AdminEventViewSet(SafeDeleteAdminViewSet):
    serializer_class = AdminEventSerializer
    lookup_field = 'id'

    def get_queryset(self):
        return Event.objects.select_related(
            'venue',
            'venue__building',
            'venue__room__floor__building'
        ).all().order_by('-start_time')

    def perform_create(self, serializer):
        clerk_id = getattr(self.request.user, 'clerk_id', None)
        with transaction.atomic():
            serializer.save(created_by_clerk_id=clerk_id)

    def perform_update(self, serializer):
        with transaction.atomic():
            serializer.save()


class AdminBuildingViewSet(SafeDeleteAdminViewSet):
    serializer_class = AdminBuildingSerializer
    queryset = Building.objects.all().order_by('name')

    def perform_create(self, serializer):
        with transaction.atomic():
            serializer.save()

    def perform_update(self, serializer):
        with transaction.atomic():
            serializer.save()


class AdminFloorViewSet(SafeDeleteAdminViewSet):
    serializer_class = AdminFloorSerializer
    queryset = Floor.objects.select_related('building').all().order_by('building', 'floor_number')

    def perform_create(self, serializer):
        with transaction.atomic():
            serializer.save()

    def perform_update(self, serializer):
        with transaction.atomic():
            serializer.save()


class AdminRoomViewSet(SafeDeleteAdminViewSet):
    serializer_class = AdminRoomSerializer
    queryset = Room.objects.select_related('floor__building').all().order_by('room_no')

    def perform_create(self, serializer):
        with transaction.atomic():
            serializer.save()

    def perform_update(self, serializer):
        with transaction.atomic():
            serializer.save()


class AdminVenueViewSet(SafeDeleteAdminViewSet):
    serializer_class = AdminVenueSerializer
    lookup_field = 'id'
    queryset = Venue.objects.select_related('building', 'room__floor__building').all().order_by('name')

    def perform_create(self, serializer):
        with transaction.atomic():
            serializer.save()

    def perform_update(self, serializer):
        with transaction.atomic():
            serializer.save()

# Handles API requests for campus data and related resources.