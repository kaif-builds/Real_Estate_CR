"""
User Management API Router.
Manages system user accounts, roles, activation states, and assignments.
READS: SUPER_ADMIN, OFFICE_EXECUTIVE
WRITES: SUPER_ADMIN only
"""

import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, UserRole, require_roles
from app.core.database import get_db
from app.models.activity_log import ActivityLog
from app.models.audit_log import AuditLog
from app.models.call import Call
from app.models.call_recording import CallRecording
from app.models.campaign import Campaign
from app.models.enums import UserRole as ModelUserRole
from app.models.field_agent import FieldAgent
from app.models.follow_up import FollowUp
from app.models.lead import Lead
from app.models.opportunity import Opportunity
from app.models.party import Party
from app.models.requirement import Requirement
from app.models.task import Task
from app.models.transaction import Transaction
from app.models.user import User
from app.models.visit import Visit
from app.schemas import (
    VALID_USER_ROLES,
    VALID_USER_STATUSES,
    UserCreate,
    UserResponse,
    UserUpdate,
)

router = APIRouter(prefix="/users", tags=["users"])

_READ_ROLES = (UserRole.SUPER_ADMIN, UserRole.OFFICE_EXECUTIVE)
_WRITE_ROLES = (UserRole.SUPER_ADMIN,)


def _iso(dt: Any) -> str | None:
    if dt is None:
        return None
    if isinstance(dt, datetime):
        return dt.isoformat()
    return str(dt)


def _enum_val(v: Any) -> str:
    if v is None:
        return ""
    if hasattr(v, "value"):
        return str(v.value)
    return str(v)


def _user_dict(u: User) -> dict:
    return {
        "id": u.id,
        "name": u.name,
        "email": u.email,
        "role": _enum_val(u.role),
        "status": u.status,
        "party_id": u.party_id,
        "last_login": _iso(u.last_login),
        "created_at": _iso(u.created_at),
        "updated_at": _iso(u.updated_at),
    }


async def _is_last_active_super_admin(db: AsyncSession, user_id: str) -> bool:
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user:
        return False
    user_role_str = user.role.value if hasattr(user.role, "value") else str(user.role)
    if user_role_str != "SUPER_ADMIN" or user.status != "Active":
        return False

    cnt = (
        await db.execute(
            select(func.count(User.id)).where(
                User.role == ModelUserRole.SUPER_ADMIN,
                User.status == "Active",
            )
        )
    ).scalar() or 0
    return cnt <= 1


async def _check_user_references(db: AsyncSession, user_id: str) -> list[str]:
    checks = [
        (Lead, Lead.assigned_to_id, "lead", "leads"),
        (Requirement, Requirement.assigned_to_id, "requirement", "requirements"),
        (Visit, Visit.agent_id, "visit", "visits"),
        (Task, Task.assigned_to_id, "task", "tasks"),
        (Opportunity, Opportunity.agent_id, "opportunity", "opportunities"),
        (Transaction, Transaction.staff_id, "transaction", "transactions"),
        (FollowUp, FollowUp.responsible_id, "follow-up", "follow-ups"),
        (Campaign, Campaign.owner_id, "campaign", "campaigns"),
        (FieldAgent, FieldAgent.user_id, "field agent profile", "field agent profiles"),
        (Call, Call.caller_id, "call log", "call logs"),
        (CallRecording, CallRecording.uploaded_by_id, "call recording", "call recordings"),
        (AuditLog, AuditLog.user_id, "audit log", "audit logs"),
    ]
    refs = []
    for model, col, sing, plur in checks:
        cnt = (
            await db.execute(
                select(func.count()).select_from(model).where(col == user_id)
            )
        ).scalar() or 0
        if cnt > 0:
            refs.append(f"{cnt} {sing if cnt == 1 else plur}")
    return refs


# ── List users ────────────────────────────────────────────────────────────────

@router.get("")
async def list_users(
    role: str | None = None,
    status: str | None = None,
    active: bool | None = None,
    search: str | None = None,
    limit: int = Query(default=50, le=200),
    offset: int = 0,
    user: CurrentUser = Depends(require_roles(*_READ_ROLES)),
    db: AsyncSession = Depends(get_db),
):
    conds = []
    if role:
        clean_role = role.strip().upper()
        if clean_role not in VALID_USER_ROLES:
            raise HTTPException(
                status_code=422,
                detail=f"Invalid role '{role}'. Valid roles: {sorted(VALID_USER_ROLES)}",
            )
        conds.append(User.role == ModelUserRole(clean_role))

    if status:
        clean_status = status.strip().capitalize()
        if clean_status not in VALID_USER_STATUSES:
            raise HTTPException(
                status_code=422,
                detail=f"Invalid status '{status}'. Valid statuses: {sorted(VALID_USER_STATUSES)}",
            )
        conds.append(User.status == clean_status)

    if active is not None:
        if active:
            conds.append(User.status == "Active")
        else:
            conds.append(User.status != "Active")

    if search and search.strip():
        q_term = search.strip()
        conds.append(
            or_(
                User.name.ilike(f"%{q_term}%"),
                User.email.ilike(f"%{q_term}%"),
            )
        )

    q = select(User)
    count_q = select(func.count(User.id))
    if conds:
        q = q.where(and_(*conds))
        count_q = count_q.where(and_(*conds))

    total = (await db.execute(count_q)).scalar() or 0
    rows = await db.execute(q.order_by(User.name.asc()).limit(limit).offset(offset))
    items = [_user_dict(u) for (u,) in rows]
    return {"items": items, "total": total}


# ── Get single user ───────────────────────────────────────────────────────────

@router.get("/{user_id}")
async def get_user(
    user_id: str,
    user: CurrentUser = Depends(require_roles(*_READ_ROLES)),
    db: AsyncSession = Depends(get_db),
):
    target = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail=f"User '{user_id}' not found")
    return _user_dict(target)


# ── Create user ───────────────────────────────────────────────────────────────

@router.post("", status_code=201)
async def create_user(
    body: UserCreate,
    user: CurrentUser = Depends(require_roles(*_WRITE_ROLES)),
    db: AsyncSession = Depends(get_db),
):
    existing = (
        await db.execute(
            select(User).where(func.lower(User.email) == body.email.lower())
        )
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"A user with email '{body.email}' already exists",
        )

    if body.party_id:
        party = (await db.execute(select(Party).where(Party.id == body.party_id))).scalar_one_or_none()
        if not party:
            raise HTTPException(status_code=404, detail=f"Party '{body.party_id}' not found")

    now = datetime.now(timezone.utc)
    new_user = User(
        id=f"u-{uuid.uuid4().hex[:6]}",
        name=body.name,
        email=body.email,
        role=ModelUserRole(body.role),
        status=body.status or "Active",
        party_id=body.party_id,
        password_hash="",
        created_at=now,
        updated_at=now,
    )
    db.add(new_user)
    await db.flush()

    res = _user_dict(new_user)
    res["message"] = "User created successfully"
    return res


# ── Patch user ────────────────────────────────────────────────────────────────

@router.patch("/{user_id}")
async def patch_user(
    user_id: str,
    body: UserUpdate,
    user: CurrentUser = Depends(require_roles(*_WRITE_ROLES)),
    db: AsyncSession = Depends(get_db),
):
    target = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail=f"User '{user_id}' not found")

    updates = body.model_dump(exclude_unset=True)

    # Protect last active Super Admin from deactivation or demotion
    if await _is_last_active_super_admin(db, user_id):
        if "status" in updates and updates["status"] != "Active":
            raise HTTPException(
                status_code=409,
                detail="Cannot deactivate the last active Super Admin account. Maintain at least one active Super Admin.",
            )
        if "role" in updates and updates["role"] != "SUPER_ADMIN":
            raise HTTPException(
                status_code=409,
                detail="Cannot demote the last active Super Admin account. Maintain at least one active Super Admin.",
            )

    # Check duplicate email
    if "email" in updates and updates["email"]:
        new_email = updates["email"]
        existing = (
            await db.execute(
                select(User).where(
                    func.lower(User.email) == new_email.lower(),
                    User.id != user_id,
                )
            )
        ).scalar_one_or_none()
        if existing:
            raise HTTPException(
                status_code=409,
                detail=f"A user with email '{new_email}' already exists",
            )
        target.email = new_email

    if "name" in updates and updates["name"]:
        target.name = updates["name"]

    if "role" in updates and updates["role"]:
        target.role = ModelUserRole(updates["role"])

    if "status" in updates and updates["status"]:
        target.status = updates["status"]

    if "party_id" in updates:
        if updates["party_id"]:
            party = (await db.execute(select(Party).where(Party.id == updates["party_id"]))).scalar_one_or_none()
            if not party:
                raise HTTPException(status_code=404, detail=f"Party '{updates['party_id']}' not found")
            target.party_id = party.id
        else:
            target.party_id = None

    target.updated_at = datetime.now(timezone.utc)
    await db.flush()

    res = _user_dict(target)
    res["message"] = "User updated successfully"
    return res


# ── Delete user ───────────────────────────────────────────────────────────────

@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    user: CurrentUser = Depends(require_roles(*_WRITE_ROLES)),
    db: AsyncSession = Depends(get_db),
):
    target = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail=f"User '{user_id}' not found")

    # Protect last active Super Admin
    if await _is_last_active_super_admin(db, user_id):
        raise HTTPException(
            status_code=409,
            detail="Cannot delete the last active Super Admin account. Maintain at least one active Super Admin.",
        )

    # Delete guard: check all 12 referencing tables
    refs = await _check_user_references(db, user_id)
    if refs:
        raise HTTPException(
            status_code=409,
            detail=f"Cannot delete user '{target.name}': referenced by {', '.join(refs)}. Please deactivate the user instead of deleting.",
        )

    await db.delete(target)
    await db.flush()
    return {"message": f"User '{target.name}' deleted successfully", "id": user_id}
