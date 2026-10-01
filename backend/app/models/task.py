"""Task model — internal operational tasks."""

import sqlalchemy as sa
from app.core.database import Base
from app.models.enums import TaskType, TaskPriority, TaskStatus, LinkedRecordType


class Task(Base):
    __tablename__ = "tasks"

    id = sa.Column(sa.String, primary_key=True)
    title = sa.Column(sa.String, nullable=False)
    task_type = sa.Column(sa.Enum(TaskType, name='enum_task_type', create_type=False), nullable=True)
    assigned_to_name = sa.Column(sa.String, nullable=True)
    assigned_to_id = sa.Column(sa.String, sa.ForeignKey("users.id"), nullable=True, index=True)
    due_date = sa.Column(sa.DateTime(timezone=True), nullable=True)
    priority = sa.Column(sa.Enum(TaskPriority, name='enum_task_priority', create_type=False), nullable=False, default="MEDIUM")
    status = sa.Column(sa.Enum(TaskStatus, name='enum_task_status', create_type=False), nullable=False, default="TODO")
    linked_record_type = sa.Column(sa.Enum(LinkedRecordType, name='enum_linked_record_type', create_type=False), nullable=True)
    linked_record_id = sa.Column(sa.String, nullable=True)
    linked_record_label = sa.Column(sa.String, nullable=True)
    description = sa.Column(sa.Text, nullable=True)
    created_at = sa.Column(sa.DateTime(timezone=True), nullable=True)
