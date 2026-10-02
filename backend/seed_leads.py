# DEMO DATA ONLY. Must be removed (run --remove) before client handoff.
"""
Seed script for LEADS module.
Reads demo leads from frontend/src/lib/mockData.ts (MOCK_LEADS).

Usage:
    cd backend
    .venv/bin/python seed_leads.py --seed       # Inserts demo leads
    .venv/bin/python seed_leads.py --remove     # Removes demo leads (safe guard if linked records exist)
"""

import argparse
import asyncio
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import select, func
from app.core.database import async_session_factory
from app.models.lead import Lead
from app.models.party import Party
from app.models.opportunity import Opportunity
from app.models.follow_up import FollowUp
from app.models.transaction import Transaction
from app.models.telemarketing_contact import TelemarketingContact
from app.models.enums import LeadType, LeadStatus, LeadPriority, ChannelType, FollowUpEntityType


def _parse_dt(v: str | None) -> datetime | None:
    """Parse ISO date string into timezone-aware datetime."""
    if not v:
        return None
    try:
        dt = datetime.fromisoformat(v.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception:
        return None


def parse_mock_leads() -> list[dict]:
    """Parse the MOCK_LEADS array from frontend/src/lib/mockData.ts."""
    mock_data_path = Path(__file__).resolve().parent.parent / "frontend" / "src" / "lib" / "mockData.ts"
    if not mock_data_path.exists():
        raise FileNotFoundError(f"Cannot find mockData.ts at {mock_data_path}")

    text = mock_data_path.read_text(encoding="utf-8")
    start = text.find("export const MOCK_LEADS: LeadRow[] = [")
    end = text.find("// ── Party details", start)
    if start == -1 or end == -1:
        raise ValueError("Could not locate MOCK_LEADS block in mockData.ts")

    snippet = text[start:end]
    raw_objects = re.findall(r"\{[^{}]+\}", snippet)

    leads = []
    string_fields = [
        "id", "party_id", "party_name", "channel_type", "source", "lead_type",
        "status", "priority", "assigned_to_id", "assigned_to_name", "remarks",
        "last_activity_at", "next_follow_up_at", "created_at", "campaign_id",
        "campaign_name", "referral_code", "ad_reference", "enquiry_at",
        "referral_partner_id", "referral_partner_name"
    ]

    for obj in raw_objects:
        item = {}
        for field in string_fields:
            m = re.search(r"\b" + field + r":\s*(null|[\x27\x22]([^\x27\x22]*)[\x27\x22])", obj)
            if m:
                item[field] = None if m.group(1) == "null" else m.group(2)
            else:
                item[field] = None

        m_val = re.search(r"\bvalue:\s*(null|[\d\.]+)", obj)
        if m_val:
            item["value"] = None if m_val.group(1) == "null" else float(m_val.group(1))
        else:
            item["value"] = None

        if item.get("id"):
            leads.append(item)

    return leads


async def seed_leads():
    """Insert demo leads into database, preserving IDs and looking up party names."""
    mock_leads = parse_mock_leads()
    print(f"📦 Parsed {len(mock_leads)} leads from mockData.ts")

    async with async_session_factory() as session:
        # 1. Fetch all existing parties from database to validate FKs and resolve party names
        parties_res = await session.execute(select(Party.id, Party.name))
        party_map = {p_id: p_name for p_id, p_name in parties_res.all()}
        print(f"📊 Found {len(party_map)} existing parties in database")

        # 2. Check existing count of leads in DB
        initial_lead_count = (await session.execute(select(func.count(Lead.id)))).scalar_one()
        print(f"📊 Current leads count in database: {initial_lead_count}")

        inserted = 0
        skipped_existing = 0
        skipped_missing_party = []
        failed = 0

        for lead_data in mock_leads:
            lead_id = lead_data["id"]
            party_id = lead_data.get("party_id")

            # Check if lead already exists
            existing = (await session.execute(select(Lead).where(Lead.id == lead_id))).scalar_one_or_none()
            if existing:
                skipped_existing += 1
                continue

            # Check if party exists in real parties table
            if not party_id or party_id not in party_map:
                skipped_missing_party.append((lead_id, party_id))
                continue

            try:
                # Real party_name resolved from database lookup
                party_name = party_map[party_id]

                # Parse dates
                created_at = _parse_dt(lead_data.get("created_at")) or datetime.now(timezone.utc)
                last_activity_at = _parse_dt(lead_data.get("last_activity_at")) or created_at
                next_follow_up_at = _parse_dt(lead_data.get("next_follow_up_at"))
                enquiry_at = _parse_dt(lead_data.get("enquiry_at")) or created_at

                # Enum conversions
                lead_type = LeadType(lead_data["lead_type"])

                # Handle status: CONVERTED in mock data maps to WON in Postgres enum
                raw_status = lead_data.get("status", "NEW")
                if raw_status == "CONVERTED":
                    status = LeadStatus.WON
                else:
                    status = LeadStatus(raw_status)

                priority = LeadPriority(lead_data.get("priority", "MEDIUM"))

                raw_channel = lead_data.get("channel_type")
                channel_type = ChannelType(raw_channel) if raw_channel else None

                # Rule: set assigned_to, campaign, referral_partner fields to None
                new_lead = Lead(
                    id=lead_id,
                    party_id=party_id,
                    party_name=party_name,
                    channel_type=channel_type,
                    source=lead_data.get("source"),
                    lead_type=lead_type,
                    status=status,
                    priority=priority,
                    assigned_to_id=None,
                    assigned_to_name=None,
                    value=lead_data.get("value"),
                    remarks=lead_data.get("remarks"),
                    last_activity_at=last_activity_at,
                    next_follow_up_at=next_follow_up_at,
                    created_at=created_at,
                    campaign_id=None,
                    campaign_name=None,
                    referral_code=lead_data.get("referral_code"),
                    ad_reference=lead_data.get("ad_reference"),
                    enquiry_at=enquiry_at,
                    referral_partner_id=None,
                    referral_partner_name=None,
                )
                session.add(new_lead)
                inserted += 1

            except Exception as e:
                print(f"❌ Error inserting lead {lead_id}: {e}")
                failed += 1

        await session.commit()

        final_count = (await session.execute(select(func.count(Lead.id)))).scalar_one()

        print("\n" + "=" * 50)
        print("🌱 SEED SUMMARY:")
        print(f"  • Inserted:               {inserted}")
        print(f"  • Skipped (already existed): {skipped_existing}")
        print(f"  • Skipped (missing party):   {len(skipped_missing_party)}")
        if skipped_missing_party:
            for lid, pid in skipped_missing_party:
                print(f"      - {lid} (party '{pid}' not found)")
        print(f"  • Failed:                 {failed}")
        print(f"  • Final leads in database: {final_count}")
        print("=" * 50)


async def remove_leads():
    """Remove ONLY the demo leads whose IDs appear in mockData.ts, respecting linked records."""
    mock_leads = parse_mock_leads()
    mock_lead_ids = [l["id"] for l in mock_leads]
    print(f"🔍 Checking {len(mock_lead_ids)} demo lead IDs for removal...")

    async with async_session_factory() as session:
        initial_lead_count = (await session.execute(select(func.count(Lead.id)))).scalar_one()
        print(f"📊 Current leads count in database: {initial_lead_count}")

        removed = 0
        skipped_linked = []
        not_found = 0

        for lead_id in mock_lead_ids:
            lead = (await session.execute(select(Lead).where(Lead.id == lead_id))).scalar_one_or_none()
            if not lead:
                not_found += 1
                continue

            # Check linked records (opportunities, follow_ups, transactions, telemarketing_contacts)
            checks = [
                (Opportunity, Opportunity.originating_lead_id == lead_id, "opportunities"),
                (
                    FollowUp,
                    (FollowUp.entity_type == FollowUpEntityType.LEAD) & (FollowUp.entity_id == lead_id),
                    "follow-ups",
                ),
                (Transaction, Transaction.originating_lead_id == lead_id, "transactions"),
                (
                    TelemarketingContact,
                    TelemarketingContact.converted_lead_id == lead_id,
                    "telemarketing contacts",
                ),
            ]

            linked_details = []
            for model, condition, label in checks:
                cnt = (await session.execute(select(func.count()).select_from(model).where(condition))).scalar_one()
                if cnt > 0:
                    linked_details.append(f"{cnt} {label}")

            if linked_details:
                skipped_linked.append((lead_id, ", ".join(linked_details)))
                continue

            await session.delete(lead)
            removed += 1

        await session.commit()

        final_count = (await session.execute(select(func.count(Lead.id)))).scalar_one()

        print("\n" + "=" * 50)
        print("🧹 REMOVAL SUMMARY:")
        print(f"  • Removed:                {removed}")
        print(f"  • Skipped (linked records): {len(skipped_linked)}")
        if skipped_linked:
            for lid, detail in skipped_linked:
                print(f"      - {lid}: linked with {detail}")
        print(f"  • Not found (already gone): {not_found}")
        print(f"  • Final leads in database: {final_count}")
        print("=" * 50)


def main():
    parser = argparse.ArgumentParser(description="Seed or remove demo leads in database.")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--seed", action="store_true", help="Insert demo leads from mockData.ts")
    group.add_argument("--remove", action="store_true", help="Remove demo leads from mockData.ts")

    args = parser.parse_args()

    if args.seed:
        asyncio.run(seed_leads())
    elif args.remove:
        asyncio.run(remove_leads())


if __name__ == "__main__":
    main()
