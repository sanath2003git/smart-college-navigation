import time
from datetime import timedelta
from django.test import TestCase, override_settings
from django.core.exceptions import ValidationError
from django.db.models.deletion import ProtectedError
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status
import jwt
from cryptography.hazmat.primitives.asymmetric import rsa

from api.models import Building, Floor, Room, Venue, Event
from api.authentication import ClerkAuthentication


# =====================================================================
# 1. PHASE 1 MODEL UNIT TESTS (Preserved)
# =====================================================================

class CampusDataModelsTestCase(TestCase):
    def setUp(self):
        self.building = Building.objects.create(
            name="Mechanical Block",
            code="MECH",
            building_type="Academic",
            floors_count=3,
            lat=11.272186,
            lng=77.607421
        )
        self.floor = Floor.objects.create(
            building=self.building,
            floor_number=1,
            name="First Floor",
            code="FF",
            has_indoor_map=True
        )
        self.room = Room.objects.create(
            room_no="M108",
            name="CAD/CAM Seminar Hall",
            floor=self.floor,
            lat=11.272200,
            lng=77.607450
        )
        self.venue = Venue.objects.create(
            id="venue-mech-m108",
            name="Mechanical Block M108",
            venue_type="INDOOR_ROOM",
            category="Seminar Hall",
            room=self.room,
            building=self.building,
            lat=11.272200,
            lng=77.607450,
            has_indoor_map=True
        )

    def test_venue_properties_resolution(self):
        self.assertEqual(self.venue.resolved_building_name, "Mechanical Block")
        self.assertEqual(self.venue.resolved_floor_number, 1)
        self.assertEqual(self.venue.resolved_room_no, "M108")

    def test_room_renaming_independence(self):
        """Surrogate PK ensures room_no can be updated without breaking venue link."""
        room_pk = self.room.id
        self.room.room_no = "M108-Renamed"
        self.room.save()

        refreshed_venue = Venue.objects.get(id="venue-mech-m108")
        self.assertEqual(refreshed_venue.room.id, room_pk)
        self.assertEqual(refreshed_venue.resolved_room_no, "M108-Renamed")

    def test_foreign_key_protection_building_floor(self):
        """A building with floors cannot be accidentally deleted."""
        with self.assertRaises(ProtectedError):
            self.building.delete()

    def test_foreign_key_protection_venue_event(self):
        """A venue with events cannot be deleted."""
        now = timezone.now()
        Event.objects.create(
            id="evt-test-1",
            title="Design Thinking Workshop",
            venue=self.venue,
            start_time=now + timedelta(hours=1),
            end_time=now + timedelta(hours=3),
            organizer="Mech Association"
        )
        with self.assertRaises(ProtectedError):
            self.venue.delete()

    def test_event_start_end_time_validation(self):
        """Event end_time must be after start_time."""
        now = timezone.now()
        invalid_event = Event(
            id="evt-invalid-time",
            title="Invalid Event",
            venue=self.venue,
            start_time=now + timedelta(hours=2),
            end_time=now + timedelta(hours=1),
            organizer="Club"
        )
        with self.assertRaises(ValidationError):
            invalid_event.full_clean()

    def test_seed_campus_data_command(self):
        """Verify seed_campus_data command executes idempotently without errors."""
        from django.core.management import call_command
        import io
        out = io.StringIO()
        call_command('seed_campus_data', stdout=out)
        output = out.getvalue()
        self.assertIn("=== Seeding Summary ===", output)
        self.assertIn("No schema or data conflicts encountered.", output)

        # Second call to ensure 100% idempotency
        out2 = io.StringIO()
        call_command('seed_campus_data', stdout=out2)
        output2 = out2.getvalue()
        self.assertIn("0 created", output2)


# =====================================================================
# 2. MOCK CLERK AUTHENTICATION TEST HELPERS
# =====================================================================

TEST_ISSUER = "https://mock.clerk.accounts.dev"
TEST_ADMIN_USER_ID = "user_clerk_admin_001"
TEST_REGULAR_USER_ID = "user_clerk_student_999"


class MockSigningKey:
    def __init__(self, key):
        self.key = key


class MockJWKClient:
    def __init__(self, public_key, uri=TEST_ISSUER + "/.well-known/jwks.json"):
        self.public_key = public_key
        self.uri = uri

    def get_signing_key_from_jwt(self, token):
        return MockSigningKey(self.public_key)


class ClerkAuthTestBase(APITestCase):
    """
    Base test case generating in-memory RSA key pairs and configuring
    ClerkAuthentication with a MockJWKClient for hermetic tests.
    """
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        # Generate primary in-memory RSA key pair
        cls.private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        cls.public_key = cls.private_key.public_key()

        # Generate secondary key pair for invalid signature tests
        cls.foreign_private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)

    def setUp(self):
        super().setUp()
        self.mock_client = MockJWKClient(self.public_key)
        ClerkAuthentication.set_jwks_client(self.mock_client)

    def tearDown(self):
        ClerkAuthentication.set_jwks_client(None)
        super().tearDown()

    def make_token(self, sub=TEST_ADMIN_USER_ID, exp_offset=3600, issuer=TEST_ISSUER, use_foreign_key=False, custom_payload=None):
        now_ts = int(time.time())
        if custom_payload is not None:
            payload = custom_payload
        else:
            payload = {
                "sub": sub,
                "iss": issuer,
                "exp": now_ts + exp_offset,
                "iat": now_ts,
                "nbf": now_ts - 5,
            }
        signing_key = self.foreign_private_key if use_foreign_key else self.private_key
        return jwt.encode(payload, signing_key, algorithm="RS256", headers={"kid": "mock-kid-1"})

    def auth_headers(self, sub=TEST_ADMIN_USER_ID, **kwargs):
        token = self.make_token(sub=sub, **kwargs)
        return {"HTTP_AUTHORIZATION": f"Bearer {token}"}



# =====================================================================
# 3. PUBLIC API TESTS (Anonymous Access, Filtering, Navigation Data)
# =====================================================================

class PublicApiTestCase(APITestCase):
    def setUp(self):
        self.building = Building.objects.create(
            name="Mechanical Block",
            code="MECH",
            lat=8.912886,
            lng=76.631817
        )
        self.floor = Floor.objects.create(
            building=self.building,
            floor_number=0,
            name="Ground Floor",
            code="GF"
        )
        self.room = Room.objects.create(
            room_no="M108",
            name="CAD/CAM Seminar Hall",
            floor=self.floor,
            lat=8.912928,
            lng=76.631978
        )
        self.venue = Venue.objects.create(
            id="venue-mech-m108",
            name="Mechanical Block M108",
            venue_type="INDOOR_ROOM",
            category="Seminar Hall",
            room=self.room,
            building=self.building,
            lat=8.912928,
            lng=76.631978,
            has_indoor_map=True,
            is_active=True
        )

        now = timezone.now()
        self.live_event = Event.objects.create(
            id="evt-live-1",
            title="Live Robotics Workshop",
            category="Tech",
            venue=self.venue,
            start_time=now - timedelta(hours=1),
            end_time=now + timedelta(hours=1),
            organizer="Robotics Club",
            created_by_clerk_id="clerk-secret-creator-id"
        )
        self.upcoming_event = Event.objects.create(
            id="evt-upcoming-1",
            title="Future AI Symposium",
            category="Tech",
            venue=self.venue,
            start_time=now + timedelta(days=2),
            end_time=now + timedelta(days=2, hours=2),
            organizer="AI Club"
        )

    def test_anonymous_can_list_and_retrieve_venues(self):
        """Public users can list and retrieve venues without credentials."""
        res_list = self.client.get('/api/venues/')
        self.assertEqual(res_list.status_code, status.HTTP_200_OK)
        results = res_list.data.get('results', res_list.data)
        self.assertTrue(len(results) >= 1)

        res_detail = self.client.get(f'/api/venues/{self.venue.id}/')
        self.assertEqual(res_detail.status_code, status.HTTP_200_OK)
        self.assertEqual(res_detail.data['id'], 'venue-mech-m108')
        # Check navigation fields
        self.assertEqual(res_detail.data['building_name'], 'Mechanical Block')
        self.assertEqual(res_detail.data['floor_number'], 0)
        self.assertEqual(res_detail.data['room_no'], 'M108')
        self.assertTrue(res_detail.data['has_indoor_map'])

    def test_anonymous_can_list_and_retrieve_events(self):
        """Public users can list and retrieve events; sensitive fields excluded."""
        res_list = self.client.get('/api/events/')
        self.assertEqual(res_list.status_code, status.HTTP_200_OK)

        res_detail = self.client.get(f'/api/events/{self.live_event.id}/')
        self.assertEqual(res_detail.status_code, status.HTTP_200_OK)
        self.assertEqual(res_detail.data['title'], "Live Robotics Workshop")
        # Internal fields must be excluded
        self.assertNotIn('created_by_clerk_id', res_detail.data)

    def test_event_status_and_text_filtering(self):
        """Verify filtering by status (live, upcoming) and text search."""
        res_live = self.client.get('/api/events/?status=live')
        self.assertEqual(res_live.status_code, status.HTTP_200_OK)
        live_ids = [e['id'] for e in res_live.data.get('results', res_live.data)]
        self.assertIn(self.live_event.id, live_ids)
        self.assertNotIn(self.upcoming_event.id, live_ids)

        res_search = self.client.get('/api/events/?search=Robotics')
        search_ids = [e['id'] for e in res_search.data.get('results', res_search.data)]
        self.assertIn(self.live_event.id, search_ids)

    def test_pagination_and_all_bypass(self):
        """Verify standard pagination and bypass with ?all=true."""
        res_paginated = self.client.get('/api/venues/')
        self.assertIn('count', res_paginated.data)
        self.assertIn('results', res_paginated.data)

        res_all = self.client.get('/api/venues/?all=true')
        self.assertIsInstance(res_all.data, list)

    def test_anonymous_cannot_mutate_public_or_admin_endpoints(self):
        """Public routes return 405 for POST; admin routes return 401 for anonymous."""
        res_post_public = self.client.post('/api/events/', {"title": "Hacked"})
        self.assertEqual(res_post_public.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

        res_post_admin = self.client.post('/api/admin/events/', {"title": "Hacked"})
        self.assertEqual(res_post_admin.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_anonymous_rate_throttling_enforced(self):
        """Anonymous rate throttling blocks excessive queries when rate exceeded."""
        from rest_framework.throttling import AnonRateThrottle
        from django.core.cache import cache

        cache.clear()
        original_rates = dict(AnonRateThrottle.THROTTLE_RATES)
        try:
            # Set a low test limit of 2 requests per minute
            AnonRateThrottle.THROTTLE_RATES['anon'] = '2/minute'

            # First 2 requests succeed
            r1 = self.client.get('/api/venues/')
            self.assertEqual(r1.status_code, status.HTTP_200_OK)
            r2 = self.client.get('/api/venues/')
            self.assertEqual(r2.status_code, status.HTTP_200_OK)

            # 3rd request receives 429 Too Many Requests
            r3 = self.client.get('/api/venues/')
            self.assertEqual(r3.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        finally:
            AnonRateThrottle.THROTTLE_RATES = original_rates
            cache.clear()



# =====================================================================
# 4. CLERK JWT AUTHENTICATION & AUTHORIZATION TESTS
# =====================================================================

@override_settings(
    CLERK_ISSUER=TEST_ISSUER,
    CLERK_ADMIN_USER_IDS=[TEST_ADMIN_USER_ID]
)
class ClerkAuthenticationTestCase(ClerkAuthTestBase):
    def setUp(self):
        super().setUp()
        self.venue = Venue.objects.create(
            id="venue-test-auth",
            name="Auth Test Venue",
            venue_type="BUILDING",
            category="Auditorium",
            lat=8.913,
            lng=76.632,
            is_active=True
        )

    def test_missing_and_malformed_auth_headers_rejected(self):
        """Missing or malformed Authorization headers return 401."""
        # Missing header
        res = self.client.get('/api/admin/events/')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        # Non-Bearer prefix
        res_basic = self.client.get('/api/admin/events/', HTTP_AUTHORIZATION="Basic 12345")
        self.assertEqual(res_basic.status_code, status.HTTP_401_UNAUTHORIZED)

        # Malformed Bearer value
        res_bad = self.client.get('/api/admin/events/', HTTP_AUTHORIZATION="Bearer")
        self.assertEqual(res_bad.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_malformed_and_unparseable_token_rejected(self):
        """Garbage JWT token string returns 401."""
        res = self.client.get('/api/admin/events/', HTTP_AUTHORIZATION="Bearer not.a.valid.jwt")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_expired_token_rejected(self):
        """Expired JWT token returns 401."""
        headers = self.auth_headers(sub=TEST_ADMIN_USER_ID, exp_offset=-300)
        res = self.client.get('/api/admin/events/', **headers)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn("expired", str(res.data))

    def test_invalid_signature_rejected(self):
        """Token signed by untrusted foreign key returns 401."""
        headers = self.auth_headers(sub=TEST_ADMIN_USER_ID, use_foreign_key=True)
        res = self.client.get('/api/admin/events/', **headers)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_non_admin_denied_access(self):
        """Valid Clerk user not in CLERK_ADMIN_USER_IDS receives 403 Forbidden."""
        headers = self.auth_headers(sub=TEST_REGULAR_USER_ID)
        res = self.client.get('/api/admin/events/', **headers)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    @override_settings(CLERK_ADMIN_USER_IDS=[])
    def test_empty_admin_allowlist_denies_all_access(self):
        """Fail closed: if CLERK_ADMIN_USER_IDS is empty, admin access is denied."""
        headers = self.auth_headers(sub=TEST_ADMIN_USER_ID)
        res = self.client.get('/api/admin/events/', **headers)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_authorized_admin_granted_access(self):
        """Valid Clerk user present in CLERK_ADMIN_USER_IDS receives 200 OK."""
        headers = self.auth_headers(sub=TEST_ADMIN_USER_ID)
        res = self.client.get('/api/admin/events/', **headers)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_token_missing_exp_rejected(self):
        """Token missing exp claim is rejected with 401."""
        now_ts = int(time.time())
        payload = {
            "sub": TEST_ADMIN_USER_ID,
            "iss": TEST_ISSUER,
            "iat": now_ts,
            "nbf": now_ts - 5,
        }
        token = self.make_token(custom_payload=payload)
        res = self.client.get('/api/admin/events/', HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn("exp", str(res.data).lower())

    def test_token_missing_sub_rejected(self):
        """Token missing sub claim is rejected with 401."""
        now_ts = int(time.time())
        payload = {
            "iss": TEST_ISSUER,
            "exp": now_ts + 3600,
            "iat": now_ts,
            "nbf": now_ts - 5,
        }
        token = self.make_token(custom_payload=payload)
        res = self.client.get('/api/admin/events/', HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn("sub", str(res.data).lower())

    def test_token_missing_iat_rejected(self):
        """Token missing iat claim is rejected with 401."""
        now_ts = int(time.time())
        payload = {
            "sub": TEST_ADMIN_USER_ID,
            "iss": TEST_ISSUER,
            "exp": now_ts + 3600,
            "nbf": now_ts - 5,
        }
        token = self.make_token(custom_payload=payload)
        res = self.client.get('/api/admin/events/', HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn("iat", str(res.data).lower())

    def test_token_immature_rejected(self):
        """Token with future nbf beyond leeway is rejected with 401."""
        now_ts = int(time.time())
        payload = {
            "sub": TEST_ADMIN_USER_ID,
            "iss": TEST_ISSUER,
            "exp": now_ts + 3600,
            "iat": now_ts + 30,
            "nbf": now_ts + 30,
        }
        token = self.make_token(custom_payload=payload)
        res = self.client.get('/api/admin/events/', HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn("not yet valid", str(res.data).lower())

    def test_token_within_leeway_accepted(self):
        """Token expired by 5 seconds is accepted when CLERK_JWT_LEEWAY=10."""
        headers = self.auth_headers(sub=TEST_ADMIN_USER_ID, exp_offset=-5)
        res = self.client.get('/api/admin/events/', **headers)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_token_beyond_leeway_rejected(self):
        """Token expired by 15 seconds is rejected when CLERK_JWT_LEEWAY=10."""
        headers = self.auth_headers(sub=TEST_ADMIN_USER_ID, exp_offset=-15)
        res = self.client.get('/api/admin/events/', **headers)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn("expired", str(res.data).lower())



# =====================================================================
# 5. ADMIN CRUD & SERIALIZER VALIDATION TESTS
# =====================================================================

@override_settings(
    CLERK_ISSUER=TEST_ISSUER,
    CLERK_ADMIN_USER_IDS=[TEST_ADMIN_USER_ID]
)
class AdminCrudValidationTestCase(ClerkAuthTestBase):
    def setUp(self):
        super().setUp()
        self.building = Building.objects.create(
            name="Mechanical Block",
            code="MECH",
            lat=8.912886,
            lng=76.631817
        )
        self.building_chem = Building.objects.create(
            name="Chemical Block",
            code="CHEM",
            lat=8.912439,
            lng=76.631670
        )
        self.floor = Floor.objects.create(
            building=self.building,
            floor_number=0,
            name="Ground Floor",
            code="GF"
        )
        self.room = Room.objects.create(
            room_no="M108",
            name="CAD/CAM Seminar Hall",
            floor=self.floor,
            lat=8.912928,
            lng=76.631978
        )
        self.venue = Venue.objects.create(
            id="venue-mech-m108",
            name="Mechanical Block M108",
            venue_type="INDOOR_ROOM",
            category="Seminar Hall",
            room=self.room,
            building=self.building,
            lat=8.912928,
            lng=76.631978,
            has_indoor_map=True,
            is_active=True
        )

    def test_admin_create_event_valid(self):
        """Authorized admin can create event; creator Clerk ID automatically recorded."""
        now = timezone.now()
        payload = {
            "title": "Annual CAD Workshop",
            "category": "Workshop",
            "venue": self.venue.id,
            "start_time": (now + timedelta(days=1)).isoformat(),
            "end_time": (now + timedelta(days=1, hours=3)).isoformat(),
            "organizer": "CAD Cell",
            "description": "Hands on workshop"
        }
        res = self.client.post('/api/admin/events/', payload, format='json', **self.auth_headers())
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(res.data['id'].startswith('evt-'))
        self.assertEqual(res.data['created_by_clerk_id'], TEST_ADMIN_USER_ID)

    def test_event_time_range_validation_on_create(self):
        """Creating event with end_time <= start_time returns 400 Bad Request."""
        now = timezone.now()
        payload = {
            "title": "Invalid Time Event",
            "venue": self.venue.id,
            "start_time": (now + timedelta(hours=2)).isoformat(),
            "end_time": (now + timedelta(hours=1)).isoformat(),
            "organizer": "Club"
        }
        res = self.client.post('/api/admin/events/', payload, format='json', **self.auth_headers())
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("end_time", res.data)

    def test_event_partial_patch_validates_combined_timestamps(self):
        """PATCH updating only end_time to be earlier than existing start_time is rejected."""
        now = timezone.now()
        event = Event.objects.create(
            id="evt-patch-test",
            title="Patch Test Event",
            venue=self.venue,
            start_time=now + timedelta(days=1, hours=2),
            end_time=now + timedelta(days=1, hours=4),
            organizer="Club"
        )

        # PATCH end_time earlier than existing start_time
        res = self.client.patch(
            f'/api/admin/events/{event.id}/',
            {"end_time": (now + timedelta(days=1, hours=1)).isoformat()},
            format='json',
            **self.auth_headers()
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("end_time", res.data)

    def test_venue_room_building_relationship_validation(self):
        """Venue cannot specify a room from one building and a different building."""
        payload = {
            "name": "Mismatched Venue",
            "venue_type": "INDOOR_ROOM",
            "category": "Lab",
            "room": self.room.id,
            "building": self.building_chem.id,  # Mismatch! Room belongs to Mechanical Block
            "lat": 8.912,
            "lng": 76.631
        }
        res = self.client.post('/api/admin/venues/', payload, format='json', **self.auth_headers())
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("room", res.data)

    def test_deletion_protection_on_referenced_records(self):
        """Attempting to delete a venue with events returns 400 PROTECTED_RECORD."""
        now = timezone.now()
        Event.objects.create(
            id="evt-del-protect",
            title="Active Event",
            venue=self.venue,
            start_time=now + timedelta(hours=1),
            end_time=now + timedelta(hours=2),
            organizer="Club"
        )

        res = self.client.delete(f'/api/admin/venues/{self.venue.id}/', **self.auth_headers())
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res.data.get('error'), "PROTECTED_RECORD")
        # Ensure venue was NOT deleted
        self.assertTrue(Venue.objects.filter(id=self.venue.id).exists())

    def test_admin_building_floor_room_crud(self):
        """Admin can perform CRUD on Buildings, Floors, and Rooms with validation."""
        # 1. Create Building
        res_b = self.client.post('/api/admin/buildings/', {
            "name": "Electronics Block",
            "code": "ECE",
            "lat": 8.915,
            "lng": 76.633
        }, format='json', **self.auth_headers())
        self.assertEqual(res_b.status_code, status.HTTP_201_CREATED)
        b_id = res_b.data['id']

        # 2. Create Floor
        res_f = self.client.post('/api/admin/floors/', {
            "building": b_id,
            "floor_number": 0,
            "name": "Ground Floor",
            "code": "GF"
        }, format='json', **self.auth_headers())
        self.assertEqual(res_f.status_code, status.HTTP_201_CREATED)
        f_id = res_f.data['id']

        # 3. Create Room
        res_r = self.client.post('/api/admin/rooms/', {
            "room_no": "E101",
            "name": "VLSI Design Lab",
            "floor": f_id,
            "space_type": "Laboratory",
            "lat": 8.9151,
            "lng": 76.6331
        }, format='json', **self.auth_headers())
        self.assertEqual(res_r.status_code, status.HTTP_201_CREATED)

        # 4. Attempting to delete Building with active Floor triggers protected error
        res_del_b = self.client.delete(f'/api/admin/buildings/{b_id}/', **self.auth_headers())
        self.assertEqual(res_del_b.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res_del_b.data.get('error'), "PROTECTED_RECORD")
# Small review-only change: clarify that this module is part of the approved campus project work.
