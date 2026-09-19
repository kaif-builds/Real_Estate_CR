"""Full data model — all entities from TECHNICAL_SPEC.md §3.3

Revision ID: 002
Revises: 001
Create Date: 2024-01-02 00:00:00.000000

This migration:
1. Drops the placeholder users table from Step 1
2. Creates all 15 tables in dependency order (no FKs before their targets)
3. Creates all indexes

Tables created (in order):
  parties, users, properties, leads, requirements,
  matches, visits, opportunities, transactions,
  activity_logs, follow_ups, calls, tasks, agent_stats, audit_logs
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── 1. Drop Step-1 placeholder users table (will be recreated below) ──────
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")

    # ── 2. parties ─────────────────────────────────────────────────────────────
    op.create_table(
        "parties",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("mobile", sa.String(), nullable=False),
        sa.Column("alt_mobile", sa.String(), nullable=True),
        sa.Column("email", sa.String(), nullable=True),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("city", sa.String(), nullable=True),
        sa.Column("roles", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("source", sa.String(), nullable=True),
        sa.Column("status", sa.String(), nullable=True, server_default="Active"),
        sa.Column("tags", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("remarks", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_parties_name", "parties", ["name"])

    # ── 3. users (full schema) ─────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("password_hash", sa.String(), nullable=False, server_default=""),
        sa.Column("role", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False, server_default="Active"),
        sa.Column("party_id", sa.String(), sa.ForeignKey("parties.id"), nullable=True),
        sa.Column("last_login", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # ── 4. properties ──────────────────────────────────────────────────────────
    op.create_table(
        "properties",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("category", sa.String(), nullable=False),
        sa.Column("short_loc", sa.String(), nullable=False),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("price", sa.Float(), nullable=False),
        sa.Column("status", sa.String(), nullable=False, server_default="NEW"),
        sa.Column("owner_id", sa.String(), sa.ForeignKey("parties.id"), nullable=False),
        sa.Column("details_json", sa.JSON(), nullable=True),
        sa.Column("expected_lat", sa.Float(), nullable=True),
        sa.Column("expected_lng", sa.Float(), nullable=True),
        sa.Column("last_verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_properties_short_loc", "properties", ["short_loc"])
    op.create_index("ix_properties_status", "properties", ["status"])

    # ── 5. leads ───────────────────────────────────────────────────────────────
    op.create_table(
        "leads",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("party_id", sa.String(), sa.ForeignKey("parties.id"), nullable=False),
        sa.Column("lead_type", sa.String(), nullable=False),
        sa.Column("source", sa.String(), nullable=True),
        sa.Column("priority", sa.String(), nullable=True, server_default="MEDIUM"),
        sa.Column("assigned_to_id", sa.String(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("status", sa.String(), nullable=False, server_default="NEW"),
        sa.Column("value", sa.Float(), nullable=True),
        sa.Column("remarks", sa.Text(), nullable=True),
        sa.Column("last_activity_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("next_follow_up_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_leads_party_id", "leads", ["party_id"])
    op.create_index("ix_leads_status", "leads", ["status"])

    # ── 6. requirements ────────────────────────────────────────────────────────
    op.create_table(
        "requirements",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("client_id", sa.String(), sa.ForeignKey("parties.id"), nullable=False),
        sa.Column("assigned_to_id", sa.String(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("category", sa.String(), nullable=False),
        sa.Column("intent", sa.String(), nullable=False),
        sa.Column("preferred_short_locs", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("min_budget", sa.Float(), nullable=True),
        sa.Column("max_budget", sa.Float(), nullable=True),
        sa.Column("status", sa.String(), nullable=False, server_default="NEW"),
        sa.Column("remarks", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_requirements_client_id", "requirements", ["client_id"])
    op.create_index("ix_requirements_status", "requirements", ["status"])

    # ── 7. matches ─────────────────────────────────────────────────────────────
    op.create_table(
        "matches",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("requirement_id", sa.String(), sa.ForeignKey("requirements.id"), nullable=False),
        sa.Column("property_id", sa.String(), sa.ForeignKey("properties.id"), nullable=False),
        sa.Column("score", sa.Float(), nullable=False),
        sa.Column("tier", sa.String(), nullable=False),
        sa.Column("score_breakdown", sa.JSON(), nullable=True),
        sa.Column("status", sa.String(), nullable=False, server_default="SUGGESTED"),
        sa.Column("reject_reason", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_matches_requirement_id", "matches", ["requirement_id"])
    op.create_index("ix_matches_property_id", "matches", ["property_id"])

    # ── 8. visits ──────────────────────────────────────────────────────────────
    op.create_table(
        "visits",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("property_id", sa.String(), sa.ForeignKey("properties.id"), nullable=False),
        sa.Column("requirement_id", sa.String(), sa.ForeignKey("requirements.id"), nullable=True),
        sa.Column("agent_id", sa.String(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("status", sa.String(), nullable=False, server_default="ASSIGNED"),
        sa.Column("purpose", sa.String(), nullable=True),
        sa.Column("planned_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expected_coords", sa.JSON(), nullable=True),
        sa.Column("actual_coords", sa.JSON(), nullable=True),
        sa.Column("gps_validation", sa.String(), nullable=True),
        sa.Column("checklist_json", sa.JSON(), nullable=True),
        sa.Column("photos_json", sa.JSON(), nullable=True),
        sa.Column("outcome_json", sa.JSON(), nullable=True),
        sa.Column("reviewed_by_id", sa.String(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("review_remarks", sa.Text(), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_visits_property_id", "visits", ["property_id"])
    op.create_index("ix_visits_agent_id", "visits", ["agent_id"])
    op.create_index("ix_visits_status", "visits", ["status"])

    # ── 9. opportunities ───────────────────────────────────────────────────────
    op.create_table(
        "opportunities",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("property_id", sa.String(), sa.ForeignKey("properties.id"), nullable=False),
        sa.Column("requirement_id", sa.String(), sa.ForeignKey("requirements.id"), nullable=True),
        sa.Column("buyer_id", sa.String(), sa.ForeignKey("parties.id"), nullable=True),
        sa.Column("seller_id", sa.String(), sa.ForeignKey("parties.id"), nullable=True),
        sa.Column("responsible_id", sa.String(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("stage", sa.String(), nullable=False, server_default="QUALIFIED"),
        sa.Column("expected_value", sa.Float(), nullable=True),
        sa.Column("expected_commission", sa.Float(), nullable=True),
        sa.Column("probability", sa.Float(), nullable=True),
        sa.Column("negotiation_history", sa.JSON(), nullable=True),
        sa.Column("final_value", sa.Float(), nullable=True),
        sa.Column("commission_pct", sa.Float(), nullable=True),
        sa.Column("lost_reason", sa.String(), nullable=True),
        sa.Column("lost_remarks", sa.Text(), nullable=True),
        sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_opportunities_property_id", "opportunities", ["property_id"])
    op.create_index("ix_opportunities_stage", "opportunities", ["stage"])

    # ── 10. transactions ───────────────────────────────────────────────────────
    op.create_table(
        "transactions",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("opportunity_id", sa.String(), sa.ForeignKey("opportunities.id"), nullable=False),
        sa.Column("property_id", sa.String(), sa.ForeignKey("properties.id"), nullable=False),
        sa.Column("transaction_type", sa.String(), nullable=False),
        sa.Column("transaction_value", sa.Float(), nullable=False),
        sa.Column("commission_amount", sa.Float(), nullable=False),
        sa.Column("commission_percent", sa.Float(), nullable=False),
        sa.Column("payment_status", sa.String(), nullable=False, server_default="PENDING"),
        sa.Column("closed_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_transactions_opportunity_id", "transactions", ["opportunity_id"])

    # ── 11. activity_logs ─────────────────────────────────────────────────────
    op.create_table(
        "activity_logs",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("type", sa.String(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_by_id", sa.String(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("occurred_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("linked_party_id", sa.String(), sa.ForeignKey("parties.id"), nullable=True),
        sa.Column("linked_lead_id", sa.String(), sa.ForeignKey("leads.id"), nullable=True),
        sa.Column("linked_requirement_id", sa.String(), sa.ForeignKey("requirements.id"), nullable=True),
        sa.Column("linked_property_id", sa.String(), sa.ForeignKey("properties.id"), nullable=True),
        sa.Column("linked_opportunity_id", sa.String(), sa.ForeignKey("opportunities.id"), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_activity_logs_type", "activity_logs", ["type"])
    op.create_index("ix_activity_logs_occurred_at", "activity_logs", ["occurred_at"])

    # ── 12. follow_ups ────────────────────────────────────────────────────────
    op.create_table(
        "follow_ups",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("responsible_id", sa.String(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("linked_party_id", sa.String(), sa.ForeignKey("parties.id"), nullable=True),
        sa.Column("linked_lead_id", sa.String(), sa.ForeignKey("leads.id"), nullable=True),
        sa.Column("linked_requirement_id", sa.String(), sa.ForeignKey("requirements.id"), nullable=True),
        sa.Column("linked_opportunity_id", sa.String(), sa.ForeignKey("opportunities.id"), nullable=True),
        sa.Column("follow_up_type", sa.String(), nullable=True),
        sa.Column("purpose", sa.String(), nullable=False),
        sa.Column("priority", sa.String(), nullable=False, server_default="MEDIUM"),
        sa.Column("status", sa.String(), nullable=False, server_default="PENDING"),
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("expected_outcome", sa.Text(), nullable=True),
        sa.Column("remarks", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_follow_ups_responsible_id", "follow_ups", ["responsible_id"])
    op.create_index("ix_follow_ups_status", "follow_ups", ["status"])
    op.create_index("ix_follow_ups_scheduled_at", "follow_ups", ["scheduled_at"])

    # ── 13. calls ─────────────────────────────────────────────────────────────
    op.create_table(
        "calls",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("party_id", sa.String(), sa.ForeignKey("parties.id"), nullable=False),
        sa.Column("lead_id", sa.String(), sa.ForeignKey("leads.id"), nullable=True),
        sa.Column("caller_id", sa.String(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("call_type", sa.String(), nullable=False),
        sa.Column("outcome", sa.String(), nullable=False),
        sa.Column("duration_minutes", sa.Integer(), nullable=True, server_default="0"),
        sa.Column("remarks", sa.Text(), nullable=True),
        sa.Column("called_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("follow_up_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("follow_up_purpose", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_calls_party_id", "calls", ["party_id"])
    op.create_index("ix_calls_called_at", "calls", ["called_at"])

    # ── 14. tasks ─────────────────────────────────────────────────────────────
    op.create_table(
        "tasks",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("task_type", sa.String(), nullable=True),
        sa.Column("assigned_to_id", sa.String(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_by_id", sa.String(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("priority", sa.String(), nullable=False, server_default="MEDIUM"),
        sa.Column("status", sa.String(), nullable=False, server_default="TODO"),
        sa.Column("due_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("linked_record", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_tasks_assigned_to_id", "tasks", ["assigned_to_id"])
    op.create_index("ix_tasks_status", "tasks", ["status"])

    # ── 15. agent_stats ───────────────────────────────────────────────────────
    op.create_table(
        "agent_stats",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("agent_id", sa.String(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("status", sa.String(), nullable=False, server_default="AVAILABLE"),
        sa.Column("today_visits", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("week_completed", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("rating", sa.Float(), nullable=True),
        sa.Column("last_location", sa.String(), nullable=True),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("agent_id"),
    )
    op.create_index("ix_agent_stats_agent_id", "agent_stats", ["agent_id"], unique=True)

    # ── 16. audit_logs ────────────────────────────────────────────────────────
    op.create_table(
        "audit_logs",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("changed_by_id", sa.String(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("action", sa.String(), nullable=False),
        sa.Column("entity_type", sa.String(), nullable=False),
        sa.Column("entity_id", sa.String(), nullable=False),
        sa.Column("summary", sa.String(), nullable=False),
        sa.Column("diff_json", sa.JSON(), nullable=True),
        sa.Column("occurred_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_audit_logs_changed_by_id", "audit_logs", ["changed_by_id"])
    op.create_index("ix_audit_logs_entity_type", "audit_logs", ["entity_type"])
    op.create_index("ix_audit_logs_occurred_at", "audit_logs", ["occurred_at"])


def downgrade() -> None:
    # Drop in reverse dependency order
    op.drop_table("audit_logs")
    op.drop_table("agent_stats")
    op.drop_table("tasks")
    op.drop_table("calls")
    op.drop_table("follow_ups")
    op.drop_table("activity_logs")
    op.drop_table("transactions")
    op.drop_table("opportunities")
    op.drop_table("visits")
    op.drop_table("matches")
    op.drop_table("requirements")
    op.drop_table("leads")
    op.drop_table("properties")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
    op.drop_table("parties")
