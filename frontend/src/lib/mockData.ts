/**
 * Mock data for frontend development.
 *
 * TEMPORARY: This entire file will be replaced with real API calls
 * during the "connect to backend" pass. It mirrors the seed_dev.py data
 * so the UI looks realistic during development.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LeadRow {
  id: string
  party_id: string
  party_name: string
  source: string | null
  lead_type: string
  status: string
  priority: string
  assigned_to_id: string | null
  assigned_to_name: string | null
  value: number | null
  remarks: string | null
  last_activity_at: string | null
  next_follow_up_at: string | null
  created_at: string | null
  campaign_id?: string | null
  campaign_name?: string | null
}

export type CampaignType =
  | 'Property Promotion'
  | 'Buyer Acquisition'
  | 'Seller Acquisition'
  | 'Tenant Acquisition'
  | 'Landlord Acquisition'
  | 'Investor Acquisition'
  | 'Brand Awareness'
  | 'Lead Generation'

export type CampaignStatus =
  | 'Draft'
  | 'Planned'
  | 'Active'
  | 'Paused'
  | 'Completed'
  | 'Cancelled'

export type TargetAudienceType =
  | 'Buyers'
  | 'Sellers'
  | 'Owners'
  | 'Tenants'
  | 'Landlords'
  | 'Investors'
  | 'Developers'
  | 'Brokers'

export type PropertyCategoryType =
  | 'Residential'
  | 'Commercial'
  | 'Industrial'
  | 'Agricultural'

export type TransactionType =
  | 'Sale'
  | 'Purchase'
  | 'Rent'
  | 'Lease'

export interface CampaignRow {
  id: string
  name: string
  type: CampaignType
  status: CampaignStatus
  start_date: string
  end_date: string
  owner_id: string
  owner_name: string
  objective: string
  target_audience: TargetAudienceType[]
  geography: string
  categories: PropertyCategoryType[]
  transaction_types: TransactionType[]
  planned_budget: number
  target_leads: number
  target_qualified_leads: number
  target_opportunities: number
  promoted_properties?: string[]
  created_at: string
  updated_at: string
}

export interface PartyRow {
  id: string
  name: string
  email: string | null
  mobile: string
  city: string | null
  roles: string[]
  status: string | null
  source: string | null
  leads_count: number
  requirements_count: number
  opportunities_count: number
  updated_at: string | null
}

export interface PartyDetail {
  party: {
    id: string; name: string; email: string | null; mobile: string
    city: string | null; roles: string[]; tags: string[]; source: string | null
    remarks: string | null; status: string | null
    created_at: string | null; updated_at: string | null
  }
  leads: LeadRow[]
  requirements: RequirementRow[]
  opportunities: OpportunityRow[]
}

export interface RequirementRow {
  id: string; category: string; intent: string
  preferred_short_locs: string[]; min_budget: number | null
  max_budget: number | null; status: string
}

export interface OpportunityRow {
  id: string; stage: string; expected_value: number | null
  expected_commission: number | null; probability: number | null; role: string
}

export interface UserOption {
  id: string
  name: string
  email: string
  role: string
  // TEMPORARY / DEMO ONLY — to be replaced with real hashed passwords checked server-side once real auth exists
  password?: string
}

// ── Users (for assignment dropdowns & authentication) ─────────────────────────

export const MOCK_USERS: UserOption[] = [
  { id: 'u1', name: 'Aman Desai',    email: 'aman@propdesk.in',   role: 'SUPER_ADMIN',      password: 'Demo@123' },
  { id: 'u2', name: 'Neha Kapoor',   email: 'neha@propdesk.in',   role: 'OFFICE_EXECUTIVE', password: 'Demo@123' },
  { id: 'u3', name: 'Ravi Mehta',    email: 'ravi@propdesk.in',   role: 'AGENT',            password: 'Demo@123' },
  { id: 'u4', name: 'Vikram Singh',  email: 'vikram@propdesk.in', role: 'CLIENT',           password: 'Demo@123' },
  { id: 'u5', name: 'Priya Sharma',  email: 'priya@propdesk.in',  role: 'AGENT',            password: 'Demo@123' },
  { id: 'u6', name: 'Amit Patel',    email: 'amit.p@propdesk.in', role: 'AGENT',            password: 'Demo@123' },
  { id: 'u7', name: 'Sanjay Verma',  email: 'sanjay@propdesk.in', role: 'AGENT',            password: 'Demo@123' },
]

// ── Parties ───────────────────────────────────────────────────────────────────

export const MOCK_PARTIES: PartyRow[] = [
  { id: 'p1', name: 'Ramesh Patel',   email: 'ramesh@example.com',  mobile: '+91 9876543210', city: 'Indore',  roles: ['OWNER', 'SELLER'],   status: 'Active', source: 'Walk-in',  leads_count: 0, requirements_count: 0, opportunities_count: 1, updated_at: '2026-09-15T10:30:00Z' },
  { id: 'p2', name: 'Sunita Gupta',   email: 'sunita@example.com',  mobile: '+91 9876543211', city: 'Bhopal',  roles: ['OWNER'],             status: 'Active', source: 'Referral', leads_count: 0, requirements_count: 0, opportunities_count: 1, updated_at: '2026-09-14T08:00:00Z' },
  { id: 'p3', name: 'Vikram Singh',   email: 'vikram@example.com',  mobile: '+91 9876543212', city: 'Indore',  roles: ['BUYER', 'TENANT'],   status: 'Active', source: 'Website',  leads_count: 1, requirements_count: 2, opportunities_count: 1, updated_at: '2026-09-16T14:00:00Z' },
  { id: 'p4', name: 'Amit Jain',      email: 'amit@example.com',    mobile: '+91 9876543213', city: 'Indore',  roles: ['BUYER', 'CLIENT'],   status: 'Active', source: 'Website',  leads_count: 1, requirements_count: 2, opportunities_count: 1, updated_at: '2026-09-16T09:00:00Z' },
  { id: 'p5', name: 'Kavita Sharma',  email: 'kavita@example.com',  mobile: '+91 9876543214', city: 'Pune',    roles: ['LANDLORD'],          status: 'Active', source: null,       leads_count: 0, requirements_count: 0, opportunities_count: 1, updated_at: '2026-09-13T12:00:00Z' },
  { id: 'p6', name: 'Rahul Verma',    email: 'rahul@example.com',   mobile: '+91 9876543215', city: 'Indore',  roles: ['BUYER', 'TENANT'],   status: 'Active', source: 'Referral', leads_count: 1, requirements_count: 2, opportunities_count: 1, updated_at: '2026-09-15T16:00:00Z' },
  { id: 'p7', name: 'Deepak Broker',  email: 'deepak@example.com',  mobile: '+91 9876543216', city: 'Ujjain',  roles: ['BROKER'],            status: 'Active', source: null,       leads_count: 1, requirements_count: 0, opportunities_count: 0, updated_at: '2026-09-12T11:00:00Z' },
  { id: 'p8', name: 'Meena Builder',  email: 'meena@example.com',   mobile: '+91 9876543217', city: 'Indore',  roles: ['BUILDER'],           status: 'Active', source: null,       leads_count: 0, requirements_count: 0, opportunities_count: 0, updated_at: '2026-09-10T09:00:00Z' },
]

// ── Leads ─────────────────────────────────────────────────────────────────────

export const MOCK_LEADS: LeadRow[] = [
  { id: 'L-1001', party_id: 'p4', party_name: 'Amit Jain',    source: 'Website',  lead_type: 'BUYER',    status: 'CONTACTED',  priority: 'HIGH',     assigned_to_id: 'u2', assigned_to_name: 'Neha Kapoor',  value: 7500000,  remarks: 'Interested in 2BHK Scheme 140', last_activity_at: '2026-09-18T10:00:00Z', next_follow_up_at: '2026-09-19T12:00:00Z', created_at: '2026-09-10T09:00:00Z', campaign_id: 'CMP-2026-002', campaign_name: 'Scheme 140 Luxury High-Rise Influx' },
  { id: 'L-1002', party_id: 'p3', party_name: 'Vikram Singh', source: 'Referral', lead_type: 'TENANT',   status: 'NEW',        priority: 'MEDIUM',   assigned_to_id: 'u3', assigned_to_name: 'Ravi Mehta',   value: null,     remarks: null,                            last_activity_at: '2026-09-17T14:00:00Z', next_follow_up_at: null,                   created_at: '2026-09-12T11:00:00Z', campaign_id: 'CMP-2026-003', campaign_name: 'Corporate Office Space Lease Drive' },
  { id: 'L-1003', party_id: 'p6', party_name: 'Rahul Verma',  source: 'Walk-in',  lead_type: 'BUYER',    status: 'QUALIFIED',  priority: 'CRITICAL', assigned_to_id: 'u2', assigned_to_name: 'Neha Kapoor',  value: 5000000,  remarks: 'Ready to finalize',             last_activity_at: '2026-09-18T08:00:00Z', next_follow_up_at: '2026-09-20T10:00:00Z', created_at: '2026-09-08T15:00:00Z', campaign_id: 'CMP-2026-001', campaign_name: 'Super Corridor Tech Hub Promotion' },
  { id: 'L-1004', party_id: 'p7', party_name: 'Deepak Broker',source: null,       lead_type: 'CONSULTANT', status: 'LOST',     priority: 'LOW',      assigned_to_id: null, assigned_to_name: null,           value: null,     remarks: 'Not responsive',                last_activity_at: '2026-09-05T09:00:00Z', next_follow_up_at: null,                   created_at: '2026-09-01T08:00:00Z', campaign_id: null, campaign_name: null },
  { id: 'L-1005', party_id: 'p3', party_name: 'Vikram Singh', source: 'Digital Ad', lead_type: 'BUYER',   status: 'NEW',        priority: 'HIGH',     assigned_to_id: 'u2', assigned_to_name: 'Neha Kapoor',  value: 8500000,  remarks: 'Inquired from Super Corridor Meta ad', last_activity_at: '2026-09-19T11:00:00Z', next_follow_up_at: '2026-09-21T10:00:00Z', created_at: '2026-09-19T11:00:00Z', campaign_id: 'CMP-2026-001', campaign_name: 'Super Corridor Tech Hub Promotion' },
  { id: 'L-1006', party_id: 'p4', party_name: 'Amit Jain',    source: 'Google Ads', lead_type: 'INVESTOR', status: 'CONTACTED', priority: 'MEDIUM',   assigned_to_id: 'u3', assigned_to_name: 'Ravi Mehta',   value: 6500000,  remarks: 'Looking for commercial plot near IT SEZ', last_activity_at: '2026-09-17T15:30:00Z', next_follow_up_at: '2026-09-20T16:00:00Z', created_at: '2026-09-15T14:00:00Z', campaign_id: 'CMP-2026-001', campaign_name: 'Super Corridor Tech Hub Promotion' },
  { id: 'L-1007', party_id: 'p6', party_name: 'Rahul Verma',  source: 'Landing Page', lead_type: 'BUYER',  status: 'QUALIFIED',  priority: 'HIGH',     assigned_to_id: 'u1', assigned_to_name: 'Aman Desai',   value: 9200000,  remarks: 'Visited landing page for 3BHK penthouse', last_activity_at: '2026-09-20T10:00:00Z', next_follow_up_at: '2026-09-22T11:00:00Z', created_at: '2026-09-16T09:30:00Z', campaign_id: 'CMP-2026-002', campaign_name: 'Scheme 140 Luxury High-Rise Influx' },
  { id: 'L-1008', party_id: 'p2', party_name: 'Sunita Gupta', source: 'Telecalling', lead_type: 'LANDLORD', status: 'CONTACTED', priority: 'MEDIUM',   assigned_to_id: 'u2', assigned_to_name: 'Neha Kapoor',  value: 35000,    remarks: 'Agreed for rental listing in Vijay Nagar', last_activity_at: '2026-08-20T16:00:00Z', next_follow_up_at: null,                   created_at: '2026-08-15T12:00:00Z', campaign_id: 'CMP-2026-004', campaign_name: 'Vijay Nagar Landlord Onboarding Q3' },
]

// ── Party details ─────────────────────────────────────────────────────────────

export function getMockPartyDetail(partyId: string): PartyDetail | null {
  const party = MOCK_PARTIES.find(p => p.id === partyId)
  if (!party) return null

  const leads = MOCK_LEADS.filter(l => l.party_id === partyId)

  const requirements: RequirementRow[] = partyId === 'p4' ? [
    { id: 'R-2001', category: 'RENTAL_RESIDENTIAL', intent: 'RENT', preferred_short_locs: ['01-Schm140_Mayank', '07-Geeta_Bhawan'], min_budget: 12000, max_budget: 20000, status: 'ACTIVE' },
    { id: 'R-2004', category: 'BUY_SELL_FLAT', intent: 'BUY', preferred_short_locs: ['08-SAPNA_SANGEETA'], min_budget: 3500000, max_budget: 5000000, status: 'ACTIVE' },
  ] : partyId === 'p3' ? [
    { id: 'R-2002', category: 'BUY_SELL_FLAT', intent: 'BUY', preferred_short_locs: ['01-Schm140_Mayank'], min_budget: 4000000, max_budget: 6000000, status: 'ACTIVE' },
    { id: 'R-2005', category: 'RENTAL_COMMERCIAL', intent: 'RENT', preferred_short_locs: ['05-MG_Road'], min_budget: 25000, max_budget: 40000, status: 'ACTIVE' },
  ] : partyId === 'p6' ? [
    { id: 'R-2003', category: 'BUY_SELL_FLAT', intent: 'BUY', preferred_short_locs: ['09-Super_Corridor'], min_budget: 6000000, max_budget: 8000000, status: 'ACTIVE' },
    { id: 'R-2006', category: 'RENTAL_RESIDENTIAL', intent: 'RENT', preferred_short_locs: ['07-Geeta_Bhawan', '04-Vijay_Nagar'], min_budget: 15000, max_budget: 25000, status: 'ACTIVE' },
  ] : []

  const opportunities: OpportunityRow[] = partyId === 'p4' ? [
    { id: 'OPP-5002', stage: 'WON', expected_value: 15000, expected_commission: 15000, probability: 100, role: 'Buyer' },
  ] : partyId === 'p3' ? [
    { id: 'OPP-5001', stage: 'NEGOTIATION', expected_value: 4500000, expected_commission: 90000, probability: 60, role: 'Buyer' },
  ] : partyId === 'p6' ? [
    { id: 'OPP-5003', stage: 'PROPOSAL', expected_value: 7000000, expected_commission: 140000, probability: 40, role: 'Buyer' },
  ] : partyId === 'p1' ? [
    { id: 'OPP-5001', stage: 'NEGOTIATION', expected_value: 4500000, expected_commission: 90000, probability: 60, role: 'Seller' },
  ] : partyId === 'p2' ? [
    { id: 'OPP-5002', stage: 'WON', expected_value: 15000, expected_commission: 15000, probability: 100, role: 'Seller' },
  ] : partyId === 'p5' ? [
    { id: 'OPP-5002', stage: 'WON', expected_value: 15000, expected_commission: 15000, probability: 100, role: 'Seller' },
  ] : []

  return {
    party: {
      id: party.id,
      name: party.name,
      email: party.email,
      mobile: party.mobile,
      city: party.city,
      roles: party.roles,
      tags: [],
      source: party.source,
      remarks: null,
      status: party.status,
      created_at: '2026-09-01T08:00:00Z',
      updated_at: party.updated_at,
    },
    leads,
    requirements,
    opportunities,
  }
}

// ── Property types & data ─────────────────────────────────────────────────────

export interface PropertyRow {
  id: string
  category: string
  short_loc: string
  address: string | null
  price: number
  status: string
  owner_id: string
  owner_name: string
  source?: 'Owner' | 'Broker' | 'Builder-Marketing' | string
  availability_date?: string | null
  details_json: Record<string, unknown> | null
  last_verified_at: string | null
  created_at: string
  lat?: number
  lng?: number
}

// ── Distance Calculation Helper (Haversine formula in metres) ─────────────────
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3 // Earth radius in metres
  const phi1 = (lat1 * Math.PI) / 180
  const phi2 = (lat2 * Math.PI) / 180
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return Math.round(R * c)
}

export const MOCK_PROPERTIES: PropertyRow[] = [
  { id: 'P-1001', category: 'RENTAL_RESIDENTIAL', short_loc: '01-Schm140_Mayank', address: 'Flat 302, Mayank Heights, Scheme 140, Indore',  price: 18000,   status: 'AVAILABLE',         owner_id: 'p1', owner_name: 'Ramesh Patel',  source: 'Owner', availability_date: '2026-10-01', details_json: { bhk: '2 BHK', furnishing: 'Semi-Furnished', built_up_area: 1100, floor: '3rd', parking: '1 Covered' },  last_verified_at: '2026-09-17T10:00:00Z', created_at: '2026-09-01T08:00:00Z', lat: 22.7050, lng: 75.9080 },
  { id: 'P-1002', category: 'RENTAL_RESIDENTIAL', short_loc: '07-Geeta_Bhawan',   address: 'B-12, Near Geeta Bhawan Square, Indore',     price: 24000,   status: 'NEW',               owner_id: 'p2', owner_name: 'Sunita Gupta',  source: 'Broker', availability_date: '2026-09-25', details_json: { bhk: '3 BHK', furnishing: 'Fully-Furnished', built_up_area: 1450, floor: '2nd', parking: '2 Covered' }, last_verified_at: '2026-09-18T14:00:00Z', created_at: '2026-09-02T08:00:00Z', lat: 22.7170, lng: 75.8820 },
  { id: 'P-1003', category: 'BUY_SELL_FLAT',      short_loc: '01-Schm140_Mayank', address: 'Tower B-604, Mayank Blue Star, Indore',       price: 5400000, status: 'AVAILABLE',         owner_id: 'p1', owner_name: 'Ramesh Patel',  source: 'Owner', availability_date: 'Immediate', details_json: { bhk: '3 BHK', furnishing: 'Unfurnished', built_up_area: 1650, floor: '6th', parking: '1 Covered' },    last_verified_at: '2026-09-16T09:00:00Z', created_at: '2026-09-01T08:00:00Z', lat: 22.7055, lng: 75.9085 },
  { id: 'P-1004', category: 'BUY_SELL_FLAT',      short_loc: '08-SAPNA_SANGEETA', address: '3rd Floor, Sapna Commercial Complex, Indore',price: 4200000, status: 'UNDER_NEGOTIATION', owner_id: 'p2', owner_name: 'Sunita Gupta',  source: 'Broker', availability_date: 'Immediate', details_json: { bhk: '2 BHK', furnishing: 'Semi-Furnished', built_up_area: 1050, floor: '3rd', parking: 'Open' },      last_verified_at: '2026-09-13T11:00:00Z', created_at: '2026-09-03T08:00:00Z', lat: 22.7020, lng: 75.8670 },
  { id: 'P-1005', category: 'RENTAL_COMMERCIAL',  short_loc: '05-MG_Road',         address: 'Unit 401, Sapphire Twin Tower, MG Road, Indore',price: 45000, status: 'ON_HOLD',           owner_id: 'p5', owner_name: 'Kavita Sharma', source: 'Owner', availability_date: '2026-11-01', details_json: { seater_capacity: 22, cabins: 2, conference_room: true, washroom: true, pantry: true, built_up_area: 1200 }, last_verified_at: '2026-09-10T16:00:00Z', created_at: '2026-09-04T08:00:00Z', lat: 22.7244, lng: 75.8752 },
  { id: 'P-1006', category: 'BUY_SELL_COMMERCIAL', short_loc: '05-MG_Road',        address: 'Ground Floor Showroom, Central Mall, MG Road',price: 18500000,status: 'AVAILABLE',        owner_id: 'p5', owner_name: 'Kavita Sharma', source: 'Builder-Marketing', availability_date: 'Immediate', details_json: { seater_capacity: 40, cabins: 4, conference_room: true, washroom: true, pantry: true, built_up_area: 2600 }, last_verified_at: '2026-09-11T08:00:00Z', created_at: '2026-09-05T08:00:00Z', lat: 22.7250, lng: 75.8760 },
  { id: 'P-1007', category: 'RENTAL_RESIDENTIAL', short_loc: '04-Vijay_Nagar',     address: 'Plot 88, Scheme 54, Vijay Nagar, Indore',    price: 16000,   status: 'RENTED',            owner_id: 'p1', owner_name: 'Ramesh Patel',  source: 'Broker', availability_date: 'Leased', details_json: { bhk: '1 BHK', furnishing: 'Fully-Furnished', built_up_area: 650, floor: '1st', parking: '1 Covered' },     last_verified_at: '2026-09-02T09:00:00Z', created_at: '2026-09-06T08:00:00Z', lat: 22.7533, lng: 75.8937 },
  { id: 'P-1008', category: 'PLOT',               short_loc: '09-Super_Corridor',  address: 'Sector 3A, Super Corridor Enclave, Indore',  price: 6500000, status: 'AVAILABLE',         owner_id: 'p8', owner_name: 'Meena Builder', source: 'Builder-Marketing', availability_date: 'Immediate', details_json: { facing: 'East', plot_number: 'C-104', size: 1800, unit: 'sqft' },                 last_verified_at: '2026-09-17T10:00:00Z', created_at: '2026-09-07T08:00:00Z', lat: 22.7800, lng: 75.8200 },
  { id: 'P-1009', category: 'BUY_SELL_FLAT',      short_loc: '09-Super_Corridor',  address: 'A-901, Signature Park, Super Corridor',      price: 7200000, status: 'NEW',               owner_id: 'p8', owner_name: 'Meena Builder', source: 'Builder-Marketing', availability_date: 'Under Construction', details_json: { bhk: '3 BHK', furnishing: 'Unfurnished', built_up_area: 1750, floor: '9th', parking: '2 Covered' }, last_verified_at: '2026-09-19T09:00:00Z', created_at: '2026-09-08T08:00:00Z', lat: 22.7810, lng: 75.8210 },
  { id: 'P-1010', category: 'RENTAL_RESIDENTIAL', short_loc: '07-Geeta_Bhawan',   address: 'House 44, Geeta Colony, Indore',             price: 14000,   status: 'SOLD',              owner_id: 'p2', owner_name: 'Sunita Gupta',  source: 'Owner', availability_date: 'Sold Out', details_json: { bhk: '2 BHK', furnishing: 'Unfurnished', built_up_area: 900, floor: 'Ground', parking: 'Open' },       last_verified_at: '2026-08-20T10:00:00Z', created_at: '2026-09-01T08:00:00Z', lat: 22.7175, lng: 75.8825 },
  { id: 'P-1011', category: 'PLOT',               short_loc: '01-Schm140_Mayank', address: 'Plot 12, VIP Enclave, Scheme 140, Indore',   price: 12000000,status: 'UNDER_NEGOTIATION', owner_id: 'p1', owner_name: 'Ramesh Patel',  source: 'Owner', availability_date: 'Immediate', details_json: { facing: 'North-East', plot_number: 'A-12', size: 2400, unit: 'sqft' },              last_verified_at: '2026-09-08T11:00:00Z', created_at: '2026-09-10T08:00:00Z', lat: 22.7060, lng: 75.9090 },
  { id: 'P-1012', category: 'RENTAL_COMMERCIAL',  short_loc: '04-Vijay_Nagar',     address: 'Floor 2, Scheme 78 Commercial, Vijay Nagar', price: 65000,   status: 'AVAILABLE',         owner_id: 'p5', owner_name: 'Kavita Sharma', source: 'Broker', availability_date: '2026-10-15', details_json: { seater_capacity: 35, cabins: 3, conference_room: true, washroom: true, pantry: true, built_up_area: 1800 }, last_verified_at: null, created_at: '2026-09-12T08:00:00Z', lat: 22.7540, lng: 75.8950 },
]

// ── Full Requirement type (for requirements page) ─────────────────────────────

export interface FullRequirementRow {
  id: string
  client_id: string
  client_name: string
  assigned_to_id: string | null
  assigned_to_name: string | null
  category: string
  intent: string
  preferred_short_locs: string[]
  alternate_locs?: string[]
  min_budget: number | null
  max_budget: number | null
  min_area?: number | null
  max_area?: number | null
  timeline?: string | null
  facilities?: string[]
  status: string
  remarks: string | null
  created_at: string
}

export const MOCK_REQUIREMENTS: FullRequirementRow[] = [
  { id: 'R-2001', client_id: 'p4', client_name: 'Amit Jain',      assigned_to_id: 'u2', assigned_to_name: 'Neha Kapoor', category: 'RENTAL_RESIDENTIAL', intent: 'RENT',  preferred_short_locs: ['01-Schm140_Mayank', '07-Geeta_Bhawan'], alternate_locs: ['04-Vijay_Nagar'], min_budget: 12000, max_budget: 20000, min_area: 900, max_area: 1300, timeline: 'Immediate', facilities: ['Parking', 'Furnished'], status: 'ACTIVE',      remarks: 'Family of 4, needs 2BHK min',                         created_at: '2026-09-05T08:00:00Z' },
  { id: 'R-2002', client_id: 'p3', client_name: 'Vikram Singh',   assigned_to_id: 'u3', assigned_to_name: 'Ravi Mehta',  category: 'BUY_SELL_FLAT',      intent: 'BUY',   preferred_short_locs: ['01-Schm140_Mayank'], alternate_locs: ['08-SAPNA_SANGEETA'], min_budget: 4000000, max_budget: 6000000, min_area: 1200, max_area: 1800, timeline: '1 month', facilities: ['Parking', 'Lift', 'Security'], status: 'QUALIFIED',   remarks: 'Ready to buy, pre-approved loan',                     created_at: '2026-09-06T08:00:00Z' },
  { id: 'R-2003', client_id: 'p6', client_name: 'Rahul Verma',    assigned_to_id: 'u2', assigned_to_name: 'Neha Kapoor', category: 'BUY_SELL_FLAT',      intent: 'BUY',   preferred_short_locs: ['09-Super_Corridor'], alternate_locs: [], min_budget: 6000000, max_budget: 8000000, min_area: 1500, max_area: 2200, timeline: '3 months', facilities: ['Parking', 'Power Backup'], status: 'ACTIVE',      remarks: 'Wants 3BHK, east facing preferred',                   created_at: '2026-09-07T08:00:00Z' },
  { id: 'R-2004', client_id: 'p4', client_name: 'Amit Jain',      assigned_to_id: 'u2', assigned_to_name: 'Neha Kapoor', category: 'BUY_SELL_FLAT',      intent: 'BUY',   preferred_short_locs: ['08-SAPNA_SANGEETA'], alternate_locs: ['07-Geeta_Bhawan'], min_budget: 3500000, max_budget: 5000000, min_area: 1000, max_area: 1400, timeline: 'Immediate', facilities: ['Lift'], status: 'NEW',         remarks: 'Looking for investment in rental-friendly building',  created_at: '2026-09-08T08:00:00Z' },
  { id: 'R-2005', client_id: 'p3', client_name: 'Vikram Singh',   assigned_to_id: 'u3', assigned_to_name: 'Ravi Mehta',  category: 'RENTAL_COMMERCIAL',  intent: 'RENT',  preferred_short_locs: ['05-MG_Road'], alternate_locs: ['04-Vijay_Nagar'], min_budget: 25000, max_budget: 40000, min_area: 600, max_area: 1200, timeline: '1 month', facilities: ['Power Backup', 'Security'], status: 'ACTIVE',      remarks: 'Office space for IT startup',                         created_at: '2026-09-09T08:00:00Z' },
  { id: 'R-2006', client_id: 'p6', client_name: 'Rahul Verma',    assigned_to_id: null, assigned_to_name: null,          category: 'RENTAL_RESIDENTIAL', intent: 'RENT',  preferred_short_locs: ['07-Geeta_Bhawan', '04-Vijay_Nagar'], alternate_locs: [], min_budget: 15000, max_budget: 25000, min_area: 800, max_area: 1100, timeline: 'Immediate', facilities: ['Furnished'], status: 'LOW_CLARITY',  remarks: 'Budget unclear, waiting for spouse confirmation',      created_at: '2026-09-10T08:00:00Z' },
  { id: 'R-2007', client_id: 'p8', client_name: 'Meena Builder',  assigned_to_id: 'u1', assigned_to_name: 'Aman Desai',  category: 'PLOT',               intent: 'BUY',   preferred_short_locs: ['09-Super_Corridor'], alternate_locs: ['01-Schm140_Mayank'], min_budget: 5000000, max_budget: 9000000, min_area: 1800, max_area: 3000, timeline: 'Flexible', facilities: [], status: 'FULFILLED',    remarks: 'Purchased plot in Super Corridor Enclave',            created_at: '2026-08-25T08:00:00Z' },
  { id: 'R-2008', client_id: 'p5', client_name: 'Kavita Sharma',  assigned_to_id: 'u2', assigned_to_name: 'Neha Kapoor', category: 'BUY_SELL_COMMERCIAL', intent: 'BUY',   preferred_short_locs: ['05-MG_Road'], alternate_locs: [], min_budget: 10000000, max_budget: 15000000, min_area: 1500, max_area: 2500, timeline: '3 months', facilities: ['Parking', 'Lift'], status: 'DROPPED',      remarks: 'Client postponed commercial expansion',               created_at: '2026-08-15T08:00:00Z' },
]

// ── Match types & data ────────────────────────────────────────────────────────

export interface MatchRow {
  id: string
  requirement_id: string
  client_name: string
  property_id: string
  short_loc: string
  property_category: string
  property_price: number
  score: number
  tier: string
  status: string
  reject_reason?: string | null
  score_breakdown: Record<string, string>
}

export const MOCK_MATCHES: MatchRow[] = [
  { id: 'M-1',  requirement_id: 'R-2001', client_name: 'Amit Jain',    property_id: 'P-1001', short_loc: '01-Schm140_Mayank', property_category: 'RENTAL_RESIDENTIAL', property_price: 18000,   score: 95.5, tier: 'HIGH',     status: 'SHARED',           score_breakdown: { location: 'PASS', budget: 'PASS', type: 'PASS', availability: 'PASS' } },
  { id: 'M-2',  requirement_id: 'R-2001', client_name: 'Amit Jain',    property_id: 'P-1002', short_loc: '07-Geeta_Bhawan',   property_category: 'RENTAL_RESIDENTIAL', property_price: 24000,   score: 88.0, tier: 'HIGH',     status: 'SUGGESTED',        score_breakdown: { location: 'PASS', budget: 'PASS', type: 'PASS', availability: 'WARNING (price near upper limit)' } },
  { id: 'M-3',  requirement_id: 'R-2002', client_name: 'Vikram Singh', property_id: 'P-1003', short_loc: '01-Schm140_Mayank', property_category: 'BUY_SELL_FLAT',      property_price: 5400000, score: 92.0, tier: 'HIGH',     status: 'VISIT_SCHEDULED',  score_breakdown: { location: 'PASS', budget: 'PASS', type: 'PASS', availability: 'PASS' } },
  { id: 'M-4',  requirement_id: 'R-2002', client_name: 'Vikram Singh', property_id: 'P-1004', short_loc: '08-SAPNA_SANGEETA', property_category: 'BUY_SELL_FLAT',      property_price: 4200000, score: 72.0, tier: 'POSSIBLE', status: 'SUGGESTED',        score_breakdown: { location: 'WARNING (different area)', budget: 'PASS', type: 'PASS', availability: 'WARNING (under negotiation)' } },
  { id: 'M-5',  requirement_id: 'R-2003', client_name: 'Rahul Verma',  property_id: 'P-1009', short_loc: '09-Super_Corridor', property_category: 'BUY_SELL_FLAT',      property_price: 7200000, score: 85.0, tier: 'GOOD',     status: 'SHORTLISTED',      score_breakdown: { location: 'PASS', budget: 'PASS', type: 'PASS', availability: 'PASS' } },
  { id: 'M-6',  requirement_id: 'R-2004', client_name: 'Amit Jain',    property_id: 'P-1004', short_loc: '08-SAPNA_SANGEETA', property_category: 'BUY_SELL_FLAT',      property_price: 4200000, score: 78.0, tier: 'GOOD',     status: 'SUGGESTED',        score_breakdown: { location: 'PASS', budget: 'WARNING (5% over max)', type: 'PASS', availability: 'WARNING (under negotiation)' } },
  { id: 'M-7',  requirement_id: 'R-2005', client_name: 'Vikram Singh', property_id: 'P-1005', short_loc: '05-MG_Road',        property_category: 'RENTAL_COMMERCIAL',  property_price: 45000,   score: 90.0, tier: 'HIGH',     status: 'SUGGESTED',        score_breakdown: { location: 'PASS', budget: 'PASS', type: 'PASS', availability: 'PASS' } },
  { id: 'M-8',  requirement_id: 'R-2006', client_name: 'Rahul Verma',  property_id: 'P-1002', short_loc: '07-Geeta_Bhawan',   property_category: 'RENTAL_RESIDENTIAL', property_price: 24000,   score: 82.0, tier: 'GOOD',     status: 'SUGGESTED',        score_breakdown: { location: 'PASS', budget: 'PASS', type: 'PASS', availability: 'PASS' } },
  { id: 'M-9',  requirement_id: 'R-2007', client_name: 'Meena Builder', property_id: 'P-1008', short_loc: '09-Super_Corridor', property_category: 'PLOT',               property_price: 6500000, score: 96.0, tier: 'HIGH',     status: 'SHORTLISTED',      score_breakdown: { location: 'PASS', budget: 'PASS', type: 'PASS', availability: 'PASS' } },
]

// ── Follow-up types & data ────────────────────────────────────────────────────

export interface FollowUpRow {
  id: string
  client_name: string
  client_id?: string
  entity_type: 'Requirement' | 'Lead' | 'Opportunity'
  entity_id: string
  purpose: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | string
  due_date: string
  status: 'PENDING' | 'COMPLETED' | 'RESCHEDULED' | 'CANCELLED' | 'OVERDUE' | 'NO_RESPONSE' | string
  responsible_name: string
  responsible_id?: string
  expected_outcome?: string | null
  created_at: string
}

export const MOCK_FOLLOW_UPS: FollowUpRow[] = [
  {
    id: 'FU-3001',
    client_name: 'Amit Jain',
    client_id: 'p4',
    entity_type: 'Lead',
    entity_id: 'L-1001',
    purpose: 'Initial discovery call on 2BHK requirement in Scheme 140',
    priority: 'HIGH',
    due_date: '2026-09-16T11:00:00Z',
    status: 'OVERDUE',
    responsible_name: 'Neha Kapoor',
    responsible_id: 'u2',
    expected_outcome: 'Gather finalized budget and preferred moving timeline',
    created_at: '2026-09-12T09:00:00Z',
  },
  {
    id: 'FU-3002',
    client_name: 'Vikram Singh',
    client_id: 'p3',
    entity_type: 'Requirement',
    entity_id: 'R-2002',
    purpose: 'Confirm site visit timing for Mayank Blue Star Flat 604',
    priority: 'HIGH',
    due_date: '2026-09-17T14:30:00Z',
    status: 'OVERDUE',
    responsible_name: 'Ravi Mehta',
    responsible_id: 'u3',
    expected_outcome: 'Book weekend slot with client and coordinate key with owner',
    created_at: '2026-09-13T10:00:00Z',
  },
  {
    id: 'FU-3003',
    client_name: 'Vikram Singh',
    client_id: 'p3',
    entity_type: 'Opportunity',
    entity_id: 'OPP-5001',
    purpose: 'Follow up on counter-offer from seller Ramesh Patel',
    priority: 'HIGH',
    due_date: '2026-09-18T10:00:00Z',
    status: 'OVERDUE',
    responsible_name: 'Aman Desai',
    responsible_id: 'u1',
    expected_outcome: 'Close final price negotiation within 5% tolerance',
    created_at: '2026-09-14T08:30:00Z',
  },
  {
    id: 'FU-3004',
    client_name: 'Amit Jain',
    client_id: 'p4',
    entity_type: 'Requirement',
    entity_id: 'R-2001',
    purpose: 'Share updated rental inventory options near Geeta Bhawan',
    priority: 'MEDIUM',
    due_date: '2026-09-19T16:00:00Z',
    status: 'PENDING',
    responsible_name: 'Neha Kapoor',
    responsible_id: 'u2',
    expected_outcome: 'Client to shortlist 2 properties for physical visit',
    created_at: '2026-09-16T11:00:00Z',
  },
  {
    id: 'FU-3005',
    client_name: 'Rahul Verma',
    client_id: 'p6',
    entity_type: 'Lead',
    entity_id: 'L-1003',
    purpose: 'Schedule site visit for 3BHK flat at Super Corridor',
    priority: 'HIGH',
    due_date: '2026-09-20T11:30:00Z',
    status: 'PENDING',
    responsible_name: 'Neha Kapoor',
    responsible_id: 'u2',
    expected_outcome: 'Confirm Sunday visit with field executive',
    created_at: '2026-09-17T09:00:00Z',
  },
  {
    id: 'FU-3006',
    client_name: 'Rahul Verma',
    client_id: 'p6',
    entity_type: 'Opportunity',
    entity_id: 'OPP-5003',
    purpose: 'Send draft agreement for review by legal counsel',
    priority: 'MEDIUM',
    due_date: '2026-09-22T15:00:00Z',
    status: 'PENDING',
    responsible_name: 'Priya Sharma',
    responsible_id: 'u5',
    expected_outcome: 'Approval on payment milestone terms',
    created_at: '2026-09-17T12:00:00Z',
  },
  {
    id: 'FU-3007',
    client_name: 'Vikram Singh',
    client_id: 'p3',
    entity_type: 'Requirement',
    entity_id: 'R-2005',
    purpose: 'Check landlord approval for IT firm commercial lease on MG Road',
    priority: 'MEDIUM',
    due_date: '2026-09-24T14:00:00Z',
    status: 'RESCHEDULED',
    responsible_name: 'Ravi Mehta',
    responsible_id: 'u3',
    expected_outcome: 'Written consent on sub-lease and fit-out timeline',
    created_at: '2026-09-15T15:00:00Z',
  },
  {
    id: 'FU-3008',
    client_name: 'Vikram Singh',
    client_id: 'p3',
    entity_type: 'Lead',
    entity_id: 'L-1002',
    purpose: 'Welcome call and collect preferred move-in date',
    priority: 'LOW',
    due_date: '2026-09-14T10:00:00Z',
    status: 'COMPLETED',
    responsible_name: 'Ravi Mehta',
    responsible_id: 'u3',
    expected_outcome: 'Move-in scheduled for October 1st',
    created_at: '2026-09-12T09:00:00Z',
  },
  {
    id: 'FU-3009',
    client_name: 'Rahul Verma',
    client_id: 'p6',
    entity_type: 'Requirement',
    entity_id: 'R-2006',
    purpose: 'Clarify monthly rental budget range with spouse',
    priority: 'LOW',
    due_date: '2026-09-16T17:00:00Z',
    status: 'NO_RESPONSE',
    responsible_name: 'Priya Sharma',
    responsible_id: 'u5',
    expected_outcome: 'Send WhatsApp summary if unreachable by call',
    created_at: '2026-09-14T14:00:00Z',
  },
  {
    id: 'FU-3010',
    client_name: 'Deepak Broker',
    client_id: 'p7',
    entity_type: 'Lead',
    entity_id: 'L-1004',
    purpose: 'Explore joint-venture commercial listings in Ujjain',
    priority: 'LOW',
    due_date: '2026-09-10T12:00:00Z',
    status: 'CANCELLED',
    responsible_name: 'Aman Desai',
    responsible_id: 'u1',
    expected_outcome: 'Dropped as client withdrew inquiry',
    created_at: '2026-09-08T10:00:00Z',
  },
]

export interface OpportunityListItem {
  id: string
  client_name: string
  stage: string
  expected_value: number
}

export const MOCK_OPPORTUNITIES_LIST: OpportunityListItem[] = [
  { id: 'OPP-5001', client_name: 'Vikram Singh', stage: 'NEGOTIATION', expected_value: 4500000 },
  { id: 'OPP-5002', client_name: 'Amit Jain', stage: 'WON', expected_value: 15000 },
  { id: 'OPP-5003', client_name: 'Rahul Verma', stage: 'PROPOSAL', expected_value: 7000000 },
]

// ── Telecalling / Call Log types & data ────────────────────────────────────────

export interface CallLogRow {
  id: string
  party_name: string
  party_id?: string
  phone: string
  call_type: 'OUTBOUND' | 'INBOUND' | 'MISSED' | string
  duration_minutes: number
  outcome: 'CONNECTED' | 'NO_ANSWER' | 'BUSY' | 'WRONG_NUMBER' | 'CALL_BACK_LATER' | string
  caller_name: string
  caller_id?: string
  call_time: string
  remarks: string
  callback_time?: string | null
  // AI call recording analysis (populated when a recording is uploaded + analyzed)
  recording_url?: string | null            // blob URL for session playback
  ai_transcript?: string | null
  ai_summary?: string | null
  ai_rates?: { mention: string; amount: string; context: string }[] | null
  ai_sentiment?: 'Interested' | 'Neutral' | 'Not Interested' | null
  ai_next_action?: string | null
}

export const MOCK_CALL_LOGS: CallLogRow[] = [
  {
    id: 'C-4001',
    party_name: 'Amit Jain',
    party_id: 'p4',
    phone: '+91 9876543213',
    call_type: 'OUTBOUND',
    duration_minutes: 8,
    outcome: 'CONNECTED',
    caller_name: 'Neha Kapoor',
    caller_id: 'u2',
    call_time: '2026-09-19T11:20:00Z',
    remarks: 'Discussed 2BHK rental listings in Scheme 140. Client requested photos on WhatsApp.',
  },
  {
    id: 'C-4002',
    party_name: 'Vikram Singh',
    party_id: 'p3',
    phone: '+91 9876543212',
    call_type: 'OUTBOUND',
    duration_minutes: 12,
    outcome: 'CONNECTED',
    caller_name: 'Ravi Mehta',
    caller_id: 'u3',
    call_time: '2026-09-19T09:45:00Z',
    remarks: 'Reviewed counter-offer on Mayank Blue Star flat. Client agreeable to ₹53L closing.',
  },
  {
    id: 'C-4003',
    party_name: 'Rahul Verma',
    party_id: 'p6',
    phone: '+91 9876543215',
    call_type: 'INBOUND',
    duration_minutes: 5,
    outcome: 'CALL_BACK_LATER',
    caller_name: 'Neha Kapoor',
    caller_id: 'u2',
    call_time: '2026-09-18T16:10:00Z',
    remarks: 'Client was in an executive meeting. Requested callback on Saturday morning.',
    callback_time: '2026-09-20T10:30:00Z',
  },
  {
    id: 'C-4004',
    party_name: 'Kavita Sharma',
    party_id: 'p5',
    phone: '+91 9876543214',
    call_type: 'OUTBOUND',
    duration_minutes: 4,
    outcome: 'CONNECTED',
    caller_name: 'Priya Sharma',
    caller_id: 'u5',
    call_time: '2026-09-18T14:30:00Z',
    remarks: 'Inquired regarding tenant lease renewal terms for Sapphire Twin Tower office space.',
  },
  {
    id: 'C-4005',
    party_name: 'Sunita Gupta',
    party_id: 'p2',
    phone: '+91 9876543211',
    call_type: 'OUTBOUND',
    duration_minutes: 0,
    outcome: 'NO_ANSWER',
    caller_name: 'Ravi Mehta',
    caller_id: 'u3',
    call_time: '2026-09-18T11:15:00Z',
    remarks: 'Ringing was full, no response. Will re-attempt tomorrow morning.',
  },
  {
    id: 'C-4006',
    party_name: 'Ramesh Patel',
    party_id: 'p1',
    phone: '+91 9876543210',
    call_type: 'INBOUND',
    duration_minutes: 15,
    outcome: 'CONNECTED',
    caller_name: 'Aman Desai',
    caller_id: 'u1',
    call_time: '2026-09-17T15:00:00Z',
    remarks: 'Owner confirmed willingness to negotiate token amount for Scheme 140 plot.',
  },
  {
    id: 'C-4007',
    party_name: 'Deepak Broker',
    party_id: 'p7',
    phone: '+91 9876543216',
    call_type: 'OUTBOUND',
    duration_minutes: 1,
    outcome: 'BUSY',
    caller_name: 'Aman Desai',
    caller_id: 'u1',
    call_time: '2026-09-17T10:45:00Z',
    remarks: 'Line was continuously engaged. Sent SMS inquiry regarding commercial land.',
  },
  {
    id: 'C-4008',
    party_name: 'Meena Builder',
    party_id: 'p8',
    phone: '+91 9876543217',
    call_type: 'INBOUND',
    duration_minutes: 6,
    outcome: 'CONNECTED',
    caller_name: 'Neha Kapoor',
    caller_id: 'u2',
    call_time: '2026-09-16T12:20:00Z',
    remarks: 'Requested inventory audit for Phase 2 Super Corridor Enclave plots.',
  },
  {
    id: 'C-4009',
    party_name: 'Amit Jain',
    party_id: 'p4',
    phone: '+91 9876543213',
    call_type: 'MISSED',
    duration_minutes: 0,
    outcome: 'NO_ANSWER',
    caller_name: 'Neha Kapoor',
    caller_id: 'u2',
    call_time: '2026-09-15T18:05:00Z',
    remarks: 'Missed incoming call after office hours. Follow-up task scheduled.',
  },
  {
    id: 'C-4010',
    party_name: 'Inquiry Lead #44',
    party_id: 'p-inq',
    phone: '+91 9811122233',
    call_type: 'OUTBOUND',
    duration_minutes: 1,
    outcome: 'WRONG_NUMBER',
    caller_name: 'Priya Sharma',
    caller_id: 'u5',
    call_time: '2026-09-15T11:00:00Z',
    remarks: 'Wrong contact number entered on web portal lead capture form.',
  },
]

// ── Call Recordings (AI-Analyzed Audio Library) ──────────────────────────────

export interface CallRecording {
  id: string
  created_at: string
  party_id?: string
  party_name?: string
  party_phone?: string
  duration_seconds?: number
  duration_formatted?: string
  sentiment: 'Interested' | 'Neutral' | 'Not Interested'
  summary: string
  transcript: string
  rates: { mention: string; amount: string; context: string }[]
  next_action?: string
  uploaded_by_id: string
  uploaded_by_name: string
  recording_url?: string | null
  file_name?: string
}

export const MOCK_CALL_RECORDINGS: CallRecording[] = [
  {
    id: 'REC-1001',
    created_at: '2026-09-20T11:30:00Z',
    party_id: 'p5',
    party_name: 'Mr. Manoj Sharma',
    party_phone: '+91 9876543214',
    duration_seconds: 15,
    duration_formatted: '0:15',
    sentiment: 'Neutral',
    summary: 'Rajesh from PropDesk called Mr. Sharma about a 3BHK apartment in Scheme 78, mentioning the owner’s price of 85 lakhs, negotiable to around 80 lakhs, and suggested a site visit on Saturday.',
    transcript: 'Hello, Mr. Sharma, this is Rajesh calling from PropDesk regarding the 3BHK apartment in Scheme 78 you inquired about. The owner is quoting 85 lakhs, but is negotiable around 80 lakhs. Can we arrange a site visit this Saturday?',
    rates: [
      { mention: "owner's quote", amount: '85 lakhs', context: 'owner\'s quoted price, negotiable around 80 lakhs' }
    ],
    next_action: 'Schedule the site visit for Mr. Sharma on Saturday and confirm the time and address.',
    uploaded_by_id: 'u3',
    uploaded_by_name: 'Ravi Mehta',
    file_name: 'sample_call_scheme78.wav'
  },
  {
    id: 'REC-1002',
    created_at: '2026-09-19T14:45:00Z',
    party_id: 'p3',
    party_name: 'Vikram Singh',
    party_phone: '+91 9876543212',
    duration_seconds: 72,
    duration_formatted: '1:12',
    sentiment: 'Interested',
    summary: 'Discussed counter-offer terms for the Mayank Blue Star flat. Buyer Vikram Singh is very keen and confirmed readiness to close at ₹53 Lakhs pending legal deed review.',
    transcript: 'Agent: Vikram ji, I spoke with seller Ramesh Patel regarding your offer. Client: Excellent Ravi, what did he say? Agent: He is ready to close at 53 Lakhs provided agreement is signed by Friday. Client: Done, that works for me. Please send the draft agreement.',
    rates: [
      { mention: 'closing price', amount: '₹53 Lakhs', context: 'agreed final transaction price' }
    ],
    next_action: 'Prepare and send draft purchase agreement to Vikram Singh by Thursday evening.',
    uploaded_by_id: 'u3',
    uploaded_by_name: 'Ravi Mehta',
    file_name: 'vikram_offer_call.mp3'
  },
  {
    id: 'REC-1003',
    created_at: '2026-09-18T16:15:00Z',
    party_id: 'p6',
    party_name: 'Rahul Verma',
    party_phone: '+91 9876543215',
    duration_seconds: 45,
    duration_formatted: '0:45',
    sentiment: 'Not Interested',
    summary: 'Inquired about Scheme 140 commercial plot rates. After learning the current rate is ₹8,500/sq.ft, client stated it exceeded their ₹6,000 budget and declined further negotiation for this location.',
    transcript: 'Agent: Hello Rahul, following up on the Scheme 140 plot. Asking is 8,500 per square foot. Client: That is way too steep for our current budget, Neha. We were looking around 6,000. Let us pause on Scheme 140 for now.',
    rates: [
      { mention: 'Scheme 140 asking rate', amount: '₹8,500/sq.ft', context: 'plot asking price' },
      { mention: 'client budget', amount: '₹6,000/sq.ft', context: 'client maximum affordability' }
    ],
    next_action: 'Look for alternate commercial inventory in Super Corridor within ₹6,000/sq.ft range.',
    uploaded_by_id: 'u2',
    uploaded_by_name: 'Neha Kapoor',
    file_name: 'rahul_plot_inquiry.wav'
  },
  {
    id: 'REC-1004',
    created_at: '2026-09-17T10:20:00Z',
    party_id: 'p4',
    party_name: 'Amit Jain',
    party_phone: '+91 9876543213',
    duration_seconds: 88,
    duration_formatted: '1:28',
    sentiment: 'Interested',
    summary: 'Reviewed 2BHK rental listings near Scheme 140. Amit requested video walkthroughs for two shortlist options quoting ₹18,000/month and ₹22,000/month.',
    transcript: 'Agent: Good morning Amit ji, I found two furnished 2BHK options in Scheme 140. One is 18,000 rent and the other with dedicated parking is 22,000. Client: Great Neha, please send video clips of both on WhatsApp.',
    rates: [
      { mention: 'option 1 rent', amount: '₹18,000/month', context: 'furnished 2BHK without parking' },
      { mention: 'option 2 rent', amount: '₹22,000/month', context: 'furnished 2BHK with dedicated parking' }
    ],
    next_action: 'Send WhatsApp video tours of both Scheme 140 2BHK units to Amit Jain.',
    uploaded_by_id: 'u2',
    uploaded_by_name: 'Neha Kapoor',
    file_name: 'amit_rental_discussion.m4a'
  }
]


// ── Tasks types & data ────────────────────────────────────────────────────────

export interface TaskRow {
  id: string
  title: string
  task_type: 'Internal' | 'Verification' | 'Documentation' | 'Admin' | 'Other'
  assigned_to_name: string
  assigned_to_id?: string
  due_date: string
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'OVERDUE'
  linked_record_type?: 'Property' | 'Requirement' | 'Lead' | 'Opportunity' | null
  linked_record_id?: string | null
  linked_record_label?: string | null
  description?: string
  created_at: string
}

export const MOCK_TASKS: TaskRow[] = [
  {
    id: 'T-101',
    title: 'Photograph front elevation and amenities for MG Road office',
    task_type: 'Verification',
    assigned_to_name: 'Ravi Mehta',
    assigned_to_id: 'u3',
    due_date: '2026-09-22T12:00:00Z',
    priority: 'HIGH',
    status: 'TODO',
    linked_record_type: 'Property',
    linked_record_id: 'P-1005',
    linked_record_label: 'Property P-1005',
    description: 'Capture 10+ high-res pictures of parking, reception, cafeteria, and building facade.',
    created_at: '2026-09-18T09:00:00Z',
  },
  {
    id: 'T-102',
    title: 'Collect updated tax clearance certificate from Ramesh Patel',
    task_type: 'Documentation',
    assigned_to_name: 'Neha Kapoor',
    assigned_to_id: 'u2',
    due_date: '2026-09-23T17:00:00Z',
    priority: 'MEDIUM',
    status: 'TODO',
    linked_record_type: 'Property',
    linked_record_id: 'P-1003',
    linked_record_label: 'Property P-1003',
    description: 'Obtain municipal tax receipt and mutation certificate for Mayank Blue Star flat.',
    created_at: '2026-09-17T11:00:00Z',
  },
  {
    id: 'T-103',
    title: 'Prepare customized quotation comparison for commercial lease',
    task_type: 'Internal',
    assigned_to_name: 'Priya Sharma',
    assigned_to_id: 'u5',
    due_date: '2026-09-25T15:00:00Z',
    priority: 'LOW',
    status: 'TODO',
    linked_record_type: 'Requirement',
    linked_record_id: 'R-2005',
    linked_record_label: 'Requirement R-2005',
    description: 'Compare floor 2 Scheme 78 vs MG Towers for Vikram Singh.',
    created_at: '2026-09-18T14:00:00Z',
  },
  {
    id: 'T-104',
    title: 'Verify RERA registration and Super Corridor land title registry',
    task_type: 'Verification',
    assigned_to_name: 'Aman Desai',
    assigned_to_id: 'u1',
    due_date: '2026-09-21T18:00:00Z',
    priority: 'CRITICAL',
    status: 'IN_PROGRESS',
    linked_record_type: 'Property',
    linked_record_id: 'P-1008',
    linked_record_label: 'Property P-1008',
    description: 'Check town planning zoning permissions and master plan compliance.',
    created_at: '2026-09-16T10:00:00Z',
  },
  {
    id: 'T-105',
    title: 'Draft stamp duty and sale agreement for Tower B-604',
    task_type: 'Documentation',
    assigned_to_name: 'Neha Kapoor',
    assigned_to_id: 'u2',
    due_date: '2026-09-20T14:00:00Z',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    linked_record_type: 'Opportunity',
    linked_record_id: 'OPP-5001',
    linked_record_label: 'Opportunity OPP-5001',
    description: 'Coordinate terms between buyer Vikram Singh and seller Ramesh Patel.',
    created_at: '2026-09-17T08:30:00Z',
  },
  {
    id: 'T-106',
    title: 'Review weekly staff performance and follow-up closure rates',
    task_type: 'Admin',
    assigned_to_name: 'Aman Desai',
    assigned_to_id: 'u1',
    due_date: '2026-09-24T18:00:00Z',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    linked_record_type: null,
    linked_record_id: null,
    linked_record_label: null,
    description: 'Review SLA on site visits and unverified properties.',
    created_at: '2026-09-18T09:00:00Z',
  },
  {
    id: 'T-107',
    title: 'Physical key handover verification with owner Sunita Gupta',
    task_type: 'Verification',
    assigned_to_name: 'Ravi Mehta',
    assigned_to_id: 'u3',
    due_date: '2026-09-15T12:00:00Z',
    priority: 'HIGH',
    status: 'DONE',
    linked_record_type: 'Property',
    linked_record_id: 'P-1004',
    linked_record_label: 'Property P-1004',
    description: 'Received physical keys for Sapna Complex 2BHK inspections.',
    created_at: '2026-09-13T10:00:00Z',
  },
  {
    id: 'T-108',
    title: 'Archive closed lease agreement for Geeta Colony property',
    task_type: 'Documentation',
    assigned_to_name: 'Neha Kapoor',
    assigned_to_id: 'u2',
    due_date: '2026-09-12T16:00:00Z',
    priority: 'LOW',
    status: 'DONE',
    linked_record_type: 'Property',
    linked_record_id: 'P-1010',
    linked_record_label: 'Property P-1010',
    description: 'Moved signed contract scan to long-term storage records.',
    created_at: '2026-09-10T14:00:00Z',
  },
  {
    id: 'T-109',
    title: 'Inspect parking allotment issue at Mayank Heights',
    task_type: 'Internal',
    assigned_to_name: 'Ravi Mehta',
    assigned_to_id: 'u3',
    due_date: '2026-09-16T11:00:00Z',
    priority: 'HIGH',
    status: 'OVERDUE',
    linked_record_type: 'Property',
    linked_record_id: 'P-1001',
    linked_record_label: 'Property P-1001',
    description: 'Tenant reported assigned stilt slot occupied by visitor.',
    created_at: '2026-09-14T09:00:00Z',
  },
]

// ── Timeline / Activity Feed types & data ─────────────────────────────────────

export interface ActivityTimelineRow {
  id: string
  activity_type:
    | 'CALL'
    | 'FOLLOWUP'
    | 'WHATSAPP'
    | 'EMAIL'
    | 'MEETING'
    | 'PROPERTY_SHARE'
    | 'VISIT'
    | 'TASK'
    | 'STATUS_CHANGE'
  title: string
  description: string
  actor_name: string
  actor_role: string
  timestamp: string
  linked_entity_type?: string
  linked_entity_id?: string
}

export const MOCK_TIMELINE_ACTIVITIES: ActivityTimelineRow[] = [
  {
    id: 'ACT-901',
    activity_type: 'CALL',
    title: 'Telecalling call logged with Amit Jain',
    description: 'Outbound discussion regarding 2BHK rental listings in Scheme 140 (Duration: 8 min).',
    actor_name: 'Neha Kapoor',
    actor_role: 'Office Executive',
    timestamp: '2026-09-19T11:20:00Z',
    linked_entity_type: 'Lead',
    linked_entity_id: 'L-1001',
  },
  {
    id: 'ACT-902',
    activity_type: 'FOLLOWUP',
    title: 'Follow-up created for Vikram Singh',
    description: 'Scheduled counter-offer review for Tower B-604 Mayank Blue Star flat.',
    actor_name: 'Aman Desai',
    actor_role: 'Super Admin',
    timestamp: '2026-09-19T10:15:00Z',
    linked_entity_type: 'Opportunity',
    linked_entity_id: 'OPP-5001',
  },
  {
    id: 'ACT-903',
    activity_type: 'STATUS_CHANGE',
    title: 'Property P-1009 status changed to NEW',
    description: '3BHK flat at Signature Park Super Corridor added to inventory listing.',
    actor_name: 'Neha Kapoor',
    actor_role: 'Office Executive',
    timestamp: '2026-09-19T09:00:00Z',
    linked_entity_type: 'Property',
    linked_entity_id: 'P-1009',
  },
  {
    id: 'ACT-904',
    activity_type: 'WHATSAPP',
    title: 'Property details brochure shared on WhatsApp',
    description: 'Sent PDF floor plans and photos of P-1001 & P-1002 to Amit Jain.',
    actor_name: 'Neha Kapoor',
    actor_role: 'Office Executive',
    timestamp: '2026-09-18T16:45:00Z',
    linked_entity_type: 'Requirement',
    linked_entity_id: 'R-2001',
  },
  {
    id: 'ACT-905',
    activity_type: 'VISIT',
    title: 'Site visit completed at Mayank Blue Star',
    description: 'Agent Ravi Mehta conducted physical inspection with client Vikram Singh.',
    actor_name: 'Ravi Mehta',
    actor_role: 'Field Agent',
    timestamp: '2026-09-18T15:30:00Z',
    linked_entity_type: 'Property',
    linked_entity_id: 'P-1003',
  },
  {
    id: 'ACT-906',
    activity_type: 'MEETING',
    title: 'In-office negotiation meeting with Ramesh Patel',
    description: 'Discussed token advance terms and final consideration value for Flat 604.',
    actor_name: 'Aman Desai',
    actor_role: 'Super Admin',
    timestamp: '2026-09-18T12:00:00Z',
    linked_entity_type: 'Party',
    linked_entity_id: 'p1',
  },
  {
    id: 'ACT-907',
    activity_type: 'TASK',
    title: 'Task completed: Key Handover Verification',
    description: 'Collected inspection keys for Sapna Complex from owner Sunita Gupta.',
    actor_name: 'Ravi Mehta',
    actor_role: 'Field Agent',
    timestamp: '2026-09-17T17:10:00Z',
    linked_entity_type: 'Property',
    linked_entity_id: 'P-1004',
  },
  {
    id: 'ACT-908',
    activity_type: 'EMAIL',
    title: 'Commercial lease agreement draft emailed',
    description: 'Sent standard 3-year commercial terms to Kavita Sharma for legal review.',
    actor_name: 'Priya Sharma',
    actor_role: 'Agent',
    timestamp: '2026-09-17T14:20:00Z',
    linked_entity_type: 'Property',
    linked_entity_id: 'P-1005',
  },
  {
    id: 'ACT-909',
    activity_type: 'PROPERTY_SHARE',
    title: 'Requirement R-2002 matched with P-1003',
    description: 'Automated match score 92% (HIGH Tier) shared with Vikram Singh via client portal.',
    actor_name: 'Aman Desai',
    actor_role: 'Super Admin',
    timestamp: '2026-09-17T11:00:00Z',
    linked_entity_type: 'Requirement',
    linked_entity_id: 'R-2002',
  },
  {
    id: 'ACT-910',
    activity_type: 'CALL',
    title: 'Inbound inquiry from Meena Builder',
    description: 'Discussed Super Corridor plotting inventory verification and pricing slabs.',
    actor_name: 'Neha Kapoor',
    actor_role: 'Office Executive',
    timestamp: '2026-09-16T12:20:00Z',
    linked_entity_type: 'Party',
    linked_entity_id: 'p8',
  },
  {
    id: 'ACT-911',
    activity_type: 'STATUS_CHANGE',
    title: 'Lead L-1003 qualified by Neha Kapoor',
    description: 'Rahul Verma confirmed ready budget and pre-approved mortgage for Super Corridor 3BHK.',
    actor_name: 'Neha Kapoor',
    actor_role: 'Office Executive',
    timestamp: '2026-09-16T09:40:00Z',
    linked_entity_type: 'Lead',
    linked_entity_id: 'L-1003',
  },
  {
    id: 'ACT-912',
    activity_type: 'VISIT',
    title: 'Inspection visit scheduled for Scheme 140',
    description: 'Visit scheduled for 2BHK flat P-1001 with client Amit Jain on Saturday.',
    actor_name: 'Ravi Mehta',
    actor_role: 'Field Agent',
    timestamp: '2026-09-15T16:00:00Z',
    linked_entity_type: 'Property',
    linked_entity_id: 'P-1001',
  },
  {
    id: 'ACT-913',
    activity_type: 'TASK',
    title: 'New task created: Parking Allotment Inspection',
    description: 'Assigned to Ravi Mehta to inspect Scheme 140 stilt parking space.',
    actor_name: 'Neha Kapoor',
    actor_role: 'Office Executive',
    timestamp: '2026-09-14T09:00:00Z',
    linked_entity_type: 'Property',
    linked_entity_id: 'P-1001',
  },
  {
    id: 'ACT-914',
    activity_type: 'FOLLOWUP',
    title: 'Follow-up marked completed for Vikram Singh',
    description: 'Welcome onboarding call completed; client confirmed move-in window.',
    actor_name: 'Ravi Mehta',
    actor_role: 'Field Agent',
    timestamp: '2026-09-14T10:00:00Z',
    linked_entity_type: 'Lead',
    linked_entity_id: 'L-1002',
  },
  {
    id: 'ACT-915',
    activity_type: 'STATUS_CHANGE',
    title: 'Requirement R-2007 marked FULFILLED',
    description: 'Meena Builder purchased plot in Super Corridor Enclave; deal closed successfully.',
    actor_name: 'Aman Desai',
    actor_role: 'Super Admin',
    timestamp: '2026-09-12T17:30:00Z',
    linked_entity_type: 'Requirement',
    linked_entity_id: 'R-2007',
  },
  {
    id: 'ACT-916',
    activity_type: 'EMAIL',
    title: 'Weekly inventory catalogue sent to registered brokers',
    description: 'Dispatched 8 new residential and commercial listings to Deepak Broker and network.',
    actor_name: 'Neha Kapoor',
    actor_role: 'Office Executive',
    timestamp: '2026-09-11T10:00:00Z',
    linked_entity_type: 'Party',
    linked_entity_id: 'p7',
  },
  {
    id: 'ACT-917',
    activity_type: 'CALL',
    title: 'Outbound inquiry to Sunita Gupta',
    description: 'Attempted reverification of Geeta Bhawan flat listing; line unanswered.',
    actor_name: 'Ravi Mehta',
    actor_role: 'Field Agent',
    timestamp: '2026-09-10T11:15:00Z',
    linked_entity_type: 'Property',
    linked_entity_id: 'P-1002',
  },
  {
    id: 'ACT-918',
    activity_type: 'TASK',
    title: 'Documentation task completed for P-1010',
    description: 'Archived closed lease agreement and inspection checklist scans.',
    actor_name: 'Neha Kapoor',
    actor_role: 'Office Executive',
    timestamp: '2026-09-09T15:00:00Z',
    linked_entity_type: 'Property',
    linked_entity_id: 'P-1010',
  },
]

// ── Visits types & data ───────────────────────────────────────────────────────

export interface VisitChecklistItem {
  label: string
  status: 'YES' | 'NO' | 'NA'
  reason?: string
}

export interface VisitReviewData {
  planned_location: string
  actual_location: string
  distance_variance: string
  planned_time: string
  actual_time: string
  planned_duration: string
  actual_duration: string
  photos: {
    property_front: string
    interior: string
    road_access: string
    signboard: string
  }
  checklist: VisitChecklistItem[]
  person_met: string
  customer_interest: 'Interested' | 'Neutral' | 'Not Interested'
  property_condition: 'Good' | 'Fair' | 'Poor'
  next_action: string
  remarks: string
}

export interface VisitRow {
  id: string
  property_id: string
  property_short_loc: string
  client_id?: string
  client_name: string
  agent_id: string
  agent_name: string
  purpose: 'Property Viewing' | 'Owner Meeting' | 'Verification'
  status:
    | 'Assigned'
    | 'Accepted'
    | 'Scheduled'
    | 'En Route'
    | 'Arrived'
    | 'Visit Started'
    | 'Visit Completed'
    | 'Submitted'
    | 'Approved'
    | 'Rejected'
    | 'Cancelled'
  scheduled_date: string
  submitted_date?: string | null
  instructions?: string
  checklist_template?: string
  review_data?: VisitReviewData | null
  created_at: string
}

export const MOCK_VISITS: VisitRow[] = [
  {
    id: 'V-501',
    property_id: 'P-1005',
    property_short_loc: '05-MG_Road',
    client_id: 'p5',
    client_name: 'Kavita Sharma',
    agent_id: 'u6',
    agent_name: 'Amit Patel',
    purpose: 'Property Viewing',
    status: 'Assigned',
    scheduled_date: '2026-09-20T11:00:00Z',
    instructions: 'Meet prospective IT tenant at Sapphire Twin Tower lobby.',
    checklist_template: 'Standard Commercial',
    created_at: '2026-09-18T10:00:00Z',
  },
  {
    id: 'V-502',
    property_id: 'P-1008',
    property_short_loc: '09-Super_Corridor',
    client_id: 'p8',
    client_name: 'Meena Builder',
    agent_id: 'u7',
    agent_name: 'Sanjay Verma',
    purpose: 'Verification',
    status: 'Accepted',
    scheduled_date: '2026-09-20T14:30:00Z',
    instructions: 'Verify survey boundary pegs on Sector 3A plotting.',
    checklist_template: 'Standard Residential',
    created_at: '2026-09-18T11:30:00Z',
  },
  {
    id: 'V-503',
    property_id: 'P-1001',
    property_short_loc: '01-Schm140_Mayank',
    client_id: 'p4',
    client_name: 'Amit Jain',
    agent_id: 'u3',
    agent_name: 'Ravi Mehta',
    purpose: 'Property Viewing',
    status: 'Scheduled',
    scheduled_date: '2026-09-20T16:00:00Z',
    instructions: 'Client requested inspection of 2BHK flat 302.',
    checklist_template: 'Standard Residential',
    created_at: '2026-09-17T09:00:00Z',
  },
  {
    id: 'V-504',
    property_id: 'P-1002',
    property_short_loc: '07-Geeta_Bhawan',
    client_id: 'p2',
    client_name: 'Sunita Gupta',
    agent_id: 'u5',
    agent_name: 'Priya Sharma',
    purpose: 'Owner Meeting',
    status: 'En Route',
    scheduled_date: '2026-09-19T14:00:00Z',
    instructions: 'Discuss rental agreement draft with owner.',
    checklist_template: 'Owner Meeting',
    created_at: '2026-09-17T14:00:00Z',
  },
  {
    id: 'V-505',
    property_id: 'P-1003',
    property_short_loc: '01-Schm140_Mayank',
    client_id: 'p3',
    client_name: 'Vikram Singh',
    agent_id: 'u3',
    agent_name: 'Ravi Mehta',
    purpose: 'Property Viewing',
    status: 'Arrived',
    scheduled_date: '2026-09-19T15:00:00Z',
    instructions: 'Second physical visit with family.',
    checklist_template: 'Standard Residential',
    created_at: '2026-09-16T12:00:00Z',
  },
  {
    id: 'V-506',
    property_id: 'P-1003',
    property_short_loc: '01-Schm140_Mayank',
    client_id: 'p3',
    client_name: 'Vikram Singh',
    agent_id: 'u3',
    agent_name: 'Ravi Mehta',
    purpose: 'Property Viewing',
    status: 'Submitted',
    scheduled_date: '2026-09-18T15:30:00Z',
    submitted_date: '2026-09-18T16:45:00Z',
    instructions: 'Show Flat B-604, discuss club amenities and parking slot.',
    checklist_template: 'Standard Residential',
    review_data: {
      planned_location: '22.7196° N, 75.8577° E (Scheme 140, Indore)',
      actual_location: '22.7197° N, 75.8576° E (Mayank Blue Star Entrance)',
      distance_variance: '12m off',
      planned_time: '2026-09-18 15:30',
      actual_time: '2026-09-18 15:33',
      planned_duration: '45 mins',
      actual_duration: '52 mins',
      photos: {
        property_front: '/placeholder-front.jpg',
        interior: '/placeholder-interior.jpg',
        road_access: '/placeholder-road.jpg',
        signboard: '/placeholder-signboard.jpg',
      },
      checklist: [
        { label: 'Property exterior condition inspected', status: 'YES' },
        { label: 'Living room and modular kitchen verified', status: 'YES' },
        { label: 'Lift and generator backup operational', status: 'YES' },
        { label: 'Swimming pool and clubhouse access', status: 'NA', reason: 'Clubhouse currently under annual maintenance' },
        { label: 'Parking space allotment marked clearly', status: 'YES' },
        { label: 'Society NOC verified with caretaker', status: 'YES' },
      ],
      person_met: 'Vikram Singh (Buyer) & Wife',
      customer_interest: 'Interested',
      property_condition: 'Good',
      next_action: 'Send revised stamp duty and booking milestone schedule',
      remarks: 'Client liked the morning sunlight and layout. Ready to submit token after consulting father.',
    },
    created_at: '2026-09-15T10:00:00Z',
  },
  {
    id: 'V-507',
    property_id: 'P-1004',
    property_short_loc: '08-SAPNA_SANGEETA',
    client_id: 'p2',
    client_name: 'Sunita Gupta',
    agent_id: 'u5',
    agent_name: 'Priya Sharma',
    purpose: 'Verification',
    status: 'Submitted',
    scheduled_date: '2026-09-18T11:00:00Z',
    submitted_date: '2026-09-18T12:15:00Z',
    instructions: 'Re-verify vacant possession and utility meter readings.',
    checklist_template: 'Standard Commercial',
    review_data: {
      planned_location: '22.7020° N, 75.8680° E (Sapna Complex, Indore)',
      actual_location: '22.7021° N, 75.8681° E (Sapna Sangeeta Main Gate)',
      distance_variance: '18m off',
      planned_time: '2026-09-18 11:00',
      actual_time: '2026-09-18 11:04',
      planned_duration: '30 mins',
      actual_duration: '35 mins',
      photos: {
        property_front: '/placeholder-front.jpg',
        interior: '/placeholder-interior.jpg',
        road_access: '/placeholder-road.jpg',
        signboard: '/placeholder-signboard.jpg',
      },
      checklist: [
        { label: 'Electricity meter reading documented', status: 'YES' },
        { label: 'Water supply connection active', status: 'YES' },
        { label: 'Fire extinguisher certificate valid', status: 'NO', reason: 'Expired last month, owner notified' },
        { label: 'Terrace access permission', status: 'NA', reason: 'Commercial unit is on 3rd floor; no private terrace' },
        { label: 'Signage visibility from main avenue', status: 'YES' },
      ],
      person_met: 'Sunita Gupta (Owner)',
      customer_interest: 'Neutral',
      property_condition: 'Fair',
      next_action: 'Owner to update fire extinguisher cylinder before next viewing',
      remarks: 'Key handed over for client viewings. Unit is clean and ready for immediate occupation.',
    },
    created_at: '2026-09-15T14:00:00Z',
  },
  {
    id: 'V-508',
    property_id: 'P-1009',
    property_short_loc: '09-Super_Corridor',
    client_id: 'p6',
    client_name: 'Rahul Verma',
    agent_id: 'u7',
    agent_name: 'Sanjay Verma',
    purpose: 'Property Viewing',
    status: 'Approved',
    scheduled_date: '2026-09-17T16:00:00Z',
    submitted_date: '2026-09-17T17:30:00Z',
    instructions: 'Completed viewing of Signature Park 3BHK flat.',
    checklist_template: 'Standard Residential',
    created_at: '2026-09-14T09:00:00Z',
  },
]

// ── Field Agent Roster types & data ───────────────────────────────────────────

export interface FieldAgentRosterRow {
  id: string
  user_id: string
  name: string
  phone: string
  status: 'Available' | 'On Visit' | 'Off Duty'
  today_visit_count: number
  week_completed_visits: number
  average_rating: number
  last_known_location: string
}

export const MOCK_FIELD_AGENTS: FieldAgentRosterRow[] = [
  {
    id: 'FA-01',
    user_id: 'u3',
    name: 'Ravi Mehta',
    phone: '+91 9876543203',
    status: 'On Visit',
    today_visit_count: 2,
    week_completed_visits: 7,
    average_rating: 4.8,
    last_known_location: 'Scheme 140 (Mayank Blue Star), Indore',
  },
  {
    id: 'FA-02',
    user_id: 'u5',
    name: 'Priya Sharma',
    phone: '+91 9876543205',
    status: 'On Visit',
    today_visit_count: 1,
    week_completed_visits: 5,
    average_rating: 4.9,
    last_known_location: 'Sapna Sangeeta Main Road, Indore',
  },
  {
    id: 'FA-03',
    user_id: 'u6',
    name: 'Amit Patel',
    phone: '+91 9876543206',
    status: 'Available',
    today_visit_count: 0,
    week_completed_visits: 6,
    average_rating: 4.6,
    last_known_location: 'Vijay Nagar Office Branch, Indore',
  },
  {
    id: 'FA-04',
    user_id: 'u7',
    name: 'Sanjay Verma',
    phone: '+91 9876543207',
    status: 'Available',
    today_visit_count: 1,
    week_completed_visits: 8,
    average_rating: 4.7,
    last_known_location: 'Super Corridor Metro Station, Indore',
  },
]

// ── Pipeline Opportunities types & data ───────────────────────────────────────

export interface NegotiationRound {
  round: number
  date: string
  asking_price: number
  offer_price: number
  revised_offer: number
  remarks: string
}

export interface PipelineOpportunityRow {
  id: string
  property_id: string
  property_short_loc: string
  client_id: string
  client_name: string
  stage:
    | 'QUALIFIED'
    | 'PROPERTY_SHARED'
    | 'SITE_VISIT'
    | 'NEGOTIATION'
    | 'DOCUMENTATION'
    | 'WON'
    | 'LOST'
  expected_value: number
  probability: number
  agent_id: string
  agent_name: string
  lost_reason?: 'Price Issue' | 'Property Issue' | 'Customer Decision' | 'Timing' | 'Other' | null
  lost_remarks?: string | null
  negotiation_history: NegotiationRound[]
  created_at: string
  closed_at?: string | null
}

export const MOCK_PIPELINE_OPPORTUNITIES: PipelineOpportunityRow[] = [
  {
    id: 'OPP-5001',
    property_id: 'P-1003',
    property_short_loc: '01-Schm140_Mayank',
    client_id: 'p3',
    client_name: 'Vikram Singh',
    stage: 'NEGOTIATION',
    expected_value: 5400000,
    probability: 75,
    agent_id: 'u3',
    agent_name: 'Ravi Mehta',
    negotiation_history: [
      {
        round: 1,
        date: '2026-09-15',
        asking_price: 5500000,
        offer_price: 5000000,
        revised_offer: 5400000,
        remarks: 'Initial offer by buyer rejected. Owner came down by ₹1L.',
      },
      {
        round: 2,
        date: '2026-09-17',
        asking_price: 5400000,
        offer_price: 5200000,
        revised_offer: 5350000,
        remarks: 'Buyer increased offer after site visit with parents.',
      },
      {
        round: 3,
        date: '2026-09-19',
        asking_price: 5350000,
        offer_price: 5300000,
        revised_offer: 5300000,
        remarks: 'Both parties agreed in principle on ₹53L with covered car park.',
      },
    ],
    created_at: '2026-09-10T10:00:00Z',
  },
  {
    id: 'OPP-5002',
    property_id: 'P-1001',
    property_short_loc: '01-Schm140_Mayank',
    client_id: 'p4',
    client_name: 'Amit Jain',
    stage: 'WON',
    expected_value: 216000,
    probability: 100,
    agent_id: 'u2',
    agent_name: 'Neha Kapoor',
    negotiation_history: [
      {
        round: 1,
        date: '2026-09-10',
        asking_price: 20000,
        offer_price: 16000,
        revised_offer: 18000,
        remarks: 'Finalized at ₹18,000/mo rental with 2-month security deposit.',
      },
    ],
    created_at: '2026-09-08T09:00:00Z',
    closed_at: '2026-09-12T15:30:00Z',
  },
  {
    id: 'OPP-5003',
    property_id: 'P-1009',
    property_short_loc: '09-Super_Corridor',
    client_id: 'p6',
    client_name: 'Rahul Verma',
    stage: 'DOCUMENTATION',
    expected_value: 7200000,
    probability: 90,
    agent_id: 'u5',
    agent_name: 'Priya Sharma',
    negotiation_history: [
      {
        round: 1,
        date: '2026-09-14',
        asking_price: 7500000,
        offer_price: 7000000,
        revised_offer: 7200000,
        remarks: 'Builder agreed to ₹72L including club membership.',
      },
    ],
    created_at: '2026-09-11T14:00:00Z',
  },
  {
    id: 'OPP-5004',
    property_id: 'P-1006',
    property_short_loc: '05-MG_Road',
    client_id: 'p5',
    client_name: 'Kavita Sharma',
    stage: 'SITE_VISIT',
    expected_value: 18500000,
    probability: 50,
    agent_id: 'u7',
    agent_name: 'Sanjay Verma',
    negotiation_history: [],
    created_at: '2026-09-15T11:00:00Z',
  },
  {
    id: 'OPP-5005',
    property_id: 'P-1008',
    property_short_loc: '09-Super_Corridor',
    client_id: 'p8',
    client_name: 'Meena Builder',
    stage: 'PROPERTY_SHARED',
    expected_value: 6500000,
    probability: 35,
    agent_id: 'u6',
    agent_name: 'Amit Patel',
    negotiation_history: [],
    created_at: '2026-09-16T15:00:00Z',
  },
  {
    id: 'OPP-5006',
    property_id: 'P-1005',
    property_short_loc: '05-MG_Road',
    client_id: 'p7',
    client_name: 'Deepak Broker',
    stage: 'LOST',
    expected_value: 540000,
    probability: 0,
    agent_id: 'u3',
    agent_name: 'Ravi Mehta',
    lost_reason: 'Price Issue',
    lost_remarks: 'Owner was unwilling to reduce monthly lease rent below ₹45k.',
    negotiation_history: [
      {
        round: 1,
        date: '2026-09-09',
        asking_price: 50000,
        offer_price: 35000,
        revised_offer: 45000,
        remarks: 'Client walked away due to budget gap.',
      },
    ],
    created_at: '2026-09-05T08:30:00Z',
    closed_at: '2026-09-11T12:00:00Z',
  },
  {
    id: 'OPP-5007',
    property_id: 'P-1004',
    property_short_loc: '08-SAPNA_SANGEETA',
    client_id: 'p2',
    client_name: 'Sunita Gupta',
    stage: 'QUALIFIED',
    expected_value: 4200000,
    probability: 20,
    agent_id: 'u5',
    agent_name: 'Priya Sharma',
    negotiation_history: [],
    created_at: '2026-09-17T16:00:00Z',
  },
]

// ── Transactions types & data ─────────────────────────────────────────────────

export interface TransactionRow {
  id: string
  opportunity_id: string
  property_id: string
  property_short_loc: string
  client_name: string
  staff_id: string
  staff_name: string
  staff_role: string
  transaction_type: 'Sale' | 'Rent' | 'Lease'
  transaction_value: number
  commission_pct: number
  commission_amount: number
  payment_status: 'Paid' | 'Partial' | 'Pending'
  closed_date: string
  notes?: string
}

export const MOCK_TRANSACTIONS: TransactionRow[] = [
  {
    id: 'TXN-797',
    opportunity_id: 'OPP-4990',
    property_id: 'P-1002',
    property_short_loc: '02-Palasia_Square',
    client_name: 'Rajesh Agrawal',
    staff_id: 'u6',
    staff_name: 'Amit Patel',
    staff_role: 'Field Agent',
    transaction_type: 'Sale',
    transaction_value: 2000000,
    commission_pct: 2.0,
    commission_amount: 40000,
    payment_status: 'Paid',
    closed_date: '2026-08-10',
    notes: 'Plot sale brokerage received in full.',
  },
  {
    id: 'TXN-798',
    opportunity_id: 'OPP-4991',
    property_id: 'P-1005',
    property_short_loc: '06-AB_Road',
    client_name: 'Deepak Chawla',
    staff_id: 'u3',
    staff_name: 'Ravi Mehta',
    staff_role: 'Field Agent',
    transaction_type: 'Sale',
    transaction_value: 3500000,
    commission_pct: 2.0,
    commission_amount: 70000,
    payment_status: 'Paid',
    closed_date: '2026-08-14',
    notes: '2BHK resale transaction brokerage settled.',
  },
  {
    id: 'TXN-799',
    opportunity_id: 'OPP-4992',
    property_id: 'P-1004',
    property_short_loc: '03-Bhawarkua',
    client_name: 'Pooja Verma',
    staff_id: 'u5',
    staff_name: 'Priya Sharma',
    staff_role: 'Field Agent',
    transaction_type: 'Rent',
    transaction_value: 300000,
    commission_pct: 10.0,
    commission_amount: 30000,
    payment_status: 'Paid',
    closed_date: '2026-08-20',
    notes: 'Commercial lease brokerage paid upon move-in.',
  },
  {
    id: 'TXN-800',
    opportunity_id: 'OPP-4993',
    property_id: 'P-1003',
    property_short_loc: '04-Vijay_Nagar',
    client_name: 'Suresh Singhal',
    staff_id: 'u7',
    staff_name: 'Sanjay Verma',
    staff_role: 'Field Agent',
    transaction_type: 'Sale',
    transaction_value: 4500000,
    commission_pct: 1.5,
    commission_amount: 67500,
    payment_status: 'Paid',
    closed_date: '2026-08-25',
    notes: 'Apartment booking commission released.',
  },
  {
    id: 'TXN-801',
    opportunity_id: 'OPP-5002',
    property_id: 'P-1001',
    property_short_loc: '01-Schm140_Mayank',
    client_name: 'Amit Jain',
    staff_id: 'u2',
    staff_name: 'Neha Kapoor',
    staff_role: 'Office Executive',
    transaction_type: 'Rent',
    transaction_value: 216000,
    commission_pct: 8.33,
    commission_amount: 18000,
    payment_status: 'Paid',
    closed_date: '2026-09-12',
    notes: 'Full 1-month brokerage paid upon agreement registration.',
  },
  {
    id: 'TXN-802',
    opportunity_id: 'OPP-4998',
    property_id: 'P-1010',
    property_short_loc: '07-Geeta_Bhawan',
    client_name: 'Sunita Gupta',
    staff_id: 'u3',
    staff_name: 'Ravi Mehta',
    staff_role: 'Field Agent',
    transaction_type: 'Sale',
    transaction_value: 4800000,
    commission_pct: 2.0,
    commission_amount: 96000,
    payment_status: 'Paid',
    closed_date: '2026-09-08',
    notes: '2% sale commission cleared via RTGS from seller.',
  },
  {
    id: 'TXN-803',
    opportunity_id: 'OPP-4999',
    property_id: 'P-1008',
    property_short_loc: '09-Super_Corridor',
    client_name: 'Meena Builder',
    staff_id: 'u7',
    staff_name: 'Sanjay Verma',
    staff_role: 'Field Agent',
    transaction_type: 'Sale',
    transaction_value: 6500000,
    commission_pct: 1.5,
    commission_amount: 97500,
    payment_status: 'Partial',
    closed_date: '2026-09-15',
    notes: 'First milestone of ₹50,000 received; balance ₹47,500 due on registry.',
  },
  {
    id: 'TXN-804',
    opportunity_id: 'OPP-4996',
    property_id: 'P-1007',
    property_short_loc: '04-Vijay_Nagar',
    client_name: 'Ramesh Patel',
    staff_id: 'u5',
    staff_name: 'Priya Sharma',
    staff_role: 'Field Agent',
    transaction_type: 'Lease',
    transaction_value: 192000,
    commission_pct: 10.0,
    commission_amount: 19200,
    payment_status: 'Paid',
    closed_date: '2026-09-05',
    notes: 'Commercial lease brokerage paid by landlord.',
  },
  {
    id: 'TXN-805',
    opportunity_id: 'OPP-4995',
    property_id: 'P-1006',
    property_short_loc: '05-MG_Road',
    client_name: 'Kavita Sharma',
    staff_id: 'u3',
    staff_name: 'Ravi Mehta',
    staff_role: 'Field Agent',
    transaction_type: 'Sale',
    transaction_value: 12000000,
    commission_pct: 1.5,
    commission_amount: 180000,
    payment_status: 'Pending',
    closed_date: '2026-09-18',
    notes: 'Registry scheduled for month end; token advance received.',
  },
]

// ── Audit Log Types & Data ───────────────────────────────────────────────────

export interface AuditLogRow {
  id: string
  timestamp: string
  user_id: string
  user_name: string
  user_role: string
  action: 'Created' | 'Updated' | 'Deleted' | 'Status Changed'
  entity_type: 'Property' | 'Requirement' | 'Lead' | 'Visit' | 'Opportunity' | 'User' | 'Transaction'
  entity_id: string
  summary: string
  details?: Record<string, any>
  ip_address?: string
}

export const MOCK_AUDIT_LOGS: AuditLogRow[] = [
  {
    id: 'AUD-901',
    timestamp: '2026-09-19 14:15:02',
    user_id: 'u2',
    user_name: 'Neha Kapoor',
    user_role: 'OFFICE_EXECUTIVE',
    action: 'Status Changed',
    entity_type: 'Visit',
    entity_id: 'V-702',
    summary: 'Status changed from Submitted to Approved following photo verification.',
    details: {
      old_status: 'Submitted',
      new_status: 'Approved',
      reviewer_notes: 'All 5 checklist items verified and geotags match within 35m.',
    },
    ip_address: '192.168.1.42',
  },
  {
    id: 'AUD-902',
    timestamp: '2026-09-19 13:42:18',
    user_id: 'u3',
    user_name: 'Ravi Mehta',
    user_role: 'AGENT',
    action: 'Created',
    entity_type: 'Opportunity',
    entity_id: 'OPP-5001',
    summary: 'Created new opportunity for Ramesh Patel linked to P-1003 in Scheme 140.',
    details: {
      client: 'Ramesh Patel',
      property_id: 'P-1003',
      expected_value: 5000000,
      initial_stage: 'QUALIFIED',
    },
    ip_address: '103.21.58.11',
  },
  {
    id: 'AUD-903',
    timestamp: '2026-09-19 11:20:45',
    user_id: 'u1',
    user_name: 'Aman Desai',
    user_role: 'SUPER_ADMIN',
    action: 'Updated',
    entity_type: 'Property',
    entity_id: 'P-1001',
    summary: 'Updated asking price from ₹45,000/mo to ₹42,000/mo per landlord instructions.',
    details: {
      field: 'asking_price',
      old_value: '₹45,000',
      new_value: '₹42,000',
      authorized_by: 'Aman Desai',
    },
    ip_address: '192.168.1.10',
  },
  {
    id: 'AUD-904',
    timestamp: '2026-09-18 17:05:12',
    user_id: 'u2',
    user_name: 'Neha Kapoor',
    user_role: 'OFFICE_EXECUTIVE',
    action: 'Status Changed',
    entity_type: 'Opportunity',
    entity_id: 'OPP-5002',
    summary: 'Deal closed as Won. Transaction TXN-801 recorded for ₹216,000.',
    details: {
      stage_before: 'DOCUMENTATION',
      stage_after: 'WON',
      transaction_id: 'TXN-801',
      deal_value: 216000,
      commission: 18000,
    },
    ip_address: '192.168.1.42',
  },
  {
    id: 'AUD-905',
    timestamp: '2026-09-18 15:10:30',
    user_id: 'u5',
    user_name: 'Priya Sharma',
    user_role: 'AGENT',
    action: 'Status Changed',
    entity_type: 'Requirement',
    entity_id: 'REQ-103',
    summary: 'Status changed from Active to Fulfilled after client agreement signing.',
    details: {
      old_status: 'Active',
      new_status: 'Fulfilled',
      matched_property: 'P-1007',
      client_name: 'Ramesh Patel',
    },
    ip_address: '103.21.58.19',
  },
  {
    id: 'AUD-906',
    timestamp: '2026-09-18 10:30:00',
    user_id: 'u1',
    user_name: 'Aman Desai',
    user_role: 'SUPER_ADMIN',
    action: 'Updated',
    entity_type: 'User',
    entity_id: 'u6',
    summary: 'Status changed from Active to Inactive for user Amit Patel.',
    details: {
      field: 'status',
      old_value: 'Active',
      new_value: 'Inactive',
      reason: 'Temporary sabbatical leave',
    },
    ip_address: '192.168.1.10',
  },
  {
    id: 'AUD-907',
    timestamp: '2026-09-17 16:45:22',
    user_id: 'u7',
    user_name: 'Sanjay Verma',
    user_role: 'AGENT',
    action: 'Created',
    entity_type: 'Lead',
    entity_id: 'L-204',
    summary: 'Created new Buyer lead Sunita Gupta from referral source.',
    details: {
      lead_name: 'Sunita Gupta',
      source: 'Referral',
      budget: '₹4,000,000 - ₹5,000,000',
      category: 'Buy-Sell Flat/Duplex',
    },
    ip_address: '103.21.58.24',
  },
  {
    id: 'AUD-908',
    timestamp: '2026-09-17 12:15:40',
    user_id: 'u2',
    user_name: 'Neha Kapoor',
    user_role: 'OFFICE_EXECUTIVE',
    action: 'Status Changed',
    entity_type: 'Property',
    entity_id: 'P-1010',
    summary: 'Status changed from Available to Sold after token registration.',
    details: {
      old_status: 'Available',
      new_status: 'Sold',
      buyer_party: 'Sunita Gupta',
      sale_value: 4800000,
    },
    ip_address: '192.168.1.42',
  },
  {
    id: 'AUD-909',
    timestamp: '2026-09-16 14:00:15',
    user_id: 'u3',
    user_name: 'Ravi Mehta',
    user_role: 'AGENT',
    action: 'Status Changed',
    entity_type: 'Opportunity',
    entity_id: 'OPP-5003',
    summary: 'Status changed to Lost. Reason: Price Issue (buyer budget gap).',
    details: {
      old_stage: 'NEGOTIATION',
      new_stage: 'LOST',
      lost_reason: 'Price Issue',
      remarks: 'Seller refused to accept ₹70L; client budget capped at ₹65L.',
    },
    ip_address: '103.21.58.11',
  },
  {
    id: 'AUD-910',
    timestamp: '2026-09-16 09:30:00',
    user_id: 'u1',
    user_name: 'Aman Desai',
    user_role: 'SUPER_ADMIN',
    action: 'Updated',
    entity_type: 'Transaction',
    entity_id: 'TXN-803',
    summary: 'Recorded partial payment receipt of ₹50,000 via NEFT.',
    details: {
      transaction_id: 'TXN-803',
      payment_status: 'Partial',
      amount_received: 50000,
      balance_due: 47500,
      payment_mode: 'NEFT Bank Transfer',
    },
    ip_address: '192.168.1.10',
  },
  {
    id: 'AUD-911',
    timestamp: '2026-09-15 18:20:05',
    user_id: 'u5',
    user_name: 'Priya Sharma',
    user_role: 'AGENT',
    action: 'Created',
    entity_type: 'Visit',
    entity_id: 'V-704',
    summary: 'Scheduled commercial site visit for Ramesh Patel at P-1007 Vijay Nagar.',
    details: {
      client: 'Ramesh Patel',
      property: 'P-1007',
      purpose: 'Client Inspection',
      scheduled_for: '2026-09-16 11:00 AM',
    },
    ip_address: '103.21.58.19',
  },
  {
    id: 'AUD-912',
    timestamp: '2026-09-15 11:10:50',
    user_id: 'u2',
    user_name: 'Neha Kapoor',
    user_role: 'OFFICE_EXECUTIVE',
    action: 'Deleted',
    entity_type: 'Requirement',
    entity_id: 'REQ-108',
    summary: 'Removed duplicate residential inquiry REQ-108 per client confirmation.',
    details: {
      reason: 'Duplicate client entry merged into REQ-101',
      client_name: 'Aman Verma',
    },
    ip_address: '192.168.1.42',
  },
]

// ── Marketing Campaigns ───────────────────────────────────────────────────────

export const MOCK_CAMPAIGNS: CampaignRow[] = [
  {
    id: 'CMP-2026-001',
    name: 'Super Corridor Tech Hub Promotion',
    type: 'Property Promotion',
    status: 'Active',
    start_date: '2026-09-01',
    end_date: '2026-10-31',
    owner_id: 'u2',
    owner_name: 'Neha Kapoor',
    objective: 'Drive buyer inquiries for premium commercial and residential plots near the Super Corridor IT SEZ.',
    target_audience: ['Buyers', 'Investors'],
    geography: '09-Super_Corridor, Indore',
    categories: ['Commercial', 'Residential'],
    transaction_types: ['Sale', 'Purchase'],
    planned_budget: 75000,
    target_leads: 50,
    target_qualified_leads: 20,
    target_opportunities: 8,
    promoted_properties: ['P-1008', 'P-1009'],
    created_at: '2026-08-25T10:00:00Z',
    updated_at: '2026-09-18T14:30:00Z',
  },
  {
    id: 'CMP-2026-002',
    name: 'Scheme 140 Luxury High-Rise Influx',
    type: 'Buyer Acquisition',
    status: 'Active',
    start_date: '2026-09-10',
    end_date: '2026-10-25',
    owner_id: 'u1',
    owner_name: 'Aman Desai',
    objective: 'Target high-net-worth individuals looking for 3BHK and penthouse flats in Scheme 140.',
    target_audience: ['Buyers', 'Investors'],
    geography: '01-Schm140_Mayank, Indore',
    categories: ['Residential'],
    transaction_types: ['Sale'],
    planned_budget: 120000,
    target_leads: 80,
    target_qualified_leads: 35,
    target_opportunities: 15,
    promoted_properties: ['P-1003'],
    created_at: '2026-09-02T11:15:00Z',
    updated_at: '2026-09-20T09:10:00Z',
  },
  {
    id: 'CMP-2026-003',
    name: 'Corporate Office Space Lease Drive',
    type: 'Tenant Acquisition',
    status: 'Paused',
    start_date: '2026-08-15',
    end_date: '2026-09-30',
    owner_id: 'u3',
    owner_name: 'Ravi Mehta',
    objective: 'Attract IT firms, clinics, and startups looking for ready-to-move furnished offices on MG Road.',
    target_audience: ['Tenants', 'Brokers'],
    geography: '05-MG_Road, Indore',
    categories: ['Commercial'],
    transaction_types: ['Rent', 'Lease'],
    planned_budget: 45000,
    target_leads: 30,
    target_qualified_leads: 12,
    target_opportunities: 5,
    promoted_properties: ['P-1005'],
    created_at: '2026-08-10T08:45:00Z',
    updated_at: '2026-09-15T16:20:00Z',
  },
  {
    id: 'CMP-2026-004',
    name: 'Vijay Nagar Landlord Onboarding Q3',
    type: 'Landlord Acquisition',
    status: 'Completed',
    start_date: '2026-07-01',
    end_date: '2026-08-31',
    owner_id: 'u2',
    owner_name: 'Neha Kapoor',
    objective: 'Acquire exclusive rental mandates from property owners in Vijay Nagar and Geeta Bhawan.',
    target_audience: ['Landlords', 'Owners'],
    geography: '04-Vijay_Nagar, 07-Geeta_Bhawan',
    categories: ['Residential', 'Commercial'],
    transaction_types: ['Rent', 'Lease'],
    planned_budget: 35000,
    target_leads: 25,
    target_qualified_leads: 18,
    target_opportunities: 10,
    promoted_properties: ['P-1001', 'P-1002'],
    created_at: '2026-06-25T12:00:00Z',
    updated_at: '2026-08-31T18:00:00Z',
  },
  {
    id: 'CMP-2026-005',
    name: 'Diwali Festive Land Investment',
    type: 'Lead Generation',
    status: 'Planned',
    start_date: '2026-10-01',
    end_date: '2026-11-15',
    owner_id: 'u5',
    owner_name: 'Priya Sharma',
    objective: 'Pre-festive promotional push across social and digital channels for upcoming plot developments.',
    target_audience: ['Buyers', 'Investors', 'Developers'],
    geography: 'Indore Suburbs, Super Corridor',
    categories: ['Residential', 'Agricultural'],
    transaction_types: ['Sale'],
    planned_budget: 150000,
    target_leads: 100,
    target_qualified_leads: 40,
    target_opportunities: 12,
    promoted_properties: [],
    created_at: '2026-09-18T10:00:00Z',
    updated_at: '2026-09-18T10:00:00Z',
  },
  {
    id: 'CMP-2026-006',
    name: 'Indore Prime Commercial Awareness',
    type: 'Brand Awareness',
    status: 'Draft',
    start_date: '2026-10-15',
    end_date: '2026-12-31',
    owner_id: 'u1',
    owner_name: 'Aman Desai',
    objective: 'Establish PropDesk as the leading agency for commercial real estate in Central India.',
    target_audience: ['Brokers', 'Developers', 'Investors'],
    geography: 'Indore Metro Region',
    categories: ['Commercial', 'Industrial'],
    transaction_types: ['Sale', 'Lease'],
    planned_budget: 200000,
    target_leads: 60,
    target_qualified_leads: 25,
    target_opportunities: 10,
    promoted_properties: [],
    created_at: '2026-09-20T16:00:00Z',
    updated_at: '2026-09-20T16:00:00Z',
  },
]

