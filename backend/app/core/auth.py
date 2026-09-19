"""
Stub authentication module.

DESIGN CONTRACT:
- `get_current_user()` is the ONLY function that reads auth credentials.
  When real auth (JWT/OAuth) is implemented, ONLY this function's internals change.
- `require_roles()` is a dependency factory that checks the user's role.
  Route code uses `Depends(require_roles(UserRole.SUPER_ADMIN))` — this NEVER changes.
- Routes never inspect auth headers directly — they always go through these dependencies.

STUB BEHAVIOR (current):
- Reads `X-Mock-Role` and `X-Mock-User-Id` headers from the request.
- Returns a CurrentUser with the specified role.
- Returns 401 if no valid role header is present.
"""

from enum import Enum
from fastapi import Depends, HTTPException, Request
from pydantic import BaseModel


class UserRole(str, Enum):
    """System roles — matches the spec's UserRole enum."""
    SUPER_ADMIN = "SUPER_ADMIN"
    OFFICE_EXECUTIVE = "OFFICE_EXECUTIVE"
    AGENT = "AGENT"
    CLIENT = "CLIENT"


class CurrentUser(BaseModel):
    """Represents the authenticated user for the current request."""
    id: str
    email: str
    role: UserRole


async def get_current_user(request: Request) -> CurrentUser:
    """
    Extract the current user from the request.

    STUB: Reads from X-Mock-Role / X-Mock-User-Id headers.
    REAL: Will decode a JWT or session token and look up the user in the DB.
    """
    role_header = request.headers.get("X-Mock-Role", "")
    user_id = request.headers.get("X-Mock-User-Id", "stub-user")
    email = request.headers.get("X-Mock-Email", "stub@example.com")

    if role_header not in UserRole.__members__:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated — provide X-Mock-Role header",
        )

    return CurrentUser(id=user_id, email=email, role=UserRole(role_header))


def require_roles(*allowed: UserRole):
    """
    Dependency factory — returns a FastAPI dependency that:
    1. Authenticates the user (via get_current_user)
    2. Checks that the user's role is in the allowed set
    3. Returns 403 if not

    Usage in routes:
        @router.get("/admin-only")
        async def admin_route(user: CurrentUser = Depends(require_roles(UserRole.SUPER_ADMIN))):
            ...
    """
    async def _check_role(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if user.role not in allowed:
            raise HTTPException(
                status_code=403,
                detail=f"Forbidden: requires one of {[r.value for r in allowed]}, got {user.role.value}",
            )
        return user
    return _check_role
