"""Task model — internal operational tasks."""

import sqlalchemy as sa
from app.core.database import Base, PgEnum
from app.models.enums import TaskType, TaskPriority, TaskStatus, LinkedRecordType


class Task(Base):
    __tablename__ = "tasks"

    id = sa.Column(sa.String, primary_key=True)
    title = sa.Column(sa.String, nullable=False)
    task_type = sa.Column(PgEnum(TaskType, name='enum_task_type'), nullable=True)
    assigned_to_name = sa.Column(sa.String, nullable=True)
    assigned_to_id = sa.Column(sa.String, sa.ForeignKey("users.id"), nullable=True, index=True)
    due_date = sa.Column(sa.DateTime(timezone=True), nullable=True)
    priority = sa.Column(PgEnum(TaskPriority, name='enum_task_priority'), nullable=False, default="MEDIUM")
    status = sa.Column(PgEnum(TaskStatus, name='enum_task_status'), nullable=False, default="TODO")
    linked_record_type = sa.Column(PgEnum(LinkedRecordType, name='enum_linked_record_type'), nullable=True)
    linked_record_id = sa.Column(sa.String, nullable=True)
    linked_record_label = sa.Column(sa.String, nullable=True)
    description = sa.Column(sa.Text, nullable=True)
    created_at = sa.Column(sa.DateTime(timezone=True), nullable=True)
