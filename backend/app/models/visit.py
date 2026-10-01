"""
Visit model — property site visits with full review data.
Matches VisitRow and VisitReviewData from frontend mockData.ts.
"""

import sqlalchemy as sa
from app.core.database import Base


class Visit(Base):
    __tablename__ = "visits"

    id = sa.Column(sa.String, primary_key=True)  # e.g. V-501
    property_id = sa.Column(sa.String, sa.ForeignKey("properties.id"), nullable=False, index=True)
    property_short_loc = sa.Column(sa.String, nullable=True)  # denormalized
    client_id = sa.Column(sa.String, sa.ForeignKey("parties.id"), nullable=True, index=True)
    client_name = sa.Column(sa.String, nullable=True)  # denormalized
    agent_id = sa.Column(sa.String, sa.ForeignKey("users.id"), nullable=False, index=True)
    agent_name = sa.Column(sa.String, nullable=True)  # denormalized
    # VisitPurpose: 'Property Viewing' | 'Owner Meeting' | 'Verification'
    purpose = sa.Column(sa.String, nullable=True)
    # VisitStatus: 'Assigned' | 'Accepted' | 'Scheduled' | 'En Route' | 'Arrived' |
    #   'Visit Started' | 'Visit Completed' | 'Submitted' | 'Approved' | 'Rejected' | 'Cancelled'
    status = sa.Column(sa.String, nullable=False, default="Assigned")
    scheduled_date = sa.Column(sa.String, nullable=False)  # ISO datetime string
    submitted_date = sa.Column(sa.String, nullable=True)
    instructions = sa.Column(sa.Text, nullable=True)
    checklist_template = sa.Column(sa.String, nullable=True)
    # Full VisitReviewData JSON: {planned_location, actual_location, distance_variance,
    #   planned_time, actual_time, planned_duration, actual_duration,
    #   photos: {property_front, interior, road_access, signboard},
    #   checklist: [{label, status, reason?}], person_met, customer_interest,
    #   property_condition, next_action, remarks}
    review_data = sa.Column(sa.JSON, nullable=True)
    created_at = sa.Column(sa.String, nullable=True)  # ISO datetime string
