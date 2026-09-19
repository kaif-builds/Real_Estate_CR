"""
Visit model — property site visits.
Spec: §3.3 Visit. Prisma: schema.prisma L289–L308.
"""

import sqlalchemy as sa
from sqlalchemy.orm import relationship
from app.core.database import Base


class Visit(Base):
    __tablename__ = "visits"

    id = sa.Column(sa.String, primary_key=True)
    property_id = sa.Column(sa.String, sa.ForeignKey("properties.id"), nullable=False, index=True)
    requirement_id = sa.Column(sa.String, sa.ForeignKey("requirements.id"), nullable=True, index=True)
    agent_id = sa.Column(sa.String, sa.ForeignKey("users.id"), nullable=False, index=True)
    status = sa.Column(sa.String, nullable=False, default="ASSIGNED")  # VisitStatus enum
    purpose = sa.Column(sa.String, nullable=True)
    planned_date = sa.Column(sa.DateTime(timezone=True), nullable=False)
    # GPS: expected coords from property, actual coords on arrival
    expected_coords = sa.Column(sa.JSON, nullable=True)  # {lat, lng}
    actual_coords = sa.Column(sa.JSON, nullable=True)    # {lat, lng}
    gps_validation = sa.Column(sa.String, nullable=True) # GpsValidation enum
    # Visit report data (filled in by agent during execution)
    checklist_json = sa.Column(sa.JSON, nullable=True)
    photos_json = sa.Column(sa.JSON, nullable=True)      # list of photo URLs
    outcome_json = sa.Column(sa.JSON, nullable=True)     # {interest, condition, remarks, ...}
    # Manager review
    reviewed_by_id = sa.Column(sa.String, sa.ForeignKey("users.id"), nullable=True)
    review_remarks = sa.Column(sa.Text, nullable=True)
    reviewed_at = sa.Column(sa.DateTime(timezone=True), nullable=True)
    created_at = sa.Column(sa.DateTime(timezone=True), server_default=sa.func.now())
    updated_at = sa.Column(
        sa.DateTime(timezone=True),
        server_default=sa.func.now(),
        onupdate=sa.func.now(),
    )

    # Relationships
    property = relationship("Property", back_populates="visits", foreign_keys=[property_id])
    requirement = relationship("Requirement", back_populates="visits", foreign_keys=[requirement_id])
    agent = relationship("User", back_populates="visits", foreign_keys=[agent_id])
    reviewed_by = relationship("User", foreign_keys=[reviewed_by_id])
