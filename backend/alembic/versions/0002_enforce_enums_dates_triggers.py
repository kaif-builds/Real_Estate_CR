"""Fix schema: native Postgres ENUMs, proper datetime columns, and name-cascade triggers

Revision ID: 0002
Revises: 9ce4e1df3955
Create Date: 2026-10-01
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '0002'
down_revision: Union[str, None] = '9ce4e1df3955'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# ─── ENUM DEFINITIONS ──────────────────────────────────────────────────────────
# Each tuple: (pg_type_name, [values])

ENUMS = [
    ('enum_user_role', [
        'SUPER_ADMIN', 'OFFICE_EXECUTIVE', 'AGENT', 'CLIENT',
    ]),
    ('enum_property_category', [
        'RENTAL_RESIDENTIAL', 'RENTAL_COMMERCIAL', 'BUY_SELL_FLAT',
        'BUY_SELL_COMMERCIAL', 'PLOT',
    ]),
    ('enum_property_status', [
        'NEW', 'UNDER_VERIFICATION', 'AVAILABLE', 'ACTIVE', 'ON_HOLD',
        'RESERVED', 'UNDER_NEGOTIATION', 'SOLD', 'RENTED', 'LEASED',
        'WITHDRAWN', 'INACTIVE',
    ]),
    ('enum_lead_type', [
        'BUYER', 'SELLER', 'OWNER', 'TENANT', 'LANDLORD',
        'INVESTOR', 'CONSULTANT', 'OTHER',
    ]),
    ('enum_lead_status', [
        'NEW', 'CONTACTED', 'QUALIFIED', 'LOST', 'WON', 'STALE', 'CLOSED',
    ]),
    ('enum_lead_priority', [
        'CRITICAL', 'HIGH', 'MEDIUM', 'LOW',
    ]),
    ('enum_channel_type', [
        'Digital', 'Offline',
    ]),
    ('enum_intent', [
        'BUY', 'RENT', 'LEASE',
    ]),
    ('enum_requirement_status', [
        'NEW', 'ACTIVE', 'QUALIFIED', 'LOW_CLARITY', 'FULFILLED', 'DROPPED',
    ]),
    ('enum_match_tier', [
        'HIGH', 'GOOD', 'POSSIBLE',
    ]),
    ('enum_match_status', [
        'SUGGESTED', 'SHARED', 'VISIT_SCHEDULED', 'REJECTED', 'SHORTLISTED',
    ]),
    ('enum_opportunity_stage', [
        'QUALIFIED', 'PROPERTY_SHARED', 'SITE_VISIT', 'NEGOTIATION',
        'DOCUMENTATION', 'WON', 'LOST',
    ]),
    ('enum_transaction_type', [
        'Sale', 'Rent', 'Lease',
    ]),
    ('enum_payment_status', [
        'Paid', 'Partial', 'Pending',
    ]),
    ('enum_followup_entity_type', [
        'Requirement', 'Lead', 'Opportunity',
    ]),
    ('enum_followup_priority', [
        'LOW', 'MEDIUM', 'HIGH',
    ]),
    ('enum_followup_status', [
        'PENDING', 'COMPLETED', 'RESCHEDULED', 'CANCELLED', 'OVERDUE', 'NO_RESPONSE',
    ]),
    ('enum_visit_purpose', [
        'Property Viewing', 'Owner Meeting', 'Verification',
    ]),
    ('enum_visit_status', [
        'Assigned', 'Accepted', 'Scheduled', 'En Route', 'Arrived',
        'Visit Started', 'Visit Completed', 'Submitted', 'Approved',
        'Rejected', 'Cancelled',
    ]),
    ('enum_task_type', [
        'Internal', 'Verification', 'Documentation', 'Admin', 'Other',
    ]),
    ('enum_task_priority', [
        'CRITICAL', 'HIGH', 'MEDIUM', 'LOW',
    ]),
    ('enum_task_status', [
        'TODO', 'IN_PROGRESS', 'DONE', 'OVERDUE',
    ]),
    ('enum_activity_type', [
        'CALL', 'FOLLOWUP', 'WHATSAPP', 'EMAIL', 'MEETING',
        'PROPERTY_SHARE', 'VISIT', 'TASK', 'STATUS_CHANGE',
    ]),
    ('enum_call_type', [
        'OUTBOUND', 'INBOUND', 'MISSED',
    ]),
    ('enum_call_outcome', [
        'CONNECTED', 'NO_ANSWER', 'BUSY', 'WRONG_NUMBER', 'CALL_BACK_LATER',
    ]),
    ('enum_sentiment', [
        'Interested', 'Neutral', 'Not Interested',
    ]),
    ('enum_audit_action', [
        'Created', 'Updated', 'Deleted', 'Status Changed', 'Cancelled',
        'Query', 'Clarification', 'Failed',
    ]),
    ('enum_audit_entity_type', [
        'Property', 'Requirement', 'Lead', 'Visit', 'Opportunity', 'User',
        'Transaction', 'Marketing Config', 'Follow-up', 'Task', 'Campaign',
        'General', 'Workflow',
    ]),
    ('enum_campaign_type', [
        'Property Promotion', 'Buyer Acquisition', 'Seller Acquisition',
        'Tenant Acquisition', 'Landlord Acquisition', 'Investor Acquisition',
        'Brand Awareness', 'Lead Generation',
    ]),
    ('enum_campaign_status', [
        'Draft', 'Planned', 'Active', 'Paused', 'Completed', 'Cancelled',
    ]),
    ('enum_partner_category', [
        'Property Consultant', 'Broker', 'Developer', 'Investor',
        'Corporate Contact', 'Referral Partner', 'Other',
    ]),
    ('enum_partner_status', [
        'Active', 'Inactive',
    ]),
    ('enum_telecampaign_status', [
        'Draft', 'Active', 'Paused', 'Completed',
    ]),
    ('enum_telemarketing_purpose', [
        'Cold Calling', 'Market Survey', 'Owner Acquisition',
        'Buyer Acquisition', 'Lead Reactivation', 'Other',
    ]),
    ('enum_call_disposition', [
        'Not Called', 'Connected', 'Busy', 'Call Later', 'Interested',
        'Not Interested', 'Wrong Number', 'Do Not Contact', 'Converted to Lead',
    ]),
    ('enum_content_type', [
        'Property Description', 'Ad Copy', 'Image', 'Video', 'Brochure',
        'Flyer', 'Social Media Creative', 'Campaign Message', 'Call Script', 'Other',
    ]),
    ('enum_field_agent_status', [
        'Available', 'On Visit', 'Off Duty',
    ]),
    ('enum_lost_reason', [
        'Price Issue', 'Property Issue', 'Customer Decision', 'Timing', 'Other',
    ]),
    ('enum_linked_record_type', [
        'Property', 'Requirement', 'Lead', 'Opportunity',
    ]),
]


# ─── COLUMN→ENUM MAPPINGS ──────────────────────────────────────────────────────
# (table, column, pg_enum_name)

ENUM_COLUMNS = [
    ('users',                    'role',                   'enum_user_role'),
    ('properties',               'category',               'enum_property_category'),
    ('properties',               'status',                 'enum_property_status'),
    ('leads',                    'lead_type',              'enum_lead_type'),
    ('leads',                    'status',                 'enum_lead_status'),
    ('leads',                    'priority',               'enum_lead_priority'),
    ('leads',                    'channel_type',           'enum_channel_type'),
    ('requirements',             'category',               'enum_property_category'),
    ('requirements',             'intent',                 'enum_intent'),
    ('requirements',             'status',                 'enum_requirement_status'),
    ('matches',                  'tier',                   'enum_match_tier'),
    ('matches',                  'status',                 'enum_match_status'),
    ('opportunities',            'stage',                  'enum_opportunity_stage'),
    ('opportunities',            'lost_reason',            'enum_lost_reason'),
    ('opportunities',            'attributed_channel_type','enum_channel_type'),
    ('transactions',             'transaction_type',       'enum_transaction_type'),
    ('transactions',             'payment_status',         'enum_payment_status'),
    ('transactions',             'attributed_channel_type','enum_channel_type'),
    ('follow_ups',               'entity_type',            'enum_followup_entity_type'),
    ('follow_ups',               'priority',               'enum_followup_priority'),
    ('follow_ups',               'status',                 'enum_followup_status'),
    ('visits',                   'purpose',                'enum_visit_purpose'),
    ('visits',                   'status',                 'enum_visit_status'),
    ('tasks',                    'task_type',              'enum_task_type'),
    ('tasks',                    'priority',               'enum_task_priority'),
    ('tasks',                    'status',                 'enum_task_status'),
    ('tasks',                    'linked_record_type',     'enum_linked_record_type'),
    ('activity_logs',            'activity_type',          'enum_activity_type'),
    ('calls',                    'call_type',              'enum_call_type'),
    ('calls',                    'outcome',                'enum_call_outcome'),
    ('calls',                    'ai_sentiment',           'enum_sentiment'),
    ('call_recordings',          'sentiment',              'enum_sentiment'),
    ('audit_logs',               'action',                 'enum_audit_action'),
    ('audit_logs',               'entity_type',            'enum_audit_entity_type'),
    ('campaigns',                'type',                   'enum_campaign_type'),
    ('campaigns',                'status',                 'enum_campaign_status'),
    ('referral_partners',        'category',               'enum_partner_category'),
    ('referral_partners',        'status',                 'enum_partner_status'),
    ('telemarketing_campaigns',  'purpose',                'enum_telemarketing_purpose'),
    ('telemarketing_campaigns',  'status',                 'enum_telecampaign_status'),
    ('telemarketing_contacts',   'status',                 'enum_call_disposition'),
    ('content_items',            'type',                   'enum_content_type'),
    ('field_agents',             'status',                 'enum_field_agent_status'),
]


# ─── TIMESTAMP COLUMNS ─────────────────────────────────────────────────────────
# (table, column) — all get converted to TIMESTAMPTZ

TIMESTAMP_COLUMNS = [
    # properties
    ('properties',               'availability_date'),
    ('properties',               'last_verified_at'),
    ('properties',               'created_at'),
    # leads
    ('leads',                    'last_activity_at'),
    ('leads',                    'next_follow_up_at'),
    ('leads',                    'created_at'),
    ('leads',                    'enquiry_at'),
    # requirements
    ('requirements',             'created_at'),
    # matches
    ('matches',                  'created_at'),
    # opportunities
    ('opportunities',            'created_at'),
    ('opportunities',            'closed_at'),
    # follow_ups
    ('follow_ups',               'due_date'),
    ('follow_ups',               'created_at'),
    # activity_logs
    ('activity_logs',            'timestamp'),
    # tasks
    ('tasks',                    'due_date'),
    ('tasks',                    'created_at'),
    # visits
    ('visits',                   'scheduled_date'),
    ('visits',                   'submitted_date'),
    ('visits',                   'created_at'),
    # call_recordings
    ('call_recordings',          'created_at'),
    # calls
    ('calls',                    'call_time'),
    ('calls',                    'callback_time'),
    # audit_logs
    ('audit_logs',               'timestamp'),
    # campaigns
    ('campaigns',                'created_at'),
    ('campaigns',                'updated_at'),
    # referral_partners
    ('referral_partners',        'created_at'),
    # telemarketing_campaigns
    ('telemarketing_campaigns',  'created_at'),
    # telemarketing_contacts
    ('telemarketing_contacts',   'last_attempt_at'),
    ('telemarketing_contacts',   'next_attempt_at'),
    ('telemarketing_contacts',   'created_at'),
    # content_items
    ('content_items',            'date_added'),
    # marketing_config
    ('marketing_config',         'created_at'),
    # parties
    ('parties',                  'updated_at'),
]


# ─── DATE-ONLY COLUMNS ─────────────────────────────────────────────────────────
# These store date-only strings like '2026-09-22'

DATE_COLUMNS = [
    ('transactions',             'closed_date'),
    ('campaigns',                'start_date'),
    ('campaigns',                'end_date'),
    ('telemarketing_campaigns',  'start_date'),
    ('telemarketing_campaigns',  'end_date'),
]


# ─── DENORMALIZED NAME FIELDS ──────────────────────────────────────────────────
# (table, name_column, fk_column, source_table)

PARTY_NAME_DENORMS = [
    ('leads',                    'party_name',         'party_id',   'parties'),
    ('requirements',             'client_name',        'client_id',  'parties'),
    ('opportunities',            'client_name',        'client_id',  'parties'),
    ('follow_ups',               'client_name',        'client_id',  'parties'),
    ('calls',                    'party_name',         'party_id',   'parties'),
    ('call_recordings',          'party_name',         'party_id',   'parties'),
    ('visits',                   'client_name',        'client_id',  'parties'),
    ('properties',               'owner_name',         'owner_id',   'parties'),
]

USER_NAME_DENORMS = [
    ('leads',                    'assigned_to_name',   'assigned_to_id', 'users'),
    ('requirements',             'assigned_to_name',   'assigned_to_id', 'users'),
    ('opportunities',            'agent_name',         'agent_id',       'users'),
    ('follow_ups',               'responsible_name',   'responsible_id', 'users'),
    ('tasks',                    'assigned_to_name',   'assigned_to_id', 'users'),
    ('visits',                   'agent_name',         'agent_id',       'users'),
    ('campaigns',                'owner_name',         'owner_id',       'users'),
    ('call_recordings',          'uploaded_by_name',   'uploaded_by_id', 'users'),
    ('calls',                    'caller_name',        'caller_id',      'users'),
    ('transactions',             'staff_name',         'staff_id',       'users'),
]


def upgrade() -> None:
    conn = op.get_bind()

    # ═══════════════════════════════════════════════════════════════════════════
    # 1. CREATE ALL ENUM TYPES
    # ═══════════════════════════════════════════════════════════════════════════
    for enum_name, values in ENUMS:
        values_sql = ", ".join(f"'{v}'" for v in values)
        conn.execute(sa.text(f"CREATE TYPE {enum_name} AS ENUM ({values_sql})"))

    # ═══════════════════════════════════════════════════════════════════════════
    # 2. CONVERT VARCHAR COLUMNS TO ENUM TYPE
    # ═══════════════════════════════════════════════════════════════════════════
    for table, column, enum_name in ENUM_COLUMNS:
        # nullable columns need USING cast
        conn.execute(sa.text(
            f'ALTER TABLE {table} ALTER COLUMN "{column}" TYPE {enum_name} '
            f'USING "{column}"::{enum_name}'
        ))

    # ═══════════════════════════════════════════════════════════════════════════
    # 3. CONVERT VARCHAR COLUMNS TO TIMESTAMPTZ
    # ═══════════════════════════════════════════════════════════════════════════
    for table, column in TIMESTAMP_COLUMNS:
        conn.execute(sa.text(
            f'ALTER TABLE {table} ALTER COLUMN "{column}" TYPE TIMESTAMPTZ '
            f'USING CASE WHEN "{column}" IS NOT NULL AND "{column}" != \'\' '
            f"THEN \"{column}\"::TIMESTAMPTZ ELSE NULL END"
        ))

    # ═══════════════════════════════════════════════════════════════════════════
    # 4. CONVERT VARCHAR COLUMNS TO DATE
    # ═══════════════════════════════════════════════════════════════════════════
    for table, column in DATE_COLUMNS:
        conn.execute(sa.text(
            f'ALTER TABLE {table} ALTER COLUMN "{column}" TYPE DATE '
            f'USING CASE WHEN "{column}" IS NOT NULL AND "{column}" != \'\' '
            f"THEN \"{column}\"::DATE ELSE NULL END"
        ))

    # ═══════════════════════════════════════════════════════════════════════════
    # 5. NAME-CASCADE TRIGGERS: parties.name → all denormalized party_name cols
    # ═══════════════════════════════════════════════════════════════════════════
    # Build dynamic UPDATE statements for each denormalized party name field
    party_updates = "\n".join(
        f'    UPDATE {table} SET "{name_col}" = NEW.name WHERE "{fk_col}" = NEW.id;'
        for table, name_col, fk_col, _ in PARTY_NAME_DENORMS
    )
    conn.execute(sa.text(f"""
        CREATE OR REPLACE FUNCTION fn_cascade_party_name()
        RETURNS TRIGGER AS $$
        BEGIN
            IF OLD.name IS DISTINCT FROM NEW.name THEN
{party_updates}
            END IF;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """))
    conn.execute(sa.text("""
        DROP TRIGGER IF EXISTS trg_cascade_party_name ON parties
    """))
    conn.execute(sa.text("""
        CREATE TRIGGER trg_cascade_party_name
        AFTER UPDATE OF name ON parties
        FOR EACH ROW
        EXECUTE FUNCTION fn_cascade_party_name()
    """))

    # ═══════════════════════════════════════════════════════════════════════════
    # 6. NAME-CASCADE TRIGGERS: users.name → all denormalized user name cols
    # ═══════════════════════════════════════════════════════════════════════════
    user_updates = "\n".join(
        f'    UPDATE {table} SET "{name_col}" = NEW.name WHERE "{fk_col}" = NEW.id;'
        for table, name_col, fk_col, _ in USER_NAME_DENORMS
    )
    conn.execute(sa.text(f"""
        CREATE OR REPLACE FUNCTION fn_cascade_user_name()
        RETURNS TRIGGER AS $$
        BEGIN
            IF OLD.name IS DISTINCT FROM NEW.name THEN
{user_updates}
            END IF;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """))
    conn.execute(sa.text("""
        DROP TRIGGER IF EXISTS trg_cascade_user_name ON users
    """))
    conn.execute(sa.text("""
        CREATE TRIGGER trg_cascade_user_name
        AFTER UPDATE OF name ON users
        FOR EACH ROW
        EXECUTE FUNCTION fn_cascade_user_name()
    """))


def downgrade() -> None:
    conn = op.get_bind()

    # Drop triggers
    conn.execute(sa.text("DROP TRIGGER IF EXISTS trg_cascade_party_name ON parties"))
    conn.execute(sa.text("DROP TRIGGER IF EXISTS trg_cascade_user_name ON users"))
    conn.execute(sa.text("DROP FUNCTION IF EXISTS fn_cascade_party_name()"))
    conn.execute(sa.text("DROP FUNCTION IF EXISTS fn_cascade_user_name()"))

    # Revert DATE columns to VARCHAR
    for table, column in DATE_COLUMNS:
        conn.execute(sa.text(
            f'ALTER TABLE {table} ALTER COLUMN "{column}" TYPE VARCHAR '
            f'USING "{column}"::VARCHAR'
        ))

    # Revert TIMESTAMP columns to VARCHAR
    for table, column in TIMESTAMP_COLUMNS:
        conn.execute(sa.text(
            f'ALTER TABLE {table} ALTER COLUMN "{column}" TYPE VARCHAR '
            f'USING CASE WHEN "{column}" IS NOT NULL '
            f"THEN \"{column}\"::VARCHAR ELSE NULL END"
        ))

    # Revert ENUM columns to VARCHAR
    for table, column, enum_name in ENUM_COLUMNS:
        conn.execute(sa.text(
            f'ALTER TABLE {table} ALTER COLUMN "{column}" TYPE VARCHAR '
            f'USING "{column}"::VARCHAR'
        ))

    # Drop all enum types
    for enum_name, _ in ENUMS:
        conn.execute(sa.text(f"DROP TYPE IF EXISTS {enum_name}"))
