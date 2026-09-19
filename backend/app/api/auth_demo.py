"""
Demo routes to prove the stub auth + role-check pattern works.
These routes exist purely for Step 1 verification — they can be removed later.
"""

from fastapi import APIRouter, Depends

from app.core.auth import CurrentUser, UserRole, get_current_user, require_roles

router = APIRouter(prefix="/auth", tags=["auth-demo"])


@router.get("/me")
async def get_me(user: CurrentUser = Depends(get_current_user)):
    """
    Protected route — any authenticated user can access.
    Returns the current user's info.

    Test:
      curl -H 'X-Mock-Role: AGENT' http://localhost:8000/api/auth/me
      → 200 {"id": "stub-user", "email": "stub@example.com", "role": "AGENT"}

      curl http://localhost:8000/api/auth/me
      → 401
    """
    return {
        "id": user.id,
        "email": user.email,
        "role": user.role.value,
        "message": "Authenticated successfully (stub auth)",
    }


@router.get("/admin-only")
async def admin_only(
    user: CurrentUser = Depends(require_roles(UserRole.SUPER_ADMIN)),
):
    """
    Role-restricted route — only SUPER_ADMIN can access.

    Test:
      curl -H 'X-Mock-Role: SUPER_ADMIN' http://localhost:8000/api/auth/admin-only
      → 200

      curl -H 'X-Mock-Role: AGENT' http://localhost:8000/api/auth/admin-only
      → 403
    """
    return {
        "message": "Welcome, admin!",
        "user": user.model_dump(),
        "secret_data": "This is only visible to Super Admins.",
    }
