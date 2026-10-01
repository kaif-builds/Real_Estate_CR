"""
Task model — internal operational tasks.
Matches TaskRow from frontend mockData.ts.
"""

import sqlalchemy as sa
from app.core.database import Base


class Task(Base):
    __tablename__ = "tasks"

    id = sa.Column(sa.String, primary_key=True)  # e.g. T-101
    title = sa.Column(sa.String, nullable=False)
    # TaskType: 'Internal' | 'Verification' | 'Documentation' | 'Admin' | 'Other'
    task_type = sa.Column(sa.String, nullable=True)
    assigned_to_name = sa.Column(sa.String, nullable=True)  # denormalized
    assigned_to_id = sa.Column(sa.String, sa.ForeignKey("users.id"), nullable=True, index=True)
    due_date = sa.Column(sa.String, nullable=True)  # ISO datetime string
    # TaskPriority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
    priority = sa.Column(sa.String, nullable=False, default="MEDIUM")
    # TaskStatus: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'OVERDUE'
    status = sa.Column(sa.String, nullable=False, default="TODO")
    # Linked record
    linked_record_type = sa.Column(sa.String, nullable=True)  # 'Property' | 'Requirement' | 'Lead' | 'Opportunity'
    linked_record_id = sa.Column(sa.String, nullable=True)
    linked_record_label = sa.Column(sa.String, nullable=True)
    description = sa.Column(sa.Text, nullable=True)
    created_at = sa.Column(sa.String, nullable=True)  # ISO datetime string
