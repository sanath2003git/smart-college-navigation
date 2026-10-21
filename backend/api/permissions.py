from rest_framework import permissions


class IsClerkAdmin(permissions.BasePermission):
    """
    Permission class that grants access only to authenticated Clerk users
    who are present in the server's CLERK_ADMIN_USER_IDS allowlist.
    """
    message = "Administrator privileges are required to perform this action."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return bool(getattr(request.user, 'is_admin', False))

# Defines access permissions for campus API resources.