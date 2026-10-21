import logging
import jwt
from django.conf import settings
from rest_framework import authentication, exceptions

logger = logging.getLogger(__name__)


class ClerkUser:
    """
    Lightweight identity representation for verified Clerk users.
    Contains verified user ID, token claims, and administrator privilege status.
    Does not require local database user synchronization.
    """
    def __init__(self, clerk_id: str, claims: dict = None, is_admin: bool = False):
        self.clerk_id = clerk_id
        self.id = clerk_id
        self.claims = claims or {}
        self.is_admin = is_admin

    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False

    def __str__(self):
        return f"ClerkUser(id={self.clerk_id}, is_admin={self.is_admin})"

    def __repr__(self):
        return self.__str__()


class ClerkAuthentication(authentication.BaseAuthentication):
    """
    Django REST Framework authentication class verifying Clerk-issued RS256 Bearer JWTs.

    Security design:
    - Verifies token signature using public keys fetched from Clerk JWKS.
    - Caches signing keys with automatic rotation handling via PyJWKClient.
    - Validates algorithm (strictly RS256), issuer, expiration (exp), and subject (sub).
    - Checks subject against server-controlled CLERK_ADMIN_USER_IDS allowlist.
    - Fails closed if CLERK_JWKS_URL is missing or key cannot be verified.
    - Never logs bearer tokens or secrets.
    """

    _jwks_client_instance = None

    @classmethod
    def get_jwks_client(cls, jwks_url: str):
        if cls._jwks_client_instance is None or cls._jwks_client_instance.uri != jwks_url:
            cls._jwks_client_instance = jwt.PyJWKClient(
                uri=jwks_url,
                cache_jwk_set=True,
                lifespan=3600  # 1 hour cache lifespan
            )
        return cls._jwks_client_instance

    @classmethod
    def set_jwks_client(cls, client):
        """Allows test suites to inject mock JWK clients."""
        cls._jwks_client_instance = client

    def authenticate_header(self, request):
        """Returns WWW-Authenticate challenge header value for HTTP 401 responses."""
        return 'Bearer realm="api"'

    def authenticate(self, request):

        auth_header = request.headers.get('Authorization') or request.META.get('HTTP_AUTHORIZATION')
        if not auth_header:
            return None  # Unauthenticated request (pass to permission check)

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            raise exceptions.AuthenticationFailed(
                "Invalid Authorization header format. Expected 'Bearer <token>'."
            )

        raw_token = parts[1]
        clerk_user, payload = self.verify_token(raw_token)
        return (clerk_user, payload)

    def verify_token(self, token: str):
        jwks_url = getattr(settings, 'CLERK_JWKS_URL', '').strip()
        issuer = getattr(settings, 'CLERK_ISSUER', '').strip()
        admin_user_ids = getattr(settings, 'CLERK_ADMIN_USER_IDS', [])

        if not jwks_url and self._jwks_client_instance is None:
            logger.error("Clerk authentication failed: CLERK_JWKS_URL is not configured.")
            raise exceptions.AuthenticationFailed(
                "Clerk authentication is not configured on the server. Please configure CLERK_JWKS_URL."
            )

        try:
            client = self._jwks_client_instance or self.get_jwks_client(jwks_url)
            signing_key = client.get_signing_key_from_jwt(token)
        except jwt.exceptions.PyJWKClientError as e:
            logger.warning("Clerk JWKS key lookup failed: %s", str(e))
            raise exceptions.AuthenticationFailed(
                "Invalid token: unable to obtain signing key from authentication provider."
            )
        except Exception as e:
            logger.warning("Token parsing or key resolution failed: %s", str(e))
            raise exceptions.AuthenticationFailed("Malformed or unparseable token.")

        decode_options = {
            "verify_signature": True,
            "verify_exp": True,
            "verify_nbf": True,
            "verify_iat": True,
            "verify_iss": bool(issuer),
            "require": ["exp", "sub", "iat"],
        }

        leeway = int(getattr(settings, 'CLERK_JWT_LEEWAY', 10))
        decode_kwargs = {
            "algorithms": ["RS256"],
            "options": decode_options,
            "leeway": leeway,
        }
        if issuer:
            decode_kwargs["issuer"] = issuer

        try:
            payload = jwt.decode(
                token,
                signing_key.key,
                **decode_kwargs
            )
        except jwt.ExpiredSignatureError:
            logger.warning("Clerk JWT rejected: Token has expired.")
            raise exceptions.AuthenticationFailed("Token has expired.")
        except jwt.ImmatureSignatureError:
            logger.warning("Clerk JWT rejected: Token is not yet valid (nbf/iat in future).")
            raise exceptions.AuthenticationFailed("Token is not yet valid.")
        except jwt.MissingRequiredClaimError as e:
            claim_name = getattr(e, 'claim', str(e))
            logger.warning("Clerk JWT rejected: Missing required claim: %s", claim_name)
            raise exceptions.AuthenticationFailed(f"Token is missing required claim: {claim_name}.")
        except jwt.InvalidIssuerError:
            logger.warning("Clerk JWT rejected: Token issuer is invalid.")
            raise exceptions.AuthenticationFailed("Token issuer is invalid.")
        except jwt.InvalidAlgorithmError:
            logger.warning("Clerk JWT rejected: Invalid signing algorithm.")
            raise exceptions.AuthenticationFailed("Invalid signing algorithm. Only RS256 is supported.")
        except jwt.InvalidSignatureError:
            logger.warning("Clerk JWT rejected: Token signature verification failed.")
            raise exceptions.AuthenticationFailed("Token signature verification failed.")
        except jwt.DecodeError:
            logger.warning("Clerk JWT rejected: Token is malformed or unparseable.")
            raise exceptions.AuthenticationFailed("Token is malformed.")
        except jwt.PyJWTError as e:
            logger.warning("Clerk JWT verification error: %s", str(e))
            raise exceptions.AuthenticationFailed("Token verification failed.")


        clerk_id = payload.get("sub")
        if not clerk_id or not isinstance(clerk_id, str):
            raise exceptions.AuthenticationFailed("Token missing valid subject (sub) claim.")

        # Server-controlled admin allowlist verification
        is_admin = bool(admin_user_ids and clerk_id in admin_user_ids)

        return ClerkUser(clerk_id=clerk_id, claims=payload, is_admin=is_admin), payload

# Handles authentication for campus API requests.