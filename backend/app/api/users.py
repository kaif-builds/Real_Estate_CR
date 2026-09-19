"""
Users list — lightweight endpoint for assignment dropdowns in forms.
Returns all active users. Accessible to SA and OE.
"""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, UserRole, require_roles
from app.core.database import get_db
from app.models.user import User

router = APIRouter(prefix="/users", tags=["users"])


@router.get("")
async def list_users(
    user: CurrentUser = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.OFFICE_EXECUTIVE)),
    db: AsyncSession = Depends(get_db),
):
    """All active users — used for 'Assigned To' dropdowns in lead/task forms."""
    rows = await db.execute(
        select(User)
        .where(User.status == "Active")
        .order_by(User.name.asc())
    )
    return {
        "items": [
            {"id": u.id, "name": u.name, "email": u.email, "role": u.role}
            for (u,) in rows
        ]
    }
