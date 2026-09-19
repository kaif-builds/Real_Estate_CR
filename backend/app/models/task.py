"""
Task model — internal operational tasks.
Spec: §3.3 Task. Mock: mockData.ts L161–L169.
"""

import sqlalchemy as sa
from sqlalchemy.orm import relationship
from app.core.database import Base


class Task(Base):
    __tablename__ = "tasks"

    id = sa.Column(sa.String, primary_key=True)
    title = sa.Column(sa.String, nullable=False)
    description = sa.Column(sa.Text, nullable=True)
    task_type = sa.Column(sa.String, nullable=True)        # e.g. Verification, Documentation, Admin, Internal
    assigned_to_id = sa.Column(sa.String, sa.ForeignKey("users.id"), nullable=False, index=True)
    created_by_id = sa.Column(sa.String, sa.ForeignKey("users.id"), nullable=True)
    priority = sa.Column(sa.String, nullable=False, default="MEDIUM")  # TaskPriority enum
    status = sa.Column(sa.String, nullable=False, default="TODO")      # TaskStatus enum
    due_date = sa.Column(sa.DateTime(timezone=True), nullable=True)
    completed_at = sa.Column(sa.DateTime(timezone=True), nullable=True)
    # Linked record (free-text reference, e.g. "P-1005", "OPP-5002")
    linked_record = sa.Column(sa.String, nullable=True)
    created_at = sa.Column(sa.DateTime(timezone=True), server_default=sa.func.now())
    updated_at = sa.Column(
        sa.DateTime(timezone=True),
        server_default=sa.func.now(),
        onupdate=sa.func.now(),
    )

    # Relationships
    assigned_to = relationship("User", back_populates="tasks_assigned", foreign_keys=[assigned_to_id])
    created_by = relationship("User", foreign_keys=[created_by_id])
