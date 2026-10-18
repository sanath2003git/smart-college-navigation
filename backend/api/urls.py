from django.urls import path, include
from rest_framework.routers import DefaultRouter

from api.views import (
    EventViewSet,
    VenueViewSet,
    AdminEventViewSet,
    AdminBuildingViewSet,
    AdminFloorViewSet,
    AdminRoomViewSet,
    AdminVenueViewSet,
)

# Public read-only router
public_router = DefaultRouter()
public_router.register(r'events', EventViewSet, basename='public-events')
public_router.register(r'venues', VenueViewSet, basename='public-venues')

# Admin CRUD router
admin_router = DefaultRouter()
admin_router.register(r'events', AdminEventViewSet, basename='admin-events')
admin_router.register(r'buildings', AdminBuildingViewSet, basename='admin-buildings')
admin_router.register(r'floors', AdminFloorViewSet, basename='admin-floors')
admin_router.register(r'rooms', AdminRoomViewSet, basename='admin-rooms')
admin_router.register(r'venues', AdminVenueViewSet, basename='admin-venues')

urlpatterns = [
    # Public endpoints: /api/events/, /api/venues/
    path('', include(public_router.urls)),

    # Admin endpoints: /api/admin/events/, /api/admin/buildings/, /api/admin/floors/, /api/admin/rooms/, /api/admin/venues/
    path('admin/', include(admin_router.urls)),
]
