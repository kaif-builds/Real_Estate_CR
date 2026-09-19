"""
SQLAlchemy-compatible enums matching the spec (TECHNICAL_SPEC.md §3.2).

All enums use Python's native Enum + SQLAlchemy's Enum type (stored as VARCHAR).
The string values match the Prisma schema exactly so existing data is portable.
"""

import enum


class PartyRole(str, enum.Enum):
    OWNER = "OWNER"
    BROKER = "BROKER"
    BUILDER = "BUILDER"
    CLIENT = "CLIENT"
    SELLER = "SELLER"
    TENANT = "TENANT"
    LANDLORD = "LANDLORD"
    CONSULTANT = "CONSULTANT"


class LeadType(str, enum.Enum):
    BUYER = "BUYER"
    SELLER = "SELLER"
    OWNER = "OWNER"
    TENANT = "TENANT"
    LANDLORD = "LANDLORD"
    INVESTOR = "INVESTOR"
    CONSULTANT = "CONSULTANT"
    OTHER = "OTHER"


class PropertyCategory(str, enum.Enum):
    RENTAL_RESIDENTIAL = "RENTAL_RESIDENTIAL"
    RENTAL_COMMERCIAL = "RENTAL_COMMERCIAL"
    BUY_SELL_FLAT = "BUY_SELL_FLAT"
    BUY_SELL_COMMERCIAL = "BUY_SELL_COMMERCIAL"
    PLOT = "PLOT"


class PropertyStatus(str, enum.Enum):
    NEW = "NEW"
    UNDER_VERIFICATION = "UNDER_VERIFICATION"
    AVAILABLE = "AVAILABLE"
    ACTIVE = "ACTIVE"
    ON_HOLD = "ON_HOLD"
    RESERVED = "RESERVED"
    UNDER_NEGOTIATION = "UNDER_NEGOTIATION"
    SOLD = "SOLD"
    RENTED = "RENTED"
    LEASED = "LEASED"
    WITHDRAWN = "WITHDRAWN"
    INACTIVE = "INACTIVE"


class Intent(str, enum.Enum):
    BUY = "BUY"
    RENT = "RENT"
    LEASE = "LEASE"


class RequirementStatus(str, enum.Enum):
    NEW = "NEW"
    ACTIVE = "ACTIVE"
    QUALIFIED = "QUALIFIED"
    LOW_CLARITY = "LOW_CLARITY"
    FULFILLED = "FULFILLED"
    DROPPED = "DROPPED"


class MatchTier(str, enum.Enum):
    HIGH = "HIGH"
    GOOD = "GOOD"
    POSSIBLE = "POSSIBLE"


class MatchStatus(str, enum.Enum):
    SUGGESTED = "SUGGESTED"
    SHARED = "SHARED"
    VISIT_SCHEDULED = "VISIT_SCHEDULED"
    REJECTED = "REJECTED"
    SHORTLISTED = "SHORTLISTED"


class ActivityType(str, enum.Enum):
    CALL = "CALL"
    FOLLOWUP = "FOLLOWUP"
    WHATSAPP = "WHATSAPP"
    EMAIL = "EMAIL"
    MEETING = "MEETING"
    PROPERTY_SHARE = "PROPERTY_SHARE"
    VISIT = "VISIT"
    TASK = "TASK"
    OTHER = "OTHER"


class FollowUpStatus(str, enum.Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    RESCHEDULED = "RESCHEDULED"
    CANCELLED = "CANCELLED"
    OVERDUE = "OVERDUE"
    NO_RESPONSE = "NO_RESPONSE"


class VisitStatus(str, enum.Enum):
    ASSIGNED = "ASSIGNED"
    ACCEPTED = "ACCEPTED"
    SCHEDULED = "SCHEDULED"
    EN_ROUTE = "EN_ROUTE"
    ARRIVED = "ARRIVED"
    STARTED = "STARTED"
    COMPLETED = "COMPLETED"
    SUBMITTED = "SUBMITTED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"


class GpsValidation(str, enum.Enum):
    VALID = "VALID"
    PARTIAL = "PARTIAL"
    INVALID = "INVALID"
    UNAVAILABLE = "UNAVAILABLE"


class OpportunityStage(str, enum.Enum):
    QUALIFIED = "QUALIFIED"
    PROPERTY_SHARED = "PROPERTY_SHARED"
    SITE_VISIT = "SITE_VISIT"
    NEGOTIATION = "NEGOTIATION"
    DOCUMENTATION = "DOCUMENTATION"
    WON = "WON"
    LOST = "LOST"


class UserRole(str, enum.Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    OFFICE_EXECUTIVE = "OFFICE_EXECUTIVE"
    AGENT = "AGENT"
    CLIENT = "CLIENT"


class LeadStatus(str, enum.Enum):
    NEW = "NEW"
    CONTACTED = "CONTACTED"
    QUALIFIED = "QUALIFIED"
    LOST = "LOST"


class LeadPriority(str, enum.Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class TaskStatus(str, enum.Enum):
    TODO = "TODO"
    IN_PROGRESS = "IN_PROGRESS"
    OVERDUE = "OVERDUE"
    DONE = "DONE"


class TaskPriority(str, enum.Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class TransactionType(str, enum.Enum):
    SALE = "SALE"
    RENT = "RENT"


class PaymentStatus(str, enum.Enum):
    RECEIVED = "RECEIVED"
    PENDING = "PENDING"
    PARTIAL = "PARTIAL"


class CallType(str, enum.Enum):
    OUTBOUND = "OUTBOUND"
    INBOUND = "INBOUND"
    MISSED = "MISSED"


class CallOutcome(str, enum.Enum):
    CONNECTED = "CONNECTED"
    NO_ANSWER = "NO_ANSWER"
    CALL_BACK_LATER = "CALL_BACK_LATER"
    MISSED = "MISSED"
    BUSY = "BUSY"
    WRONG_NUMBER = "WRONG_NUMBER"


class AgentAvailability(str, enum.Enum):
    ON_VISIT = "ON_VISIT"
    AVAILABLE = "AVAILABLE"
    OFF_DUTY = "OFF_DUTY"
