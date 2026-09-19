# Import all models here so Alembic can discover them via Base.metadata.
# Order matters: tables with no FK dependencies first, then dependents.

from app.models.user import User  # noqa: F401
from app.models.party import Party  # noqa: F401
from app.models.property import Property  # noqa: F401
from app.models.lead import Lead  # noqa: F401
from app.models.requirement import Requirement  # noqa: F401
from app.models.match import Match  # noqa: F401
from app.models.visit import Visit  # noqa: F401
from app.models.opportunity import Opportunity  # noqa: F401
from app.models.transaction import Transaction  # noqa: F401
from app.models.activity_log import ActivityLog  # noqa: F401
from app.models.follow_up import FollowUp  # noqa: F401
from app.models.call import Call  # noqa: F401
from app.models.task import Task  # noqa: F401
from app.models.agent_stats import AgentStats  # noqa: F401
from app.models.audit_log import AuditLog  # noqa: F401
from app.models.enums import (  # noqa: F401
    PartyRole,
    LeadType,
    PropertyCategory,
    PropertyStatus,
    Intent,
    RequirementStatus,
    MatchTier,
    MatchStatus,
    ActivityType,
    FollowUpStatus,
    VisitStatus,
    GpsValidation,
    OpportunityStage,
    UserRole,
    LeadStatus,
    LeadPriority,
    TaskStatus,
    TaskPriority,
    TransactionType,
    PaymentStatus,
    CallType,
    CallOutcome,
    AgentAvailability,
)
