"""
DEV-ONLY seed script — loads all mock data from TECHNICAL_SPEC.md §3.3.

═══════════════════════════════════════════════════════════════
  ⚠  THIS SCRIPT IS FOR LOCAL DEVELOPMENT ONLY.
     It must NEVER run automatically (not in migrations,
     not in app startup, not in any deployment pipeline).
     Run it explicitly when you want test data:

       cd backend
       python seed_dev.py

  The production database ships with only the bootstrap
  Super Admin account. Run seed_bootstrap.py for that.
═══════════════════════════════════════════════════════════════

Data inserted matches the mock data from the original CRM project
(src/lib/mockData.ts) exactly, so all spec examples and business
logic tests work against real database rows.
"""

import asyncio
import sys
from datetime import datetime, timezone, timedelta

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

# ── datetime helpers ──────────────────────────────────────────────────────────

def now() -> datetime:
    return datetime.now(timezone.utc)

def days_ago(n: int) -> datetime:
    return now() - timedelta(days=n)

def hours_ago(n: int) -> datetime:
    return now() - timedelta(hours=n)

def days_from_now(n: int) -> datetime:
    return now() + timedelta(days=n)


# ── seed data (matches mockData.ts exactly) ───────────────────────────────────

USERS = [
    {"id": "u1", "name": "Aman Desai",    "email": "aman@propdesk.in",   "role": "SUPER_ADMIN",       "status": "Active", "party_id": None},
    {"id": "u2", "name": "Neha Kapoor",   "email": "neha@propdesk.in",   "role": "OFFICE_EXECUTIVE",  "status": "Active", "party_id": None},
    {"id": "u3", "name": "Ravi Mehta",    "email": "ravi@propdesk.in",   "role": "AGENT",             "status": "Active", "party_id": None},
    {"id": "u4", "name": "Vikram Singh",  "email": "vikram@propdesk.in", "role": "CLIENT",            "status": "Active", "party_id": "p4"},
    {"id": "u5", "name": "Priya Sharma",  "email": "priya@propdesk.in",  "role": "AGENT",             "status": "Active", "party_id": None},
    {"id": "u6", "name": "Karan Joshi",   "email": "karan@propdesk.in",  "role": "AGENT",             "status": "Inactive", "party_id": None},
]

PARTIES = [
    {"id": "p1", "name": "Ramesh Patel",    "mobile": "+91 9876543210", "email": "ramesh@example.com", "city": "Indore",  "roles": ["OWNER", "SELLER"]},
    {"id": "p2", "name": "Sunita Gupta",    "mobile": "+91 9876543211", "email": "sunita@example.com", "city": "Bhopal",  "roles": ["OWNER"]},
    {"id": "p3", "name": "Vikram Singh",    "mobile": "+91 9876543212", "email": "vikram@example.com", "city": "Indore",  "roles": ["BUYER", "TENANT"]},
    {"id": "p4", "name": "Amit Jain",       "mobile": "+91 9876543213", "email": "amit@example.com",   "city": "Indore",  "roles": ["BUYER", "CLIENT"]},
    {"id": "p5", "name": "Kavita Sharma",   "mobile": "+91 9876543214", "email": "kavita@example.com", "city": "Pune",    "roles": ["LANDLORD"]},
    {"id": "p6", "name": "Rahul Verma",     "mobile": "+91 9876543215", "email": "rahul@example.com",  "city": "Indore",  "roles": ["BUYER", "TENANT"]},
    {"id": "p7", "name": "Deepak Broker",   "mobile": "+91 9876543216", "email": "deepak@example.com", "city": "Ujjain",  "roles": ["BROKER"]},
    {"id": "p8", "name": "Meena Builder",   "mobile": "+91 9876543217", "email": "meena@example.com",  "city": "Indore",  "roles": ["BUILDER"]},
]

PROPERTIES = [
    {"id": "P-1001", "category": "RENTAL_RESIDENTIAL", "short_loc": "01-Schm140_Mayank",   "price": 15000,    "status": "AVAILABLE",         "owner_id": "p1", "last_verified_at": days_ago(1),  "expected_lat": 22.7196, "expected_lng": 75.8577},
    {"id": "P-1002", "category": "BUY_SELL_FLAT",      "short_loc": "02-Bengali_Kanadia",   "price": 4500000,  "status": "ACTIVE",            "owner_id": "p2", "last_verified_at": days_ago(2),  "expected_lat": None,    "expected_lng": None},
    {"id": "P-1003", "category": "RENTAL_COMMERCIAL",  "short_loc": "03-Vijay_Nagar",       "price": 45000,    "status": "AVAILABLE",         "owner_id": "p1", "last_verified_at": days_ago(1),  "expected_lat": None,    "expected_lng": None},
    {"id": "P-1004", "category": "BUY_SELL_COMMERCIAL","short_loc": "04-Palasia_Square",    "price": 12000000, "status": "UNDER_NEGOTIATION", "owner_id": "p5", "last_verified_at": days_ago(3),  "expected_lat": None,    "expected_lng": None},
    {"id": "P-1005", "category": "PLOT",               "short_loc": "05-Bhawarkuan_Main",   "price": 2200000,  "status": "AVAILABLE",         "owner_id": "p8", "last_verified_at": days_ago(4),  "expected_lat": None,    "expected_lng": None},
    {"id": "P-1006", "category": "BUY_SELL_FLAT",      "short_loc": "06-Nipania_Bypass",    "price": 5800000,  "status": "ACTIVE",            "owner_id": "p2", "last_verified_at": days_ago(2),  "expected_lat": None,    "expected_lng": None},
    {"id": "P-1007", "category": "RENTAL_RESIDENTIAL", "short_loc": "07-Geeta_Bhawan",      "price": 18000,    "status": "AVAILABLE",         "owner_id": "p1", "last_verified_at": days_ago(8),  "expected_lat": None,    "expected_lng": None},
    {"id": "P-1008", "category": "BUY_SELL_FLAT",      "short_loc": "08-SAPNA_SANGEETA",    "price": 3900000,  "status": "ACTIVE",            "owner_id": "p5", "last_verified_at": days_ago(10), "expected_lat": None,    "expected_lng": None},
    {"id": "P-1009", "category": "PLOT",               "short_loc": "09-Super_Corridor",    "price": 22000000, "status": "AVAILABLE",         "owner_id": "p8", "last_verified_at": days_ago(15), "expected_lat": None,    "expected_lng": None},
    {"id": "P-1010", "category": "BUY_SELL_COMMERCIAL","short_loc": "10-Rau_Pithampur",     "price": 8500000,  "status": "SOLD",              "owner_id": "p1", "last_verified_at": days_ago(20), "expected_lat": None,    "expected_lng": None},
]

REQUIREMENTS = [
    {"id": "R-2001", "client_id": "p4", "assigned_to_id": "u2", "category": "RENTAL_RESIDENTIAL", "intent": "RENT", "preferred_short_locs": ["01-Schm140_Mayank", "07-Geeta_Bhawan"], "min_budget": 12000,   "max_budget": 20000,   "status": "ACTIVE"},
    {"id": "R-2002", "client_id": "p3", "assigned_to_id": "u2", "category": "BUY_SELL_FLAT",      "intent": "BUY",  "preferred_short_locs": ["02-Bengali_Kanadia", "06-Nipania_Bypass"], "min_budget": 4000000, "max_budget": 6000000, "status": "ACTIVE"},
    {"id": "R-2003", "client_id": "p6", "assigned_to_id": "u1", "category": "RENTAL_COMMERCIAL",  "intent": "RENT", "preferred_short_locs": ["03-Vijay_Nagar", "04-Palasia_Square"],   "min_budget": 30000,   "max_budget": 60000,   "status": "ACTIVE"},
    {"id": "R-2004", "client_id": "p4", "assigned_to_id": "u2", "category": "BUY_SELL_FLAT",      "intent": "BUY",  "preferred_short_locs": ["08-SAPNA_SANGEETA"],                      "min_budget": 3500000, "max_budget": 5000000, "status": "ACTIVE"},
    {"id": "R-2005", "client_id": "p3", "assigned_to_id": "u1", "category": "PLOT",               "intent": "BUY",  "preferred_short_locs": ["05-Bhawarkuan_Main", "09-Super_Corridor"], "min_budget": 1500000, "max_budget": 3000000, "status": "ACTIVE"},
    {"id": "R-2006", "client_id": "p6", "assigned_to_id": "u2", "category": "BUY_SELL_COMMERCIAL","intent": "BUY",  "preferred_short_locs": ["04-Palasia_Square", "10-Rau_Pithampur"],  "min_budget": 8000000, "max_budget": 15000000,"status": "ACTIVE"},
]

LEADS = [
    {"id": "L-1001", "party_id": "p4", "lead_type": "BUYER",    "source": "Website",  "priority": "HIGH",     "assigned_to_id": "u2", "status": "CONTACTED", "value": 7500000,  "last_activity_at": hours_ago(2),  "next_follow_up_at": days_from_now(1)},
    {"id": "L-1002", "party_id": "p3", "lead_type": "TENANT",   "source": "Referral", "priority": "MEDIUM",   "assigned_to_id": "u1", "status": "NEW",       "value": 25000,    "last_activity_at": days_ago(1),   "next_follow_up_at": days_from_now(7)},
    {"id": "L-1003", "party_id": "p6", "lead_type": "INVESTOR", "source": "Walk-in",  "priority": "CRITICAL", "assigned_to_id": "u2", "status": "QUALIFIED", "value": 20000000, "last_activity_at": days_ago(3),   "next_follow_up_at": None},
    {"id": "L-1004", "party_id": "p7", "lead_type": "LANDLORD", "source": "Cold Call","priority": "LOW",      "assigned_to_id": "u1", "status": "LOST",      "value": None,     "last_activity_at": days_ago(14),  "next_follow_up_at": None},
]

MATCHES = [
    {"id": "M-1", "requirement_id": "R-2001", "property_id": "P-1001", "score": 95.5, "tier": "HIGH",     "score_breakdown": {"location": "PASS", "budget": "PASS", "bhk": "PASS"},                                              "status": "SHARED"},
    {"id": "M-2", "requirement_id": "R-2001", "property_id": "P-1007", "score": 88.0, "tier": "HIGH",     "score_breakdown": {"location": "PASS", "budget": "PASS", "bhk": "PASS"},                                              "status": "SUGGESTED"},
    {"id": "M-3", "requirement_id": "R-2002", "property_id": "P-1002", "score": 92.0, "tier": "HIGH",     "score_breakdown": {"location": "PASS", "budget": "PASS", "bhk": "PASS"},                                              "status": "VISIT_SCHEDULED"},
    {"id": "M-4", "requirement_id": "R-2002", "property_id": "P-1006", "score": 75.0, "tier": "GOOD",     "score_breakdown": {"location": "PASS", "budget": "PASS", "bhk": "WARNING (Requested 3, found 2)"},                   "status": "SUGGESTED"},
    {"id": "M-5", "requirement_id": "R-2003", "property_id": "P-1003", "score": 94.0, "tier": "HIGH",     "score_breakdown": {"location": "PASS", "budget": "PASS", "bhk": "PASS"},                                              "status": "SHORTLISTED"},
    {"id": "M-6", "requirement_id": "R-2004", "property_id": "P-1008", "score": 60.0, "tier": "POSSIBLE", "score_breakdown": {"location": "PASS", "budget": "WARNING (Property price exceeds budget by 40k)", "bhk": "PASS"},   "status": "SUGGESTED"},
]

VISITS = [
    {
        "id": "V-4001", "property_id": "P-1001", "requirement_id": "R-2001", "agent_id": "u3",
        "status": "ASSIGNED", "purpose": "Initial Viewing", "planned_date": days_from_now(1),
        "expected_coords": {"lat": 22.7196, "lng": 75.8577},
        "checklist_json": None, "photos_json": None, "outcome_json": None,
    },
    {
        "id": "V-4002", "property_id": "P-1002", "requirement_id": "R-2002", "agent_id": "u3",
        "status": "COMPLETED", "purpose": "Client Visit", "planned_date": days_ago(2),
        "expected_coords": None,
        "checklist_json": {"property_matches_listing": True, "photos_taken": True, "owner_present": False, "client_signed": True, "parking_verified": True},
        "photos_json": ["https://example.com/photo1.jpg", "https://example.com/photo2.jpg"],
        "outcome_json": {"person_met": "Owner", "interest": "Highly Interested", "condition": "Good", "next_action": "Send Agreement", "remarks": "Client very interested, ready to proceed."},
    },
    {
        "id": "V-4003", "property_id": "P-1003", "requirement_id": "R-2003", "agent_id": "u5",
        "status": "SUBMITTED", "purpose": "Commercial Inspection", "planned_date": days_ago(5),
        "expected_coords": None,
        "checklist_json": {"property_matches_listing": True, "photos_taken": True, "owner_present": True, "client_signed": False, "parking_verified": True},
        "photos_json": ["https://example.com/photo3.jpg"],
        "outcome_json": {"person_met": "Tenant Rep", "interest": "Neutral", "condition": "Fair", "next_action": "Follow Up", "remarks": "Needs negotiation on rent."},
    },
    {
        "id": "V-4004", "property_id": "P-1005", "requirement_id": "R-2005", "agent_id": "u5",
        "status": "SCHEDULED", "purpose": "Plot Survey", "planned_date": days_from_now(3),
        "expected_coords": None,
        "checklist_json": None, "photos_json": None, "outcome_json": None,
    },
]

OPPORTUNITIES = [
    {
        "id": "OPP-5001", "property_id": "P-1004", "requirement_id": "R-2003",
        "buyer_id": "p6", "seller_id": "p5", "responsible_id": "u1",
        "stage": "NEGOTIATION", "expected_value": 12000000, "expected_commission": 240000,
        "probability": 80, "negotiation_history": [],
    },
    {
        "id": "OPP-5002", "property_id": "P-1001", "requirement_id": "R-2001",
        "buyer_id": "p4", "seller_id": "p1", "responsible_id": "u2",
        "stage": "WON", "expected_value": 15000, "expected_commission": 15000,
        "probability": 100, "negotiation_history": [],
        "final_value": 15000, "commission_pct": 100.0,
        "closed_at": days_ago(30),
    },
    {
        "id": "OPP-5003", "property_id": "P-1002", "requirement_id": "R-2002",
        "buyer_id": "p3", "seller_id": "p2", "responsible_id": "u2",
        "stage": "WON", "expected_value": 4500000, "expected_commission": 90000,
        "probability": 100, "negotiation_history": [],
        "final_value": 4500000, "commission_pct": 2.0,
        "closed_at": days_ago(60),
    },
]

TRANSACTIONS = [
    {
        "id": "TRX-6001", "opportunity_id": "OPP-5002", "property_id": "P-1001",
        "transaction_type": "RENT", "transaction_value": 15000,
        "commission_amount": 15000, "commission_percent": 100.0,
        "payment_status": "RECEIVED", "closed_at": days_ago(30),
    },
    {
        "id": "TRX-6002", "opportunity_id": "OPP-5003", "property_id": "P-1002",
        "transaction_type": "SALE", "transaction_value": 4500000,
        "commission_amount": 90000, "commission_percent": 2.0,
        "payment_status": "RECEIVED", "closed_at": days_ago(60),
    },
    {
        "id": "TRX-6003", "opportunity_id": "OPP-5003", "property_id": "P-1002",
        "transaction_type": "SALE", "transaction_value": 4500000,
        "commission_amount": 45000, "commission_percent": 1.0,
        "payment_status": "PENDING", "closed_at": days_ago(60),
    },
]

FOLLOW_UPS = [
    {
        "id": "F-3001", "responsible_id": "u2",
        "linked_party_id": "p4", "follow_up_type": "Opportunity",
        "purpose": "Discuss payment terms", "priority": "HIGH",
        "status": "PENDING", "scheduled_at": days_from_now(1),
    },
    {
        "id": "F-3002", "responsible_id": "u1",
        "linked_party_id": "p6", "follow_up_type": "Requirement",
        "purpose": "Share new listings", "priority": "MEDIUM",
        "status": "PENDING", "scheduled_at": days_ago(2),  # past → OVERDUE in business logic
    },
]

CALLS = [
    {"id": "C-1", "party_id": "p4", "lead_id": "L-1001", "caller_id": "u2", "call_type": "OUTBOUND",  "outcome": "CONNECTED",       "duration_minutes": 12, "remarks": "Discussed requirements.",          "called_at": hours_ago(2)},
    {"id": "C-2", "party_id": "p3", "lead_id": "L-1002", "caller_id": "u1", "call_type": "INBOUND",   "outcome": "CONNECTED",       "duration_minutes": 8,  "remarks": "Client called about flat.",        "called_at": days_ago(1)},
    {"id": "C-3", "party_id": "p6", "lead_id": "L-1003", "caller_id": "u2", "call_type": "OUTBOUND",  "outcome": "NO_ANSWER",       "duration_minutes": 0,  "remarks": "",                                  "called_at": days_ago(1)},
    {"id": "C-4", "party_id": "p7", "lead_id": "L-1004", "caller_id": "u1", "call_type": "OUTBOUND",  "outcome": "CALL_BACK_LATER", "duration_minutes": 2,  "remarks": "Will call back tomorrow.",         "called_at": days_ago(2)},
    {"id": "C-5", "party_id": "p1", "lead_id": None,     "caller_id": "u2", "call_type": "OUTBOUND",  "outcome": "CONNECTED",       "duration_minutes": 15, "remarks": "Discussed property pricing.",      "called_at": days_ago(2)},
    {"id": "C-6", "party_id": "p5", "lead_id": None,     "caller_id": "u1", "call_type": "MISSED",    "outcome": "MISSED",          "duration_minutes": 0,  "remarks": "",                                  "called_at": days_ago(3)},
    {"id": "C-7", "party_id": "p8", "lead_id": None,     "caller_id": "u2", "call_type": "OUTBOUND",  "outcome": "BUSY",            "duration_minutes": 0,  "remarks": "",                                  "called_at": days_ago(3)},
    {"id": "C-8", "party_id": "p2", "lead_id": None,     "caller_id": "u1", "call_type": "INBOUND",   "outcome": "CONNECTED",       "duration_minutes": 6,  "remarks": "Owner asking about new listings.", "called_at": days_ago(4)},
]

TASKS = [
    {"id": "T-1", "title": "Verify property documents",       "task_type": "Verification",   "assigned_to_id": "u3", "created_by_id": "u1", "priority": "HIGH",   "status": "TODO",        "due_date": days_from_now(2),  "linked_record": "P-1005", "description": "Check all ownership docs for plot."},
    {"id": "T-2", "title": "Prepare sale agreement",          "task_type": "Documentation",  "assigned_to_id": "u2", "created_by_id": "u1", "priority": "CRITICAL","status": "IN_PROGRESS", "due_date": days_from_now(1),  "linked_record": "OPP-5002","description": "Draft and review sale agreement."},
    {"id": "T-3", "title": "Update CRM entries",              "task_type": "Admin",          "assigned_to_id": "u2", "created_by_id": "u2", "priority": "LOW",    "status": "DONE",        "due_date": days_ago(1),       "linked_record": None,     "description": "Update all pending CRM records."},
    {"id": "T-4", "title": "Follow up with Ramesh Patel",     "task_type": "Internal",       "assigned_to_id": "u1", "created_by_id": "u2", "priority": "MEDIUM", "status": "TODO",        "due_date": days_from_now(3),  "linked_record": "p1",     "description": "Check on property availability."},
    {"id": "T-5", "title": "Site visit photos upload",        "task_type": "Verification",   "assigned_to_id": "u3", "created_by_id": "u1", "priority": "HIGH",   "status": "OVERDUE",     "due_date": days_ago(2),       "linked_record": "V-4002", "description": "Upload photos from completed visit."},
    {"id": "T-6", "title": "Client requirement clarification","task_type": "Internal",       "assigned_to_id": "u2", "created_by_id": "u1", "priority": "MEDIUM", "status": "TODO",        "due_date": days_from_now(5),  "linked_record": "R-2001", "description": "Clarify BHK and location preferences."},
    {"id": "T-7", "title": "Commission payout processing",    "task_type": "Admin",          "assigned_to_id": "u1", "created_by_id": "u1", "priority": "HIGH",   "status": "TODO",        "due_date": days_from_now(7),  "linked_record": "TRX-6002","description": "Process commission payout for closed deal."},
]

AGENT_STATS = [
    {"agent_id": "u3", "status": "ON_VISIT",  "today_visits": 2, "week_completed": 5, "rating": 4.5, "last_location": "Vijay Nagar"},
    {"agent_id": "u5", "status": "AVAILABLE", "today_visits": 1, "week_completed": 3, "rating": 4.8, "last_location": "Palasia Square"},
    {"agent_id": "u6", "status": "OFF_DUTY",  "today_visits": 0, "week_completed": 0, "rating": 4.0, "last_location": "Bhawarkuan"},
]

ACTIVITY_LOGS = [
    {"id": "AL-1",  "type": "CALL",           "notes": "Called Amit Jain regarding requirement R-2001.",   "created_by_id": "u2", "occurred_at": hours_ago(2),   "linked_party_id": "p4", "linked_lead_id": "L-1001"},
    {"id": "AL-2",  "type": "PROPERTY_SHARE", "notes": "Shared P-1001 with requirement R-2001.",           "created_by_id": "u2", "occurred_at": days_ago(1),    "linked_requirement_id": "R-2001", "linked_property_id": "P-1001"},
    {"id": "AL-3",  "type": "VISIT",          "notes": "Visit V-4002 completed for P-1002.",               "created_by_id": "u3", "occurred_at": days_ago(2),    "linked_property_id": "P-1002"},
    {"id": "AL-4",  "type": "FOLLOWUP",       "notes": "Follow-up scheduled for Amit Jain.",               "created_by_id": "u2", "occurred_at": days_ago(1),    "linked_party_id": "p4"},
    {"id": "AL-5",  "type": "WHATSAPP",       "notes": "Sent property brochure via WhatsApp.",              "created_by_id": "u1", "occurred_at": days_ago(3),    "linked_party_id": "p6"},
    {"id": "AL-6",  "type": "MEETING",        "notes": "Met with Ramesh Patel about pricing.",             "created_by_id": "u1", "occurred_at": days_ago(4),    "linked_party_id": "p1"},
    {"id": "AL-7",  "type": "CALL",           "notes": "Called Vikram Singh re: plot requirement.",         "created_by_id": "u2", "occurred_at": days_ago(2),    "linked_party_id": "p3"},
    {"id": "AL-8",  "type": "VISIT",          "notes": "V-4003 submitted for review.",                     "created_by_id": "u5", "occurred_at": days_ago(5),    "linked_property_id": "P-1003"},
    {"id": "AL-9",  "type": "EMAIL",          "notes": "Sent offer letter to Amit Jain.",                  "created_by_id": "u2", "occurred_at": days_ago(6),    "linked_opportunity_id": "OPP-5002"},
    {"id": "AL-10", "type": "TASK",           "notes": "Task T-3 completed.",                              "created_by_id": "u2", "occurred_at": days_ago(1),    "linked_party_id": None},
]

AUDIT_LOGS = [
    {"id": "A-1",  "changed_by_id": "u1", "action": "Status Changed", "entity_type": "Opportunity", "entity_id": "OPP-5002", "summary": "Stage changed from NEGOTIATION to WON",      "occurred_at": days_ago(30)},
    {"id": "A-2",  "changed_by_id": "u2", "action": "Created",        "entity_type": "Lead",        "entity_id": "L-1001",   "summary": "New lead created for Amit Jain",              "occurred_at": days_ago(10)},
    {"id": "A-3",  "changed_by_id": "u1", "action": "Updated",        "entity_type": "Property",    "entity_id": "P-1004",   "summary": "Status changed to UNDER_NEGOTIATION",         "occurred_at": days_ago(7)},
    {"id": "A-4",  "changed_by_id": "u2", "action": "Created",        "entity_type": "User",        "entity_id": "u5",       "summary": "New agent account created",                   "occurred_at": days_ago(30)},
    {"id": "A-5",  "changed_by_id": "u1", "action": "Status Changed", "entity_type": "Visit",       "entity_id": "V-4002",   "summary": "Visit status changed to COMPLETED",           "occurred_at": days_ago(2)},
    {"id": "A-6",  "changed_by_id": "u2", "action": "Created",        "entity_type": "Transaction", "entity_id": "TRX-6001", "summary": "Transaction recorded for OPP-5002",           "occurred_at": days_ago(30)},
    {"id": "A-7",  "changed_by_id": "u1", "action": "Updated",        "entity_type": "Requirement", "entity_id": "R-2001",   "summary": "Preferred locations updated",                  "occurred_at": days_ago(5)},
    {"id": "A-8",  "changed_by_id": "u2", "action": "Status Changed", "entity_type": "Lead",        "entity_id": "L-1004",   "summary": "Lead marked as Lost",                         "occurred_at": days_ago(14)},
    {"id": "A-9",  "changed_by_id": "u1", "action": "Created",        "entity_type": "Match",       "entity_id": "M-1",      "summary": "Match created for R-2001 / P-1001",           "occurred_at": days_ago(8)},
    {"id": "A-10", "changed_by_id": "u1", "action": "Updated",        "entity_type": "Alert Setting","entity_id":"alerts",   "summary": "Staleness threshold updated to 5 days",       "occurred_at": days_ago(3)},
    {"id": "A-11", "changed_by_id": "u2", "action": "Created",        "entity_type": "Task",        "entity_id": "T-2",      "summary": "Task created: Prepare sale agreement",        "occurred_at": days_ago(2)},
    {"id": "A-12", "changed_by_id": "u1", "action": "Deleted",        "entity_type": "Match",       "entity_id": "M-99",     "summary": "Stale rejected match removed",                 "occurred_at": days_ago(1)},
]


# ── insert functions ──────────────────────────────────────────────────────────

async def seed(session: AsyncSession) -> None:
    from sqlalchemy import text

    # Delete all in reverse dependency order to avoid FK violations
    print("  Clearing existing data...")
    for table in [
        "audit_logs", "agent_stats", "tasks", "calls", "follow_ups",
        "activity_logs", "transactions", "opportunities", "visits",
        "matches", "requirements", "leads", "properties", "users", "parties",
    ]:
        await session.execute(text(f"DELETE FROM {table}"))

    print("  Inserting parties...")
    for r in PARTIES:
        await session.execute(
            text("INSERT INTO parties (id, name, mobile, email, city, roles, tags) VALUES (:id,:name,:mobile,:email,:city,:roles,'[]')"),
            {**r, "roles": str(r["roles"]).replace("'", '"')},
        )

    print("  Inserting users...")
    for r in USERS:
        await session.execute(
            text("INSERT INTO users (id, name, email, role, status, party_id) VALUES (:id,:name,:email,:role,:status,:party_id)"),
            r,
        )

    print("  Inserting properties...")
    for r in PROPERTIES:
        await session.execute(
            text("INSERT INTO properties (id, category, short_loc, price, status, owner_id, expected_lat, expected_lng, last_verified_at) VALUES (:id,:category,:short_loc,:price,:status,:owner_id,:expected_lat,:expected_lng,:last_verified_at)"),
            r,
        )

    print("  Inserting leads...")
    for r in LEADS:
        await session.execute(
            text("INSERT INTO leads (id, party_id, lead_type, source, priority, assigned_to_id, status, value, last_activity_at, next_follow_up_at) VALUES (:id,:party_id,:lead_type,:source,:priority,:assigned_to_id,:status,:value,:last_activity_at,:next_follow_up_at)"),
            r,
        )

    print("  Inserting requirements...")
    for r in REQUIREMENTS:
        await session.execute(
            text("INSERT INTO requirements (id, client_id, assigned_to_id, category, intent, preferred_short_locs, min_budget, max_budget, status) VALUES (:id,:client_id,:assigned_to_id,:category,:intent,:preferred_short_locs,:min_budget,:max_budget,:status)"),
            {**r, "preferred_short_locs": str(r["preferred_short_locs"]).replace("'", '"')},
        )

    print("  Inserting matches...")
    import json
    for r in MATCHES:
        await session.execute(
            text("INSERT INTO matches (id, requirement_id, property_id, score, tier, score_breakdown, status) VALUES (:id,:requirement_id,:property_id,:score,:tier,:score_breakdown,:status)"),
            {**r, "score_breakdown": json.dumps(r["score_breakdown"])},
        )

    print("  Inserting visits...")
    for r in VISITS:
        await session.execute(
            text("INSERT INTO visits (id, property_id, requirement_id, agent_id, status, purpose, planned_date, expected_coords, checklist_json, photos_json, outcome_json) VALUES (:id,:property_id,:requirement_id,:agent_id,:status,:purpose,:planned_date,:expected_coords,:checklist_json,:photos_json,:outcome_json)"),
            {**r,
             "expected_coords": json.dumps(r["expected_coords"]) if r["expected_coords"] else None,
             "checklist_json": json.dumps(r["checklist_json"]) if r["checklist_json"] else None,
             "photos_json": json.dumps(r["photos_json"]) if r["photos_json"] else None,
             "outcome_json": json.dumps(r["outcome_json"]) if r["outcome_json"] else None,
            },
        )

    print("  Inserting opportunities...")
    for r in OPPORTUNITIES:
        await session.execute(
            text("INSERT INTO opportunities (id, property_id, requirement_id, buyer_id, seller_id, responsible_id, stage, expected_value, expected_commission, probability, negotiation_history, final_value, commission_pct, closed_at) VALUES (:id,:property_id,:requirement_id,:buyer_id,:seller_id,:responsible_id,:stage,:expected_value,:expected_commission,:probability,:negotiation_history,:final_value,:commission_pct,:closed_at)"),
            {**r,
             "negotiation_history": json.dumps(r.get("negotiation_history", [])),
             "final_value": r.get("final_value"),
             "commission_pct": r.get("commission_pct"),
             "closed_at": r.get("closed_at"),
            },
        )

    print("  Inserting transactions...")
    for r in TRANSACTIONS:
        await session.execute(
            text("INSERT INTO transactions (id, opportunity_id, property_id, transaction_type, transaction_value, commission_amount, commission_percent, payment_status, closed_at) VALUES (:id,:opportunity_id,:property_id,:transaction_type,:transaction_value,:commission_amount,:commission_percent,:payment_status,:closed_at)"),
            r,
        )

    print("  Inserting follow_ups...")
    for r in FOLLOW_UPS:
        await session.execute(
            text("INSERT INTO follow_ups (id, responsible_id, linked_party_id, follow_up_type, purpose, priority, status, scheduled_at) VALUES (:id,:responsible_id,:linked_party_id,:follow_up_type,:purpose,:priority,:status,:scheduled_at)"),
            r,
        )

    print("  Inserting calls...")
    for r in CALLS:
        await session.execute(
            text("INSERT INTO calls (id, party_id, lead_id, caller_id, call_type, outcome, duration_minutes, remarks, called_at) VALUES (:id,:party_id,:lead_id,:caller_id,:call_type,:outcome,:duration_minutes,:remarks,:called_at)"),
            r,
        )

    print("  Inserting tasks...")
    for r in TASKS:
        await session.execute(
            text("INSERT INTO tasks (id, title, task_type, assigned_to_id, created_by_id, priority, status, due_date, linked_record, description) VALUES (:id,:title,:task_type,:assigned_to_id,:created_by_id,:priority,:status,:due_date,:linked_record,:description)"),
            r,
        )

    print("  Inserting agent_stats...")
    for r in AGENT_STATS:
        await session.execute(
            text("INSERT INTO agent_stats (agent_id, status, today_visits, week_completed, rating, last_location) VALUES (:agent_id,:status,:today_visits,:week_completed,:rating,:last_location)"),
            r,
        )

    print("  Inserting activity_logs...")
    for r in ACTIVITY_LOGS:
        await session.execute(
            text("INSERT INTO activity_logs (id, type, notes, created_by_id, occurred_at, linked_party_id, linked_lead_id, linked_requirement_id, linked_property_id, linked_opportunity_id) VALUES (:id,:type,:notes,:created_by_id,:occurred_at,:linked_party_id,:linked_lead_id,:linked_requirement_id,:linked_property_id,:linked_opportunity_id)"),
            {
                "id": r["id"], "type": r["type"], "notes": r["notes"],
                "created_by_id": r["created_by_id"], "occurred_at": r["occurred_at"],
                "linked_party_id": r.get("linked_party_id"),
                "linked_lead_id": r.get("linked_lead_id"),
                "linked_requirement_id": r.get("linked_requirement_id"),
                "linked_property_id": r.get("linked_property_id"),
                "linked_opportunity_id": r.get("linked_opportunity_id"),
            },
        )

    print("  Inserting audit_logs...")
    for r in AUDIT_LOGS:
        await session.execute(
            text("INSERT INTO audit_logs (id, changed_by_id, action, entity_type, entity_id, summary, occurred_at) VALUES (:id,:changed_by_id,:action,:entity_type,:entity_id,:summary,:occurred_at)"),
            r,
        )

    await session.commit()
    print("  ✅ All seed data inserted successfully.")


async def main() -> None:
    print("=" * 60)
    print("  DEV SEED SCRIPT — for local development only")
    print("=" * 60)
    print(f"  Database: {settings.DATABASE_URL}")
    print()

    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with factory() as session:
        await seed(session)

    await engine.dispose()
    print()
    print("  Done. Refresh your browser or re-run the backend.")


if __name__ == "__main__":
    asyncio.run(main())
