"""
Seed script to import all 50 Party records from frontend/src/lib/mockData.ts
into the real Supabase database.

Usage:
    cd backend
    .venv/bin/python seed_parties.py

Safe to run multiple times: performs idempotent upserts on party ID (p1..p50).
"""

import asyncio
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import select, func
from app.core.database import async_session_factory
from app.models.party import Party


def parse_mock_parties() -> list[dict]:
    """Parse the 50 MOCK_PARTIES entries from frontend/src/lib/mockData.ts."""
    mock_data_path = Path(__file__).resolve().parent.parent / "frontend" / "src" / "lib" / "mockData.ts"
    if not mock_data_path.exists():
        raise FileNotFoundError(f"Cannot find mockData.ts at {mock_data_path}")

    text = mock_data_path.read_text(encoding="utf-8")
    start = text.find("export const MOCK_PARTIES: PartyRow[] = [")
    end = text.find("// ── Lead Sources", start)
    if start == -1 or end == -1:
        raise ValueError("Could not locate MOCK_PARTIES block in mockData.ts")

    snippet = text[start:end]
    raw_objects = re.findall(r"\{[^{}]+\}", snippet)

    parties = []
    for obj in raw_objects:
        p: dict = {}
        # Parse scalar string/null fields
        for field in ["id", "name", "email", "mobile", "city", "status", "source", "updated_at"]:
            m = re.search(r"\b" + field + r":\s*(null|[\x27\x22]([^\x27\x22]*)[\x27\x22])", obj)
            if m:
                p[field] = None if m.group(1) == "null" else m.group(2)
            else:
                p[field] = None

        # Parse numeric counts
        for field in ["leads_count", "requirements_count", "opportunities_count"]:
            m = re.search(r"\b" + field + r":\s*(\d+)", obj)
            p[field] = int(m.group(1)) if m else 0

        # Parse roles array
        m_roles = re.search(r"roles:\s*\[(.*?)\]", obj)
        if m_roles:
            p["roles"] = [r.strip(" \x27\x22") for r in m_roles.group(1).split(",") if r.strip(" \x27\x22")]
        else:
            p["roles"] = []

        if p.get("id"):
            parties.append(p)

    return parties


async def seed_parties():
    mock_parties = parse_mock_parties()
    print(f"📦 Parsed {len(mock_parties)} parties from mockData.ts (p1..p{len(mock_parties)})")

    async with async_session_factory() as session:
        # Check existing count
        before_count = (await session.execute(select(func.count(Party.id)))).scalar_one()
        print(f"📊 Current parties count in database: {before_count}")

        inserted = 0
        updated = 0

        for p_data in mock_parties:
            pid = p_data["id"]
            existing = (await session.execute(select(Party).where(Party.id == pid))).scalar_one_or_none()

            updated_dt = None
            if p_data.get("updated_at"):
                try:
                    updated_dt = datetime.fromisoformat(p_data["updated_at"].replace("Z", "+00:00"))
                except Exception:
                    updated_dt = datetime.now(timezone.utc)

            if existing:
                existing.name = p_data["name"]
                existing.email = p_data["email"]
                existing.mobile = p_data["mobile"]
                existing.city = p_data["city"]
                existing.roles = p_data["roles"]
                existing.status = p_data["status"] or "Active"
                existing.source = p_data["source"]
                existing.leads_count = p_data["leads_count"]
                existing.requirements_count = p_data["requirements_count"]
                existing.opportunities_count = p_data["opportunities_count"]
                existing.updated_at = updated_dt
                updated += 1
            else:
                party = Party(
                    id=pid,
                    name=p_data["name"],
                    email=p_data["email"],
                    mobile=p_data["mobile"],
                    city=p_data["city"],
                    roles=p_data["roles"],
                    status=p_data["status"] or "Active",
                    source=p_data["source"],
                    leads_count=p_data["leads_count"],
                    requirements_count=p_data["requirements_count"],
                    opportunities_count=p_data["opportunities_count"],
                    updated_at=updated_dt,
                    created_at=updated_dt or datetime.now(timezone.utc),
                )
                session.add(party)
                inserted += 1

        await session.commit()

        after_count = (await session.execute(select(func.count(Party.id)))).scalar_one()
        print(f"✅ Seeding complete!")
        print(f"   - Newly inserted: {inserted}")
        print(f"   - Updated:        {updated}")
        print(f"   - Total in DB:    {after_count}")


if __name__ == "__main__":
    asyncio.run(seed_parties())
