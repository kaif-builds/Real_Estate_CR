"""
Shared PostgreSQL enum types used across all models.

These map 1:1 to the native Postgres ENUM types created by migration 0002.
Import the enum you need, then reference it in sa.Enum(MyEnum, ...).
"""

import enum


class UserRole(str, enum.Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    OFFICE_EXECUTIVE = "OFFICE_EXECUTIVE"
    AGENT = "AGENT"
    CLIENT = "CLIENT"


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


class LeadType(str, enum.Enum):
    BUYER = "BUYER"
    SELLER = "SELLER"
    OWNER = "OWNER"
    TENANT = "TENANT"
    LANDLORD = "LANDLORD"
    INVESTOR = "INVESTOR"
    CONSULTANT = "CONSULTANT"
    OTHER = "OTHER"


class LeadStatus(str, enum.Enum):
    NEW = "NEW"
    CONTACTED = "CONTACTED"
    QUALIFIED = "QUALIFIED"
    LOST = "LOST"
    WON = "WON"
    STALE = "STALE"
    CLOSED = "CLOSED"


class LeadPriority(str, enum.Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class ChannelType(str, enum.Enum):
    DIGITAL = "Digital"
    OFFLINE = "Offline"


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


class OpportunityStage(str, enum.Enum):
    QUALIFIED = "QUALIFIED"
    PROPERTY_SHARED = "PROPERTY_SHARED"
    SITE_VISIT = "SITE_VISIT"
    NEGOTIATION = "NEGOTIATION"
    DOCUMENTATION = "DOCUMENTATION"
    WON = "WON"
    LOST = "LOST"


class LostReason(str, enum.Enum):
    PRICE_ISSUE = "Price Issue"
    PROPERTY_ISSUE = "Property Issue"
    CUSTOMER_DECISION = "Customer Decision"
    TIMING = "Timing"
    OTHER = "Other"


class TransactionType(str, enum.Enum):
    SALE = "Sale"
    RENT = "Rent"
    LEASE = "Lease"


class PaymentStatus(str, enum.Enum):
    PAID = "Paid"
    PARTIAL = "Partial"
    PENDING = "Pending"


class FollowUpEntityType(str, enum.Enum):
    REQUIREMENT = "Requirement"
    LEAD = "Lead"
    OPPORTUNITY = "Opportunity"


class FollowUpPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class FollowUpStatus(str, enum.Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    RESCHEDULED = "RESCHEDULED"
    CANCELLED = "CANCELLED"
    OVERDUE = "OVERDUE"
    NO_RESPONSE = "NO_RESPONSE"


class VisitPurpose(str, enum.Enum):
    PROPERTY_VIEWING = "Property Viewing"
    OWNER_MEETING = "Owner Meeting"
    VERIFICATION = "Verification"


class VisitStatus(str, enum.Enum):
    ASSIGNED = "Assigned"
    ACCEPTED = "Accepted"
    SCHEDULED = "Scheduled"
    EN_ROUTE = "En Route"
    ARRIVED = "Arrived"
    VISIT_STARTED = "Visit Started"
    VISIT_COMPLETED = "Visit Completed"
    SUBMITTED = "Submitted"
    APPROVED = "Approved"
    REJECTED = "Rejected"
    CANCELLED = "Cancelled"


class TaskType(str, enum.Enum):
    INTERNAL = "Internal"
    VERIFICATION = "Verification"
    DOCUMENTATION = "Documentation"
    ADMIN = "Admin"
    OTHER = "Other"


class TaskPriority(str, enum.Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class TaskStatus(str, enum.Enum):
    TODO = "TODO"
    IN_PROGRESS = "IN_PROGRESS"
    DONE = "DONE"
    OVERDUE = "OVERDUE"


class ActivityType(str, enum.Enum):
    CALL = "CALL"
    FOLLOWUP = "FOLLOWUP"
    WHATSAPP = "WHATSAPP"
    EMAIL = "EMAIL"
    MEETING = "MEETING"
    PROPERTY_SHARE = "PROPERTY_SHARE"
    VISIT = "VISIT"
    TASK = "TASK"
    STATUS_CHANGE = "STATUS_CHANGE"


class CallType(str, enum.Enum):
    OUTBOUND = "OUTBOUND"
    INBOUND = "INBOUND"
    MISSED = "MISSED"


class CallOutcome(str, enum.Enum):
    CONNECTED = "CONNECTED"
    NO_ANSWER = "NO_ANSWER"
    BUSY = "BUSY"
    WRONG_NUMBER = "WRONG_NUMBER"
    CALL_BACK_LATER = "CALL_BACK_LATER"


class Sentiment(str, enum.Enum):
    INTERESTED = "Interested"
    NEUTRAL = "Neutral"
    NOT_INTERESTED = "Not Interested"


class AuditAction(str, enum.Enum):
    CREATED = "Created"
    UPDATED = "Updated"
    DELETED = "Deleted"
    STATUS_CHANGED = "Status Changed"
    CANCELLED = "Cancelled"
    QUERY = "Query"
    CLARIFICATION = "Clarification"
    FAILED = "Failed"


class AuditEntityType(str, enum.Enum):
    PROPERTY = "Property"
    REQUIREMENT = "Requirement"
    LEAD = "Lead"
    VISIT = "Visit"
    OPPORTUNITY = "Opportunity"
    USER = "User"
    TRANSACTION = "Transaction"
    MARKETING_CONFIG = "Marketing Config"
    FOLLOW_UP = "Follow-up"
    TASK = "Task"
    CAMPAIGN = "Campaign"
    GENERAL = "General"
    WORKFLOW = "Workflow"


class CampaignType(str, enum.Enum):
    PROPERTY_PROMOTION = "Property Promotion"
    BUYER_ACQUISITION = "Buyer Acquisition"
    SELLER_ACQUISITION = "Seller Acquisition"
    TENANT_ACQUISITION = "Tenant Acquisition"
    LANDLORD_ACQUISITION = "Landlord Acquisition"
    INVESTOR_ACQUISITION = "Investor Acquisition"
    BRAND_AWARENESS = "Brand Awareness"
    LEAD_GENERATION = "Lead Generation"


class CampaignStatus(str, enum.Enum):
    DRAFT = "Draft"
    PLANNED = "Planned"
    ACTIVE = "Active"
    PAUSED = "Paused"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"


class PartnerCategory(str, enum.Enum):
    PROPERTY_CONSULTANT = "Property Consultant"
    BROKER = "Broker"
    DEVELOPER = "Developer"
    INVESTOR = "Investor"
    CORPORATE_CONTACT = "Corporate Contact"
    REFERRAL_PARTNER = "Referral Partner"
    OTHER = "Other"


class PartnerStatus(str, enum.Enum):
    ACTIVE = "Active"
    INACTIVE = "Inactive"


class TeleCampaignStatus(str, enum.Enum):
    DRAFT = "Draft"
    ACTIVE = "Active"
    PAUSED = "Paused"
    COMPLETED = "Completed"


class TelemarketingPurpose(str, enum.Enum):
    COLD_CALLING = "Cold Calling"
    MARKET_SURVEY = "Market Survey"
    OWNER_ACQUISITION = "Owner Acquisition"
    BUYER_ACQUISITION = "Buyer Acquisition"
    LEAD_REACTIVATION = "Lead Reactivation"
    OTHER = "Other"


class CallDisposition(str, enum.Enum):
    NOT_CALLED = "Not Called"
    CONNECTED = "Connected"
    BUSY = "Busy"
    CALL_LATER = "Call Later"
    INTERESTED = "Interested"
    NOT_INTERESTED = "Not Interested"
    WRONG_NUMBER = "Wrong Number"
    DO_NOT_CONTACT = "Do Not Contact"
    CONVERTED_TO_LEAD = "Converted to Lead"


class ContentType(str, enum.Enum):
    PROPERTY_DESCRIPTION = "Property Description"
    AD_COPY = "Ad Copy"
    IMAGE = "Image"
    VIDEO = "Video"
    BROCHURE = "Brochure"
    FLYER = "Flyer"
    SOCIAL_MEDIA_CREATIVE = "Social Media Creative"
    CAMPAIGN_MESSAGE = "Campaign Message"
    CALL_SCRIPT = "Call Script"
    OTHER = "Other"


class FieldAgentStatus(str, enum.Enum):
    AVAILABLE = "Available"
    ON_VISIT = "On Visit"
    OFF_DUTY = "Off Duty"


class LinkedRecordType(str, enum.Enum):
    PROPERTY = "Property"
    REQUIREMENT = "Requirement"
    LEAD = "Lead"
    OPPORTUNITY = "Opportunity"
