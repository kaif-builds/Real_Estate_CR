"""
Pydantic schemas for all Core CRM entities.
Field names and types match the frontend's Row interfaces exactly.
"""

from datetime import datetime, date
from typing import Optional, Any
from pydantic import BaseModel, field_validator, model_validator


# ═══════════════════════════════════════════════════════════════════════════════
# PARTY
# ═══════════════════════════════════════════════════════════════════════════════

class PartyCreate(BaseModel):
    name: str
    mobile: str
    email: Optional[str] = None
    city: Optional[str] = None
    roles: list[str] = []
    source: Optional[str] = None
    status: Optional[str] = "Active"


class PartyUpdate(BaseModel):
    name: Optional[str] = None
    mobile: Optional[str] = None
    email: Optional[str] = None
    city: Optional[str] = None
    roles: Optional[list[str]] = None
    source: Optional[str] = None
    status: Optional[str] = None


class PartyResponse(BaseModel):
    """Matches frontend PartyRow interface exactly."""
    id: str
    name: str
    email: Optional[str] = None
    mobile: Optional[str] = None
    city: Optional[str] = None
    roles: list[str] = []
    status: Optional[str] = None
    source: Optional[str] = None
    leads_count: int = 0
    requirements_count: int = 0
    opportunities_count: int = 0
    updated_at: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════════
# LEAD
# ═══════════════════════════════════════════════════════════════════════════════

class LeadCreate(BaseModel):
    party_id: str
    lead_type: str
    source: Optional[str] = None
    channel_type: Optional[str] = None
    priority: str = "MEDIUM"
    status: str = "NEW"
    assigned_to_id: Optional[str] = None
    value: Optional[float] = None
    remarks: Optional[str] = None
    campaign_id: Optional[str] = None
    referral_code: Optional[str] = None
    ad_reference: Optional[str] = None
    referral_partner_id: Optional[str] = None
    enquiry_at: Optional[str | datetime] = None


class LeadUpdate(BaseModel):
    party_id: Optional[str] = None
    lead_type: Optional[str] = None
    channel_type: Optional[str] = None
    source: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assigned_to_id: Optional[str] = None
    value: Optional[float] = None
    remarks: Optional[str] = None
    campaign_id: Optional[str] = None
    referral_code: Optional[str] = None
    ad_reference: Optional[str] = None
    referral_partner_id: Optional[str] = None
    next_follow_up_at: Optional[str | datetime] = None
    enquiry_at: Optional[str | datetime] = None


class LeadResponse(BaseModel):
    """Matches frontend LeadRow interface exactly."""
    id: str
    party_id: str
    party_name: str
    channel_type: Optional[str] = None
    source: Optional[str] = None
    lead_type: str
    status: str
    priority: str
    assigned_to_id: Optional[str] = None
    assigned_to_name: Optional[str] = None
    value: Optional[float] = None
    remarks: Optional[str] = None
    last_activity_at: Optional[str] = None
    next_follow_up_at: Optional[str] = None
    created_at: Optional[str] = None
    campaign_id: Optional[str] = None
    campaign_name: Optional[str] = None
    referral_code: Optional[str] = None
    ad_reference: Optional[str] = None
    enquiry_at: Optional[str] = None
    referral_partner_id: Optional[str] = None
    referral_partner_name: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════════
# PROPERTY
# ═══════════════════════════════════════════════════════════════════════════════

class PropertyCreate(BaseModel):
    category: str
    short_loc: str
    address: Optional[str] = None
    price: float
    status: str = "NEW"
    owner_id: str
    source: Optional[str] = None
    availability_date: Optional[str] = None
    details_json: Optional[dict[str, Any]] = None
    lat: Optional[float] = None
    lng: Optional[float] = None

    @field_validator("price")
    @classmethod
    def validate_price(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Price must be greater than 0")
        return v


class PropertyUpdate(BaseModel):
    category: Optional[str] = None
    short_loc: Optional[str] = None
    address: Optional[str] = None
    price: Optional[float] = None
    status: Optional[str] = None
    owner_id: Optional[str] = None
    source: Optional[str] = None
    availability_date: Optional[str] = None
    details_json: Optional[dict[str, Any]] = None
    last_verified_at: Optional[str | datetime] = None
    lat: Optional[float] = None
    lng: Optional[float] = None

    @field_validator("price")
    @classmethod
    def validate_price(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and v <= 0:
            raise ValueError("Price must be greater than 0")
        return v


class PropertyResponse(BaseModel):
    """Matches frontend PropertyRow interface exactly."""
    id: str
    category: str
    short_loc: Optional[str] = None
    address: Optional[str] = None
    price: Optional[float] = None
    status: str
    owner_id: Optional[str] = None
    owner_name: Optional[str] = None
    source: Optional[str] = None
    availability_date: Optional[str] = None
    details_json: Optional[dict[str, Any]] = None
    last_verified_at: Optional[str] = None
    created_at: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None


# ═══════════════════════════════════════════════════════════════════════════════
# REQUIREMENT
# ═══════════════════════════════════════════════════════════════════════════════

class RequirementCreate(BaseModel):
    client_id: str
    category: str
    intent: str
    preferred_short_locs: list[str] = []
    alternate_locs: Optional[list[str]] = []
    min_budget: Optional[float] = None
    max_budget: Optional[float] = None
    min_area: Optional[float] = None
    max_area: Optional[float] = None
    timeline: Optional[str] = None
    facilities: Optional[list[str]] = []
    status: str = "NEW"
    remarks: Optional[str] = None
    assigned_to_id: Optional[str] = None

    @field_validator("min_budget")
    @classmethod
    def validate_min_budget(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and v <= 0:
            raise ValueError("Min budget must be greater than 0")
        return v

    @field_validator("max_budget")
    @classmethod
    def validate_max_budget(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and v <= 0:
            raise ValueError("Max budget must be greater than 0")
        return v

    @model_validator(mode="after")
    def validate_budget_range(self) -> "RequirementCreate":
        if self.min_budget is not None and self.max_budget is not None:
            if self.min_budget > self.max_budget:
                raise ValueError("Min budget cannot be greater than max budget")
        return self


class RequirementUpdate(BaseModel):
    client_id: Optional[str] = None
    category: Optional[str] = None
    intent: Optional[str] = None
    preferred_short_locs: Optional[list[str]] = None
    alternate_locs: Optional[list[str]] = None
    min_budget: Optional[float] = None
    max_budget: Optional[float] = None
    min_area: Optional[float] = None
    max_area: Optional[float] = None
    timeline: Optional[str] = None
    facilities: Optional[list[str]] = None
    status: Optional[str] = None
    remarks: Optional[str] = None
    assigned_to_id: Optional[str] = None

    @field_validator("min_budget")
    @classmethod
    def validate_min_budget(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and v <= 0:
            raise ValueError("Min budget must be greater than 0")
        return v

    @field_validator("max_budget")
    @classmethod
    def validate_max_budget(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and v <= 0:
            raise ValueError("Max budget must be greater than 0")
        return v

    @model_validator(mode="after")
    def validate_budget_range(self) -> "RequirementUpdate":
        if self.min_budget is not None and self.max_budget is not None:
            if self.min_budget > self.max_budget:
                raise ValueError("Min budget cannot be greater than max budget")
        return self


class RequirementResponse(BaseModel):
    """Matches frontend FullRequirementRow interface exactly."""
    id: str
    client_id: str
    client_name: str
    assigned_to_id: Optional[str] = None
    assigned_to_name: Optional[str] = None
    category: str
    intent: str
    preferred_short_locs: list[str] = []
    alternate_locs: Optional[list[str]] = []
    min_budget: Optional[float] = None
    max_budget: Optional[float] = None
    min_area: Optional[float] = None
    max_area: Optional[float] = None
    timeline: Optional[str] = None
    facilities: Optional[list[str]] = []
    status: str
    remarks: Optional[str] = None
    match_count: int = 0
    created_at: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════════
# MATCH
# ═══════════════════════════════════════════════════════════════════════════════

class MatchUpdate(BaseModel):
    status: str  # SUGGESTED, SHARED, VISIT_SCHEDULED, REJECTED, SHORTLISTED


class MatchResponse(BaseModel):
    """Matches frontend MatchRow interface exactly."""
    id: str
    requirement_id: str
    client_name: Optional[str] = None
    property_id: str
    short_loc: Optional[str] = None
    property_category: Optional[str] = None
    property_price: Optional[float] = None
    score: float
    tier: str
    status: str
    score_breakdown: Optional[dict[str, str]] = None
    property_status: Optional[str] = None
    property_unavailable: bool = False


class MatchRunResponse(BaseModel):
    matches: list[MatchResponse]
    summary: str
