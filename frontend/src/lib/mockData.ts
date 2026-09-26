/**
 * Mock data for frontend development.
 *
 * TEMPORARY: This entire file will be replaced with real API calls
 * during the "connect to backend" pass. It mirrors the seed_dev.py data
 * so the UI looks realistic during development.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type ChannelType = 'Digital' | 'Offline'

export type DigitalSourceType =
  | 'Website'
  | 'Landing Page'
  | 'Social Media'
  | 'Search/Display Ad'
  | 'Property Portal'
  | 'WhatsApp'
  | 'Email'
  | 'QR Code'
  | 'Digital Form'
  | 'Other'

export type OfflineSourceType =
  | 'Newspaper'
  | 'Hoarding'
  | 'Banner'
  | 'Flyer'
  | 'Brochure'
  | 'Exhibition'
  | 'Event'
  | 'Local Campaign'
  | 'Networking Event'
  | 'Referral Drive'
  | 'Direct Marketing'
  | 'Other'

export interface LeadSourceItem {
  id: string
  name: string
  channel_type: ChannelType
  is_active: boolean
  description?: string
  leads_count?: number
  created_at: string
}

export interface LeadRow {
  id: string
  party_id: string
  party_name: string
  channel_type?: ChannelType | null
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
  referral_code?: string | null
  ad_reference?: string | null
  enquiry_at?: string | null
  referral_partner_id?: string | null
  referral_partner_name?: string | null
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
  actual_spend?: number
  target_leads: number
  target_qualified_leads: number
  target_opportunities: number
  promoted_properties?: string[]
  participating_partner_ids?: string[]
  created_at: string
  updated_at: string
}

export interface CampaignPropertyPromotion {
  id: string
  campaign_id: string
  property_id: string
  marketing_headline: string
  marketing_description: string
  cta_text: string
  media_attachments: string[] // file-name references (e.g. photos, videos, brochure)
  enquiries_count: number
  added_at: string
}

// ── Referral & Partner Management Types ────────────────────────────────────────

export type PartnerCategory =
  | 'Property Consultant'
  | 'Broker'
  | 'Developer'
  | 'Investor'
  | 'Corporate Contact'
  | 'Referral Partner'
  | 'Other'

export type PartnerStatus = 'Active' | 'Inactive'

export interface ReferralPartnerRow {
  id: string
  name: string
  category: PartnerCategory
  contact_person?: string
  phone: string
  email: string
  referral_code: string
  status: PartnerStatus
  notes?: string
  created_at: string
}

// ── Telemarketing Campaign Types ───────────────────────────────────────────────

export type TelemarketingCampaignStatus = 'Draft' | 'Active' | 'Paused' | 'Completed'

export type TelemarketingPurpose =
  | 'Cold Calling'
  | 'Market Survey'
  | 'Owner Acquisition'
  | 'Buyer Acquisition'
  | 'Lead Reactivation'
  | 'Other'

export type CallDisposition =
  | 'Not Called'
  | 'Connected'
  | 'Busy'
  | 'Call Later'
  | 'Interested'
  | 'Not Interested'
  | 'Wrong Number'
  | 'Do Not Contact'
  | 'Converted to Lead'

export interface TelemarketingContact {
  id: string
  campaign_id: string
  name: string
  phone: string
  party_id?: string | null
  status: CallDisposition
  last_attempt_at?: string | null
  attempts_count: number
  assigned_telecaller: string
  notes?: string | null
  next_attempt_at?: string | null
  converted_lead_id?: string | null
  created_at: string
}

export interface TelemarketingCampaignRow {
  id: string
  name: string
  linked_campaign_id?: string | null
  linked_campaign_name?: string | null
  target_audience: string // e.g. 'Buyer', 'Seller', 'Owner', 'Tenant', 'Landlord', 'Investor', 'Broker', 'Other'
  category: string // e.g. 'Residential', 'Commercial', 'Industrial', 'Agricultural', 'Mixed'
  geography: string
  start_date: string
  end_date: string
  purpose: TelemarketingPurpose
  assigned_telecallers: string[]
  status: TelemarketingCampaignStatus
  created_at: string
}

export interface DemandGapItem {
  id: string
  category: string
  category_label: string
  short_loc: string
  demand_count: number
  supply_count: number
  gap: number
  suggested_campaign_type: CampaignType
  suggested_campaign_name: string
  suggested_objective: string
  suggested_audience: TargetAudienceType[]
  suggested_category: PropertyCategoryType
  suggested_transaction: TransactionType
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
  { id: 'u1',  name: 'Aman Desai',     email: 'aman@propdesk.in',    role: 'SUPER_ADMIN',      password: 'Demo@123' },
  { id: 'u2',  name: 'Neha Kapoor',    email: 'neha@propdesk.in',    role: 'OFFICE_EXECUTIVE', password: 'Demo@123' },
  { id: 'u3',  name: 'Ravi Mehta',     email: 'ravi@propdesk.in',    role: 'AGENT',            password: 'Demo@123' },
  { id: 'u4',  name: 'Vikram Singh',   email: 'vikram@propdesk.in',  role: 'CLIENT',           password: 'Demo@123' },
  { id: 'u5',  name: 'Priya Sharma',   email: 'priya@propdesk.in',   role: 'AGENT',            password: 'Demo@123' },
  { id: 'u6',  name: 'Amit Patel',     email: 'amit.p@propdesk.in',  role: 'AGENT',            password: 'Demo@123' },
  { id: 'u7',  name: 'Sanjay Verma',   email: 'sanjay@propdesk.in',  role: 'AGENT',            password: 'Demo@123' },
  { id: 'u8',  name: 'Rajesh Nair',    email: 'rajesh.n@propdesk.in',role: 'OFFICE_EXECUTIVE', password: 'Demo@123' },
  { id: 'u9',  name: 'Sunita Rao',     email: 'sunita.r@propdesk.in',role: 'OFFICE_EXECUTIVE', password: 'Demo@123' },
  { id: 'u10', name: 'Alok Pandey',    email: 'alok.p@propdesk.in',  role: 'OFFICE_EXECUTIVE', password: 'Demo@123' },
  { id: 'u11', name: 'Meera Sen',      email: 'meera.s@propdesk.in', role: 'OFFICE_EXECUTIVE', password: 'Demo@123' },
  { id: 'u12', name: 'Mayank Joshi',   email: 'mayank.j@propdesk.in',role: 'AGENT',            password: 'Demo@123' },
  { id: 'u13', name: 'Rohit Malviya',  email: 'rohit.m@propdesk.in', role: 'AGENT',            password: 'Demo@123' },
  { id: 'u14', name: 'Amit Jain',      email: 'amit@example.com',    role: 'CLIENT',           password: 'Demo@123' },
  { id: 'u15', name: 'Rahul Verma',    email: 'rahul@example.com',   role: 'CLIENT',           password: 'Demo@123' },
  { id: 'u16', name: 'Kavita Sharma',  email: 'kavita@example.com',  role: 'CLIENT',           password: 'Demo@123' },
  { id: 'u17', name: 'Ramesh Patel',   email: 'ramesh@example.com',  role: 'CLIENT',           password: 'Demo@123' },
  { id: 'u18', name: 'Sunita Gupta',   email: 'sunita@example.com',  role: 'CLIENT',           password: 'Demo@123' },
  { id: 'u19', name: 'Anil Sharma',    email: 'anil.sharma@example.com', role: 'CLIENT',       password: 'Demo@123' },
  { id: 'u20', name: 'Meena Builder',  email: 'meena@example.com',   role: 'CLIENT',           password: 'Demo@123' },
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
  // ── Expanded parties (p9–p50) ────────────────────────────────────────────────
  { id: 'p9',  name: 'Anil Sharma',       email: 'anil.sharma@example.com',  mobile: '+91 9812300001', city: 'Indore',    roles: ['BUYER'],                status: 'Active',   source: 'Website',          leads_count: 2, requirements_count: 1, opportunities_count: 0, updated_at: '2026-09-20T09:00:00Z' },
  { id: 'p10', name: 'Anil K. Sharma',    email: 'anil.k@example.com',       mobile: '+91 9812300002', city: 'Indore',    roles: ['BUYER', 'INVESTOR'],    status: 'Active',   source: 'Referral',         leads_count: 1, requirements_count: 1, opportunities_count: 1, updated_at: '2026-09-19T10:00:00Z' },
  { id: 'p11', name: 'Priya Tiwari',      email: 'priya.t@example.com',      mobile: '+91 9812300003', city: 'Indore',    roles: ['TENANT'],               status: 'Active',   source: 'Social Media',     leads_count: 1, requirements_count: 1, opportunities_count: 0, updated_at: '2026-09-18T11:00:00Z' },
  { id: 'p12', name: 'Suresh Agrawal',    email: 'suresh.a@example.com',     mobile: '+91 9812300004', city: 'Indore',    roles: ['OWNER', 'LANDLORD'],    status: 'Active',   source: 'Walk-in',          leads_count: 0, requirements_count: 0, opportunities_count: 2, updated_at: '2026-09-17T12:00:00Z' },
  { id: 'p13', name: 'Geeta Malviya',     email: 'geeta.m@example.com',      mobile: '+91 9812300005', city: 'Indore',    roles: ['BUYER'],                status: 'Active',   source: 'Website',          leads_count: 1, requirements_count: 1, opportunities_count: 0, updated_at: '2026-09-16T13:00:00Z' },
  { id: 'p14', name: 'Rakesh Chouhan',    email: 'rakesh.c@example.com',     mobile: '+91 9812300006', city: 'Bhopal',    roles: ['INVESTOR'],             status: 'Active',   source: 'Referral',         leads_count: 2, requirements_count: 1, opportunities_count: 1, updated_at: '2026-09-15T14:00:00Z' },
  { id: 'p15', name: 'Sonal Joshi',       email: 'sonal.j@example.com',      mobile: '+91 9812300007', city: 'Indore',    roles: ['TENANT', 'BUYER'],      status: 'Active',   source: 'Property Portal',  leads_count: 1, requirements_count: 2, opportunities_count: 0, updated_at: '2026-09-14T15:00:00Z' },
  { id: 'p16', name: 'Dinesh Rathore',    email: 'dinesh.r@example.com',     mobile: '+91 9812300008', city: 'Ujjain',    roles: ['BROKER'],               status: 'Active',   source: null,               leads_count: 0, requirements_count: 0, opportunities_count: 0, updated_at: '2026-09-13T09:00:00Z' },
  { id: 'p17', name: 'Anita Bhatt',       email: 'anita.b@example.com',      mobile: '+91 9812300009', city: 'Indore',    roles: ['OWNER', 'SELLER'],      status: 'Active',   source: 'Walk-in',          leads_count: 0, requirements_count: 0, opportunities_count: 1, updated_at: '2026-09-12T10:00:00Z' },
  { id: 'p18', name: 'Manoj Khare',       email: 'manoj.k@example.com',      mobile: '+91 9812300010', city: 'Indore',    roles: ['BUYER'],                status: 'Active',   source: 'WhatsApp',         leads_count: 1, requirements_count: 1, opportunities_count: 0, updated_at: '2026-09-11T11:00:00Z' },
  { id: 'p19', name: 'Poonam Saxena',     email: 'poonam.s@example.com',     mobile: '+91 9812300011', city: 'Indore',    roles: ['LANDLORD'],             status: 'Active',   source: 'Referral',         leads_count: 0, requirements_count: 0, opportunities_count: 1, updated_at: '2026-09-10T12:00:00Z' },
  { id: 'p20', name: 'Vijay Patil',       email: 'vijay.p@example.com',      mobile: '+91 9812300012', city: 'Indore',    roles: ['BUYER', 'INVESTOR'],    status: 'Active',   source: 'Event',            leads_count: 2, requirements_count: 1, opportunities_count: 1, updated_at: '2026-09-09T13:00:00Z' },
  { id: 'p21', name: 'Kavya Singh',       email: 'kavya.s@example.com',      mobile: '+91 9812300013', city: 'Indore',    roles: ['TENANT'],               status: 'Active',   source: 'Social Media',     leads_count: 1, requirements_count: 1, opportunities_count: 0, updated_at: '2026-09-08T14:00:00Z' },
  { id: 'p22', name: 'Hemant Dubey',      email: 'hemant.d@example.com',     mobile: '+91 9812300014', city: 'Indore',    roles: ['OWNER'],                status: 'Active',   source: 'Walk-in',          leads_count: 0, requirements_count: 0, opportunities_count: 1, updated_at: '2026-09-07T09:00:00Z' },
  { id: 'p23', name: 'Ritu Gupta',        email: 'ritu.g@example.com',       mobile: '+91 9812300015', city: 'Dewas',     roles: ['BUYER'],                status: 'Active',   source: 'Hoarding',         leads_count: 1, requirements_count: 1, opportunities_count: 0, updated_at: '2026-09-06T10:00:00Z' },
  { id: 'p24', name: 'Santosh Yadav',     email: 'santosh.y@example.com',    mobile: '+91 9812300016', city: 'Indore',    roles: ['BUILDER'],              status: 'Active',   source: null,               leads_count: 0, requirements_count: 0, opportunities_count: 0, updated_at: '2026-09-05T11:00:00Z' },
  { id: 'p25', name: 'Meera Pandey',      email: 'meera.p@example.com',      mobile: '+91 9812300017', city: 'Indore',    roles: ['BUYER', 'TENANT'],      status: 'Active',   source: 'Property Portal',  leads_count: 2, requirements_count: 2, opportunities_count: 0, updated_at: '2026-09-04T12:00:00Z' },
  { id: 'p26', name: 'Nilesh Shah',       email: 'nilesh.s@example.com',     mobile: '+91 9812300018', city: 'Indore',    roles: ['INVESTOR'],             status: 'Active',   source: 'Networking Event', leads_count: 1, requirements_count: 1, opportunities_count: 1, updated_at: '2026-09-03T13:00:00Z' },
  { id: 'p27', name: 'Divya Rastogi',     email: 'divya.r@example.com',      mobile: '+91 9812300019', city: 'Indore',    roles: ['OWNER', 'SELLER'],      status: 'Active',   source: 'Referral',         leads_count: 0, requirements_count: 0, opportunities_count: 1, updated_at: '2026-09-02T14:00:00Z' },
  { id: 'p28', name: 'Ashok Tripathi',    email: 'ashok.t@example.com',      mobile: '+91 9812300020', city: 'Indore',    roles: ['BUYER'],                status: 'Active',   source: 'Flyer',            leads_count: 1, requirements_count: 1, opportunities_count: 0, updated_at: '2026-09-01T09:00:00Z' },
  { id: 'p29', name: 'Sunita Rajput',     email: 'sunita.r@example.com',     mobile: '+91 9812300021', city: 'Indore',    roles: ['LANDLORD'],             status: 'Active',   source: 'Walk-in',          leads_count: 0, requirements_count: 0, opportunities_count: 1, updated_at: '2026-08-31T10:00:00Z' },
  { id: 'p30', name: 'Ramesh Yadav',      email: 'ramesh.y@example.com',     mobile: '+91 9812300022', city: 'Ratlam',    roles: ['BROKER'],               status: 'Active',   source: null,               leads_count: 0, requirements_count: 0, opportunities_count: 0, updated_at: '2026-08-30T11:00:00Z' },
  { id: 'p31', name: 'Pooja Mishra',      email: 'pooja.m@example.com',      mobile: '+91 9812300023', city: 'Indore',    roles: ['BUYER'],                status: 'Active',   source: 'Email',            leads_count: 1, requirements_count: 1, opportunities_count: 0, updated_at: '2026-08-29T12:00:00Z' },
  { id: 'p32', name: 'Karan Mehta',       email: 'karan.m@example.com',      mobile: '+91 9812300024', city: 'Indore',    roles: ['BUYER', 'INVESTOR'],    status: 'Active',   source: 'Social Media',     leads_count: 1, requirements_count: 1, opportunities_count: 0, updated_at: '2026-08-28T13:00:00Z' },
  { id: 'p33', name: 'Deepika Pandey',    email: 'deepika.p@example.com',    mobile: '+91 9812300025', city: 'Indore',    roles: ['TENANT'],               status: 'Active',   source: 'Website',          leads_count: 1, requirements_count: 1, opportunities_count: 0, updated_at: '2026-08-27T14:00:00Z' },
  { id: 'p34', name: 'Naresh Bhadke',     email: 'naresh.b@example.com',     mobile: '+91 9812300026', city: 'Indore',    roles: ['OWNER'],                status: 'Inactive', source: 'Walk-in',          leads_count: 0, requirements_count: 0, opportunities_count: 0, updated_at: '2026-08-26T09:00:00Z' },
  { id: 'p35', name: 'Priti Kaur',        email: 'priti.k@example.com',      mobile: '+91 9812300027', city: 'Indore',    roles: ['BUYER'],                status: 'Active',   source: 'Banner',           leads_count: 1, requirements_count: 1, opportunities_count: 0, updated_at: '2026-08-25T10:00:00Z' },
  { id: 'p36', name: 'Ajay Shrivastava',  email: 'ajay.s@example.com',       mobile: '+91 9812300028', city: 'Indore',    roles: ['CONSULTANT'],           status: 'Active',   source: 'Networking Event', leads_count: 0, requirements_count: 0, opportunities_count: 0, updated_at: '2026-08-24T11:00:00Z' },
  { id: 'p37', name: 'Bhavna Jain',       email: 'bhavna.j@example.com',     mobile: '+91 9812300029', city: 'Indore',    roles: ['BUYER', 'CLIENT'],      status: 'Active',   source: 'WhatsApp',         leads_count: 2, requirements_count: 1, opportunities_count: 1, updated_at: '2026-08-23T12:00:00Z' },
  { id: 'p38', name: 'Mukesh Trivedi',    email: 'mukesh.t@example.com',     mobile: '+91 9812300030', city: 'Indore',    roles: ['OWNER', 'LANDLORD'],    status: 'Active',   source: 'Referral',         leads_count: 0, requirements_count: 0, opportunities_count: 2, updated_at: '2026-08-22T13:00:00Z' },
  { id: 'p39', name: 'Shweta Soni',       email: 'shweta.s@example.com',     mobile: '+91 9812300031', city: 'Indore',    roles: ['TENANT'],               status: 'Active',   source: 'QR Code',          leads_count: 1, requirements_count: 1, opportunities_count: 0, updated_at: '2026-08-21T14:00:00Z' },
  { id: 'p40', name: 'Dinesh Kumar',      email: 'dinesh.k@example.com',     mobile: '+91 9812300032', city: 'Sehore',    roles: ['BUYER'],                status: 'Active',   source: 'Newspaper',        leads_count: 1, requirements_count: 1, opportunities_count: 0, updated_at: '2026-08-20T09:00:00Z' },
  { id: 'p41', name: 'Archana Shukla',    email: 'archana.s@example.com',    mobile: '+91 9812300033', city: 'Indore',    roles: ['INVESTOR'],             status: 'Active',   source: 'Referral',         leads_count: 1, requirements_count: 1, opportunities_count: 0, updated_at: '2026-08-19T10:00:00Z' },
  { id: 'p42', name: 'Yogesh Thakur',     email: 'yogesh.t@example.com',     mobile: '+91 9812300034', city: 'Indore',    roles: ['BUYER'],                status: 'Active',   source: 'Exhibition',       leads_count: 1, requirements_count: 1, opportunities_count: 0, updated_at: '2026-08-18T11:00:00Z' },
  { id: 'p43', name: 'Vandana Malviya',   email: 'vandana.m@example.com',    mobile: '+91 9812300035', city: 'Indore',    roles: ['OWNER', 'SELLER'],      status: 'Active',   source: 'Walk-in',          leads_count: 0, requirements_count: 0, opportunities_count: 1, updated_at: '2026-08-17T12:00:00Z' },
  { id: 'p44', name: 'Rohit Bansal',      email: 'rohit.b@example.com',      mobile: '+91 9812300036', city: 'Indore',    roles: ['BUYER'],                status: 'Active',   source: 'Property Portal',  leads_count: 2, requirements_count: 1, opportunities_count: 1, updated_at: '2026-08-16T13:00:00Z' },
  { id: 'p45', name: 'Suman Agrawal',     email: 'suman.a2@example.com',     mobile: '+91 9812300037', city: 'Indore',    roles: ['LANDLORD'],             status: 'Active',   source: 'Walk-in',          leads_count: 0, requirements_count: 0, opportunities_count: 1, updated_at: '2026-08-15T14:00:00Z' },
  { id: 'p46', name: 'Jitendra Solanki',  email: 'jitendra.s@example.com',   mobile: '+91 9812300038', city: 'Pithampur', roles: ['BUYER'],                status: 'Active',   source: 'Hoarding',         leads_count: 1, requirements_count: 1, opportunities_count: 0, updated_at: '2026-08-14T09:00:00Z' },
  { id: 'p47', name: 'Kirti Verma',       email: 'kirti.v@example.com',      mobile: '+91 9812300039', city: 'Indore',    roles: ['TENANT', 'BUYER'],      status: 'Active',   source: 'WhatsApp',         leads_count: 1, requirements_count: 1, opportunities_count: 0, updated_at: '2026-08-13T10:00:00Z' },
  { id: 'p48', name: 'Santosh Patel',     email: 'santosh.p@example.com',    mobile: '+91 9812300040', city: 'Indore',    roles: ['OWNER'],                status: 'Active',   source: 'Referral',         leads_count: 0, requirements_count: 0, opportunities_count: 1, updated_at: '2026-08-12T11:00:00Z' },
  { id: 'p49', name: 'Nisha Kapoor',      email: 'nisha.k@example.com',      mobile: '+91 9812300041', city: 'Indore',    roles: ['BUYER'],                status: 'Active',   source: 'Website',          leads_count: 1, requirements_count: 1, opportunities_count: 0, updated_at: '2026-08-11T12:00:00Z' },
  { id: 'p50', name: 'Raghav Dixit',      email: 'raghav.d@example.com',     mobile: '+91 9812300042', city: 'Indore',    roles: ['BUYER', 'INVESTOR'],    status: 'Active',   source: 'Exhibition',       leads_count: 1, requirements_count: 1, opportunities_count: 1, updated_at: '2026-08-10T13:00:00Z' },
]

// ── Lead Sources (Master Config) ───────────────────────────────────────────────

export const DEFAULT_LEAD_SOURCES: LeadSourceItem[] = [
  // Digital sources (10)
  { id: 'src-dig-01', name: 'Website',           channel_type: 'Digital', is_active: true,  description: 'Direct organic/direct visitors on the main PropDesk agency portal.', created_at: '2026-01-01T00:00:00Z' },
  { id: 'src-dig-02', name: 'Landing Page',      channel_type: 'Digital', is_active: true,  description: 'Campaign-dedicated standalone landing pages with lead capture forms.', created_at: '2026-01-01T00:00:00Z' },
  { id: 'src-dig-03', name: 'Social Media',       channel_type: 'Digital', is_active: true,  description: 'Organic posts and paid lead forms on Meta (Instagram/Facebook) and LinkedIn.', created_at: '2026-01-01T00:00:00Z' },
  { id: 'src-dig-04', name: 'Search/Display Ad', channel_type: 'Digital', is_active: true,  description: 'Google Ads (Search keywords & Display network banners).', created_at: '2026-01-01T00:00:00Z' },
  { id: 'src-dig-05', name: 'Property Portal',   channel_type: 'Digital', is_active: true,  description: 'Inbound property listing leads from 99acres, MagicBricks, Housing.', created_at: '2026-01-01T00:00:00Z' },
  { id: 'src-dig-06', name: 'WhatsApp',          channel_type: 'Digital', is_active: true,  description: 'Inbound chat widget clicks and broadcast response messages.', created_at: '2026-01-01T00:00:00Z' },
  { id: 'src-dig-07', name: 'Email',             channel_type: 'Digital', is_active: true,  description: 'Email newsletter clicks and dedicated subscriber email blasts.', created_at: '2026-01-01T00:00:00Z' },
  { id: 'src-dig-08', name: 'QR Code',           channel_type: 'Digital', is_active: true,  description: 'Dynamic QR codes printed on physical collateral directing to digital pages.', created_at: '2026-01-01T00:00:00Z' },
  { id: 'src-dig-09', name: 'Digital Form',      channel_type: 'Digital', is_active: true,  description: 'Embedded registration widgets on affiliate and community blogs.', created_at: '2026-01-01T00:00:00Z' },
  { id: 'src-dig-10', name: 'Other',             channel_type: 'Digital', is_active: true,  description: 'Miscellaneous online and digital acquisition channels.', created_at: '2026-01-01T00:00:00Z' },

  // Offline sources (12)
  { id: 'src-off-01', name: 'Newspaper',         channel_type: 'Offline', is_active: true,  description: 'Print daily newspaper advertisements, classifieds, and weekend inserts.', created_at: '2026-01-01T00:00:00Z' },
  { id: 'src-off-02', name: 'Hoarding',          channel_type: 'Offline', is_active: true,  description: 'Prime outdoor billboard hoardings on arterial highways & junctions.', created_at: '2026-01-01T00:00:00Z' },
  { id: 'src-off-03', name: 'Banner',            channel_type: 'Offline', is_active: true,  description: 'Street-pole kiosks, gate banners, and local flex boards.', created_at: '2026-01-01T00:00:00Z' },
  { id: 'src-off-04', name: 'Flyer',             channel_type: 'Offline', is_active: true,  description: 'Direct door-to-door handbill/pamphlet distribution in targeted societies.', created_at: '2026-01-01T00:00:00Z' },
  { id: 'src-off-05', name: 'Brochure',          channel_type: 'Offline', is_active: true,  description: 'Premium physical project booklets handed at client meetings and sales lounges.', created_at: '2026-01-01T00:00:00Z' },
  { id: 'src-off-06', name: 'Exhibition',        channel_type: 'Offline', is_active: true,  description: 'Real estate consumer expos and property conventions (CREDAI, etc.).', created_at: '2026-01-01T00:00:00Z' },
  { id: 'src-off-07', name: 'Event',             channel_type: 'Offline', is_active: true,  description: 'Project launch parties, weekend open houses, channel partner meets.', created_at: '2026-01-01T00:00:00Z' },
  { id: 'src-off-08', name: 'Local Campaign',    channel_type: 'Offline', is_active: true,  description: 'Targeted micro-market roadshows and mobile promotional canopies.', created_at: '2026-01-01T00:00:00Z' },
  { id: 'src-off-09', name: 'Networking Event',  channel_type: 'Offline', is_active: true,  description: 'BNI chapters, chamber of commerce forums, rotary club meetups.', created_at: '2026-01-01T00:00:00Z' },
  { id: 'src-off-10', name: 'Referral Drive',    channel_type: 'Offline', is_active: true,  description: 'Structured existing client & alumni word-of-mouth referral programs.', created_at: '2026-01-01T00:00:00Z' },
  { id: 'src-off-11', name: 'Direct Marketing',  channel_type: 'Offline', is_active: true,  description: 'Targeted outbound telecalling, corporate park visits, and direct mailers.', created_at: '2026-01-01T00:00:00Z' },
  { id: 'src-off-12', name: 'Other',             channel_type: 'Offline', is_active: true,  description: 'Miscellaneous offline acquisition channels and unclassified walk-ins.', created_at: '2026-01-01T00:00:00Z' },
  { id: 'src-off-13', name: 'Referral Partner',  channel_type: 'Offline', is_active: true,  description: 'Leads referred by registered marketing, broker, and corporate partners.', created_at: '2026-01-01T00:00:00Z' },
]

// ── Leads ─────────────────────────────────────────────────────────────────────

export const MOCK_LEADS: LeadRow[] = [
  {
    id: 'L-1001',
    party_id: 'p4',
    party_name: 'Amit Jain',
    channel_type: 'Offline',
    source: 'Referral Partner',
    lead_type: 'BUYER',
    status: 'CONTACTED',
    priority: 'HIGH',
    assigned_to_id: 'u2',
    assigned_to_name: 'Neha Kapoor',
    value: 7500000,
    remarks: 'Referred by Shree Balaji Consultancy for 2BHK Scheme 140',
    last_activity_at: '2026-09-18T10:00:00Z',
    next_follow_up_at: '2026-09-19T12:00:00Z',
    created_at: '2026-09-10T09:00:00Z',
    campaign_id: 'CMP-2026-002',
    campaign_name: 'Scheme 140 Luxury High-Rise Influx',
    referral_code: 'REF-BALAJI',
    ad_reference: 'Partner Direct Referral',
    enquiry_at: '2026-09-10T08:58:00Z',
    referral_partner_id: 'RP-101',
    referral_partner_name: 'Shree Balaji Realty Advisors',
  },
  {
    id: 'L-1002',
    party_id: 'p3',
    party_name: 'Vikram Singh',
    channel_type: 'Offline',
    source: 'Referral Drive',
    lead_type: 'TENANT',
    status: 'NEW',
    priority: 'MEDIUM',
    assigned_to_id: 'u3',
    assigned_to_name: 'Ravi Mehta',
    value: null,
    remarks: 'Referred by corporate park contact for IT office lease',
    last_activity_at: '2026-09-17T14:00:00Z',
    next_follow_up_at: null,
    created_at: '2026-09-12T11:00:00Z',
    campaign_id: 'CMP-2026-003',
    campaign_name: 'Corporate Office Space Lease Drive',
    referral_code: 'REF-TECHPARK-09',
    ad_reference: null,
    enquiry_at: '2026-09-12T10:45:00Z',
  },
  {
    id: 'L-1003',
    party_id: 'p6',
    party_name: 'Rahul Verma',
    channel_type: 'Offline',
    source: 'Hoarding',
    lead_type: 'BUYER',
    status: 'QUALIFIED',
    priority: 'CRITICAL',
    assigned_to_id: 'u2',
    assigned_to_name: 'Neha Kapoor',
    value: 5000000,
    remarks: 'Ready to finalize; spotted Super Corridor highway billboard',
    last_activity_at: '2026-09-18T08:00:00Z',
    next_follow_up_at: '2026-09-20T10:00:00Z',
    created_at: '2026-09-08T15:00:00Z',
    campaign_id: 'CMP-2026-001',
    campaign_name: 'Super Corridor Tech Hub Promotion',
    referral_code: 'HOARD-CORR-01',
    ad_reference: null,
    enquiry_at: '2026-09-08T14:40:00Z',
  },
  {
    id: 'L-1004',
    party_id: 'p7',
    party_name: 'Deepak Broker',
    channel_type: 'Offline',
    source: 'Networking Event',
    lead_type: 'CONSULTANT',
    status: 'LOST',
    priority: 'LOW',
    assigned_to_id: null,
    assigned_to_name: null,
    value: null,
    remarks: 'Met at regional realtor chapter meetup; unresponsive',
    last_activity_at: '2026-09-05T09:00:00Z',
    next_follow_up_at: null,
    created_at: '2026-09-01T08:00:00Z',
    campaign_id: null,
    campaign_name: null,
    referral_code: 'NET-BNI-AUG',
    ad_reference: null,
    enquiry_at: '2026-09-01T07:30:00Z',
  },
  {
    id: 'L-1005',
    party_id: 'p3',
    party_name: 'Vikram Singh',
    channel_type: 'Offline',
    source: 'Referral Partner',
    lead_type: 'BUYER',
    status: 'NEW',
    priority: 'HIGH',
    assigned_to_id: 'u2',
    assigned_to_name: 'Neha Kapoor',
    value: 8500000,
    remarks: 'Referred by Apex Prime Infra network for Super Corridor plots',
    last_activity_at: '2026-09-19T11:00:00Z',
    next_follow_up_at: '2026-09-21T10:00:00Z',
    created_at: '2026-09-19T11:00:00Z',
    campaign_id: 'CMP-2026-001',
    campaign_name: 'Super Corridor Tech Hub Promotion',
    referral_code: 'REF-APEX',
    ad_reference: 'Partner Network Drive',
    enquiry_at: '2026-09-19T10:55:00Z',
    referral_partner_id: 'RP-102',
    referral_partner_name: 'Apex Prime Infra Network',
  },
  {
    id: 'L-1006',
    party_id: 'p4',
    party_name: 'Amit Jain',
    channel_type: 'Offline',
    source: 'Referral Partner',
    lead_type: 'INVESTOR',
    status: 'CONTACTED',
    priority: 'MEDIUM',
    assigned_to_id: 'u3',
    assigned_to_name: 'Ravi Mehta',
    value: 6500000,
    remarks: 'Corporate HNI channel referral for commercial plot',
    last_activity_at: '2026-09-17T15:30:00Z',
    next_follow_up_at: '2026-09-20T16:00:00Z',
    created_at: '2026-09-15T14:00:00Z',
    campaign_id: 'CMP-2026-001',
    campaign_name: 'Super Corridor Tech Hub Promotion',
    referral_code: 'REF-HNI',
    ad_reference: 'Indore HNI Club Bulletin',
    enquiry_at: '2026-09-15T13:50:00Z',
    referral_partner_id: 'RP-103',
    referral_partner_name: 'Indore HNI Wealth Advisory',
  },
  {
    id: 'L-1007',
    party_id: 'p6',
    party_name: 'Rahul Verma',
    channel_type: 'Digital',
    source: 'Landing Page',
    lead_type: 'BUYER',
    status: 'QUALIFIED',
    priority: 'HIGH',
    assigned_to_id: 'u1',
    assigned_to_name: 'Aman Desai',
    value: 9200000,
    remarks: 'Visited landing page for Scheme 140 3BHK penthouse package',
    last_activity_at: '2026-09-20T10:00:00Z',
    next_follow_up_at: '2026-09-22T11:00:00Z',
    created_at: '2026-09-16T09:30:00Z',
    campaign_id: 'CMP-2026-002',
    campaign_name: 'Scheme 140 Luxury High-Rise Influx',
    referral_code: 'LP-SCH140-PENT',
    ad_reference: '/landing/scheme-140-penthouses?utm_source=meta&utm_medium=cpc',
    enquiry_at: '2026-09-16T09:25:00Z',
  },
  {
    id: 'L-1008',
    party_id: 'p2',
    party_name: 'Sunita Gupta',
    channel_type: 'Offline',
    source: 'Direct Marketing',
    lead_type: 'LANDLORD',
    status: 'CONTACTED',
    priority: 'MEDIUM',
    assigned_to_id: 'u2',
    assigned_to_name: 'Neha Kapoor',
    value: 35000,
    remarks: 'Agreed for rental listing in Vijay Nagar after direct flyer outreach',
    last_activity_at: '2026-08-20T16:00:00Z',
    next_follow_up_at: null,
    created_at: '2026-08-15T12:00:00Z',
    campaign_id: 'CMP-2026-004',
    campaign_name: 'Vijay Nagar Landlord Onboarding Q3',
    referral_code: 'DIR-FLYER-VNQ3',
    ad_reference: null,
    enquiry_at: '2026-08-15T11:30:00Z',
  },
  {
    id: 'L-1009',
    party_id: 'p1',
    party_name: 'Ramesh Patel',
    channel_type: 'Offline',
    source: 'Newspaper',
    lead_type: 'SELLER',
    status: 'CONTACTED',
    priority: 'HIGH',
    assigned_to_id: 'u2',
    assigned_to_name: 'Neha Kapoor',
    value: 12000000,
    remarks: 'Inquired after Dainik Bhaskar weekend property showcase insertion',
    last_activity_at: '2026-09-18T16:00:00Z',
    next_follow_up_at: '2026-09-22T10:00:00Z',
    created_at: '2026-09-18T08:30:00Z',
    campaign_id: null,
    campaign_name: null,
    referral_code: 'NP-DB-IND-09',
    ad_reference: null,
    enquiry_at: '2026-09-18T08:15:00Z',
  },
  {
    id: 'L-1010',
    party_id: 'p5',
    party_name: 'Kavita Sharma',
    channel_type: 'Digital',
    source: 'Property Portal',
    lead_type: 'LANDLORD',
    status: 'NEW',
    priority: 'MEDIUM',
    assigned_to_id: 'u3',
    assigned_to_name: 'Ravi Mehta',
    value: 45000,
    remarks: 'Enquired via 99acres verified owner-listing lead form',
    last_activity_at: '2026-09-19T14:15:00Z',
    next_follow_up_at: '2026-09-21T15:00:00Z',
    created_at: '2026-09-19T14:15:00Z',
    campaign_id: null,
    campaign_name: null,
    referral_code: '99ACRES-OWNER',
    ad_reference: '99acres Listing ID #982341 (Premium Banner Placement)',
    enquiry_at: '2026-09-19T14:05:00Z',
  },
  // ── Expanded Leads (L-1011–L-1048) ──────────────────────────────────────────
  { id: 'L-1011', party_id: 'p9',  party_name: 'Anil Sharma',      channel_type: 'Digital',  source: 'Website',           lead_type: 'BUYER',      status: 'NEW',       priority: 'HIGH',   assigned_to_id: 'u5',  assigned_to_name: 'Priya Sharma', value: 6000000,  remarks: 'Interested in 3BHK in Scheme 140 area',                             last_activity_at: '2026-09-20T10:00:00Z', next_follow_up_at: '2026-09-22T10:00:00Z', created_at: '2026-09-20T09:30:00Z', enquiry_at: '2026-09-20T09:25:00Z', campaign_id: 'CMP-2026-002', campaign_name: 'Scheme 140 Luxury High-Rise Influx', referral_code: null, ad_reference: null, referral_partner_id: null, referral_partner_name: null },
  { id: 'L-1012', party_id: 'p10', party_name: 'Anil K. Sharma',   channel_type: 'Offline',  source: 'Referral Partner',  lead_type: 'INVESTOR',   status: 'CONTACTED', priority: 'HIGH',   assigned_to_id: 'u3',  assigned_to_name: 'Ravi Mehta',   value: 15000000, remarks: 'HNI investor looking for commercial plots in Super Corridor',       last_activity_at: '2026-09-19T14:00:00Z', next_follow_up_at: '2026-09-21T11:00:00Z', created_at: '2026-09-18T10:00:00Z', enquiry_at: '2026-09-18T09:50:00Z', campaign_id: 'CMP-2026-001', campaign_name: 'Super Corridor Tech Hub Promotion', referral_code: 'REF-HNI', ad_reference: null, referral_partner_id: 'RP-103', referral_partner_name: 'Indore HNI Wealth Advisory' },
  { id: 'L-1013', party_id: 'p11', party_name: 'Priya Tiwari',     channel_type: 'Digital',  source: 'Social Media',      lead_type: 'TENANT',     status: 'QUALIFIED', priority: 'MEDIUM', assigned_to_id: 'u5',  assigned_to_name: 'Priya Sharma', value: 18000,    remarks: 'Looking for 2BHK furnished near Palasia for family',                last_activity_at: '2026-09-18T11:00:00Z', next_follow_up_at: '2026-09-20T12:00:00Z', created_at: '2026-09-17T10:00:00Z', enquiry_at: '2026-09-17T09:55:00Z', campaign_id: null, campaign_name: null, referral_code: null, ad_reference: 'Meta Lead Ad (FB)', referral_partner_id: null, referral_partner_name: null },
  { id: 'L-1014', party_id: 'p13', party_name: 'Geeta Malviya',    channel_type: 'Digital',  source: 'Website',           lead_type: 'BUYER',      status: 'NEW',       priority: 'LOW',    assigned_to_id: 'u6',  assigned_to_name: 'Amit Patel',   value: 3500000,  remarks: 'First-time home buyer, looking for 2BHK in Navlakha area',          last_activity_at: '2026-09-17T13:00:00Z', next_follow_up_at: null, created_at: '2026-09-16T12:00:00Z', enquiry_at: '2026-09-16T11:50:00Z', campaign_id: null, campaign_name: null, referral_code: null, ad_reference: null, referral_partner_id: null, referral_partner_name: null },
  { id: 'L-1015', party_id: 'p14', party_name: 'Rakesh Chouhan',   channel_type: 'Offline',  source: 'Referral Drive',    lead_type: 'INVESTOR',   status: 'CONTACTED', priority: 'HIGH',   assigned_to_id: 'u2',  assigned_to_name: 'Neha Kapoor',  value: 20000000, remarks: 'Portfolio diversification — interested in commercial properties',    last_activity_at: '2026-09-15T14:00:00Z', next_follow_up_at: '2026-09-20T15:00:00Z', created_at: '2026-09-14T13:00:00Z', enquiry_at: '2026-09-14T12:55:00Z', campaign_id: 'CMP-2026-003', campaign_name: 'Corporate Office Space Lease Drive', referral_code: 'REF-INVEST', ad_reference: null, referral_partner_id: 'RP-104', referral_partner_name: 'Bhopal Wealth Managers' },
  { id: 'L-1016', party_id: 'p15', party_name: 'Sonal Joshi',      channel_type: 'Digital',  source: 'Property Portal',   lead_type: 'TENANT',     status: 'QUALIFIED', priority: 'MEDIUM', assigned_to_id: 'u7',  assigned_to_name: 'Sanjay Verma', value: 20000,    remarks: 'Office relocation — needs 1200 sqft commercial space near MG Road', last_activity_at: '2026-09-14T15:00:00Z', next_follow_up_at: '2026-09-19T14:00:00Z', created_at: '2026-09-13T14:00:00Z', enquiry_at: '2026-09-13T13:50:00Z', campaign_id: null, campaign_name: null, referral_code: null, ad_reference: '99acres Premium Listing', referral_partner_id: null, referral_partner_name: null },
  { id: 'L-1017', party_id: 'p18', party_name: 'Manoj Khare',      channel_type: 'Digital',  source: 'WhatsApp',          lead_type: 'BUYER',      status: 'CONTACTED', priority: 'MEDIUM', assigned_to_id: 'u3',  assigned_to_name: 'Ravi Mehta',   value: 4500000,  remarks: 'WhatsApp inbound — wants 2BHK Vijay Nagar or Bicholi',              last_activity_at: '2026-09-11T11:00:00Z', next_follow_up_at: '2026-09-15T11:00:00Z', created_at: '2026-09-10T10:30:00Z', enquiry_at: '2026-09-10T10:25:00Z', campaign_id: null, campaign_name: null, referral_code: null, ad_reference: null, referral_partner_id: null, referral_partner_name: null },
  { id: 'L-1018', party_id: 'p20', party_name: 'Vijay Patil',      channel_type: 'Offline',  source: 'Event',             lead_type: 'BUYER',      status: 'QUALIFIED', priority: 'CRITICAL',assigned_to_id: 'u2',  assigned_to_name: 'Neha Kapoor',  value: 8500000,  remarks: 'Attended CREDAI expo; specifically wants Super Corridor flat',       last_activity_at: '2026-09-09T13:00:00Z', next_follow_up_at: '2026-09-12T10:00:00Z', created_at: '2026-09-08T12:00:00Z', enquiry_at: '2026-09-08T11:55:00Z', campaign_id: 'CMP-2026-001', campaign_name: 'Super Corridor Tech Hub Promotion', referral_code: 'EXPO-CREDAI', ad_reference: null, referral_partner_id: null, referral_partner_name: null },
  { id: 'L-1019', party_id: 'p21', party_name: 'Kavya Singh',      channel_type: 'Digital',  source: 'Social Media',      lead_type: 'TENANT',     status: 'NEW',       priority: 'LOW',    assigned_to_id: null,  assigned_to_name: null,           value: 12000,    remarks: 'Instagram DM — looking for 1BHK near college area',                 last_activity_at: '2026-09-08T14:00:00Z', next_follow_up_at: null, created_at: '2026-09-07T13:30:00Z', enquiry_at: '2026-09-07T13:25:00Z', campaign_id: null, campaign_name: null, referral_code: null, ad_reference: 'Instagram Story Ad', referral_partner_id: null, referral_partner_name: null },
  { id: 'L-1020', party_id: 'p23', party_name: 'Ritu Gupta',       channel_type: 'Offline',  source: 'Hoarding',          lead_type: 'BUYER',      status: 'CONTACTED', priority: 'MEDIUM', assigned_to_id: 'u6',  assigned_to_name: 'Amit Patel',   value: 4000000,  remarks: 'Saw AB Road hoarding for Navlakha apartments',                       last_activity_at: '2026-09-06T10:00:00Z', next_follow_up_at: '2026-09-10T10:00:00Z', created_at: '2026-09-05T09:00:00Z', enquiry_at: '2026-09-05T08:55:00Z', campaign_id: 'CMP-2026-004', campaign_name: 'Vijay Nagar Landlord Onboarding Q3', referral_code: 'HOARD-AB-01', ad_reference: null, referral_partner_id: null, referral_partner_name: null },
  { id: 'L-1021', party_id: 'p25', party_name: 'Meera Pandey',     channel_type: 'Digital',  source: 'Property Portal',   lead_type: 'BUYER',      status: 'QUALIFIED', priority: 'HIGH',   assigned_to_id: 'u5',  assigned_to_name: 'Priya Sharma', value: 5500000,  remarks: 'Loan pre-approved; searching for 3BHK in Palasia',                  last_activity_at: '2026-09-04T12:00:00Z', next_follow_up_at: '2026-09-08T11:00:00Z', created_at: '2026-09-03T11:00:00Z', enquiry_at: '2026-09-03T10:55:00Z', campaign_id: null, campaign_name: null, referral_code: null, ad_reference: 'MagicBricks Featured Listing', referral_partner_id: null, referral_partner_name: null },
  { id: 'L-1022', party_id: 'p26', party_name: 'Nilesh Shah',      channel_type: 'Offline',  source: 'Networking Event',  lead_type: 'INVESTOR',   status: 'CONTACTED', priority: 'HIGH',   assigned_to_id: 'u2',  assigned_to_name: 'Neha Kapoor',  value: 12000000, remarks: 'BNI chapter meet — commercial investor from Mumbai relocating',      last_activity_at: '2026-09-03T13:00:00Z', next_follow_up_at: '2026-09-06T13:00:00Z', created_at: '2026-09-02T12:30:00Z', enquiry_at: '2026-09-02T12:25:00Z', campaign_id: null, campaign_name: null, referral_code: 'BNI-SEP-IND', ad_reference: null, referral_partner_id: null, referral_partner_name: null },
  { id: 'L-1023', party_id: 'p28', party_name: 'Ashok Tripathi',   channel_type: 'Offline',  source: 'Flyer',             lead_type: 'BUYER',      status: 'NEW',       priority: 'LOW',    assigned_to_id: 'u7',  assigned_to_name: 'Sanjay Verma', value: 3000000,  remarks: 'Flyer distributed in Navlakha area; wants small flat',              last_activity_at: '2026-09-01T09:00:00Z', next_follow_up_at: null, created_at: '2026-08-31T08:00:00Z', enquiry_at: '2026-08-31T07:55:00Z', campaign_id: null, campaign_name: null, referral_code: null, ad_reference: null, referral_partner_id: null, referral_partner_name: null },
  { id: 'L-1024', party_id: 'p31', party_name: 'Pooja Mishra',     channel_type: 'Digital',  source: 'Email',             lead_type: 'BUYER',      status: 'CONTACTED', priority: 'MEDIUM', assigned_to_id: 'u3',  assigned_to_name: 'Ravi Mehta',   value: 4200000,  remarks: 'Email newsletter response — Khandwa Road 2BHK preference',          last_activity_at: '2026-08-29T12:00:00Z', next_follow_up_at: '2026-09-02T12:00:00Z', created_at: '2026-08-28T11:00:00Z', enquiry_at: '2026-08-28T10:55:00Z', campaign_id: null, campaign_name: null, referral_code: null, ad_reference: 'Email Campaign - Sept Offers', referral_partner_id: null, referral_partner_name: null },
  { id: 'L-1025', party_id: 'p32', party_name: 'Karan Mehta',      channel_type: 'Digital',  source: 'Social Media',      lead_type: 'INVESTOR',   status: 'LOST',      priority: 'MEDIUM', assigned_to_id: 'u6',  assigned_to_name: 'Amit Patel',   value: 8000000,  remarks: 'Dropped — went with another broker',                                 last_activity_at: '2026-08-20T13:00:00Z', next_follow_up_at: null, created_at: '2026-08-15T12:00:00Z', enquiry_at: '2026-08-15T11:55:00Z', campaign_id: null, campaign_name: null, referral_code: null, ad_reference: null, referral_partner_id: null, referral_partner_name: null },
  { id: 'L-1026', party_id: 'p33', party_name: 'Deepika Pandey',   channel_type: 'Digital',  source: 'Website',           lead_type: 'TENANT',     status: 'QUALIFIED', priority: 'MEDIUM', assigned_to_id: 'u5',  assigned_to_name: 'Priya Sharma', value: 15000,    remarks: 'Looking for 2BHK near Annapurna Road',                              last_activity_at: '2026-08-27T14:00:00Z', next_follow_up_at: '2026-08-30T14:00:00Z', created_at: '2026-08-26T13:00:00Z', enquiry_at: '2026-08-26T12:55:00Z', campaign_id: null, campaign_name: null, referral_code: null, ad_reference: null, referral_partner_id: null, referral_partner_name: null },
  { id: 'L-1027', party_id: 'p35', party_name: 'Priti Kaur',       channel_type: 'Offline',  source: 'Banner',            lead_type: 'BUYER',      status: 'CONTACTED', priority: 'MEDIUM', assigned_to_id: 'u7',  assigned_to_name: 'Sanjay Verma', value: 4500000,  remarks: 'Gate banner inquiry at Bicholi scheme',                              last_activity_at: '2026-08-25T10:00:00Z', next_follow_up_at: '2026-08-28T10:00:00Z', created_at: '2026-08-24T09:00:00Z', enquiry_at: '2026-08-24T08:55:00Z', campaign_id: null, campaign_name: null, referral_code: null, ad_reference: null, referral_partner_id: null, referral_partner_name: null },
  { id: 'L-1028', party_id: 'p37', party_name: 'Bhavna Jain',      channel_type: 'Digital',  source: 'WhatsApp',          lead_type: 'BUYER',      status: 'QUALIFIED', priority: 'HIGH',   assigned_to_id: 'u2',  assigned_to_name: 'Neha Kapoor',  value: 7000000,  remarks: 'WhatsApp broadcast response — Super Corridor 3BHK interest',        last_activity_at: '2026-08-23T12:00:00Z', next_follow_up_at: '2026-08-26T12:00:00Z', created_at: '2026-08-22T11:00:00Z', enquiry_at: '2026-08-22T10:55:00Z', campaign_id: 'CMP-2026-001', campaign_name: 'Super Corridor Tech Hub Promotion', referral_code: null, ad_reference: 'WhatsApp Broadcast - SC Homes', referral_partner_id: null, referral_partner_name: null },
  { id: 'L-1029', party_id: 'p39', party_name: 'Shweta Soni',      channel_type: 'Digital',  source: 'QR Code',           lead_type: 'TENANT',     status: 'NEW',       priority: 'LOW',    assigned_to_id: null,  assigned_to_name: null,           value: 10000,    remarks: 'QR code scan from apartment society notice board',                  last_activity_at: '2026-08-21T14:00:00Z', next_follow_up_at: null, created_at: '2026-08-20T13:00:00Z', enquiry_at: '2026-08-20T12:55:00Z', campaign_id: null, campaign_name: null, referral_code: null, ad_reference: null, referral_partner_id: null, referral_partner_name: null },
  { id: 'L-1030', party_id: 'p40', party_name: 'Dinesh Kumar',     channel_type: 'Offline',  source: 'Newspaper',         lead_type: 'BUYER',      status: 'CONTACTED', priority: 'MEDIUM', assigned_to_id: 'u6',  assigned_to_name: 'Amit Patel',   value: 3500000,  remarks: 'Dainik Bhaskar Sunday classified — Dewas Naka plot interest',       last_activity_at: '2026-08-20T09:00:00Z', next_follow_up_at: '2026-08-23T09:00:00Z', created_at: '2026-08-19T08:00:00Z', enquiry_at: '2026-08-19T07:55:00Z', campaign_id: null, campaign_name: null, referral_code: null, ad_reference: 'Dainik Bhaskar Sunday RE Section', referral_partner_id: null, referral_partner_name: null },
  { id: 'L-1031', party_id: 'p41', party_name: 'Archana Shukla',   channel_type: 'Offline',  source: 'Referral Partner',  lead_type: 'INVESTOR',   status: 'CONTACTED', priority: 'HIGH',   assigned_to_id: 'u2',  assigned_to_name: 'Neha Kapoor',  value: 10000000, remarks: 'Referred by Shree Balaji for commercial warehouse plot',            last_activity_at: '2026-08-19T10:00:00Z', next_follow_up_at: '2026-08-22T10:00:00Z', created_at: '2026-08-18T09:00:00Z', enquiry_at: '2026-08-18T08:55:00Z', campaign_id: null, campaign_name: null, referral_code: 'REF-BALAJI', ad_reference: null, referral_partner_id: 'RP-101', referral_partner_name: 'Shree Balaji Realty Advisors' },
  { id: 'L-1032', party_id: 'p42', party_name: 'Yogesh Thakur',    channel_type: 'Offline',  source: 'Exhibition',        lead_type: 'BUYER',      status: 'LOST',      priority: 'MEDIUM', assigned_to_id: 'u7',  assigned_to_name: 'Sanjay Verma', value: 5000000,  remarks: 'CREDAI expo — budget mismatch, could not match',                    last_activity_at: '2026-08-10T11:00:00Z', next_follow_up_at: null, created_at: '2026-08-05T10:00:00Z', enquiry_at: '2026-08-05T09:55:00Z', campaign_id: null, campaign_name: null, referral_code: 'EXPO-AUG', ad_reference: null, referral_partner_id: null, referral_partner_name: null },
  { id: 'L-1033', party_id: 'p44', party_name: 'Rohit Bansal',     channel_type: 'Digital',  source: 'Property Portal',   lead_type: 'BUYER',      status: 'QUALIFIED', priority: 'HIGH',   assigned_to_id: 'u3',  assigned_to_name: 'Ravi Mehta',   value: 6500000,  remarks: '99acres premium listing inquiry for Vijay Nagar 3BHK',              last_activity_at: '2026-08-16T13:00:00Z', next_follow_up_at: '2026-08-19T13:00:00Z', created_at: '2026-08-15T12:00:00Z', enquiry_at: '2026-08-15T11:55:00Z', campaign_id: null, campaign_name: null, referral_code: null, ad_reference: '99acres Featured Ad', referral_partner_id: null, referral_partner_name: null },
  { id: 'L-1034', party_id: 'p46', party_name: 'Jitendra Solanki', channel_type: 'Offline',  source: 'Hoarding',          lead_type: 'BUYER',      status: 'CONTACTED', priority: 'MEDIUM', assigned_to_id: 'u6',  assigned_to_name: 'Amit Patel',   value: 3200000,  remarks: 'Pithampur highway hoarding for Dewas Naka plots',                   last_activity_at: '2026-08-14T09:00:00Z', next_follow_up_at: '2026-08-17T09:00:00Z', created_at: '2026-08-13T08:00:00Z', enquiry_at: '2026-08-13T07:55:00Z', campaign_id: null, campaign_name: null, referral_code: 'HOARD-PITH-01', ad_reference: null, referral_partner_id: null, referral_partner_name: null },
  { id: 'L-1035', party_id: 'p47', party_name: 'Kirti Verma',      channel_type: 'Digital',  source: 'WhatsApp',          lead_type: 'TENANT',     status: 'QUALIFIED', priority: 'MEDIUM', assigned_to_id: 'u5',  assigned_to_name: 'Priya Sharma', value: 16000,    remarks: 'WhatsApp enquiry for semi-furnished 2BHK near Bhawarkua',           last_activity_at: '2026-08-13T10:00:00Z', next_follow_up_at: '2026-08-16T10:00:00Z', created_at: '2026-08-12T09:00:00Z', enquiry_at: '2026-08-12T08:55:00Z', campaign_id: null, campaign_name: null, referral_code: null, ad_reference: null, referral_partner_id: null, referral_partner_name: null },
  { id: 'L-1036', party_id: 'p49', party_name: 'Nisha Kapoor',     channel_type: 'Digital',  source: 'Website',           lead_type: 'BUYER',      status: 'NEW',       priority: 'MEDIUM', assigned_to_id: null,  assigned_to_name: null,           value: 4800000,  remarks: 'Website contact form — 2BHK in Palasia or Geeta Bhawan area',       last_activity_at: '2026-08-11T12:00:00Z', next_follow_up_at: null, created_at: '2026-08-10T11:00:00Z', enquiry_at: '2026-08-10T10:55:00Z', campaign_id: null, campaign_name: null, referral_code: null, ad_reference: null, referral_partner_id: null, referral_partner_name: null },
  { id: 'L-1037', party_id: 'p50', party_name: 'Raghav Dixit',     channel_type: 'Offline',  source: 'Exhibition',        lead_type: 'INVESTOR',   status: 'QUALIFIED', priority: 'CRITICAL',assigned_to_id: 'u2',  assigned_to_name: 'Neha Kapoor',  value: 25000000, remarks: 'CREDAI expo — large-scale investor looking for commercial complex',  last_activity_at: '2026-08-10T13:00:00Z', next_follow_up_at: '2026-08-13T11:00:00Z', created_at: '2026-08-09T12:00:00Z', enquiry_at: '2026-08-09T11:55:00Z', campaign_id: 'CMP-2026-001', campaign_name: 'Super Corridor Tech Hub Promotion', referral_code: 'EXPO-CREDAI', ad_reference: null, referral_partner_id: null, referral_partner_name: null },
  { id: 'L-1038', party_id: 'p9',  party_name: 'Anil Sharma',      channel_type: 'Digital',  source: 'Landing Page',      lead_type: 'BUYER',      status: 'CONTACTED', priority: 'MEDIUM', assigned_to_id: 'u3',  assigned_to_name: 'Ravi Mehta',   value: 5000000,  remarks: 'Landing page form on Scheme 140 campaign — second enquiry',         last_activity_at: '2026-09-15T10:00:00Z', next_follow_up_at: '2026-09-18T10:00:00Z', created_at: '2026-09-14T09:00:00Z', enquiry_at: '2026-09-14T08:55:00Z', campaign_id: 'CMP-2026-002', campaign_name: 'Scheme 140 Luxury High-Rise Influx', referral_code: null, ad_reference: null, referral_partner_id: null, referral_partner_name: null },
  { id: 'L-1039', party_id: 'p14', party_name: 'Rakesh Chouhan',   channel_type: 'Digital',  source: 'Search/Display Ad', lead_type: 'BUYER',      status: 'CONTACTED', priority: 'HIGH',   assigned_to_id: 'u7',  assigned_to_name: 'Sanjay Verma', value: 9000000,  remarks: 'Google Display Ad click — Nanda Nagar luxury flat interest',         last_activity_at: '2026-09-10T14:00:00Z', next_follow_up_at: '2026-09-13T14:00:00Z', created_at: '2026-09-09T13:00:00Z', enquiry_at: '2026-09-09T12:55:00Z', campaign_id: null, campaign_name: null, referral_code: null, ad_reference: 'Google Display Ad - Luxury Homes', referral_partner_id: null, referral_partner_name: null },
  { id: 'L-1040', party_id: 'p20', party_name: 'Vijay Patil',      channel_type: 'Offline',  source: 'Referral Partner',  lead_type: 'INVESTOR',   status: 'QUALIFIED', priority: 'HIGH',   assigned_to_id: 'u2',  assigned_to_name: 'Neha Kapoor',  value: 18000000, remarks: 'Apex Prime referral for commercial park investment',                 last_activity_at: '2026-09-05T13:00:00Z', next_follow_up_at: '2026-09-08T13:00:00Z', created_at: '2026-09-04T12:00:00Z', enquiry_at: '2026-09-04T11:55:00Z', campaign_id: null, campaign_name: null, referral_code: 'REF-APEX', ad_reference: null, referral_partner_id: 'RP-102', referral_partner_name: 'Apex Prime Infra Network' },
  { id: 'L-1041', party_id: 'p25', party_name: 'Meera Pandey',     channel_type: 'Digital',  source: 'Social Media',      lead_type: 'TENANT',     status: 'NEW',       priority: 'LOW',    assigned_to_id: null,  assigned_to_name: null,           value: 14000,    remarks: 'Facebook post comment — looking for rental near Annapurna Road',    last_activity_at: '2026-09-01T12:00:00Z', next_follow_up_at: null, created_at: '2026-08-31T11:00:00Z', enquiry_at: '2026-08-31T10:55:00Z', campaign_id: null, campaign_name: null, referral_code: null, ad_reference: null, referral_partner_id: null, referral_partner_name: null },
  { id: 'L-1042', party_id: 'p37', party_name: 'Bhavna Jain',      channel_type: 'Digital',  source: 'Landing Page',      lead_type: 'BUYER',      status: 'CONVERTED', priority: 'HIGH',   assigned_to_id: 'u5',  assigned_to_name: 'Priya Sharma', value: 7200000,  remarks: 'Converted to Opportunity OPP-5008 — Signature Park 3BHK',           last_activity_at: '2026-09-18T12:00:00Z', next_follow_up_at: null, created_at: '2026-09-10T11:00:00Z', enquiry_at: '2026-09-10T10:55:00Z', campaign_id: 'CMP-2026-001', campaign_name: 'Super Corridor Tech Hub Promotion', referral_code: null, ad_reference: null, referral_partner_id: null, referral_partner_name: null },
  { id: 'L-1043', party_id: 'p44', party_name: 'Rohit Bansal',     channel_type: 'Digital',  source: 'Property Portal',   lead_type: 'BUYER',      status: 'QUALIFIED', priority: 'CRITICAL',assigned_to_id: 'u3',  assigned_to_name: 'Ravi Mehta',   value: 8000000,  remarks: 'MagicBricks — committed to buying 4BHK on AB Road by year end',     last_activity_at: '2026-09-16T13:00:00Z', next_follow_up_at: '2026-09-19T13:00:00Z', created_at: '2026-09-15T12:00:00Z', enquiry_at: '2026-09-15T11:55:00Z', campaign_id: null, campaign_name: null, referral_code: null, ad_reference: 'MagicBricks Featured', referral_partner_id: null, referral_partner_name: null },
  { id: 'L-1044', party_id: 'p26', party_name: 'Nilesh Shah',      channel_type: 'Offline',  source: 'Networking Event',  lead_type: 'BUYER',      status: 'CONTACTED', priority: 'HIGH',   assigned_to_id: 'u2',  assigned_to_name: 'Neha Kapoor',  value: 9500000,  remarks: 'Chamber of Commerce meeting — 4BHK high-rise requirement',           last_activity_at: '2026-09-09T13:00:00Z', next_follow_up_at: '2026-09-12T13:00:00Z', created_at: '2026-09-08T12:00:00Z', enquiry_at: '2026-09-08T11:55:00Z', campaign_id: null, campaign_name: null, referral_code: 'NET-CHAMBER', ad_reference: null, referral_partner_id: null, referral_partner_name: null },
  { id: 'L-1045', party_id: 'p50', party_name: 'Raghav Dixit',     channel_type: 'Offline',  source: 'Referral Drive',    lead_type: 'BUYER',      status: 'NEW',       priority: 'MEDIUM', assigned_to_id: null,  assigned_to_name: null,           value: 6000000,  remarks: 'Word-of-mouth referral from existing client for AB Road flat',       last_activity_at: '2026-09-07T13:00:00Z', next_follow_up_at: null, created_at: '2026-09-06T12:00:00Z', enquiry_at: '2026-09-06T11:55:00Z', campaign_id: null, campaign_name: null, referral_code: null, ad_reference: null, referral_partner_id: null, referral_partner_name: null },
  { id: 'L-1046', party_id: 'p15', party_name: 'Sonal Joshi',      channel_type: 'Digital',  source: 'Website',           lead_type: 'BUYER',      status: 'LOST',      priority: 'LOW',    assigned_to_id: 'u6',  assigned_to_name: 'Amit Patel',   value: 3000000,  remarks: 'Inactive for 30+ days — no response to 5 follow-up attempts',       last_activity_at: '2026-08-01T15:00:00Z', next_follow_up_at: null, created_at: '2026-07-15T14:00:00Z', enquiry_at: '2026-07-15T13:55:00Z', campaign_id: null, campaign_name: null, referral_code: null, ad_reference: null, referral_partner_id: null, referral_partner_name: null },
  { id: 'L-1047', party_id: 'p33', party_name: 'Deepika Pandey',   channel_type: 'Digital',  source: 'Digital Form',      lead_type: 'TENANT',     status: 'CONTACTED', priority: 'MEDIUM', assigned_to_id: 'u7',  assigned_to_name: 'Sanjay Verma', value: 15000,    remarks: 'Registration form on affiliate blog — interested in Mahalakshmi area',last_activity_at: '2026-09-13T14:00:00Z', next_follow_up_at: '2026-09-16T14:00:00Z', created_at: '2026-09-12T13:00:00Z', enquiry_at: '2026-09-12T12:55:00Z', campaign_id: null, campaign_name: null, referral_code: null, ad_reference: null, referral_partner_id: null, referral_partner_name: null },
  { id: 'L-1048', party_id: 'p28', party_name: 'Ashok Tripathi',   channel_type: 'Offline',  source: 'Direct Marketing',  lead_type: 'SELLER',     status: 'CONTACTED', priority: 'MEDIUM', assigned_to_id: 'u2',  assigned_to_name: 'Neha Kapoor',  value: 4500000,  remarks: 'Telemarketing outreach — owner wants to sell Navlakha flat',         last_activity_at: '2026-09-17T09:00:00Z', next_follow_up_at: '2026-09-20T09:00:00Z', created_at: '2026-09-16T08:00:00Z', enquiry_at: '2026-09-16T07:55:00Z', campaign_id: null, campaign_name: null, referral_code: null, ad_reference: null, referral_partner_id: null, referral_partner_name: null },
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
  { id: 'P-1012', category: 'RENTAL_COMMERCIAL',  short_loc: '04-Vijay_Nagar',    address: 'Floor 2, Scheme 78 Commercial, Vijay Nagar', price: 65000,   status: 'AVAILABLE',         owner_id: 'p5', owner_name: 'Kavita Sharma', source: 'Broker', availability_date: '2026-10-15', details_json: { seater_capacity: 35, cabins: 3, conference_room: true, washroom: true, pantry: true, built_up_area: 1800 }, last_verified_at: null, created_at: '2026-09-12T08:00:00Z', lat: 22.7540, lng: 75.8950 },
  // ── Expanded Properties (P-1013–P-1075) ──────────────────────────────────────
  { id: 'P-1013', category: 'RENTAL_RESIDENTIAL', short_loc: '10-Palasia_Priya',   address: 'A-7, Palasia Heights, Indore',                price: 20000,   status: 'AVAILABLE',         owner_id: 'p12', owner_name: 'Suresh Agrawal', source: 'Owner', availability_date: '2026-10-01', details_json: { bhk: '2 BHK', furnishing: 'Fully-Furnished', built_up_area: 1050, floor: '2nd', parking: '1 Covered' },    last_verified_at: '2026-09-19T10:00:00Z', created_at: '2026-09-01T08:00:00Z', lat: 22.7213, lng: 75.8870 },
  { id: 'P-1014', category: 'BUY_SELL_FLAT',      short_loc: '10-Palasia_Priya',   address: 'C-302, Palasia Enclave, Indore',              price: 4800000, status: 'AVAILABLE',         owner_id: 'p17', owner_name: 'Anita Bhatt',  source: 'Owner', availability_date: 'Immediate', details_json: { bhk: '2 BHK', furnishing: 'Unfurnished', built_up_area: 1100, floor: '3rd', parking: 'Open' },         last_verified_at: '2026-09-18T11:00:00Z', created_at: '2026-09-02T08:00:00Z', lat: 22.7215, lng: 75.8875 },
  { id: 'P-1015', category: 'PLOT',               short_loc: '11-Bicholi_Amit',    address: 'Sector 7, Bicholi Mardana, Indore',           price: 3200000, status: 'AVAILABLE',         owner_id: 'p22', owner_name: 'Hemant Dubey', source: 'Owner', availability_date: 'Immediate', details_json: { facing: 'West', plot_number: 'B-22', size: 1200, unit: 'sqft' },                 last_verified_at: '2026-09-17T09:00:00Z', created_at: '2026-09-03T08:00:00Z', lat: 22.7410, lng: 75.9100 },
  { id: 'P-1016', category: 'RENTAL_RESIDENTIAL', short_loc: '12-Navlakha_Sanjay', address: 'Flat 104, Navlakha Society, Indore',           price: 12000,   status: 'AVAILABLE',         owner_id: 'p29', owner_name: 'Sunita Rajput', source: 'Owner', availability_date: '2026-09-25', details_json: { bhk: '1 BHK', furnishing: 'Semi-Furnished', built_up_area: 650, floor: '1st', parking: 'Open' },      last_verified_at: '2026-09-16T10:00:00Z', created_at: '2026-09-04T08:00:00Z', lat: 22.7090, lng: 75.8700 },
  { id: 'P-1017', category: 'BUY_SELL_FLAT',      short_loc: '12-Navlakha_Sanjay', address: 'B-203, Navlakha Apartments, Indore',          price: 3600000, status: 'AVAILABLE',         owner_id: 'p27', owner_name: 'Divya Rastogi', source: 'Broker', availability_date: 'Immediate', details_json: { bhk: '2 BHK', furnishing: 'Semi-Furnished', built_up_area: 1000, floor: '2nd', parking: '1 Covered' },   last_verified_at: '2026-09-15T11:00:00Z', created_at: '2026-09-05T08:00:00Z', lat: 22.7092, lng: 75.8705 },
  { id: 'P-1018', category: 'RENTAL_COMMERCIAL',  short_loc: '13-AB_Road_Ravi',    address: 'Unit 201, Orbit Tower, AB Road, Indore',      price: 80000,   status: 'AVAILABLE',         owner_id: 'p38', owner_name: 'Mukesh Trivedi', source: 'Owner', availability_date: 'Immediate', details_json: { seater_capacity: 40, cabins: 4, conference_room: true, washroom: true, pantry: true, built_up_area: 2200 }, last_verified_at: '2026-09-14T12:00:00Z', created_at: '2026-09-06T08:00:00Z', lat: 22.7180, lng: 75.8800 },
  { id: 'P-1019', category: 'BUY_SELL_COMMERCIAL',short_loc: '13-AB_Road_Ravi',    address: 'Ground Floor Office, Metro Tower, AB Road',   price: 12000000,status: 'AVAILABLE',         owner_id: 'p38', owner_name: 'Mukesh Trivedi', source: 'Owner', availability_date: 'Immediate', details_json: { seater_capacity: 50, cabins: 6, conference_room: true, washroom: true, pantry: true, built_up_area: 3200 }, last_verified_at: '2026-09-13T13:00:00Z', created_at: '2026-09-07T08:00:00Z', lat: 22.7185, lng: 75.8810 },
  { id: 'P-1020', category: 'RENTAL_RESIDENTIAL', short_loc: '14-Rajendra_Neha',   address: 'Flat 301, Rajendra Nagar, Indore',            price: 15000,   status: 'RENTED',            owner_id: 'p45', owner_name: 'Suman Agrawal', source: 'Owner', availability_date: 'Leased',  details_json: { bhk: '2 BHK', furnishing: 'Unfurnished', built_up_area: 950, floor: '3rd', parking: 'Open' },         last_verified_at: '2026-08-15T09:00:00Z', created_at: '2026-08-01T08:00:00Z', lat: 22.7230, lng: 75.8850 },
  { id: 'P-1021', category: 'BUY_SELL_FLAT',      short_loc: '14-Rajendra_Neha',   address: 'D-404, Green Park, Rajendra Nagar, Indore',   price: 5200000, status: 'AVAILABLE',         owner_id: 'p43', owner_name: 'Vandana Malviya', source: 'Owner', availability_date: 'Immediate', details_json: { bhk: '3 BHK', furnishing: 'Unfurnished', built_up_area: 1450, floor: '4th', parking: '1 Covered' },  last_verified_at: '2026-09-12T10:00:00Z', created_at: '2026-09-08T08:00:00Z', lat: 22.7232, lng: 75.8855 },
  { id: 'P-1022', category: 'PLOT',               short_loc: '11-Bicholi_Amit',    address: 'Plot 9, Bicholi Housing Board, Indore',       price: 2800000, status: 'AVAILABLE',         owner_id: 'p48', owner_name: 'Santosh Patel', source: 'Owner', availability_date: 'Immediate', details_json: { facing: 'North', plot_number: 'H-9', size: 1000, unit: 'sqft' },                   last_verified_at: '2026-09-11T11:00:00Z', created_at: '2026-09-09T08:00:00Z', lat: 22.7412, lng: 75.9105 },
  { id: 'P-1023', category: 'RENTAL_RESIDENTIAL', short_loc: '15-Khandwa_Sanjay',  address: 'House 22, Khandwa Road Colony, Indore',       price: 10000,   status: 'AVAILABLE',         owner_id: 'p19', owner_name: 'Poonam Saxena', source: 'Broker', availability_date: '2026-10-01', details_json: { bhk: '1 BHK', furnishing: 'Unfurnished', built_up_area: 600, floor: 'Ground', parking: 'Open' },    last_verified_at: '2026-09-10T12:00:00Z', created_at: '2026-09-10T08:00:00Z', lat: 22.6980, lng: 75.8600 },
  { id: 'P-1024', category: 'BUY_SELL_FLAT',      short_loc: '09-Super_Corridor',  address: 'B-705, Emerald View, Super Corridor, Indore', price: 8500000, status: 'AVAILABLE',         owner_id: 'p24', owner_name: 'Santosh Yadav', source: 'Builder-Marketing', availability_date: 'Under Construction', details_json: { bhk: '4 BHK', furnishing: 'Unfurnished', built_up_area: 2100, floor: '7th', parking: '2 Covered' }, last_verified_at: '2026-09-19T09:00:00Z', created_at: '2026-09-11T08:00:00Z', lat: 22.7815, lng: 75.8215 },
  { id: 'P-1025', category: 'RENTAL_COMMERCIAL',  short_loc: '09-Super_Corridor',  address: 'Unit 402, Tech Park, Super Corridor, Indore', price: 120000,  status: 'AVAILABLE',         owner_id: 'p24', owner_name: 'Santosh Yadav', source: 'Builder-Marketing', availability_date: 'Immediate', details_json: { seater_capacity: 60, cabins: 8, conference_room: true, washroom: true, pantry: true, built_up_area: 4000 }, last_verified_at: '2026-09-18T10:00:00Z', created_at: '2026-09-12T08:00:00Z', lat: 22.7820, lng: 75.8220 },
  { id: 'P-1026', category: 'BUY_SELL_FLAT',      short_loc: '01-Schm140_Mayank', address: 'A-501, Crystal Towers, Scheme 140, Indore',   price: 6200000, status: 'AVAILABLE',         owner_id: 'p1', owner_name: 'Ramesh Patel',  source: 'Owner', availability_date: 'Immediate', details_json: { bhk: '3 BHK', furnishing: 'Semi-Furnished', built_up_area: 1700, floor: '5th', parking: '1 Covered' },  last_verified_at: '2026-09-17T10:00:00Z', created_at: '2026-09-13T08:00:00Z', lat: 22.7058, lng: 75.9088 },
  { id: 'P-1027', category: 'RENTAL_RESIDENTIAL', short_loc: '16-Annapurna_Priya', address: 'C-12, Annapurna Road Society, Indore',        price: 18000,   status: 'AVAILABLE',         owner_id: 'p29', owner_name: 'Sunita Rajput', source: 'Owner', availability_date: '2026-10-15', details_json: { bhk: '2 BHK', furnishing: 'Semi-Furnished', built_up_area: 1000, floor: '1st', parking: '1 Covered' },   last_verified_at: '2026-09-16T11:00:00Z', created_at: '2026-09-14T08:00:00Z', lat: 22.7125, lng: 75.8770 },
  { id: 'P-1028', category: 'BUY_SELL_COMMERCIAL',short_loc: '04-Vijay_Nagar',     address: 'Shop No 5, Vijay Nagar Plaza, Indore',        price: 4500000, status: 'AVAILABLE',         owner_id: 'p12', owner_name: 'Suresh Agrawal', source: 'Owner', availability_date: 'Immediate', details_json: { seater_capacity: 10, cabins: 1, conference_room: false, washroom: true, pantry: false, built_up_area: 450 }, last_verified_at: '2026-09-15T12:00:00Z', created_at: '2026-09-15T08:00:00Z', lat: 22.7538, lng: 75.8940 },
  { id: 'P-1029', category: 'PLOT',               short_loc: '17-Limbodi_Sanjay',  address: 'Plot 34, Limbodi Extension, Indore',          price: 1900000, status: 'AVAILABLE',         owner_id: 'p22', owner_name: 'Hemant Dubey', source: 'Owner', availability_date: 'Immediate', details_json: { facing: 'East', plot_number: 'E-34', size: 900, unit: 'sqft' },                    last_verified_at: '2026-09-14T13:00:00Z', created_at: '2026-09-16T08:00:00Z', lat: 22.7150, lng: 75.8960 },
  { id: 'P-1030', category: 'RENTAL_RESIDENTIAL', short_loc: '07-Geeta_Bhawan',    address: 'Flat 202, Shree Krishna Tower, Indore',       price: 16000,   status: 'AVAILABLE',         owner_id: 'p2', owner_name: 'Sunita Gupta',  source: 'Owner', availability_date: 'Immediate', details_json: { bhk: '2 BHK', furnishing: 'Unfurnished', built_up_area: 950, floor: '2nd', parking: 'Open' },         last_verified_at: '2026-09-13T14:00:00Z', created_at: '2026-09-17T08:00:00Z', lat: 22.7172, lng: 75.8822 },
  { id: 'P-1031', category: 'BUY_SELL_FLAT',      short_loc: '08-SAPNA_SANGEETA',  address: 'A-101, Aura Residency, Sapna Sangeeta, Indore', price: 4000000, status: 'AVAILABLE',      owner_id: 'p17', owner_name: 'Anita Bhatt',  source: 'Broker', availability_date: 'Immediate', details_json: { bhk: '2 BHK', furnishing: 'Unfurnished', built_up_area: 1050, floor: '1st', parking: 'Open' },      last_verified_at: '2026-09-12T10:00:00Z', created_at: '2026-09-18T08:00:00Z', lat: 22.7022, lng: 75.8672 },
  { id: 'P-1032', category: 'PLOT',               short_loc: '09-Super_Corridor',  address: 'Sector 5B, Super Corridor Enclave, Indore',   price: 7800000, status: 'AVAILABLE',         owner_id: 'p8', owner_name: 'Meena Builder', source: 'Builder-Marketing', availability_date: 'Immediate', details_json: { facing: 'North-East', plot_number: 'F-52', size: 2200, unit: 'sqft' },          last_verified_at: '2026-09-11T09:00:00Z', created_at: '2026-09-19T08:00:00Z', lat: 22.7805, lng: 75.8205 },
  { id: 'P-1033', category: 'RENTAL_COMMERCIAL',  short_loc: '18-Ring_Road_Ravi',  address: 'Office 301, Ring Road Tower, Indore',         price: 55000,   status: 'AVAILABLE',         owner_id: 'p38', owner_name: 'Mukesh Trivedi', source: 'Broker', availability_date: '2026-10-01', details_json: { seater_capacity: 28, cabins: 3, conference_room: true, washroom: true, pantry: true, built_up_area: 1600 }, last_verified_at: '2026-09-10T11:00:00Z', created_at: '2026-09-01T08:00:00Z', lat: 22.7300, lng: 75.8650 },
  { id: 'P-1034', category: 'BUY_SELL_FLAT',      short_loc: '16-Annapurna_Priya', address: 'B-803, Annapurna Towers, Indore',             price: 5800000, status: 'AVAILABLE',         owner_id: 'p43', owner_name: 'Vandana Malviya', source: 'Owner', availability_date: 'Immediate', details_json: { bhk: '3 BHK', furnishing: 'Unfurnished', built_up_area: 1600, floor: '8th', parking: '1 Covered' },  last_verified_at: '2026-09-09T12:00:00Z', created_at: '2026-09-02T08:00:00Z', lat: 22.7128, lng: 75.8772 },
  { id: 'P-1035', category: 'RENTAL_RESIDENTIAL', short_loc: '19-Tejaji_Sanjay',   address: 'House 5, Tejaji Nagar, Indore',               price: 8000,    status: 'AVAILABLE',         owner_id: 'p45', owner_name: 'Suman Agrawal', source: 'Owner', availability_date: 'Immediate', details_json: { bhk: '1 BHK', furnishing: 'Unfurnished', built_up_area: 550, floor: 'Ground', parking: 'Open' },   last_verified_at: '2026-09-08T13:00:00Z', created_at: '2026-09-03T08:00:00Z', lat: 22.7050, lng: 75.8500 },
  { id: 'P-1036', category: 'BUY_SELL_COMMERCIAL',short_loc: '18-Ring_Road_Ravi',  address: 'Showroom, Ring Road Centre, Indore',          price: 22000000,status: 'ON_HOLD',           owner_id: 'p38', owner_name: 'Mukesh Trivedi', source: 'Owner', availability_date: '2026-12-01', details_json: { seater_capacity: 80, cabins: 10, conference_room: true, washroom: true, pantry: true, built_up_area: 5500 }, last_verified_at: '2026-08-01T10:00:00Z', created_at: '2026-07-15T08:00:00Z', lat: 22.7305, lng: 75.8655 },
  { id: 'P-1037', category: 'RENTAL_RESIDENTIAL', short_loc: '20-New_Palasia_Ravi',address: 'Flat 501, New Palasia Colony, Indore',        price: 22000,   status: 'AVAILABLE',         owner_id: 'p12', owner_name: 'Suresh Agrawal', source: 'Owner', availability_date: '2026-10-01', details_json: { bhk: '3 BHK', furnishing: 'Fully-Furnished', built_up_area: 1350, floor: '5th', parking: '1 Covered' }, last_verified_at: '2026-09-18T10:00:00Z', created_at: '2026-09-04T08:00:00Z', lat: 22.7218, lng: 75.8878 },
  { id: 'P-1038', category: 'BUY_SELL_FLAT',      short_loc: '13-AB_Road_Ravi',    address: 'C-1201, AB Road Residency, Indore',           price: 9500000, status: 'AVAILABLE',         owner_id: 'p26', owner_name: 'Nilesh Shah',  source: 'Broker', availability_date: 'Immediate', details_json: { bhk: '4 BHK', furnishing: 'Fully-Furnished', built_up_area: 2400, floor: '12th', parking: '2 Covered' }, last_verified_at: '2026-09-17T11:00:00Z', created_at: '2026-09-05T08:00:00Z', lat: 22.7188, lng: 75.8812 },
  { id: 'P-1039', category: 'PLOT',               short_loc: '21-Kanadiya_Amit',   address: 'Plot 78, Kanadiya Road Scheme, Indore',       price: 4500000, status: 'AVAILABLE',         owner_id: 'p1', owner_name: 'Ramesh Patel',  source: 'Owner', availability_date: 'Immediate', details_json: { facing: 'South', plot_number: 'K-78', size: 1600, unit: 'sqft' },                  last_verified_at: '2026-09-16T12:00:00Z', created_at: '2026-09-06T08:00:00Z', lat: 22.7600, lng: 75.9200 },
  { id: 'P-1040', category: 'RENTAL_RESIDENTIAL', short_loc: '05-MG_Road',         address: 'E-403, MG Residency, Indore',                 price: 25000,   status: 'AVAILABLE',         owner_id: 'p5', owner_name: 'Kavita Sharma', source: 'Owner', availability_date: '2026-10-15', details_json: { bhk: '2 BHK', furnishing: 'Fully-Furnished', built_up_area: 1100, floor: '4th', parking: '1 Covered' },   last_verified_at: '2026-09-15T13:00:00Z', created_at: '2026-09-07T08:00:00Z', lat: 22.7246, lng: 75.8754 },
  { id: 'P-1041', category: 'BUY_SELL_FLAT',      short_loc: '17-Limbodi_Sanjay',  address: 'A-203, Limbodi Heights, Indore',              price: 3200000, status: 'AVAILABLE',         owner_id: 'p27', owner_name: 'Divya Rastogi', source: 'Owner', availability_date: 'Immediate', details_json: { bhk: '2 BHK', furnishing: 'Unfurnished', built_up_area: 950, floor: '2nd', parking: 'Open' },         last_verified_at: '2026-09-14T14:00:00Z', created_at: '2026-09-08T08:00:00Z', lat: 22.7152, lng: 75.8962 },
  { id: 'P-1042', category: 'RENTAL_COMMERCIAL',  short_loc: '22-Bhawarkua_Amit',  address: 'Suite 101, Bhawarkua Square, Indore',         price: 42000,   status: 'AVAILABLE',         owner_id: 'p5', owner_name: 'Kavita Sharma', source: 'Broker', availability_date: 'Immediate', details_json: { seater_capacity: 20, cabins: 2, conference_room: true, washroom: true, pantry: true, built_up_area: 1100 }, last_verified_at: '2026-09-13T10:00:00Z', created_at: '2026-09-09T08:00:00Z', lat: 22.7095, lng: 75.8620 },
  { id: 'P-1043', category: 'PLOT',               short_loc: '21-Kanadiya_Amit',   address: 'Plot 14, Kanadiya Township, Indore',          price: 3800000, status: 'SOLD',              owner_id: 'p48', owner_name: 'Santosh Patel', source: 'Owner', availability_date: 'Sold Out', details_json: { facing: 'East', plot_number: 'T-14', size: 1350, unit: 'sqft' },                  last_verified_at: '2026-07-20T10:00:00Z', created_at: '2026-06-15T08:00:00Z', lat: 22.7602, lng: 75.9205 },
  { id: 'P-1044', category: 'BUY_SELL_FLAT',      short_loc: '04-Vijay_Nagar',     address: 'D-803, Vijay Nagar Complex, Indore',          price: 4700000, status: 'AVAILABLE',         owner_id: 'p22', owner_name: 'Hemant Dubey', source: 'Owner', availability_date: 'Immediate', details_json: { bhk: '3 BHK', furnishing: 'Unfurnished', built_up_area: 1400, floor: '8th', parking: '1 Covered' },  last_verified_at: '2026-09-12T11:00:00Z', created_at: '2026-09-10T08:00:00Z', lat: 22.7535, lng: 75.8942 },
  { id: 'P-1045', category: 'RENTAL_RESIDENTIAL', short_loc: '23-Scheme54_Priya',  address: 'House 66, Scheme 54, Indore',                 price: 13000,   status: 'AVAILABLE',         owner_id: 'p19', owner_name: 'Poonam Saxena', source: 'Owner', availability_date: 'Immediate', details_json: { bhk: '2 BHK', furnishing: 'Unfurnished', built_up_area: 850, floor: 'Ground', parking: 'Open' },     last_verified_at: '2026-09-11T12:00:00Z', created_at: '2026-09-11T08:00:00Z', lat: 22.7540, lng: 75.8900 },
  { id: 'P-1046', category: 'BUY_SELL_COMMERCIAL',short_loc: '22-Bhawarkua_Amit',  address: 'Ground Floor Office, Bhawarkua Main, Indore', price: 7500000, status: 'AVAILABLE',         owner_id: 'p26', owner_name: 'Nilesh Shah',  source: 'Owner', availability_date: 'Immediate', details_json: { seater_capacity: 25, cabins: 3, conference_room: true, washroom: true, pantry: true, built_up_area: 1400 }, last_verified_at: '2026-09-10T13:00:00Z', created_at: '2026-09-12T08:00:00Z', lat: 22.7097, lng: 75.8622 },
  { id: 'P-1047', category: 'RENTAL_RESIDENTIAL', short_loc: '24-Mahalakshmi_Ravi',address: 'Flat 301, Mahalakshmi Nagar, Indore',         price: 14000,   status: 'AVAILABLE',         owner_id: 'p45', owner_name: 'Suman Agrawal', source: 'Owner', availability_date: 'Immediate', details_json: { bhk: '2 BHK', furnishing: 'Unfurnished', built_up_area: 900, floor: '3rd', parking: 'Open' },         last_verified_at: '2026-09-09T14:00:00Z', created_at: '2026-09-13T08:00:00Z', lat: 22.7140, lng: 75.8720 },
  { id: 'P-1048', category: 'BUY_SELL_FLAT',      short_loc: '20-New_Palasia_Ravi',address: 'E-602, Palasia Premium, Indore',              price: 7800000, status: 'AVAILABLE',         owner_id: 'p20', owner_name: 'Vijay Patil', source: 'Broker', availability_date: 'Immediate', details_json: { bhk: '3 BHK', furnishing: 'Fully-Furnished', built_up_area: 2000, floor: '6th', parking: '2 Covered' },  last_verified_at: '2026-09-18T11:00:00Z', created_at: '2026-09-14T08:00:00Z', lat: 22.7220, lng: 75.8880 },
  { id: 'P-1049', category: 'PLOT',               short_loc: '25-Dewas_Naka_Sanjay',address: 'Plot 45, Dewas Naka Extension, Indore',      price: 2500000, status: 'AVAILABLE',         owner_id: 'p48', owner_name: 'Santosh Patel', source: 'Owner', availability_date: 'Immediate', details_json: { facing: 'West', plot_number: 'D-45', size: 1100, unit: 'sqft' },                  last_verified_at: '2026-09-17T12:00:00Z', created_at: '2026-09-15T08:00:00Z', lat: 22.7550, lng: 75.8680 },
  { id: 'P-1050', category: 'RENTAL_COMMERCIAL',  short_loc: '04-Vijay_Nagar',     address: 'Office 201, Vijay Nagar Business Centre, Indore', price: 35000, status: 'AVAILABLE',        owner_id: 'p12', owner_name: 'Suresh Agrawal', source: 'Owner', availability_date: '2026-10-01', details_json: { seater_capacity: 18, cabins: 2, conference_room: true, washroom: true, pantry: false, built_up_area: 950 }, last_verified_at: '2026-09-16T13:00:00Z', created_at: '2026-09-16T08:00:00Z', lat: 22.7542, lng: 75.8948 },
  { id: 'P-1051', category: 'BUY_SELL_FLAT',      short_loc: '23-Scheme54_Priya',  address: 'C-201, Scheme 54 Heights, Indore',            price: 4300000, status: 'UNDER_NEGOTIATION', owner_id: 'p27', owner_name: 'Divya Rastogi', source: 'Broker', availability_date: 'Immediate', details_json: { bhk: '2 BHK', furnishing: 'Unfurnished', built_up_area: 1100, floor: '2nd', parking: '1 Covered' },  last_verified_at: '2026-09-15T14:00:00Z', created_at: '2026-09-17T08:00:00Z', lat: 22.7542, lng: 75.8902 },
  { id: 'P-1052', category: 'RENTAL_RESIDENTIAL', short_loc: '01-Schm140_Mayank',  address: 'Flat 401, Blue Diamond, Scheme 140, Indore',  price: 21000,   status: 'AVAILABLE',         owner_id: 'p1', owner_name: 'Ramesh Patel',  source: 'Owner', availability_date: 'Immediate', details_json: { bhk: '2 BHK', furnishing: 'Fully-Furnished', built_up_area: 1050, floor: '4th', parking: '1 Covered' },  last_verified_at: '2026-09-14T15:00:00Z', created_at: '2026-09-18T08:00:00Z', lat: 22.7052, lng: 75.9082 },
  { id: 'P-1053', category: 'PLOT',               short_loc: '25-Dewas_Naka_Sanjay',address: 'Plot 88, AUDA Scheme, Dewas Naka, Indore',   price: 6500000, status: 'AVAILABLE',         owner_id: 'p22', owner_name: 'Hemant Dubey', source: 'Owner', availability_date: 'Immediate', details_json: { facing: 'East', plot_number: 'A-88', size: 2000, unit: 'sqft' },                   last_verified_at: '2026-09-13T10:00:00Z', created_at: '2026-09-01T08:00:00Z', lat: 22.7552, lng: 75.8682 },
  { id: 'P-1054', category: 'BUY_SELL_COMMERCIAL',short_loc: '05-MG_Road',         address: 'Office Suite 1101, MG Towers, Indore',        price: 25000000,status: 'AVAILABLE',         owner_id: 'p5', owner_name: 'Kavita Sharma', source: 'Owner', availability_date: 'Immediate', details_json: { seater_capacity: 100, cabins: 12, conference_room: true, washroom: true, pantry: true, built_up_area: 6000 }, last_verified_at: '2026-09-12T11:00:00Z', created_at: '2026-09-02T08:00:00Z', lat: 22.7248, lng: 75.8756 },
  { id: 'P-1055', category: 'RENTAL_RESIDENTIAL', short_loc: '24-Mahalakshmi_Ravi',address: 'Flat 201, Lotus Apartments, Indore',          price: 17000,   status: 'RENTED',            owner_id: 'p19', owner_name: 'Poonam Saxena', source: 'Owner', availability_date: 'Leased', details_json: { bhk: '2 BHK', furnishing: 'Unfurnished', built_up_area: 950, floor: '2nd', parking: 'Open' },         last_verified_at: '2026-07-10T09:00:00Z', created_at: '2026-06-01T08:00:00Z', lat: 22.7142, lng: 75.8722 },
  { id: 'P-1056', category: 'BUY_SELL_FLAT',      short_loc: '11-Bicholi_Amit',    address: 'E-402, Bicholi Prime, Indore',                price: 3500000, status: 'AVAILABLE',         owner_id: 'p17', owner_name: 'Anita Bhatt',  source: 'Broker', availability_date: 'Immediate', details_json: { bhk: '2 BHK', furnishing: 'Unfurnished', built_up_area: 980, floor: '4th', parking: 'Open' },         last_verified_at: '2026-09-11T12:00:00Z', created_at: '2026-09-03T08:00:00Z', lat: 22.7414, lng: 75.9108 },
  { id: 'P-1057', category: 'RENTAL_COMMERCIAL',  short_loc: '16-Annapurna_Priya', address: 'Office 101, Annapurna Commercial Zone, Indore', price: 30000, status: 'AVAILABLE',         owner_id: 'p38', owner_name: 'Mukesh Trivedi', source: 'Owner', availability_date: 'Immediate', details_json: { seater_capacity: 15, cabins: 1, conference_room: false, washroom: true, pantry: false, built_up_area: 800 }, last_verified_at: '2026-09-10T13:00:00Z', created_at: '2026-09-04T08:00:00Z', lat: 22.7130, lng: 75.8774 },
  { id: 'P-1058', category: 'PLOT',               short_loc: '17-Limbodi_Sanjay',  address: 'Plot 23, Limbodi Housing, Indore',            price: 1500000, status: 'WITHDRAWN',         owner_id: 'p48', owner_name: 'Santosh Patel', source: 'Owner', availability_date: 'On Hold', details_json: { facing: 'North', plot_number: 'L-23', size: 750, unit: 'sqft' },                     last_verified_at: '2026-06-01T10:00:00Z', created_at: '2026-05-01T08:00:00Z', lat: 22.7154, lng: 75.8964 },
  { id: 'P-1059', category: 'BUY_SELL_FLAT',      short_loc: '07-Geeta_Bhawan',    address: 'B-604, Geeta Premium, Indore',                price: 4100000, status: 'AVAILABLE',         owner_id: 'p2', owner_name: 'Sunita Gupta',  source: 'Owner', availability_date: 'Immediate', details_json: { bhk: '2 BHK', furnishing: 'Unfurnished', built_up_area: 1050, floor: '6th', parking: 'Open' },         last_verified_at: '2026-09-09T14:00:00Z', created_at: '2026-09-05T08:00:00Z', lat: 22.7174, lng: 75.8824 },
  { id: 'P-1060', category: 'RENTAL_RESIDENTIAL', short_loc: '26-Sanyogitaganj_Ravi', address: 'House 12, Sanyogitaganj, Indore',           price: 11000,   status: 'AVAILABLE',         owner_id: 'p45', owner_name: 'Suman Agrawal', source: 'Broker', availability_date: 'Immediate', details_json: { bhk: '1 BHK', furnishing: 'Unfurnished', built_up_area: 600, floor: 'Ground', parking: 'Open' },  last_verified_at: '2026-09-08T10:00:00Z', created_at: '2026-09-06T08:00:00Z', lat: 22.7080, lng: 75.8640 },
  { id: 'P-1061', category: 'BUY_SELL_FLAT',      short_loc: '19-Tejaji_Sanjay',   address: 'D-201, Tejaji Heights, Indore',               price: 2900000, status: 'AVAILABLE',         owner_id: 'p27', owner_name: 'Divya Rastogi', source: 'Owner', availability_date: 'Immediate', details_json: { bhk: '1 BHK', furnishing: 'Unfurnished', built_up_area: 700, floor: '2nd', parking: 'Open' },         last_verified_at: '2026-09-07T11:00:00Z', created_at: '2026-09-07T08:00:00Z', lat: 22.7052, lng: 75.8502 },
  { id: 'P-1062', category: 'PLOT',               short_loc: '26-Sanyogitaganj_Ravi', address: 'Plot 18, Sanyogitaganj Scheme, Indore',     price: 2200000, status: 'AVAILABLE',         owner_id: 'p22', owner_name: 'Hemant Dubey', source: 'Owner', availability_date: 'Immediate', details_json: { facing: 'South', plot_number: 'S-18', size: 900, unit: 'sqft' },                    last_verified_at: '2026-09-06T12:00:00Z', created_at: '2026-09-08T08:00:00Z', lat: 22.7082, lng: 75.8642 },
  { id: 'P-1063', category: 'RENTAL_COMMERCIAL',  short_loc: '23-Scheme54_Priya',  address: 'Office 301, Scheme 54 IT Park, Indore',       price: 50000,   status: 'ON_HOLD',           owner_id: 'p5', owner_name: 'Kavita Sharma', source: 'Owner', availability_date: '2026-12-01', details_json: { seater_capacity: 25, cabins: 2, conference_room: true, washroom: true, pantry: true, built_up_area: 1400 }, last_verified_at: '2026-07-15T10:00:00Z', created_at: '2026-07-01T08:00:00Z', lat: 22.7544, lng: 75.8904 },
  { id: 'P-1064', category: 'BUY_SELL_FLAT',      short_loc: '15-Khandwa_Sanjay',  address: 'A-401, Khandwa Road Towers, Indore',          price: 3800000, status: 'AVAILABLE',         owner_id: 'p43', owner_name: 'Vandana Malviya', source: 'Broker', availability_date: 'Immediate', details_json: { bhk: '2 BHK', furnishing: 'Unfurnished', built_up_area: 1050, floor: '4th', parking: 'Open' },     last_verified_at: '2026-09-19T10:00:00Z', created_at: '2026-09-09T08:00:00Z', lat: 22.6982, lng: 75.8602 },
  { id: 'P-1065', category: 'RENTAL_RESIDENTIAL', short_loc: '22-Bhawarkua_Amit',  address: 'Flat 101, Bhawarkua Colony, Indore',          price: 16000,   status: 'AVAILABLE',         owner_id: 'p29', owner_name: 'Sunita Rajput', source: 'Owner', availability_date: 'Immediate', details_json: { bhk: '2 BHK', furnishing: 'Semi-Furnished', built_up_area: 900, floor: '1st', parking: 'Open' },       last_verified_at: '2026-09-18T11:00:00Z', created_at: '2026-09-10T08:00:00Z', lat: 22.7097, lng: 75.8622 },
  { id: 'P-1066', category: 'PLOT',               short_loc: '27-Nanda_Nagar_Priya',address: 'Plot 56, Nanda Nagar, Indore',               price: 5500000, status: 'AVAILABLE',         owner_id: 'p1', owner_name: 'Ramesh Patel',  source: 'Owner', availability_date: 'Immediate', details_json: { facing: 'North-West', plot_number: 'N-56', size: 1800, unit: 'sqft' },               last_verified_at: '2026-09-17T12:00:00Z', created_at: '2026-09-11T08:00:00Z', lat: 22.7350, lng: 75.9050 },
  { id: 'P-1067', category: 'BUY_SELL_FLAT',      short_loc: '27-Nanda_Nagar_Priya',address: 'B-302, Nanda Nagar Heights, Indore',         price: 5500000, status: 'AVAILABLE',         owner_id: 'p17', owner_name: 'Anita Bhatt',  source: 'Owner', availability_date: 'Immediate', details_json: { bhk: '3 BHK', furnishing: 'Unfurnished', built_up_area: 1500, floor: '3rd', parking: '1 Covered' },  last_verified_at: '2026-09-16T13:00:00Z', created_at: '2026-09-12T08:00:00Z', lat: 22.7352, lng: 75.9052 },
  { id: 'P-1068', category: 'RENTAL_COMMERCIAL',  short_loc: '27-Nanda_Nagar_Priya',address: 'Office 202, Nanda Business Park, Indore',    price: 45000,   status: 'AVAILABLE',         owner_id: 'p12', owner_name: 'Suresh Agrawal', source: 'Broker', availability_date: 'Immediate', details_json: { seater_capacity: 22, cabins: 2, conference_room: true, washroom: true, pantry: true, built_up_area: 1250 }, last_verified_at: '2026-09-15T14:00:00Z', created_at: '2026-09-13T08:00:00Z', lat: 22.7354, lng: 75.9054 },
  { id: 'P-1069', category: 'BUY_SELL_COMMERCIAL',short_loc: '09-Super_Corridor',  address: 'IT Tower 3, Super Corridor, Indore',          price: 35000000,status: 'AVAILABLE',         owner_id: 'p24', owner_name: 'Santosh Yadav', source: 'Builder-Marketing', availability_date: 'Under Construction', details_json: { seater_capacity: 200, cabins: 25, conference_room: true, washroom: true, pantry: true, built_up_area: 12000 }, last_verified_at: '2026-09-14T10:00:00Z', created_at: '2026-09-14T08:00:00Z', lat: 22.7825, lng: 75.8225 },
  { id: 'P-1070', category: 'RENTAL_RESIDENTIAL', short_loc: '28-Chandan_Nagar_Sanjay', address: 'A-202, Chandan Nagar Colony, Indore',    price: 19000,   status: 'AVAILABLE',         owner_id: 'p38', owner_name: 'Mukesh Trivedi', source: 'Owner', availability_date: '2026-10-15', details_json: { bhk: '2 BHK', furnishing: 'Semi-Furnished', built_up_area: 1000, floor: '2nd', parking: '1 Covered' }, last_verified_at: '2026-09-13T11:00:00Z', created_at: '2026-09-15T08:00:00Z', lat: 22.7450, lng: 75.9150 },
  { id: 'P-1071', category: 'BUY_SELL_FLAT',      short_loc: '28-Chandan_Nagar_Sanjay', address: 'C-501, Chandan Heights, Indore',         price: 4600000, status: 'AVAILABLE',         owner_id: 'p43', owner_name: 'Vandana Malviya', source: 'Owner', availability_date: 'Immediate', details_json: { bhk: '2 BHK', furnishing: 'Unfurnished', built_up_area: 1150, floor: '5th', parking: '1 Covered' }, last_verified_at: '2026-09-12T12:00:00Z', created_at: '2026-09-16T08:00:00Z', lat: 22.7452, lng: 75.9152 },
  { id: 'P-1072', category: 'RENTAL_RESIDENTIAL', short_loc: '10-Palasia_Priya',   address: 'E-102, Palasia Garden, Indore',               price: 16000,   status: 'SOLD',              owner_id: 'p2', owner_name: 'Sunita Gupta',  source: 'Owner', availability_date: 'Sold Out', details_json: { bhk: '1 BHK', furnishing: 'Unfurnished', built_up_area: 650, floor: '1st', parking: 'Open' },         last_verified_at: '2026-07-05T10:00:00Z', created_at: '2026-06-01T08:00:00Z', lat: 22.7217, lng: 75.8877 },
  { id: 'P-1073', category: 'PLOT',               short_loc: '28-Chandan_Nagar_Sanjay', address: 'Plot 11, Chandan Nagar Extension, Indore', price: 3200000, status: 'AVAILABLE',        owner_id: 'p48', owner_name: 'Santosh Patel', source: 'Owner', availability_date: 'Immediate', details_json: { facing: 'East', plot_number: 'C-11', size: 1200, unit: 'sqft' },               last_verified_at: '2026-09-11T13:00:00Z', created_at: '2026-09-17T08:00:00Z', lat: 22.7454, lng: 75.9154 },
  { id: 'P-1074', category: 'BUY_SELL_FLAT',      short_loc: '26-Sanyogitaganj_Ravi', address: 'B-501, Sanyogitaganj Premium, Indore',    price: 3300000, status: 'AVAILABLE',         owner_id: 'p27', owner_name: 'Divya Rastogi', source: 'Broker', availability_date: 'Immediate', details_json: { bhk: '2 BHK', furnishing: 'Unfurnished', built_up_area: 900, floor: '5th', parking: 'Open' },         last_verified_at: '2026-09-10T14:00:00Z', created_at: '2026-09-18T08:00:00Z', lat: 22.7084, lng: 75.8644 },
  { id: 'P-1075', category: 'RENTAL_COMMERCIAL',  short_loc: '21-Kanadiya_Amit',   address: 'Office 101, Kanadiya Tech Centre, Indore',    price: 38000,   status: 'AVAILABLE',         owner_id: 'p5', owner_name: 'Kavita Sharma', source: 'Owner', availability_date: 'Immediate', details_json: { seater_capacity: 18, cabins: 2, conference_room: false, washroom: true, pantry: true, built_up_area: 1000 }, last_verified_at: '2026-09-09T10:00:00Z', created_at: '2026-09-19T08:00:00Z', lat: 22.7604, lng: 75.9207 },
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
  // ── Expanded Requirements (R-2009–R-2038) ────────────────────────────────────
  { id: 'R-2009',  client_id: 'p9',  client_name: 'Anil Sharma',       assigned_to_id: 'u5',  assigned_to_name: 'Priya Sharma', category: 'BUY_SELL_FLAT',       intent: 'BUY',   preferred_short_locs: ['01-Schm140_Mayank'], alternate_locs: ['10-Palasia_Priya'], min_budget: 5000000, max_budget: 7000000, min_area: 1400, max_area: 1900, timeline: '2 months',  facilities: ['Parking', 'Lift', 'Power Backup'], status: 'ACTIVE',     remarks: '3BHK for self-use, east-facing preferred',       created_at: '2026-09-20T09:30:00Z' },
  { id: 'R-2010',  client_id: 'p10', client_name: 'Anil K. Sharma',    assigned_to_id: 'u3',  assigned_to_name: 'Ravi Mehta',   category: 'PLOT',                intent: 'BUY',   preferred_short_locs: ['09-Super_Corridor'], alternate_locs: ['21-Kanadiya_Amit'], min_budget: 10000000, max_budget: 20000000, min_area: 2000, max_area: 4000, timeline: 'Flexible', facilities: [], status: 'ACTIVE',     remarks: 'Investment plot near Super Corridor infrastructure', created_at: '2026-09-18T10:00:00Z' },
  { id: 'R-2011',  client_id: 'p11', client_name: 'Priya Tiwari',      assigned_to_id: 'u5',  assigned_to_name: 'Priya Sharma', category: 'RENTAL_RESIDENTIAL',  intent: 'RENT',  preferred_short_locs: ['10-Palasia_Priya', '16-Annapurna_Priya'], alternate_locs: [], min_budget: 15000, max_budget: 22000, min_area: 900, max_area: 1300, timeline: 'Immediate', facilities: ['Furnished', 'Parking'], status: 'ACTIVE',     remarks: 'Needs 2BHK furnished for family',                created_at: '2026-09-17T10:00:00Z' },
  { id: 'R-2012',  client_id: 'p13', client_name: 'Geeta Malviya',     assigned_to_id: 'u6',  assigned_to_name: 'Amit Patel',   category: 'BUY_SELL_FLAT',       intent: 'BUY',   preferred_short_locs: ['12-Navlakha_Sanjay', '19-Tejaji_Sanjay'], alternate_locs: [], min_budget: 3000000, max_budget: 4000000, min_area: 900, max_area: 1200, timeline: '3 months',  facilities: ['Lift'], status: 'NEW',        remarks: 'First home, budget conscious, 2BHK preference',  created_at: '2026-09-16T12:00:00Z' },
  { id: 'R-2013',  client_id: 'p14', client_name: 'Rakesh Chouhan',    assigned_to_id: 'u2',  assigned_to_name: 'Neha Kapoor',  category: 'BUY_SELL_COMMERCIAL', intent: 'BUY',   preferred_short_locs: ['13-AB_Road_Ravi', '05-MG_Road'], alternate_locs: [], min_budget: 15000000, max_budget: 30000000, min_area: 3000, max_area: 8000, timeline: 'Flexible', facilities: ['Parking', 'Generator'], status: 'ACTIVE',    remarks: 'Commercial hub for multi-tenant lease-back',     created_at: '2026-09-15T14:00:00Z' },
  { id: 'R-2014',  client_id: 'p15', client_name: 'Sonal Joshi',       assigned_to_id: 'u7',  assigned_to_name: 'Sanjay Verma', category: 'RENTAL_COMMERCIAL',   intent: 'RENT',  preferred_short_locs: ['05-MG_Road'], alternate_locs: ['13-AB_Road_Ravi'], min_budget: 60000, max_budget: 100000, min_area: 1000, max_area: 2000, timeline: '1 month', facilities: ['Power Backup', 'Parking', 'Security'], status: 'QUALIFIED',  remarks: 'Corporate office expansion — 20+ seater',        created_at: '2026-09-14T13:00:00Z' },
  { id: 'R-2015',  client_id: 'p18', client_name: 'Manoj Khare',       assigned_to_id: 'u3',  assigned_to_name: 'Ravi Mehta',   category: 'BUY_SELL_FLAT',       intent: 'BUY',   preferred_short_locs: ['04-Vijay_Nagar', '11-Bicholi_Amit'], alternate_locs: [], min_budget: 4000000, max_budget: 5000000, min_area: 1000, max_area: 1400, timeline: '2 months',  facilities: ['Lift', 'Security'], status: 'ACTIVE',     remarks: '2BHK for self-use',                              created_at: '2026-09-10T10:30:00Z' },
  { id: 'R-2016',  client_id: 'p20', client_name: 'Vijay Patil',       assigned_to_id: 'u2',  assigned_to_name: 'Neha Kapoor',  category: 'BUY_SELL_FLAT',       intent: 'BUY',   preferred_short_locs: ['09-Super_Corridor'], alternate_locs: ['01-Schm140_Mayank'], min_budget: 7000000, max_budget: 10000000, min_area: 1800, max_area: 2500, timeline: '3 months',  facilities: ['Parking', 'Pool', 'Club'], status: 'QUALIFIED',  remarks: 'Premium 3-4BHK with amenities',                  created_at: '2026-09-08T12:00:00Z' },
  { id: 'R-2017',  client_id: 'p21', client_name: 'Kavya Singh',       assigned_to_id: null,  assigned_to_name: null,           category: 'RENTAL_RESIDENTIAL',  intent: 'RENT',  preferred_short_locs: ['12-Navlakha_Sanjay', '19-Tejaji_Sanjay'], alternate_locs: [], min_budget: 8000, max_budget: 14000, min_area: 500, max_area: 800, timeline: 'Immediate', facilities: [], status: 'NEW',        remarks: 'Student/working professional 1BHK',              created_at: '2026-09-07T13:30:00Z' },
  { id: 'R-2018',  client_id: 'p23', client_name: 'Ritu Gupta',        assigned_to_id: 'u6',  assigned_to_name: 'Amit Patel',   category: 'BUY_SELL_FLAT',       intent: 'BUY',   preferred_short_locs: ['12-Navlakha_Sanjay'], alternate_locs: ['17-Limbodi_Sanjay'], min_budget: 3500000, max_budget: 4500000, min_area: 900, max_area: 1300, timeline: '2 months',  facilities: ['Parking'], status: 'ACTIVE',     remarks: '2BHK compact flat',                              created_at: '2026-09-05T09:00:00Z' },
  { id: 'R-2019',  client_id: 'p25', client_name: 'Meera Pandey',      assigned_to_id: 'u5',  assigned_to_name: 'Priya Sharma', category: 'BUY_SELL_FLAT',       intent: 'BUY',   preferred_short_locs: ['10-Palasia_Priya', '16-Annapurna_Priya'], alternate_locs: [], min_budget: 5000000, max_budget: 6500000, min_area: 1400, max_area: 1800, timeline: '2 months',  facilities: ['Lift', 'Parking', 'Power Backup'], status: 'QUALIFIED',  remarks: '3BHK, loan pre-sanctioned',                      created_at: '2026-09-03T11:00:00Z' },
  { id: 'R-2020',  client_id: 'p25', client_name: 'Meera Pandey',      assigned_to_id: 'u5',  assigned_to_name: 'Priya Sharma', category: 'RENTAL_RESIDENTIAL',  intent: 'RENT',  preferred_short_locs: ['16-Annapurna_Priya'], alternate_locs: ['24-Mahalakshmi_Ravi'], min_budget: 12000, max_budget: 18000, min_area: 800, max_area: 1100, timeline: 'Immediate', facilities: ['Furnished'], status: 'DROPPED',    remarks: 'Switched to buying plan',                        created_at: '2026-08-20T11:00:00Z' },
  { id: 'R-2021',  client_id: 'p26', client_name: 'Nilesh Shah',       assigned_to_id: 'u2',  assigned_to_name: 'Neha Kapoor',  category: 'BUY_SELL_COMMERCIAL', intent: 'BUY',   preferred_short_locs: ['13-AB_Road_Ravi'], alternate_locs: ['18-Ring_Road_Ravi'], min_budget: 8000000, max_budget: 15000000, min_area: 2000, max_area: 5000, timeline: 'Flexible', facilities: ['Parking', 'Generator', 'Lift'], status: 'ACTIVE',     remarks: 'Office suite for Indore branch expansion',       created_at: '2026-09-02T12:30:00Z' },
  { id: 'R-2022',  client_id: 'p28', client_name: 'Ashok Tripathi',    assigned_to_id: 'u7',  assigned_to_name: 'Sanjay Verma', category: 'BUY_SELL_FLAT',       intent: 'BUY',   preferred_short_locs: ['12-Navlakha_Sanjay', '19-Tejaji_Sanjay'], alternate_locs: [], min_budget: 2800000, max_budget: 3500000, min_area: 800, max_area: 1100, timeline: '3 months',  facilities: [], status: 'NEW',        remarks: '2BHK, small budget, flexible location',          created_at: '2026-08-31T08:00:00Z' },
  { id: 'R-2023',  client_id: 'p31', client_name: 'Pooja Mishra',      assigned_to_id: 'u3',  assigned_to_name: 'Ravi Mehta',   category: 'BUY_SELL_FLAT',       intent: 'BUY',   preferred_short_locs: ['15-Khandwa_Sanjay', '23-Scheme54_Priya'], alternate_locs: [], min_budget: 3800000, max_budget: 4500000, min_area: 1000, max_area: 1400, timeline: '2 months',  facilities: ['Lift'], status: 'ACTIVE',     remarks: 'First home purchase for working couple',         created_at: '2026-08-28T11:00:00Z' },
  { id: 'R-2024',  client_id: 'p32', client_name: 'Karan Mehta',       assigned_to_id: 'u6',  assigned_to_name: 'Amit Patel',   category: 'PLOT',                intent: 'BUY',   preferred_short_locs: ['25-Dewas_Naka_Sanjay'], alternate_locs: ['17-Limbodi_Sanjay'], min_budget: 2000000, max_budget: 4000000, min_area: 1000, max_area: 2000, timeline: 'Flexible', facilities: [], status: 'DROPPED',    remarks: 'Changed plan, considering other city',           created_at: '2026-08-15T12:00:00Z' },
  { id: 'R-2025',  client_id: 'p33', client_name: 'Deepika Pandey',    assigned_to_id: 'u5',  assigned_to_name: 'Priya Sharma', category: 'RENTAL_RESIDENTIAL',  intent: 'RENT',  preferred_short_locs: ['16-Annapurna_Priya', '24-Mahalakshmi_Ravi'], alternate_locs: [], min_budget: 12000, max_budget: 18000, min_area: 800, max_area: 1100, timeline: 'Immediate', facilities: [], status: 'ACTIVE',     remarks: '2BHK near Annapurna or Mahalakshmi area',        created_at: '2026-08-26T13:00:00Z' },
  { id: 'R-2026',  client_id: 'p35', client_name: 'Priti Kaur',        assigned_to_id: 'u7',  assigned_to_name: 'Sanjay Verma', category: 'BUY_SELL_FLAT',       intent: 'BUY',   preferred_short_locs: ['11-Bicholi_Amit'], alternate_locs: ['15-Khandwa_Sanjay'], min_budget: 4000000, max_budget: 5000000, min_area: 1100, max_area: 1500, timeline: '3 months',  facilities: ['Security'], status: 'ACTIVE',     remarks: '2BHK, east-facing, gated community preferred',   created_at: '2026-08-24T09:00:00Z' },
  { id: 'R-2027',  client_id: 'p37', client_name: 'Bhavna Jain',       assigned_to_id: 'u2',  assigned_to_name: 'Neha Kapoor',  category: 'BUY_SELL_FLAT',       intent: 'BUY',   preferred_short_locs: ['09-Super_Corridor'], alternate_locs: ['01-Schm140_Mayank'], min_budget: 6500000, max_budget: 8000000, min_area: 1600, max_area: 2200, timeline: '2 months',  facilities: ['Club', 'Pool', 'Parking'], status: 'FULFILLED',  remarks: 'Converted — OPP-5008',                           created_at: '2026-08-22T11:00:00Z' },
  { id: 'R-2028',  client_id: 'p39', client_name: 'Shweta Soni',       assigned_to_id: null,  assigned_to_name: null,           category: 'RENTAL_RESIDENTIAL',  intent: 'RENT',  preferred_short_locs: ['23-Scheme54_Priya', '22-Bhawarkua_Amit'], alternate_locs: [], min_budget: 8000, max_budget: 12000, min_area: 500, max_area: 750, timeline: 'Immediate', facilities: [], status: 'NEW',        remarks: '1BHK, near Scheme 54',                           created_at: '2026-08-20T13:00:00Z' },
  { id: 'R-2029',  client_id: 'p40', client_name: 'Dinesh Kumar',      assigned_to_id: 'u6',  assigned_to_name: 'Amit Patel',   category: 'PLOT',                intent: 'BUY',   preferred_short_locs: ['25-Dewas_Naka_Sanjay'], alternate_locs: ['17-Limbodi_Sanjay'], min_budget: 2500000, max_budget: 3500000, min_area: 900, max_area: 1500, timeline: '3 months',  facilities: [], status: 'ACTIVE',     remarks: 'Plot for residential construction',              created_at: '2026-08-19T08:00:00Z' },
  { id: 'R-2030',  client_id: 'p41', client_name: 'Archana Shukla',    assigned_to_id: 'u2',  assigned_to_name: 'Neha Kapoor',  category: 'PLOT',                intent: 'BUY',   preferred_short_locs: ['09-Super_Corridor', '21-Kanadiya_Amit'], alternate_locs: [], min_budget: 8000000, max_budget: 15000000, min_area: 2000, max_area: 5000, timeline: 'Flexible', facilities: [], status: 'ACTIVE',     remarks: 'Investment plot near IT corridor',               created_at: '2026-08-18T09:00:00Z' },
  { id: 'R-2031',  client_id: 'p42', client_name: 'Yogesh Thakur',     assigned_to_id: 'u7',  assigned_to_name: 'Sanjay Verma', category: 'BUY_SELL_FLAT',       intent: 'BUY',   preferred_short_locs: ['04-Vijay_Nagar', '23-Scheme54_Priya'], alternate_locs: [], min_budget: 4500000, max_budget: 5500000, min_area: 1200, max_area: 1600, timeline: '3 months',  facilities: ['Parking', 'Lift'], status: 'DROPPED',    remarks: 'Budget reduced, went to other market',           created_at: '2026-08-05T10:00:00Z' },
  { id: 'R-2032',  client_id: 'p44', client_name: 'Rohit Bansal',      assigned_to_id: 'u3',  assigned_to_name: 'Ravi Mehta',   category: 'BUY_SELL_FLAT',       intent: 'BUY',   preferred_short_locs: ['13-AB_Road_Ravi'], alternate_locs: ['20-New_Palasia_Ravi'], min_budget: 7000000, max_budget: 9000000, min_area: 2000, max_area: 2800, timeline: '2 months',  facilities: ['Parking', 'Club', 'Gym'], status: 'QUALIFIED',  remarks: '4BHK premium flat',                              created_at: '2026-08-15T12:00:00Z' },
  { id: 'R-2033',  client_id: 'p46', client_name: 'Jitendra Solanki',  assigned_to_id: 'u6',  assigned_to_name: 'Amit Patel',   category: 'PLOT',                intent: 'BUY',   preferred_short_locs: ['25-Dewas_Naka_Sanjay'], alternate_locs: [], min_budget: 2000000, max_budget: 3200000, min_area: 900, max_area: 1400, timeline: '6 months',  facilities: [], status: 'ACTIVE',     remarks: 'Plot near Pithampur industrial area',            created_at: '2026-08-13T08:00:00Z' },
  { id: 'R-2034',  client_id: 'p47', client_name: 'Kirti Verma',       assigned_to_id: 'u5',  assigned_to_name: 'Priya Sharma', category: 'RENTAL_RESIDENTIAL',  intent: 'RENT',  preferred_short_locs: ['22-Bhawarkua_Amit', '16-Annapurna_Priya'], alternate_locs: [], min_budget: 14000, max_budget: 19000, min_area: 850, max_area: 1150, timeline: 'Immediate', facilities: ['Parking', 'Security'], status: 'ACTIVE',     remarks: 'Semi-furnished 2BHK preferred',                  created_at: '2026-08-12T09:00:00Z' },
  { id: 'R-2035',  client_id: 'p49', client_name: 'Nisha Kapoor',      assigned_to_id: null,  assigned_to_name: null,           category: 'BUY_SELL_FLAT',       intent: 'BUY',   preferred_short_locs: ['10-Palasia_Priya', '07-Geeta_Bhawan'], alternate_locs: [], min_budget: 4000000, max_budget: 5500000, min_area: 1000, max_area: 1400, timeline: '3 months',  facilities: [], status: 'NEW',        remarks: 'Self-use 2BHK, website inquiry',                 created_at: '2026-08-10T11:00:00Z' },
  { id: 'R-2036',  client_id: 'p50', client_name: 'Raghav Dixit',      assigned_to_id: 'u2',  assigned_to_name: 'Neha Kapoor',  category: 'BUY_SELL_COMMERCIAL', intent: 'BUY',   preferred_short_locs: ['09-Super_Corridor', '13-AB_Road_Ravi'], alternate_locs: [], min_budget: 20000000, max_budget: 40000000, min_area: 8000, max_area: 20000, timeline: 'Flexible', facilities: ['Parking', 'Generator', 'CCTV'], status: 'ACTIVE',    remarks: 'Commercial complex investment',                  created_at: '2026-08-09T12:00:00Z' },
  { id: 'R-2037',  client_id: 'p37', client_name: 'Bhavna Jain',       assigned_to_id: 'u5',  assigned_to_name: 'Priya Sharma', category: 'RENTAL_RESIDENTIAL',  intent: 'RENT',  preferred_short_locs: ['01-Schm140_Mayank'], alternate_locs: ['07-Geeta_Bhawan'], min_budget: 18000, max_budget: 26000, min_area: 1000, max_area: 1400, timeline: '1 month',  facilities: ['Furnished', 'Parking'], status: 'ACTIVE',     remarks: 'Temp rental while Signature Park flat is ready',created_at: '2026-09-11T11:00:00Z' },
  { id: 'R-2038',  client_id: 'p9',  client_name: 'Anil Sharma',       assigned_to_id: 'u3',  assigned_to_name: 'Ravi Mehta',   category: 'RENTAL_RESIDENTIAL',  intent: 'RENT',  preferred_short_locs: ['01-Schm140_Mayank', '10-Palasia_Priya'], alternate_locs: [], min_budget: 18000, max_budget: 25000, min_area: 950, max_area: 1300, timeline: 'Immediate', facilities: ['Parking', 'Furnished'], status: 'LOW_CLARITY',remarks: 'Not sure if buying or renting — clarification pending', created_at: '2026-09-14T09:00:00Z' },
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
  { id: 'M-10', requirement_id: 'R-2009', client_name: 'Anil Sharma',   property_id: 'P-1026', short_loc: '01-Schm140_Mayank', property_category: 'BUY_SELL_FLAT',      property_price: 6200000, score: 94.0, tier: 'HIGH',     status: 'SUGGESTED',        score_breakdown: { location: 'PASS', budget: 'PASS', type: 'PASS', availability: 'PASS' } },
  { id: 'M-11', requirement_id: 'R-2009', client_name: 'Anil Sharma',   property_id: 'P-1014', short_loc: '10-Palasia_Priya',   property_category: 'BUY_SELL_FLAT',      property_price: 4800000, score: 86.0, tier: 'HIGH',     status: 'SHARED',           score_breakdown: { location: 'PASS (alternate loc)', budget: 'PASS', type: 'PASS', availability: 'PASS' } },
  { id: 'M-12', requirement_id: 'R-2010', client_name: 'Anil K. Sharma',property_id: 'P-1032', short_loc: '09-Super_Corridor', property_category: 'PLOT',               property_price: 7800000, score: 91.0, tier: 'HIGH',     status: 'VISIT_SCHEDULED',  score_breakdown: { location: 'PASS', budget: 'PASS', type: 'PASS', availability: 'PASS' } },
  { id: 'M-13', requirement_id: 'R-2010', client_name: 'Anil K. Sharma',property_id: 'P-1039', short_loc: '21-Kanadiya_Amit',   property_category: 'PLOT',               property_price: 4500000, score: 76.0, tier: 'GOOD',     status: 'SUGGESTED',        score_breakdown: { location: 'PASS (alternate loc)', budget: 'PASS', type: 'PASS', availability: 'PASS' } },
  { id: 'M-14', requirement_id: 'R-2011', client_name: 'Priya Tiwari',  property_id: 'P-1013', short_loc: '10-Palasia_Priya',   property_category: 'RENTAL_RESIDENTIAL', property_price: 20000,   score: 95.0, tier: 'HIGH',     status: 'SHARED',           score_breakdown: { location: 'PASS', budget: 'PASS', type: 'PASS', availability: 'PASS' } },
  { id: 'M-15', requirement_id: 'R-2011', client_name: 'Priya Tiwari',  property_id: 'P-1027', short_loc: '16-Annapurna_Priya', property_category: 'RENTAL_RESIDENTIAL', property_price: 18000,   score: 89.0, tier: 'HIGH',     status: 'SUGGESTED',        score_breakdown: { location: 'PASS (alternate loc)', budget: 'PASS', type: 'PASS', availability: 'PASS' } },
  { id: 'M-16', requirement_id: 'R-2012', client_name: 'Geeta Malviya', property_id: 'P-1017', short_loc: '12-Navlakha_Sanjay', property_category: 'BUY_SELL_FLAT',      property_price: 3600000, score: 92.0, tier: 'HIGH',     status: 'SHORTLISTED',      score_breakdown: { location: 'PASS', budget: 'PASS', type: 'PASS', availability: 'PASS' } },
  { id: 'M-17', requirement_id: 'R-2012', client_name: 'Geeta Malviya', property_id: 'P-1061', short_loc: '19-Tejaji_Sanjay',   property_category: 'BUY_SELL_FLAT',      property_price: 2900000, score: 81.0, tier: 'GOOD',     status: 'SUGGESTED',        score_breakdown: { location: 'PASS (alternate loc)', budget: 'PASS', type: 'PASS', availability: 'PASS' } },
  { id: 'M-18', requirement_id: 'R-2013', client_name: 'Rakesh Chouhan',property_id: 'P-1019', short_loc: '13-AB_Road_Ravi',    property_category: 'BUY_SELL_COMMERCIAL',property_price: 12000000,score: 88.0, tier: 'HIGH',     status: 'SUGGESTED',        score_breakdown: { location: 'PASS', budget: 'PASS', type: 'PASS', availability: 'PASS' } },
  { id: 'M-19', requirement_id: 'R-2013', client_name: 'Rakesh Chouhan',property_id: 'P-1054', short_loc: '05-MG_Road',         property_category: 'BUY_SELL_COMMERCIAL',property_price: 25000000,score: 93.0, tier: 'HIGH',     status: 'SHORTLISTED',      score_breakdown: { location: 'PASS', budget: 'PASS', type: 'PASS', availability: 'PASS' } },
  { id: 'M-20', requirement_id: 'R-2014', client_name: 'Sonal Joshi',   property_id: 'P-1018', short_loc: '13-AB_Road_Ravi',    property_category: 'RENTAL_COMMERCIAL',  property_price: 80000,   score: 90.0, tier: 'HIGH',     status: 'VISIT_SCHEDULED',  score_breakdown: { location: 'PASS', budget: 'PASS', type: 'PASS', availability: 'PASS' } },
  { id: 'M-21', requirement_id: 'R-2015', client_name: 'Manoj Khare',   property_id: 'P-1044', short_loc: '04-Vijay_Nagar',     property_category: 'BUY_SELL_FLAT',      property_price: 4700000, score: 91.0, tier: 'HIGH',     status: 'SUGGESTED',        score_breakdown: { location: 'PASS', budget: 'PASS', type: 'PASS', availability: 'PASS' } },
  { id: 'M-22', requirement_id: 'R-2015', client_name: 'Manoj Khare',   property_id: 'P-1056', short_loc: '11-Bicholi_Amit',    property_category: 'BUY_SELL_FLAT',      property_price: 3500000, score: 82.0, tier: 'GOOD',     status: 'SHARED',           score_breakdown: { location: 'PASS (alternate loc)', budget: 'PASS', type: 'PASS', availability: 'PASS' } },
  { id: 'M-23', requirement_id: 'R-2016', client_name: 'Vijay Patil',   property_id: 'P-1024', short_loc: '09-Super_Corridor',  property_category: 'BUY_SELL_FLAT',      property_price: 8500000, score: 96.0, tier: 'HIGH',     status: 'SHORTLISTED',      score_breakdown: { location: 'PASS', budget: 'PASS', type: 'PASS', availability: 'PASS' } },
  { id: 'M-24', requirement_id: 'R-2017', client_name: 'Kavya Singh',   property_id: 'P-1016', short_loc: '12-Navlakha_Sanjay', property_category: 'RENTAL_RESIDENTIAL', property_price: 12000,   score: 92.0, tier: 'HIGH',     status: 'SUGGESTED',        score_breakdown: { location: 'PASS', budget: 'PASS', type: 'PASS', availability: 'PASS' } },
  { id: 'M-25', requirement_id: 'R-2018', client_name: 'Ritu Gupta',    property_id: 'P-1017', short_loc: '12-Navlakha_Sanjay', property_category: 'BUY_SELL_FLAT',      property_price: 3600000, score: 89.0, tier: 'HIGH',     status: 'SUGGESTED',        score_breakdown: { location: 'PASS', budget: 'PASS', type: 'PASS', availability: 'PASS' } },
  { id: 'M-26', requirement_id: 'R-2019', client_name: 'Meera Pandey',  property_id: 'P-1034', short_loc: '16-Annapurna_Priya', property_category: 'BUY_SELL_FLAT',      property_price: 5800000, score: 94.0, tier: 'HIGH',     status: 'VISIT_SCHEDULED',  score_breakdown: { location: 'PASS', budget: 'PASS', type: 'PASS', availability: 'PASS' } },
  { id: 'M-27', requirement_id: 'R-2021', client_name: 'Nilesh Shah',   property_id: 'P-1019', short_loc: '13-AB_Road_Ravi',    property_category: 'BUY_SELL_COMMERCIAL',property_price: 12000000,score: 93.0, tier: 'HIGH',     status: 'SHARED',           score_breakdown: { location: 'PASS', budget: 'PASS', type: 'PASS', availability: 'PASS' } },
  { id: 'M-28', requirement_id: 'R-2023', client_name: 'Pooja Mishra',  property_id: 'P-1064', short_loc: '15-Khandwa_Sanjay',  property_category: 'BUY_SELL_FLAT',      property_price: 3800000, score: 90.0, tier: 'HIGH',     status: 'SUGGESTED',        score_breakdown: { location: 'PASS', budget: 'PASS', type: 'PASS', availability: 'PASS' } },
  { id: 'M-29', requirement_id: 'R-2025', client_name: 'Deepika Pandey',property_id: 'P-1027', short_loc: '16-Annapurna_Priya', property_category: 'RENTAL_RESIDENTIAL', property_price: 18000,   score: 91.0, tier: 'HIGH',     status: 'SUGGESTED',        score_breakdown: { location: 'PASS', budget: 'PASS', type: 'PASS', availability: 'PASS' } },
  { id: 'M-30', requirement_id: 'R-2026', client_name: 'Priti Kaur',    property_id: 'P-1056', short_loc: '11-Bicholi_Amit',    property_category: 'BUY_SELL_FLAT',      property_price: 3500000, score: 85.0, tier: 'GOOD',     status: 'SUGGESTED',        score_breakdown: { location: 'PASS', budget: 'PASS', type: 'PASS', availability: 'PASS' } },
  { id: 'M-31', requirement_id: 'R-2029', client_name: 'Dinesh Kumar',  property_id: 'P-1049', short_loc: '25-Dewas_Naka_Sanjay',property_category: 'PLOT',               property_price: 2500000, score: 92.0, tier: 'HIGH',     status: 'SUGGESTED',        score_breakdown: { location: 'PASS', budget: 'PASS', type: 'PASS', availability: 'PASS' } },
  { id: 'M-32', requirement_id: 'R-2030', client_name: 'Archana Shukla',property_id: 'P-1032', short_loc: '09-Super_Corridor', property_category: 'PLOT',               property_price: 7800000, score: 88.0, tier: 'HIGH',     status: 'SHORTLISTED',      score_breakdown: { location: 'PASS', budget: 'PASS', type: 'PASS', availability: 'PASS' } },
  { id: 'M-33', requirement_id: 'R-2032', client_name: 'Rohit Bansal',  property_id: 'P-1038', short_loc: '13-AB_Road_Ravi',    property_category: 'BUY_SELL_FLAT',      property_price: 9500000, score: 86.0, tier: 'HIGH',     status: 'VISIT_SCHEDULED',  score_breakdown: { location: 'PASS', budget: 'WARNING (5% over budget)', type: 'PASS', availability: 'PASS' } },
  { id: 'M-34', requirement_id: 'R-2034', client_name: 'Kirti Verma',   property_id: 'P-1065', short_loc: '22-Bhawarkua_Amit',  property_category: 'RENTAL_RESIDENTIAL', property_price: 16000,   score: 93.0, tier: 'HIGH',     status: 'SHARED',           score_breakdown: { location: 'PASS', budget: 'PASS', type: 'PASS', availability: 'PASS' } },
  { id: 'M-35', requirement_id: 'R-2037', client_name: 'Bhavna Jain',   property_id: 'P-1052', short_loc: '01-Schm140_Mayank',  property_category: 'RENTAL_RESIDENTIAL', property_price: 21000,   score: 95.0, tier: 'HIGH',     status: 'SHORTLISTED',      score_breakdown: { location: 'PASS', budget: 'PASS', type: 'PASS', availability: 'PASS' } },
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
  {
    id: 'FU-3011',
    client_name: 'Anil Sharma',
    client_id: 'p9',
    entity_type: 'Lead',
    entity_id: 'L-1011',
    purpose: 'Discuss Scheme 140 3BHK flat options and schedule site visit',
    priority: 'HIGH',
    due_date: '2026-09-22T10:00:00Z',
    status: 'PENDING',
    responsible_name: 'Priya Sharma',
    responsible_id: 'u5',
    expected_outcome: 'Confirm weekend site visit for P-1026 and P-1014',
    created_at: '2026-09-20T10:00:00Z',
  },
  {
    id: 'FU-3012',
    client_name: 'Anil K. Sharma',
    client_id: 'p10',
    entity_type: 'Lead',
    entity_id: 'L-1012',
    purpose: 'Present Super Corridor commercial plotting survey report',
    priority: 'HIGH',
    due_date: '2026-09-21T11:00:00Z',
    status: 'PENDING',
    responsible_name: 'Ravi Mehta',
    responsible_id: 'u3',
    expected_outcome: 'Schedule owner meeting with Meena Builder',
    created_at: '2026-09-18T10:00:00Z',
  },
  {
    id: 'FU-3013',
    client_name: 'Priya Tiwari',
    client_id: 'p11',
    entity_type: 'Requirement',
    entity_id: 'R-2011',
    purpose: 'Share photos and video walkthrough of Palasia 2BHK',
    priority: 'MEDIUM',
    due_date: '2026-09-18T15:00:00Z',
    status: 'OVERDUE',
    responsible_name: 'Priya Sharma',
    responsible_id: 'u5',
    expected_outcome: 'Receive confirmation on visit timing',
    created_at: '2026-09-17T10:00:00Z',
  },
  {
    id: 'FU-3014',
    client_name: 'Rakesh Chouhan',
    client_id: 'p14',
    entity_type: 'Requirement',
    entity_id: 'R-2013',
    purpose: 'Follow up on AB Road office space comparison deck',
    priority: 'HIGH',
    due_date: '2026-09-20T15:00:00Z',
    status: 'COMPLETED',
    responsible_name: 'Neha Kapoor',
    responsible_id: 'u2',
    expected_outcome: 'Client reviewed deck and shortlisted P-1054',
    created_at: '2026-09-15T14:00:00Z',
  },
  {
    id: 'FU-3015',
    client_name: 'Sonal Joshi',
    client_id: 'p15',
    entity_type: 'Opportunity',
    entity_id: 'OPP-5004',
    purpose: 'Check feedback after Sapphire Twin Tower site visit',
    priority: 'HIGH',
    due_date: '2026-09-17T12:00:00Z',
    status: 'OVERDUE',
    responsible_name: 'Ravi Mehta',
    responsible_id: 'u3',
    expected_outcome: 'Collect token advance or counter terms',
    created_at: '2026-09-14T11:00:00Z',
  },
  {
    id: 'FU-3016',
    client_name: 'Manoj Khare',
    client_id: 'p18',
    entity_type: 'Lead',
    entity_id: 'L-1017',
    purpose: 'Call to review Vijay Nagar vs Bicholi pricing breakdown',
    priority: 'MEDIUM',
    due_date: '2026-09-15T11:00:00Z',
    status: 'COMPLETED',
    responsible_name: 'Ravi Mehta',
    responsible_id: 'u3',
    expected_outcome: 'Client preferred Vijay Nagar P-1044',
    created_at: '2026-09-10T10:30:00Z',
  },
  {
    id: 'FU-3017',
    client_name: 'Vijay Patil',
    client_id: 'p20',
    entity_type: 'Lead',
    entity_id: 'L-1018',
    purpose: 'Provide updated construction schedule and payment plan for Emerald View',
    priority: 'HIGH',
    due_date: '2026-09-19T16:00:00Z',
    status: 'OVERDUE',
    responsible_name: 'Neha Kapoor',
    responsible_id: 'u2',
    expected_outcome: 'Set up booking discussion with builder rep',
    created_at: '2026-09-08T12:00:00Z',
  },
  {
    id: 'FU-3018',
    client_name: 'Ritu Gupta',
    client_id: 'p23',
    entity_type: 'Requirement',
    entity_id: 'R-2018',
    purpose: 'Check if loan pre-approval letter received from SBI',
    priority: 'MEDIUM',
    due_date: '2026-09-23T11:00:00Z',
    status: 'PENDING',
    responsible_name: 'Amit Patel',
    responsible_id: 'u6',
    expected_outcome: 'Proceed with Navlakha flat site visit',
    created_at: '2026-09-05T09:00:00Z',
  },
  {
    id: 'FU-3019',
    client_name: 'Meera Pandey',
    client_id: 'p25',
    entity_type: 'Requirement',
    entity_id: 'R-2019',
    purpose: 'Coordinate site visit for Annapurna Towers 3BHK',
    priority: 'HIGH',
    due_date: '2026-09-22T14:00:00Z',
    status: 'PENDING',
    responsible_name: 'Priya Sharma',
    responsible_id: 'u5',
    expected_outcome: 'Finalize viewing date with owner Vandana Malviya',
    created_at: '2026-09-03T11:00:00Z',
  },
  {
    id: 'FU-3020',
    client_name: 'Nilesh Shah',
    client_id: 'p26',
    entity_type: 'Requirement',
    entity_id: 'R-2021',
    purpose: 'Follow up on commercial lease agreement template review',
    priority: 'HIGH',
    due_date: '2026-09-24T12:00:00Z',
    status: 'PENDING',
    responsible_name: 'Neha Kapoor',
    responsible_id: 'u2',
    expected_outcome: 'Agree on security deposit terms and fit-out period',
    created_at: '2026-09-02T12:30:00Z',
  },
  {
    id: 'FU-3021',
    client_name: 'Pooja Mishra',
    client_id: 'p31',
    entity_type: 'Lead',
    entity_id: 'L-1024',
    purpose: 'Share Khandwa Road Towers project brochure and pricing',
    priority: 'MEDIUM',
    due_date: '2026-09-14T10:00:00Z',
    status: 'COMPLETED',
    responsible_name: 'Ravi Mehta',
    responsible_id: 'u3',
    expected_outcome: 'Client scheduled visit for upcoming weekend',
    created_at: '2026-08-28T11:00:00Z',
  },
  {
    id: 'FU-3022',
    client_name: 'Deepika Pandey',
    client_id: 'p33',
    entity_type: 'Requirement',
    entity_id: 'R-2025',
    purpose: 'Check availability of owner for key handover inspection',
    priority: 'MEDIUM',
    due_date: '2026-09-25T16:00:00Z',
    status: 'PENDING',
    responsible_name: 'Priya Sharma',
    responsible_id: 'u5',
    expected_outcome: 'Schedule key handover',
    created_at: '2026-08-26T13:00:00Z',
  },
  {
    id: 'FU-3023',
    client_name: 'Priti Kaur',
    client_id: 'p35',
    entity_type: 'Lead',
    entity_id: 'L-1027',
    purpose: 'Follow up on Bicholi Prime 2BHK flat pricing clarification',
    priority: 'MEDIUM',
    due_date: '2026-09-16T15:00:00Z',
    status: 'NO_RESPONSE',
    responsible_name: 'Sanjay Verma',
    responsible_id: 'u7',
    expected_outcome: 'Send WhatsApp summary if unanswered',
    created_at: '2026-08-24T09:00:00Z',
  },
  {
    id: 'FU-3024',
    client_name: 'Bhavna Jain',
    client_id: 'p37',
    entity_type: 'Lead',
    entity_id: 'L-1028',
    purpose: 'Finalize paperwork for Signature Park apartment booking',
    priority: 'HIGH',
    due_date: '2026-09-20T11:00:00Z',
    status: 'COMPLETED',
    responsible_name: 'Neha Kapoor',
    responsible_id: 'u2',
    expected_outcome: 'Token deposit received and receipt issued',
    created_at: '2026-08-22T11:00:00Z',
  },
  {
    id: 'FU-3025',
    client_name: 'Dinesh Kumar',
    client_id: 'p40',
    entity_type: 'Requirement',
    entity_id: 'R-2029',
    purpose: 'Coordinate land survey visit for Dewas Naka residential plot',
    priority: 'MEDIUM',
    due_date: '2026-09-22T09:30:00Z',
    status: 'PENDING',
    responsible_name: 'Amit Patel',
    responsible_id: 'u6',
    expected_outcome: 'Confirm boundary peg markings with patwari',
    created_at: '2026-08-19T08:00:00Z',
  },
  {
    id: 'FU-3026',
    client_name: 'Archana Shukla',
    client_id: 'p41',
    entity_type: 'Lead',
    entity_id: 'L-1031',
    purpose: 'Consultancy follow-up on commercial warehouse land title search',
    priority: 'HIGH',
    due_date: '2026-09-18T14:00:00Z',
    status: 'OVERDUE',
    responsible_name: 'Neha Kapoor',
    responsible_id: 'u2',
    expected_outcome: 'Obtain legal vetting report from advocate',
    created_at: '2026-08-18T09:00:00Z',
  },
  {
    id: 'FU-3027',
    client_name: 'Rohit Bansal',
    client_id: 'p44',
    entity_type: 'Requirement',
    entity_id: 'R-2032',
    purpose: 'Follow up after AB Road 4BHK penthouse viewing',
    priority: 'HIGH',
    due_date: '2026-09-21T17:00:00Z',
    status: 'PENDING',
    responsible_name: 'Ravi Mehta',
    responsible_id: 'u3',
    expected_outcome: 'Check if buyer wants to submit opening offer',
    created_at: '2026-08-15T12:00:00Z',
  },
  {
    id: 'FU-3028',
    client_name: 'Jitendra Solanki',
    client_id: 'p46',
    entity_type: 'Lead',
    entity_id: 'L-1034',
    purpose: 'Call to review Pithampur corridor residential plot listings',
    priority: 'LOW',
    due_date: '2026-09-12T10:00:00Z',
    status: 'RESCHEDULED',
    responsible_name: 'Amit Patel',
    responsible_id: 'u6',
    expected_outcome: 'Client requested call back after Diwali festival',
    created_at: '2026-08-13T08:00:00Z',
  },
  {
    id: 'FU-3029',
    client_name: 'Kirti Verma',
    client_id: 'p47',
    entity_type: 'Requirement',
    entity_id: 'R-2034',
    purpose: 'Share updated video of Bhawarkua 2BHK flat with tenant',
    priority: 'MEDIUM',
    due_date: '2026-09-20T12:00:00Z',
    status: 'COMPLETED',
    responsible_name: 'Priya Sharma',
    responsible_id: 'u5',
    expected_outcome: 'Tenant approved condition and agreed to meet owner',
    created_at: '2026-08-12T09:00:00Z',
  },
  {
    id: 'FU-3030',
    client_name: 'Nisha Kapoor',
    client_id: 'p49',
    entity_type: 'Lead',
    entity_id: 'L-1036',
    purpose: 'First call to qualify budget and preferred timeline',
    priority: 'MEDIUM',
    due_date: '2026-09-23T15:00:00Z',
    status: 'PENDING',
    responsible_name: 'Neha Kapoor',
    responsible_id: 'u2',
    expected_outcome: 'Capture exact specifications for requirement R-2035',
    created_at: '2026-08-10T11:00:00Z',
  },
  {
    id: 'FU-3031',
    client_name: 'Raghav Dixit',
    client_id: 'p50',
    entity_type: 'Requirement',
    entity_id: 'R-2036',
    purpose: 'Commercial complex financial viability report walkthrough',
    priority: 'HIGH',
    due_date: '2026-09-24T11:00:00Z',
    status: 'PENDING',
    responsible_name: 'Neha Kapoor',
    responsible_id: 'u2',
    expected_outcome: 'Schedule board presentation with investor group',
    created_at: '2026-08-09T12:00:00Z',
  },
  {
    id: 'FU-3032',
    client_name: 'Anil Sharma',
    client_id: 'p9',
    entity_type: 'Requirement',
    entity_id: 'R-2038',
    purpose: 'Clarify whether client prefers rental or purchase for Palasia property',
    priority: 'HIGH',
    due_date: '2026-09-17T11:00:00Z',
    status: 'OVERDUE',
    responsible_name: 'Ravi Mehta',
    responsible_id: 'u3',
    expected_outcome: 'Resolve ambiguity between purchase (R-2009) and rental (R-2038)',
    created_at: '2026-09-14T09:00:00Z',
  },
  {
    id: 'FU-3033',
    client_name: 'Geeta Malviya',
    client_id: 'p13',
    entity_type: 'Requirement',
    entity_id: 'R-2012',
    purpose: 'Check if father visited Tejaji Heights site independently',
    priority: 'LOW',
    due_date: '2026-09-22T16:00:00Z',
    status: 'PENDING',
    responsible_name: 'Amit Patel',
    responsible_id: 'u6',
    expected_outcome: 'Get feedback on location suitability',
    created_at: '2026-09-16T12:00:00Z',
  },
  {
    id: 'FU-3034',
    client_name: 'Santosh Yadav',
    client_id: 'p24',
    entity_type: 'Lead',
    entity_id: 'L-1018',
    purpose: 'Review developer inventory status on Super Corridor projects',
    priority: 'MEDIUM',
    due_date: '2026-09-25T11:00:00Z',
    status: 'PENDING',
    responsible_name: 'Neha Kapoor',
    responsible_id: 'u2',
    expected_outcome: 'Receive updated unsold unit list with pricing',
    created_at: '2026-09-08T12:00:00Z',
  },
  {
    id: 'FU-3035',
    client_name: 'Suresh Agrawal',
    client_id: 'p12',
    entity_type: 'Opportunity',
    entity_id: 'OPP-5006',
    purpose: 'Review tenant lease draft for Vijay Nagar commercial office',
    priority: 'HIGH',
    due_date: '2026-09-19T10:00:00Z',
    status: 'COMPLETED',
    responsible_name: 'Priya Sharma',
    responsible_id: 'u5',
    expected_outcome: 'Owner signed off on 3-year lock-in period',
    created_at: '2026-09-13T10:00:00Z',
  },
  {
    id: 'FU-3036',
    client_name: 'Sunita Rajput',
    client_id: 'p29',
    entity_type: 'Requirement',
    entity_id: 'R-2025',
    purpose: 'Follow up on society maintenance dues clearance receipt',
    priority: 'LOW',
    due_date: '2026-09-15T14:00:00Z',
    status: 'COMPLETED',
    responsible_name: 'Sanjay Verma',
    responsible_id: 'u7',
    expected_outcome: 'Receipt attached to property folder',
    created_at: '2026-09-04T08:00:00Z',
  },
  {
    id: 'FU-3037',
    client_name: 'Mukesh Trivedi',
    client_id: 'p38',
    entity_type: 'Opportunity',
    entity_id: 'OPP-5005',
    purpose: 'Confirm RTGS transaction for security deposit transfer',
    priority: 'HIGH',
    due_date: '2026-09-16T12:00:00Z',
    status: 'COMPLETED',
    responsible_name: 'Neha Kapoor',
    responsible_id: 'u2',
    expected_outcome: 'RTGS reference UTR documented',
    created_at: '2026-09-12T10:00:00Z',
  },
  {
    id: 'FU-3038',
    client_name: 'Kavita Sharma',
    client_id: 'p5',
    entity_type: 'Lead',
    entity_id: 'L-1010',
    purpose: 'Verify owner listing details for 99acres portal update',
    priority: 'MEDIUM',
    due_date: '2026-09-21T15:00:00Z',
    status: 'PENDING',
    responsible_name: 'Ravi Mehta',
    responsible_id: 'u3',
    expected_outcome: 'Confirm availability date and revised expected rent',
    created_at: '2026-09-19T14:15:00Z',
  },
]

export interface OpportunityListItem {
  id: string
  client_name: string
  stage: string
  expected_value: number
}

export const MOCK_OPPORTUNITIES_LIST: OpportunityListItem[] = [
  { id: 'OPP-5001', client_name: 'Vikram Singh', stage: 'NEGOTIATION', expected_value: 5400000 },
  { id: 'OPP-5002', client_name: 'Amit Jain', stage: 'WON', expected_value: 216000 },
  { id: 'OPP-5003', client_name: 'Rahul Verma', stage: 'DOCUMENTATION', expected_value: 7200000 },
  { id: 'OPP-5004', client_name: 'Kavita Sharma', stage: 'SITE_VISIT', expected_value: 18500000 },
  { id: 'OPP-5005', client_name: 'Ramesh Patel', stage: 'NEGOTIATION', expected_value: 12000000 },
  { id: 'OPP-5006', client_name: 'Vikram Singh', stage: 'LOST', expected_value: 540000 },
  { id: 'OPP-5007', client_name: 'Sunita Gupta', stage: 'QUALIFIED', expected_value: 4200000 },
  { id: 'OPP-5008', client_name: 'Bhavna Jain', stage: 'WON', expected_value: 7200000 },
  { id: 'OPP-5009', client_name: 'Anil Sharma', stage: 'QUALIFIED', expected_value: 6200000 },
  { id: 'OPP-5010', client_name: 'Anil K. Sharma', stage: 'PROPERTY_SHARED', expected_value: 7800000 },
  { id: 'OPP-5011', client_name: 'Priya Tiwari', stage: 'SITE_VISIT', expected_value: 240000 },
  { id: 'OPP-5012', client_name: 'Geeta Malviya', stage: 'WON', expected_value: 3600000 },
  { id: 'OPP-5013', client_name: 'Rakesh Chouhan', stage: 'NEGOTIATION', expected_value: 24000000 },
  { id: 'OPP-5014', client_name: 'Sonal Joshi', stage: 'SITE_VISIT', expected_value: 960000 },
  { id: 'OPP-5015', client_name: 'Karan Mehta', stage: 'LOST', expected_value: 2500000 },
  { id: 'OPP-5016', client_name: 'Vijay Patil', stage: 'WON', expected_value: 8500000 },
  { id: 'OPP-5017', client_name: 'Manoj Khare', stage: 'DOCUMENTATION', expected_value: 4700000 },
  { id: 'OPP-5018', client_name: 'Ritu Gupta', stage: 'QUALIFIED', expected_value: 3600000 },
  { id: 'OPP-5019', client_name: 'Meera Pandey', stage: 'SITE_VISIT', expected_value: 5800000 },
  { id: 'OPP-5020', client_name: 'Nilesh Shah', stage: 'WON', expected_value: 12000000 },
  { id: 'OPP-5021', client_name: 'Yogesh Thakur', stage: 'LOST', expected_value: 4700000 },
  { id: 'OPP-5022', client_name: 'Rohit Bansal', stage: 'DOCUMENTATION', expected_value: 9500000 },
  { id: 'OPP-5023', client_name: 'Raghav Dixit', stage: 'NEGOTIATION', expected_value: 35000000 },
  { id: 'OPP-5024', client_name: 'Kirti Verma', stage: 'WON', expected_value: 192000 },
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
  {
    id: 'C-4011',
    party_name: 'Anil Sharma',
    party_id: 'p9',
    phone: '+91 9812300001',
    call_type: 'OUTBOUND',
    duration_minutes: 9,
    outcome: 'CONNECTED',
    caller_name: 'Priya Sharma',
    caller_id: 'u5',
    call_time: '2026-09-20T10:15:00Z',
    remarks: 'Discussed Scheme 140 3BHK flat options; confirmed site visit for P-1026 on weekend.',
  },
  {
    id: 'C-4012',
    party_name: 'Anil K. Sharma',
    party_id: 'p10',
    phone: '+91 9812300002',
    call_type: 'OUTBOUND',
    duration_minutes: 14,
    outcome: 'CONNECTED',
    caller_name: 'Ravi Mehta',
    caller_id: 'u3',
    call_time: '2026-09-19T14:30:00Z',
    remarks: 'Presented Super Corridor commercial plot options; client requested RERA title copy.',
  },
  {
    id: 'C-4013',
    party_name: 'Priya Tiwari',
    party_id: 'p11',
    phone: '+91 9812300003',
    call_type: 'INBOUND',
    duration_minutes: 6,
    outcome: 'CONNECTED',
    caller_name: 'Priya Sharma',
    caller_id: 'u5',
    call_time: '2026-09-18T11:45:00Z',
    remarks: 'Client called asking about monthly maintenance charges in Palasia Heights flat.',
  },
  {
    id: 'C-4014',
    party_name: 'Rakesh Chouhan',
    party_id: 'p14',
    phone: '+91 9812300006',
    call_type: 'OUTBOUND',
    duration_minutes: 11,
    outcome: 'CONNECTED',
    caller_name: 'Neha Kapoor',
    caller_id: 'u2',
    call_time: '2026-09-17T15:20:00Z',
    remarks: 'Detailed walkthrough of rental yield calculations for MG Towers commercial unit.',
  },
  {
    id: 'C-4015',
    party_name: 'Sonal Joshi',
    party_id: 'p15',
    phone: '+91 9812300007',
    call_type: 'OUTBOUND',
    duration_minutes: 4,
    outcome: 'CALL_BACK_LATER',
    caller_name: 'Sanjay Verma',
    caller_id: 'u7',
    call_time: '2026-09-17T11:00:00Z',
    remarks: 'Client in a meeting; asked to call back after 4 PM.',
    callback_time: '2026-09-17T16:00:00Z',
  },
  {
    id: 'C-4016',
    party_name: 'Manoj Khare',
    party_id: 'p18',
    phone: '+91 9812300010',
    call_type: 'OUTBOUND',
    duration_minutes: 7,
    outcome: 'CONNECTED',
    caller_name: 'Ravi Mehta',
    caller_id: 'u3',
    call_time: '2026-09-16T12:10:00Z',
    remarks: 'Finalized viewing schedule for Vijay Nagar Complex flat.',
  },
  {
    id: 'C-4017',
    party_name: 'Vijay Patil',
    party_id: 'p20',
    phone: '+91 9812300012',
    call_type: 'INBOUND',
    duration_minutes: 15,
    outcome: 'CONNECTED',
    caller_name: 'Neha Kapoor',
    caller_id: 'u2',
    call_time: '2026-09-15T16:45:00Z',
    remarks: 'Negotiated payment milestone flexibility for Emerald View booking.',
  },
  {
    id: 'C-4018',
    party_name: 'Kavya Singh',
    party_id: 'p21',
    phone: '+91 9812300013',
    call_type: 'OUTBOUND',
    duration_minutes: 3,
    outcome: 'BUSY',
    caller_name: 'Sanjay Verma',
    caller_id: 'u7',
    call_time: '2026-09-15T10:30:00Z',
    remarks: 'Line busy. Scheduled automatic retry for afternoon.',
  },
  {
    id: 'C-4019',
    party_name: 'Ritu Gupta',
    party_id: 'p23',
    phone: '+91 9812300015',
    call_type: 'OUTBOUND',
    duration_minutes: 8,
    outcome: 'CONNECTED',
    caller_name: 'Amit Patel',
    caller_id: 'u6',
    call_time: '2026-09-14T14:15:00Z',
    remarks: 'Explained SBI Home Loan processing fees and eligibility for Navlakha purchase.',
  },
  {
    id: 'C-4020',
    party_name: 'Meera Pandey',
    party_id: 'p25',
    phone: '+91 9812300017',
    call_type: 'INBOUND',
    duration_minutes: 10,
    outcome: 'CONNECTED',
    caller_name: 'Priya Sharma',
    caller_id: 'u5',
    call_time: '2026-09-13T10:00:00Z',
    remarks: 'Confirmed interest in 3BHK Annapurna Towers after viewing brochure.',
  },
  {
    id: 'C-4021',
    party_name: 'Nilesh Shah',
    party_id: 'p26',
    phone: '+91 9812300018',
    call_type: 'OUTBOUND',
    duration_minutes: 16,
    outcome: 'CONNECTED',
    caller_name: 'Neha Kapoor',
    caller_id: 'u2',
    call_time: '2026-09-12T13:45:00Z',
    remarks: 'Commercial lease agreement review — clauses 4 and 8 discussed.',
  },
  {
    id: 'C-4022',
    party_name: 'Ashok Tripathi',
    party_id: 'p28',
    phone: '+91 9812300020',
    call_type: 'OUTBOUND',
    duration_minutes: 2,
    outcome: 'NO_ANSWER',
    caller_name: 'Sanjay Verma',
    caller_id: 'u7',
    call_time: '2026-09-11T11:20:00Z',
    remarks: 'No answer on 2 attempts. Will retry tomorrow morning.',
  },
  {
    id: 'C-4023',
    party_name: 'Pooja Mishra',
    party_id: 'p31',
    phone: '+91 9812300023',
    call_type: 'OUTBOUND',
    duration_minutes: 6,
    outcome: 'CONNECTED',
    caller_name: 'Ravi Mehta',
    caller_id: 'u3',
    call_time: '2026-09-10T15:10:00Z',
    remarks: 'Answered questions regarding water connection and lift generator backup.',
  },
  {
    id: 'C-4024',
    party_name: 'Deepika Pandey',
    party_id: 'p33',
    phone: '+91 9812300025',
    call_type: 'INBOUND',
    duration_minutes: 5,
    outcome: 'CONNECTED',
    caller_name: 'Priya Sharma',
    caller_id: 'u5',
    call_time: '2026-09-09T16:30:00Z',
    remarks: 'Confirmed move-in date for 1st of next month; rental agreement requested.',
  },
  {
    id: 'C-4025',
    party_name: 'Bhavna Jain',
    party_id: 'p37',
    phone: '+91 9812300029',
    call_type: 'OUTBOUND',
    duration_minutes: 12,
    outcome: 'CONNECTED',
    caller_name: 'Neha Kapoor',
    caller_id: 'u2',
    call_time: '2026-09-08T11:00:00Z',
    remarks: 'Finalized token deposit schedule for Signature Park apartment purchase.',
  },
  {
    id: 'C-4026',
    party_name: 'Dinesh Kumar',
    party_id: 'p40',
    phone: '+91 9812300032',
    call_type: 'OUTBOUND',
    duration_minutes: 7,
    outcome: 'CONNECTED',
    caller_name: 'Amit Patel',
    caller_id: 'u6',
    call_time: '2026-09-07T09:45:00Z',
    remarks: 'Confirmed plot survey timing with Patwari at Dewas Naka location.',
  },
  {
    id: 'C-4027',
    party_name: 'Rohit Bansal',
    party_id: 'p44',
    phone: '+91 9812300036',
    call_type: 'INBOUND',
    duration_minutes: 18,
    outcome: 'CONNECTED',
    caller_name: 'Ravi Mehta',
    caller_id: 'u3',
    call_time: '2026-09-06T14:00:00Z',
    remarks: 'Detailed discussion on floor plan modifications and car park allocation.',
  },
  {
    id: 'C-4028',
    party_name: 'Raghav Dixit',
    party_id: 'p50',
    phone: '+91 9812300042',
    call_type: 'OUTBOUND',
    duration_minutes: 22,
    outcome: 'CONNECTED',
    caller_name: 'Neha Kapoor',
    caller_id: 'u2',
    call_time: '2026-09-05T15:30:00Z',
    remarks: 'High-value institutional investor consultation for Super Corridor IT park.',
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
  },
  {
    id: 'REC-1005',
    created_at: '2026-09-16T11:45:00Z',
    party_id: 'p9',
    party_name: 'Anil Sharma',
    party_phone: '+91 9812300001',
    duration_seconds: 64,
    duration_formatted: '1:04',
    sentiment: 'Interested',
    summary: 'Priya called buyer Anil Sharma regarding Crystal Towers 3BHK flat. The asking price is 62 lakhs and the client expressed strong interest in a Sunday morning viewing.',
    transcript: 'Agent: Good afternoon Anil ji, Priya here from PropDesk. The 3BHK in Scheme 140 at Crystal Towers has just come on market at 62 lakhs. Client: Hi Priya, 62 lakhs sounds reasonable. Does it include covered parking? Agent: Yes, one covered parking included. Client: Great, let us visit this Sunday at 11 AM.',
    rates: [
      { mention: 'asking price', amount: '62 lakhs', context: 'Crystal Towers 3BHK with covered parking' }
    ],
    next_action: 'Block agent calendar for Sunday 11 AM visit and inform society security.',
    uploaded_by_id: 'u5',
    uploaded_by_name: 'Priya Sharma',
    file_name: 'anil_sharma_crystal_towers.wav'
  },
  {
    id: 'REC-1006',
    created_at: '2026-09-15T15:30:00Z',
    party_id: 'p20',
    party_name: 'Vijay Patil',
    party_phone: '+91 9812300012',
    duration_seconds: 95,
    duration_formatted: '1:35',
    sentiment: 'Interested',
    summary: 'Discussion regarding 4BHK Emerald View apartment at Super Corridor. Client negotiated payment schedule milestones, agreeing to ₹85 Lakhs total booking price with 10% booking advance.',
    transcript: 'Agent: Hello Vijay ji, builder agreed to adjust milestone 3 to match roof-slab casting. Final rate is 85 lakhs. Client: Perfect Neha, that gives us the cash flow buffer we needed. We will issue the 8.5 lakh token cheque tomorrow.',
    rates: [
      { mention: 'final deal price', amount: '₹85 Lakhs', context: 'all-inclusive apartment booking price' },
      { mention: 'booking advance token', amount: '₹8.5 Lakhs', context: '10% milestone deposit' }
    ],
    next_action: 'Prepare booking application form and courier to buyer residence for signature.',
    uploaded_by_id: 'u2',
    uploaded_by_name: 'Neha Kapoor',
    file_name: 'vijay_patil_emerald_view.mp3'
  },
  {
    id: 'REC-1007',
    created_at: '2026-09-14T10:15:00Z',
    party_id: 'p26',
    party_name: 'Nilesh Shah',
    party_phone: '+91 9812300018',
    duration_seconds: 110,
    duration_formatted: '1:50',
    sentiment: 'Neutral',
    summary: 'Commercial showroom purchase discussion for Metro Tower AB Road. Client asked about floor plate division, quoting ₹1.2 Crore valuation against developer quote of ₹1.25 Crore.',
    transcript: 'Agent: Mr. Shah, developer is firm on 1.25 Crore for the ground floor retail plate. Client: Look, market rate for AB Road commercial is around 1.15 to 1.2 Crore. If they meet me at 1.2 Crore, I can wire the earnest money this week.',
    rates: [
      { mention: 'developer quote', amount: '₹1.25 Crore', context: 'developer asking price' },
      { mention: 'buyer counter-offer', amount: '₹1.20 Crore', context: 'buyer formal counter-bid' }
    ],
    next_action: 'Present ₹1.20 Crore counter-bid to developer asset management committee.',
    uploaded_by_id: 'u2',
    uploaded_by_name: 'Neha Kapoor',
    file_name: 'nilesh_commercial_abroad.mp3'
  },
  {
    id: 'REC-1008',
    created_at: '2026-09-13T16:40:00Z',
    party_id: 'p47',
    party_name: 'Kirti Verma',
    party_phone: '+91 9812300039',
    duration_seconds: 52,
    duration_formatted: '0:52',
    sentiment: 'Interested',
    summary: 'Rental agreement finalization for 2BHK flat in Bhawarkua. Tenant agreed to ₹16,000/month with 2 months security deposit.',
    transcript: 'Agent: Kirti ji, owner agreed to 16,000 rent. Client: Wonderful Priya! Is the security deposit 32,000? Agent: Yes, exactly 2 months deposit. Moving date will be October 1st.',
    rates: [
      { mention: 'agreed monthly rent', amount: '₹16,000/month', context: 'residential lease monthly rental' },
      { mention: 'security deposit', amount: '₹32,000', context: 'two months refundable security deposit' }
    ],
    next_action: 'Draft 11-month rental agreement and schedule stamp duty e-registration.',
    uploaded_by_id: 'u5',
    uploaded_by_name: 'Priya Sharma',
    file_name: 'kirti_rental_agreement.wav'
  },
  {
    id: 'REC-1009',
    created_at: '2026-09-12T13:20:00Z',
    party_id: 'p32',
    party_name: 'Karan Mehta',
    party_phone: '+91 9812300024',
    duration_seconds: 40,
    duration_formatted: '0:40',
    sentiment: 'Not Interested',
    summary: 'Follow up on Dewas Naka residential plot. Client decided not to invest in Indore real estate at this time due to alternative financial investments.',
    transcript: 'Agent: Hello Karan ji, checking in regarding the Dewas Naka plots. Client: Hi Amit, thank you for following up, but I have decided to invest in equity mutual funds instead for the remainder of this fiscal year. Please close my inquiry.',
    rates: [],
    next_action: 'Mark opportunity OPP-5015 and lead as Lost in CRM.',
    uploaded_by_id: 'u6',
    uploaded_by_name: 'Amit Patel',
    file_name: 'karan_lost_call.wav'
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
  {
    id: 'T-110',
    title: 'Photograph front elevation and amenities for Palasia Heights flat',
    task_type: 'Verification',
    assigned_to_name: 'Priya Sharma',
    assigned_to_id: 'u5',
    due_date: '2026-09-22T14:00:00Z',
    priority: 'HIGH',
    status: 'TODO',
    linked_record_type: 'Property',
    linked_record_id: 'P-1013',
    linked_record_label: 'Property P-1013',
    description: 'Capture 8+ pictures of living area, kitchen, balcony, and lobby.',
    created_at: '2026-09-19T10:00:00Z',
  },
  {
    id: 'T-111',
    title: 'Verify RERA registration status for Signature Park building',
    task_type: 'Verification',
    assigned_to_name: 'Aman Desai',
    assigned_to_id: 'u1',
    due_date: '2026-09-21T16:00:00Z',
    priority: 'CRITICAL',
    status: 'IN_PROGRESS',
    linked_record_type: 'Property',
    linked_record_id: 'P-1009',
    linked_record_label: 'Property P-1009',
    description: 'Confirm builder compliance with MP-RERA quarterly progress filings.',
    created_at: '2026-09-18T11:00:00Z',
  },
  {
    id: 'T-112',
    title: 'Draft sale agreement and payment milestone chart for Signature Park 3BHK',
    task_type: 'Documentation',
    assigned_to_name: 'Neha Kapoor',
    assigned_to_id: 'u2',
    due_date: '2026-09-21T12:00:00Z',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    linked_record_type: 'Opportunity',
    linked_record_id: 'OPP-5008',
    linked_record_label: 'Opportunity OPP-5008',
    description: 'Prepare agreement for Bhavna Jain and Meena Builder.',
    created_at: '2026-09-18T14:00:00Z',
  },
  {
    id: 'T-113',
    title: 'Collect electricity and water clearance bills from Suresh Agrawal',
    task_type: 'Documentation',
    assigned_to_name: 'Amit Patel',
    assigned_to_id: 'u6',
    due_date: '2026-09-23T15:00:00Z',
    priority: 'MEDIUM',
    status: 'TODO',
    linked_record_type: 'Property',
    linked_record_id: 'P-1013',
    linked_record_label: 'Property P-1013',
    description: 'Obtain last 3 paid utility receipts prior to tenant agreement.',
    created_at: '2026-09-17T09:00:00Z',
  },
  {
    id: 'T-114',
    title: 'Perform site survey and measure boundary width at Bicholi Mardana plot',
    task_type: 'Verification',
    assigned_to_name: 'Amit Patel',
    assigned_to_id: 'u6',
    due_date: '2026-09-17T11:00:00Z',
    priority: 'HIGH',
    status: 'OVERDUE',
    linked_record_type: 'Property',
    linked_record_id: 'P-1015',
    linked_record_label: 'Property P-1015',
    description: 'Confirm 30-foot front approach road width matches town planning master layout.',
    created_at: '2026-09-15T09:30:00Z',
  },
  {
    id: 'T-115',
    title: 'Prepare comparative market analysis report for corporate office lease',
    task_type: 'Internal',
    assigned_to_name: 'Priya Sharma',
    assigned_to_id: 'u5',
    due_date: '2026-09-24T17:00:00Z',
    priority: 'LOW',
    status: 'TODO',
    linked_record_type: 'Requirement',
    linked_record_id: 'R-2014',
    linked_record_label: 'Requirement R-2014',
    description: 'Compile per sqft rent analysis for MG Towers vs Orbit Tower for Sonal Joshi.',
    created_at: '2026-09-18T15:00:00Z',
  },
  {
    id: 'T-116',
    title: 'Review and reconcile monthly brokerage ledger with bank statements',
    task_type: 'Admin',
    assigned_to_name: 'Aman Desai',
    assigned_to_id: 'u1',
    due_date: '2026-09-25T18:00:00Z',
    priority: 'HIGH',
    status: 'TODO',
    linked_record_type: null,
    linked_record_id: null,
    linked_record_label: null,
    description: 'Reconcile Q3 commission collections against GST filing thresholds.',
    created_at: '2026-09-18T10:00:00Z',
  },
  {
    id: 'T-117',
    title: 'Submit tenant police verification form for Bhawarkua flat',
    task_type: 'Documentation',
    assigned_to_name: 'Priya Sharma',
    assigned_to_id: 'u5',
    due_date: '2026-09-19T13:00:00Z',
    priority: 'CRITICAL',
    status: 'DONE',
    linked_record_type: 'Opportunity',
    linked_record_id: 'OPP-5024',
    linked_record_label: 'Opportunity OPP-5024',
    description: 'Submitted tenant verification at Bhanwarkuan Police Station; receipt filed.',
    created_at: '2026-09-16T14:00:00Z',
  },
  {
    id: 'T-118',
    title: 'Verify lift annual maintenance contract for Navlakha Apartments',
    task_type: 'Verification',
    assigned_to_name: 'Sanjay Verma',
    assigned_to_id: 'u7',
    due_date: '2026-09-20T12:00:00Z',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    linked_record_type: 'Property',
    linked_record_id: 'P-1017',
    linked_record_label: 'Property P-1017',
    description: 'Check society Otis AMC certificate validity before closing sale.',
    created_at: '2026-09-16T10:30:00Z',
  },
  {
    id: 'T-119',
    title: 'Onboard Shree Balaji Realty Advisors onto partner commission portal',
    task_type: 'Admin',
    assigned_to_name: 'Neha Kapoor',
    assigned_to_id: 'u2',
    due_date: '2026-09-15T15:00:00Z',
    priority: 'MEDIUM',
    status: 'DONE',
    linked_record_type: null,
    linked_record_id: 'RP-101',
    linked_record_label: 'Partner RP-101',
    description: 'Issued referral code REF-BALAJI and shared commission rate card.',
    created_at: '2026-09-12T11:00:00Z',
  },
  {
    id: 'T-120',
    title: 'Conduct fire NOC inspection at Orbit Tower commercial unit',
    task_type: 'Verification',
    assigned_to_name: 'Ravi Mehta',
    assigned_to_id: 'u3',
    due_date: '2026-09-23T11:00:00Z',
    priority: 'HIGH',
    status: 'TODO',
    linked_record_type: 'Property',
    linked_record_id: 'P-1018',
    linked_record_label: 'Property P-1018',
    description: 'Verify sprinkler system and emergency exit stairwell clearance.',
    created_at: '2026-09-17T14:30:00Z',
  },
  {
    id: 'T-121',
    title: 'Deliver physical registry deed copy to Vikram Singh',
    task_type: 'Documentation',
    assigned_to_name: 'Ravi Mehta',
    assigned_to_id: 'u3',
    due_date: '2026-09-18T16:00:00Z',
    priority: 'MEDIUM',
    status: 'DONE',
    linked_record_type: 'Opportunity',
    linked_record_id: 'OPP-5001',
    linked_record_label: 'Opportunity OPP-5001',
    description: 'Delivered attested sale deed copy to client and obtained signature confirmation.',
    created_at: '2026-09-17T11:00:00Z',
  },
  {
    id: 'T-122',
    title: 'Coordinate professional cleaning and painting for Geeta Colony flat',
    task_type: 'Internal',
    assigned_to_name: 'Sunita Rao',
    assigned_to_id: 'u9',
    due_date: '2026-09-22T18:00:00Z',
    priority: 'LOW',
    status: 'IN_PROGRESS',
    linked_record_type: 'Property',
    linked_record_id: 'P-1030',
    linked_record_label: 'Property P-1030',
    description: 'Ensure deep cleaning is complete before new tenant check-in.',
    created_at: '2026-09-18T13:00:00Z',
  },
  {
    id: 'T-123',
    title: 'Update listing photos and floor plan diagrams for AB Road Residency',
    task_type: 'Documentation',
    assigned_to_name: 'Rajesh Nair',
    assigned_to_id: 'u8',
    due_date: '2026-09-24T14:00:00Z',
    priority: 'MEDIUM',
    status: 'TODO',
    linked_record_type: 'Property',
    linked_record_id: 'P-1038',
    linked_record_label: 'Property P-1038',
    description: 'Upload high-res HDR gallery photos and architectural floor CAD.',
    created_at: '2026-09-19T09:30:00Z',
  },
  {
    id: 'T-124',
    title: 'Audit telemarketing agent call dispositions and conversion metrics',
    task_type: 'Admin',
    assigned_to_name: 'Aman Desai',
    assigned_to_id: 'u1',
    due_date: '2026-09-26T17:00:00Z',
    priority: 'MEDIUM',
    status: 'TODO',
    linked_record_type: null,
    linked_record_id: null,
    linked_record_label: null,
    description: 'Review weekly telecalling stats and lead generation rate against benchmarks.',
    created_at: '2026-09-20T08:30:00Z',
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
  {
    id: 'ACT-919',
    activity_type: 'VISIT',
    title: 'Site visit completed for Anil Sharma',
    description: 'Conducted physical inspection of Crystal Towers 3BHK flat P-1026 in Scheme 140.',
    actor_name: 'Priya Sharma',
    actor_role: 'Field Agent',
    timestamp: '2026-09-20T11:45:00Z',
    linked_entity_type: 'Property',
    linked_entity_id: 'P-1026',
  },
  {
    id: 'ACT-920',
    activity_type: 'CALL',
    title: 'Call logged with Anil K. Sharma',
    description: 'Detailed discussion on Super Corridor plot F-52 infrastructure connectivity.',
    actor_name: 'Ravi Mehta',
    actor_role: 'Field Agent',
    timestamp: '2026-09-19T14:30:00Z',
    linked_entity_type: 'Lead',
    linked_entity_id: 'L-1012',
  },
  {
    id: 'ACT-921',
    activity_type: 'WHATSAPP',
    title: 'Digital brochures shared via WhatsApp',
    description: 'Sent photos and layout PDF for Palasia Heights 2BHK to Priya Tiwari.',
    actor_name: 'Priya Sharma',
    actor_role: 'Field Agent',
    timestamp: '2026-09-19T13:10:00Z',
    linked_entity_type: 'Requirement',
    linked_entity_id: 'R-2011',
  },
  {
    id: 'ACT-922',
    activity_type: 'STATUS_CHANGE',
    title: 'Opportunity OPP-5008 marked WON',
    description: 'Bhavna Jain finalized Signature Park 3BHK apartment purchase for ₹72 Lakhs.',
    actor_name: 'Priya Sharma',
    actor_role: 'Field Agent',
    timestamp: '2026-09-18T16:00:00Z',
    linked_entity_type: 'Opportunity',
    linked_entity_id: 'OPP-5008',
  },
  {
    id: 'ACT-923',
    activity_type: 'MEETING',
    title: 'In-office negotiation with Meena Builder',
    description: 'Agreed on milestone-based payment schedule and 1 covered parking inclusion.',
    actor_name: 'Aman Desai',
    actor_role: 'Super Admin',
    timestamp: '2026-09-18T14:30:00Z',
    linked_entity_type: 'Opportunity',
    linked_entity_id: 'OPP-5008',
  },
  {
    id: 'ACT-924',
    activity_type: 'PROPERTY_SHARE',
    title: 'Shared commercial portfolio with Rakesh Chouhan',
    description: 'Dispatched curated shortlist of 3 high-yield commercial properties on AB Road and MG Road.',
    actor_name: 'Neha Kapoor',
    actor_role: 'Office Executive',
    timestamp: '2026-09-18T11:00:00Z',
    linked_entity_type: 'Requirement',
    linked_entity_id: 'R-2013',
  },
  {
    id: 'ACT-925',
    activity_type: 'STATUS_CHANGE',
    title: 'Opportunity OPP-5012 marked WON',
    description: 'Geeta Malviya closed Navlakha 2BHK flat sale for ₹36 Lakhs.',
    actor_name: 'Amit Patel',
    actor_role: 'Field Agent',
    timestamp: '2026-09-19T14:00:00Z',
    linked_entity_type: 'Opportunity',
    linked_entity_id: 'OPP-5012',
  },
  {
    id: 'ACT-926',
    activity_type: 'EMAIL',
    title: 'Draft agreement emailed to Geeta Malviya',
    description: 'Sent sale agreement draft, list of required identity documents, and payment milestones.',
    actor_name: 'Neha Kapoor',
    actor_role: 'Office Executive',
    timestamp: '2026-09-18T17:15:00Z',
    linked_entity_type: 'Lead',
    linked_entity_id: 'L-1014',
  },
  {
    id: 'ACT-927',
    activity_type: 'VISIT',
    title: 'Site visit completed for Sonal Joshi',
    description: 'Conducted inspection of Orbit Tower 2nd floor commercial office unit P-1018.',
    actor_name: 'Sanjay Verma',
    actor_role: 'Field Agent',
    timestamp: '2026-09-17T17:30:00Z',
    linked_entity_type: 'Property',
    linked_entity_id: 'P-1018',
  },
  {
    id: 'ACT-928',
    activity_type: 'FOLLOWUP',
    title: 'Follow-up call with Manoj Khare',
    description: 'Discussed Vijay Nagar Complex flat vs Bicholi Prime pricing comparison.',
    actor_name: 'Ravi Mehta',
    actor_role: 'Field Agent',
    timestamp: '2026-09-17T12:00:00Z',
    linked_entity_type: 'Lead',
    linked_entity_id: 'L-1017',
  },
  {
    id: 'ACT-929',
    activity_type: 'STATUS_CHANGE',
    title: 'Opportunity OPP-5016 marked WON',
    description: 'Vijay Patil closed Emerald View 4BHK booking at Super Corridor for ₹85 Lakhs.',
    actor_name: 'Neha Kapoor',
    actor_role: 'Office Executive',
    timestamp: '2026-09-17T15:00:00Z',
    linked_entity_type: 'Opportunity',
    linked_entity_id: 'OPP-5016',
  },
  {
    id: 'ACT-930',
    activity_type: 'CALL',
    title: 'Telecalling outbound to Vijay Patil',
    description: 'Negotiated payment milestone adjustment directly with buyer.',
    actor_name: 'Neha Kapoor',
    actor_role: 'Office Executive',
    timestamp: '2026-09-16T16:45:00Z',
    linked_entity_type: 'Opportunity',
    linked_entity_id: 'OPP-5016',
  },
  {
    id: 'ACT-931',
    activity_type: 'TASK',
    title: 'Police verification submitted for Kirti Verma',
    description: 'Submitted tenant verification papers at Bhanwarkuan Police Station for Bhawarkua 2BHK.',
    actor_name: 'Priya Sharma',
    actor_role: 'Field Agent',
    timestamp: '2026-09-16T14:00:00Z',
    linked_entity_type: 'Opportunity',
    linked_entity_id: 'OPP-5024',
  },
  {
    id: 'ACT-932',
    activity_type: 'STATUS_CHANGE',
    title: 'Opportunity OPP-5024 marked WON',
    description: 'Kirti Verma signed 11-month lease for Bhawarkua flat P-1065 at ₹16,000/month.',
    actor_name: 'Priya Sharma',
    actor_role: 'Field Agent',
    timestamp: '2026-09-16T12:00:00Z',
    linked_entity_type: 'Opportunity',
    linked_entity_id: 'OPP-5024',
  },
  {
    id: 'ACT-933',
    activity_type: 'PROPERTY_SHARE',
    title: 'Shared Annapurna Towers flat brochure with Meera Pandey',
    description: 'Sent WhatsApp brochure and floor layout of B-803 Annapurna Towers to client.',
    actor_name: 'Priya Sharma',
    actor_role: 'Field Agent',
    timestamp: '2026-09-15T15:30:00Z',
    linked_entity_type: 'Requirement',
    linked_entity_id: 'R-2019',
  },
  {
    id: 'ACT-934',
    activity_type: 'STATUS_CHANGE',
    title: 'Opportunity OPP-5020 marked WON',
    description: 'Nilesh Shah purchased Metro Tower ground floor commercial showroom for ₹1.2 Crore.',
    actor_name: 'Neha Kapoor',
    actor_role: 'Office Executive',
    timestamp: '2026-09-14T11:00:00Z',
    linked_entity_type: 'Opportunity',
    linked_entity_id: 'OPP-5020',
  },
  {
    id: 'ACT-935',
    activity_type: 'MEETING',
    title: 'Final closing meeting for Nilesh Shah',
    description: 'Owner Mukesh Trivedi and buyer Nilesh Shah executed memorandum of understanding.',
    actor_name: 'Aman Desai',
    actor_role: 'Super Admin',
    timestamp: '2026-09-14T10:00:00Z',
    linked_entity_type: 'Opportunity',
    linked_entity_id: 'OPP-5020',
  },
  {
    id: 'ACT-936',
    activity_type: 'VISIT',
    title: 'Structural verification at IT Tower 3',
    description: 'Inspected building construction quality and elevator installation on Super Corridor.',
    actor_name: 'Ravi Mehta',
    actor_role: 'Field Agent',
    timestamp: '2026-09-14T16:00:00Z',
    linked_entity_type: 'Property',
    linked_entity_id: 'P-1069',
  },
  {
    id: 'ACT-937',
    activity_type: 'WHATSAPP',
    title: 'Follow-up message sent to Pooja Mishra',
    description: 'Answered query regarding borewell water connection and society security guards.',
    actor_name: 'Ravi Mehta',
    actor_role: 'Field Agent',
    timestamp: '2026-09-13T16:20:00Z',
    linked_entity_type: 'Lead',
    linked_entity_id: 'L-1024',
  },
  {
    id: 'ACT-938',
    activity_type: 'CALL',
    title: 'Discovery call with Deepika Pandey',
    description: 'Qualified move-in timeline for October 1st and scheduled rental property viewing.',
    actor_name: 'Priya Sharma',
    actor_role: 'Field Agent',
    timestamp: '2026-09-13T11:45:00Z',
    linked_entity_type: 'Lead',
    linked_entity_id: 'L-1026',
  },
  {
    id: 'ACT-939',
    activity_type: 'STATUS_CHANGE',
    title: 'Opportunity OPP-5015 marked LOST',
    description: 'Karan Mehta opted out of Dewas Naka plot purchase; investing in alternative assets.',
    actor_name: 'Amit Patel',
    actor_role: 'Field Agent',
    timestamp: '2026-09-12T15:00:00Z',
    linked_entity_type: 'Opportunity',
    linked_entity_id: 'OPP-5015',
  },
  {
    id: 'ACT-940',
    activity_type: 'EMAIL',
    title: 'Partner portal login details sent to RP-102',
    description: 'Onboarded Apex Prime Infra Network to partner network; issued referral code REF-APEX.',
    actor_name: 'Neha Kapoor',
    actor_role: 'Office Executive',
    timestamp: '2026-09-12T11:30:00Z',
    linked_entity_type: 'Party',
    linked_entity_id: 'p7',
  },
  {
    id: 'ACT-941',
    activity_type: 'VISIT',
    title: 'Site visit conducted at Khandwa Road Towers',
    description: 'Showed 2BHK flat P-1064 to Pooja Mishra and spouse.',
    actor_name: 'Ravi Mehta',
    actor_role: 'Field Agent',
    timestamp: '2026-09-11T12:00:00Z',
    linked_entity_type: 'Property',
    linked_entity_id: 'P-1064',
  },
  {
    id: 'ACT-942',
    activity_type: 'CALL',
    title: 'Inbound call from Bhavna Jain',
    description: 'Buyer confirmed readiness to submit token payment for Signature Park flat.',
    actor_name: 'Neha Kapoor',
    actor_role: 'Office Executive',
    timestamp: '2026-09-10T14:15:00Z',
    linked_entity_type: 'Lead',
    linked_entity_id: 'L-1028',
  },
  {
    id: 'ACT-943',
    activity_type: 'STATUS_CHANGE',
    title: 'Lead L-1042 converted to Opportunity',
    description: 'Bhavna Jain qualified and converted to OPP-5008 for Super Corridor purchase.',
    actor_name: 'Neha Kapoor',
    actor_role: 'Office Executive',
    timestamp: '2026-09-10T11:00:00Z',
    linked_entity_type: 'Lead',
    linked_entity_id: 'L-1042',
  },
  {
    id: 'ACT-944',
    activity_type: 'FOLLOWUP',
    title: 'Follow-up with Dinesh Kumar on plot survey',
    description: 'Coordinated meeting with revenue surveyor for Dewas Naka residential plot D-45.',
    actor_name: 'Amit Patel',
    actor_role: 'Field Agent',
    timestamp: '2026-09-09T10:00:00Z',
    linked_entity_type: 'Requirement',
    linked_entity_id: 'R-2029',
  },
  {
    id: 'ACT-945',
    activity_type: 'PROPERTY_SHARE',
    title: 'Shared AB Road penthouse details with Rohit Bansal',
    description: 'Sent photos, floor plan, and video tour of C-1201 AB Road Residency.',
    actor_name: 'Ravi Mehta',
    actor_role: 'Field Agent',
    timestamp: '2026-09-08T16:00:00Z',
    linked_entity_type: 'Requirement',
    linked_entity_id: 'R-2032',
  },
  {
    id: 'ACT-946',
    activity_type: 'VISIT',
    title: 'Viewing conducted at AB Road Residency',
    description: 'Accompanied Rohit Bansal and architect through C-1201 penthouse.',
    actor_name: 'Ravi Mehta',
    actor_role: 'Field Agent',
    timestamp: '2026-09-08T17:30:00Z',
    linked_entity_type: 'Property',
    linked_entity_id: 'P-1038',
  },
  {
    id: 'ACT-947',
    activity_type: 'CALL',
    title: 'Outbound consultation with Raghav Dixit',
    description: 'Reviewed financial IRR and lease-back projections for IT Tower 3 floors.',
    actor_name: 'Neha Kapoor',
    actor_role: 'Office Executive',
    timestamp: '2026-09-07T15:30:00Z',
    linked_entity_type: 'Lead',
    linked_entity_id: 'L-1037',
  },
  {
    id: 'ACT-948',
    activity_type: 'STATUS_CHANGE',
    title: 'Opportunity OPP-5021 marked LOST',
    description: 'Yogesh Thakur cancelled purchase due to out-of-state corporate transfer.',
    actor_name: 'Sanjay Verma',
    actor_role: 'Field Agent',
    timestamp: '2026-09-06T14:00:00Z',
    linked_entity_type: 'Opportunity',
    linked_entity_id: 'OPP-5021',
  },
  {
    id: 'ACT-949',
    activity_type: 'WHATSAPP',
    title: 'WhatsApp message sent to Jitendra Solanki',
    description: 'Shared Google Maps location pin and layout plan for Dewas Naka plots.',
    actor_name: 'Amit Patel',
    actor_role: 'Field Agent',
    timestamp: '2026-09-05T11:20:00Z',
    linked_entity_type: 'Lead',
    linked_entity_id: 'L-1034',
  },
  {
    id: 'ACT-950',
    activity_type: 'TASK',
    title: 'Title deed search completed at Sub-Registrar Office',
    description: 'Completed 30-year non-encumbrance certificate search for Super Corridor plot.',
    actor_name: 'Aman Desai',
    actor_role: 'Super Admin',
    timestamp: '2026-09-04T16:00:00Z',
    linked_entity_type: 'Property',
    linked_entity_id: 'P-1008',
  },
  {
    id: 'ACT-951',
    activity_type: 'EMAIL',
    title: 'Monthly newsletter dispatched to 450 contacts',
    description: 'Distributed Indore Real Estate September Market Trends report.',
    actor_name: 'Neha Kapoor',
    actor_role: 'Office Executive',
    timestamp: '2026-09-03T09:00:00Z',
    linked_entity_type: 'Party',
    linked_entity_id: 'p1',
  },
  {
    id: 'ACT-952',
    activity_type: 'VISIT',
    title: 'Initial verification visit at Palasia Heights',
    description: 'Verified owner documentation, electrical fittings, and keys for flat P-1013.',
    actor_name: 'Priya Sharma',
    actor_role: 'Field Agent',
    timestamp: '2026-09-02T11:00:00Z',
    linked_entity_type: 'Property',
    linked_entity_id: 'P-1013',
  },
  {
    id: 'ACT-953',
    activity_type: 'CALL',
    title: 'Discovery call with Geeta Malviya',
    description: 'Captured budget constraints and preferred 2BHK floor levels in Navlakha.',
    actor_name: 'Amit Patel',
    actor_role: 'Field Agent',
    timestamp: '2026-09-01T14:00:00Z',
    linked_entity_type: 'Lead',
    linked_entity_id: 'L-1014',
  },
  {
    id: 'ACT-954',
    activity_type: 'STATUS_CHANGE',
    title: 'Property P-1013 status changed to AVAILABLE',
    description: 'Palasia Heights 2BHK flat completed verification and published to inventory.',
    actor_name: 'Neha Kapoor',
    actor_role: 'Office Executive',
    timestamp: '2026-09-01T10:00:00Z',
    linked_entity_type: 'Property',
    linked_entity_id: 'P-1013',
  },
  {
    id: 'ACT-955',
    activity_type: 'FOLLOWUP',
    title: 'Follow-up with Suresh Agrawal',
    description: 'Confirmed key handover protocol and tenant profile preferences with landlord.',
    actor_name: 'Priya Sharma',
    actor_role: 'Field Agent',
    timestamp: '2026-08-31T15:30:00Z',
    linked_entity_type: 'Party',
    linked_entity_id: 'p12',
  },
  {
    id: 'ACT-956',
    activity_type: 'WHATSAPP',
    title: 'Sent plot demarcation maps to Archana Shukla',
    description: 'Dispatched revenue sheet and survey map for Super Corridor plots.',
    actor_name: 'Ravi Mehta',
    actor_role: 'Field Agent',
    timestamp: '2026-08-30T12:00:00Z',
    linked_entity_type: 'Lead',
    linked_entity_id: 'L-1031',
  },
  {
    id: 'ACT-957',
    activity_type: 'CALL',
    title: 'Call with Nisha Kapoor on website inquiry',
    description: 'Explained differential pricing between Palasia and Geeta Bhawan residential units.',
    actor_name: 'Neha Kapoor',
    actor_role: 'Office Executive',
    timestamp: '2026-08-29T16:15:00Z',
    linked_entity_type: 'Lead',
    linked_entity_id: 'L-1036',
  },
  {
    id: 'ACT-958',
    activity_type: 'MEETING',
    title: 'Quarterly sales review meet',
    description: 'Reviewed August site visit closure conversion metrics and agent roster assignments.',
    actor_name: 'Aman Desai',
    actor_role: 'Super Admin',
    timestamp: '2026-08-28T10:00:00Z',
    linked_entity_type: 'Party',
    linked_entity_id: 'p1',
  },
  {
    id: 'ACT-959',
    activity_type: 'PROPERTY_SHARE',
    title: 'Shared commercial brochure with Bhopal Wealth Managers',
    description: 'Dispatched institutional marketing package for Sapphire Twin Tower units.',
    actor_name: 'Neha Kapoor',
    actor_role: 'Office Executive',
    timestamp: '2026-08-27T14:00:00Z',
    linked_entity_type: 'Party',
    linked_entity_id: 'p7',
  },
  {
    id: 'ACT-960',
    activity_type: 'VISIT',
    title: 'Viewing conducted at Mahalakshmi Nagar flat',
    description: 'Showed flat 301 Mahalakshmi Nagar to Deepika Pandey.',
    actor_name: 'Priya Sharma',
    actor_role: 'Field Agent',
    timestamp: '2026-08-26T15:00:00Z',
    linked_entity_type: 'Property',
    linked_entity_id: 'P-1047',
  },
  {
    id: 'ACT-961',
    activity_type: 'STATUS_CHANGE',
    title: 'Property P-1020 status changed to RENTED',
    description: 'Rajendra Nagar flat 301 leased for 11 months; deposit received.',
    actor_name: 'Neha Kapoor',
    actor_role: 'Office Executive',
    timestamp: '2026-08-25T11:00:00Z',
    linked_entity_type: 'Property',
    linked_entity_id: 'P-1020',
  },
  {
    id: 'ACT-962',
    activity_type: 'TASK',
    title: 'Photographed amenities at Green Park Rajendra Nagar',
    description: 'Uploaded high resolution photos of clubhouse, lift, and generator backup.',
    actor_name: 'Amit Patel',
    actor_role: 'Field Agent',
    timestamp: '2026-08-24T14:00:00Z',
    linked_entity_type: 'Property',
    linked_entity_id: 'P-1021',
  },
  {
    id: 'ACT-963',
    activity_type: 'CALL',
    title: 'Lead re-engagement call with Ashok Tripathi',
    description: 'Checked whether client is still considering Navlakha small flats.',
    actor_name: 'Sanjay Verma',
    actor_role: 'Field Agent',
    timestamp: '2026-08-23T11:00:00Z',
    linked_entity_type: 'Lead',
    linked_entity_id: 'L-1023',
  },
  {
    id: 'ACT-964',
    activity_type: 'WHATSAPP',
    title: 'WhatsApp broadcast to CREDAI expo attendees',
    description: 'Sent Super Corridor project launch brochure to 120 registered expo visitors.',
    actor_name: 'Neha Kapoor',
    actor_role: 'Office Executive',
    timestamp: '2026-08-22T09:30:00Z',
    linked_entity_type: 'Party',
    linked_entity_id: 'p3',
  },
  {
    id: 'ACT-965',
    activity_type: 'FOLLOWUP',
    title: 'Follow-up with Priti Kaur on Bicholi Prime',
    description: 'Provided answers regarding bank approved project codes for home loan processing.',
    actor_name: 'Sanjay Verma',
    actor_role: 'Field Agent',
    timestamp: '2026-08-21T16:00:00Z',
    linked_entity_type: 'Lead',
    linked_entity_id: 'L-1027',
  },
  {
    id: 'ACT-966',
    activity_type: 'VISIT',
    title: 'Site visit completed for Dinesh Kumar at Dewas Naka',
    description: 'Walked through residential plot layout and confirmed plot size of 1,100 sqft.',
    actor_name: 'Amit Patel',
    actor_role: 'Field Agent',
    timestamp: '2026-08-20T10:30:00Z',
    linked_entity_type: 'Property',
    linked_entity_id: 'P-1049',
  },
  {
    id: 'ACT-967',
    activity_type: 'EMAIL',
    title: 'Commission payment advice sent to field agents',
    description: 'Issued August closing commission settlement statements for Ravi Mehta and Priya Sharma.',
    actor_name: 'Aman Desai',
    actor_role: 'Super Admin',
    timestamp: '2026-08-20T17:00:00Z',
    linked_entity_type: 'Party',
    linked_entity_id: 'p1',
  },
  {
    id: 'ACT-968',
    activity_type: 'STATUS_CHANGE',
    title: 'Requirement R-2027 marked FULFILLED',
    description: 'Bhavna Jain requirement closed upon successful apartment booking.',
    actor_name: 'Neha Kapoor',
    actor_role: 'Office Executive',
    timestamp: '2026-08-22T11:00:00Z',
    linked_entity_type: 'Requirement',
    linked_entity_id: 'R-2027',
  },
  {
    id: 'ACT-969',
    activity_type: 'CALL',
    title: 'Cold outreach call to Scheme 54 property owners',
    description: 'Connected with 8 landlords; 2 requested listing valuation visits.',
    actor_name: 'Priya Sharma',
    actor_role: 'Field Agent',
    timestamp: '2026-08-21T11:30:00Z',
    linked_entity_type: 'Party',
    linked_entity_id: 'p12',
  },
  {
    id: 'ACT-970',
    activity_type: 'MEETING',
    title: 'Channel partner kickoff meet at Indore Club',
    description: 'Presented Q3 incentive structure to 12 regional real estate consultants and brokers.',
    actor_name: 'Aman Desai',
    actor_role: 'Super Admin',
    timestamp: '2026-08-20T18:00:00Z',
    linked_entity_type: 'Party',
    linked_entity_id: 'p7',
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
  {
    id: 'V-509',
    property_id: 'P-1026',
    property_short_loc: '01-Schm140_Mayank',
    client_id: 'p9',
    client_name: 'Anil Sharma',
    agent_id: 'u5',
    agent_name: 'Priya Sharma',
    purpose: 'Property Viewing',
    status: 'Scheduled',
    scheduled_date: '2026-09-22T11:00:00Z',
    instructions: 'Show Crystal Towers 3BHK flat. Key with society security guard.',
    checklist_template: 'Standard Residential',
    created_at: '2026-09-20T10:00:00Z',
  },
  {
    id: 'V-510',
    property_id: 'P-1032',
    property_short_loc: '09-Super_Corridor',
    client_id: 'p10',
    client_name: 'Anil K. Sharma',
    agent_id: 'u3',
    agent_name: 'Ravi Mehta',
    purpose: 'Verification',
    status: 'Assigned',
    scheduled_date: '2026-09-21T14:00:00Z',
    instructions: 'Verify plot peg markers F-52 with developer site engineer.',
    checklist_template: 'Standard Commercial',
    created_at: '2026-09-18T11:00:00Z',
  },
  {
    id: 'V-511',
    property_id: 'P-1013',
    property_short_loc: '10-Palasia_Priya',
    client_id: 'p11',
    client_name: 'Priya Tiwari',
    agent_id: 'u5',
    agent_name: 'Priya Sharma',
    purpose: 'Property Viewing',
    status: 'En Route',
    scheduled_date: '2026-09-20T15:00:00Z',
    instructions: 'Meet client at Palasia Heights entrance gate.',
    checklist_template: 'Standard Residential',
    created_at: '2026-09-17T12:00:00Z',
  },
  {
    id: 'V-512',
    property_id: 'P-1017',
    property_short_loc: '12-Navlakha_Sanjay',
    client_id: 'p13',
    client_name: 'Geeta Malviya',
    agent_id: 'u6',
    agent_name: 'Amit Patel',
    purpose: 'Property Viewing',
    status: 'Visit Completed',
    scheduled_date: '2026-09-18T10:30:00Z',
    submitted_date: '2026-09-18T11:45:00Z',
    instructions: 'Show B-203 Navlakha Apartments to buyer and her father.',
    checklist_template: 'Standard Residential',
    created_at: '2026-09-16T13:00:00Z',
  },
  {
    id: 'V-513',
    property_id: 'P-1054',
    property_short_loc: '05-MG_Road',
    client_id: 'p14',
    client_name: 'Rakesh Chouhan',
    agent_id: 'u3',
    agent_name: 'Ravi Mehta',
    purpose: 'Owner Meeting',
    status: 'Accepted',
    scheduled_date: '2026-09-22T16:00:00Z',
    instructions: 'Coordinate terms between investor Rakesh Chouhan and owner Kavita Sharma.',
    checklist_template: 'Owner Meeting',
    created_at: '2026-09-15T15:00:00Z',
  },
  {
    id: 'V-514',
    property_id: 'P-1018',
    property_short_loc: '13-AB_Road_Ravi',
    client_id: 'p15',
    client_name: 'Sonal Joshi',
    agent_id: 'u7',
    agent_name: 'Sanjay Verma',
    purpose: 'Property Viewing',
    status: 'Arrived',
    scheduled_date: '2026-09-20T16:30:00Z',
    instructions: 'Orbit Tower 2nd floor office viewing with corporate admin head.',
    checklist_template: 'Standard Commercial',
    created_at: '2026-09-14T14:00:00Z',
  },
  {
    id: 'V-515',
    property_id: 'P-1044',
    property_short_loc: '04-Vijay_Nagar',
    client_id: 'p18',
    client_name: 'Manoj Khare',
    agent_id: 'u3',
    agent_name: 'Ravi Mehta',
    purpose: 'Property Viewing',
    status: 'Visit Started',
    scheduled_date: '2026-09-20T17:00:00Z',
    instructions: 'Show Vijay Nagar Complex D-803.',
    checklist_template: 'Standard Residential',
    created_at: '2026-09-11T12:00:00Z',
  },
  {
    id: 'V-516',
    property_id: 'P-1024',
    property_short_loc: '09-Super_Corridor',
    client_id: 'p20',
    client_name: 'Vijay Patil',
    agent_id: 'u6',
    agent_name: 'Amit Patel',
    purpose: 'Property Viewing',
    status: 'Approved',
    scheduled_date: '2026-09-16T11:00:00Z',
    submitted_date: '2026-09-16T12:30:00Z',
    instructions: 'Walkthrough of Emerald View 4BHK with buyer family.',
    checklist_template: 'Standard Residential',
    created_at: '2026-09-09T14:00:00Z',
  },
  {
    id: 'V-517',
    property_id: 'P-1016',
    property_short_loc: '12-Navlakha_Sanjay',
    client_id: 'p21',
    client_name: 'Kavya Singh',
    agent_id: 'u7',
    agent_name: 'Sanjay Verma',
    purpose: 'Property Viewing',
    status: 'Scheduled',
    scheduled_date: '2026-09-23T11:30:00Z',
    instructions: 'Show Flat 104 Navlakha Society for single occupancy rental.',
    checklist_template: 'Standard Residential',
    created_at: '2026-09-08T15:00:00Z',
  },
  {
    id: 'V-518',
    property_id: 'P-1017',
    property_short_loc: '12-Navlakha_Sanjay',
    client_id: 'p23',
    client_name: 'Ritu Gupta',
    agent_id: 'u6',
    agent_name: 'Amit Patel',
    purpose: 'Property Viewing',
    status: 'Rejected',
    scheduled_date: '2026-09-15T15:00:00Z',
    instructions: 'Visit rejected by supervisor due to invalid checklist photos.',
    checklist_template: 'Standard Residential',
    created_at: '2026-09-06T11:00:00Z',
  },
  {
    id: 'V-519',
    property_id: 'P-1034',
    property_short_loc: '16-Annapurna_Priya',
    client_id: 'p25',
    client_name: 'Meera Pandey',
    agent_id: 'u5',
    agent_name: 'Priya Sharma',
    purpose: 'Property Viewing',
    status: 'Scheduled',
    scheduled_date: '2026-09-22T15:00:00Z',
    instructions: 'Show Annapurna Towers B-803. Key with caretaker Mr. Sharma.',
    checklist_template: 'Standard Residential',
    created_at: '2026-09-04T13:00:00Z',
  },
  {
    id: 'V-520',
    property_id: 'P-1019',
    property_short_loc: '13-AB_Road_Ravi',
    client_id: 'p26',
    client_name: 'Nilesh Shah',
    agent_id: 'u3',
    agent_name: 'Ravi Mehta',
    purpose: 'Verification',
    status: 'Approved',
    scheduled_date: '2026-09-12T14:00:00Z',
    submitted_date: '2026-09-12T15:15:00Z',
    instructions: 'Verify commercial occupancy certificate and electricity transformer rating.',
    checklist_template: 'Standard Commercial',
    created_at: '2026-09-03T14:00:00Z',
  },
  {
    id: 'V-521',
    property_id: 'P-1061',
    property_short_loc: '19-Tejaji_Sanjay',
    client_id: 'p28',
    client_name: 'Ashok Tripathi',
    agent_id: 'u7',
    agent_name: 'Sanjay Verma',
    purpose: 'Property Viewing',
    status: 'Cancelled',
    scheduled_date: '2026-09-14T10:00:00Z',
    instructions: 'Cancelled by client due to family emergency.',
    checklist_template: 'Standard Residential',
    created_at: '2026-09-01T10:00:00Z',
  },
  {
    id: 'V-522',
    property_id: 'P-1064',
    property_short_loc: '15-Khandwa_Sanjay',
    client_id: 'p31',
    client_name: 'Pooja Mishra',
    agent_id: 'u3',
    agent_name: 'Ravi Mehta',
    purpose: 'Property Viewing',
    status: 'Submitted',
    scheduled_date: '2026-09-19T11:00:00Z',
    submitted_date: '2026-09-19T12:05:00Z',
    instructions: 'Inspect Khandwa Road Towers 2BHK flat condition.',
    checklist_template: 'Standard Residential',
    created_at: '2026-08-29T13:00:00Z',
  },
  {
    id: 'V-523',
    property_id: 'P-1049',
    property_short_loc: '25-Dewas_Naka_Sanjay',
    client_id: 'p32',
    client_name: 'Karan Mehta',
    agent_id: 'u6',
    agent_name: 'Amit Patel',
    purpose: 'Verification',
    status: 'Cancelled',
    scheduled_date: '2026-08-20T10:00:00Z',
    instructions: 'Cancelled — buyer dropped out of transaction.',
    checklist_template: 'Standard Commercial',
    created_at: '2026-08-16T11:00:00Z',
  },
  {
    id: 'V-524',
    property_id: 'P-1027',
    property_short_loc: '16-Annapurna_Priya',
    client_id: 'p33',
    client_name: 'Deepika Pandey',
    agent_id: 'u5',
    agent_name: 'Priya Sharma',
    purpose: 'Property Viewing',
    status: 'Approved',
    scheduled_date: '2026-09-18T16:00:00Z',
    submitted_date: '2026-09-18T17:10:00Z',
    instructions: 'Walkthrough of Annapurna Road semi-furnished flat.',
    checklist_template: 'Standard Residential',
    created_at: '2026-08-27T15:00:00Z',
  },
  {
    id: 'V-525',
    property_id: 'P-1056',
    property_short_loc: '11-Bicholi_Amit',
    client_id: 'p35',
    client_name: 'Priti Kaur',
    agent_id: 'u7',
    agent_name: 'Sanjay Verma',
    purpose: 'Property Viewing',
    status: 'Assigned',
    scheduled_date: '2026-09-24T10:00:00Z',
    instructions: 'Show Bicholi Prime E-402 flat.',
    checklist_template: 'Standard Residential',
    created_at: '2026-08-25T11:00:00Z',
  },
  {
    id: 'V-526',
    property_id: 'P-1009',
    property_short_loc: '09-Super_Corridor',
    client_id: 'p37',
    client_name: 'Bhavna Jain',
    agent_id: 'u5',
    agent_name: 'Priya Sharma',
    purpose: 'Property Viewing',
    status: 'Approved',
    scheduled_date: '2026-09-12T11:00:00Z',
    submitted_date: '2026-09-12T12:20:00Z',
    instructions: 'Viewing for Signature Park high-rise flat.',
    checklist_template: 'Standard Residential',
    created_at: '2026-08-23T13:00:00Z',
  },
  {
    id: 'V-527',
    property_id: 'P-1065',
    property_short_loc: '22-Bhawarkua_Amit',
    client_id: 'p39',
    client_name: 'Shweta Soni',
    agent_id: 'u6',
    agent_name: 'Amit Patel',
    purpose: 'Property Viewing',
    status: 'Accepted',
    scheduled_date: '2026-09-23T16:00:00Z',
    instructions: 'Show Bhawarkua Colony flat 101.',
    checklist_template: 'Standard Residential',
    created_at: '2026-08-21T15:00:00Z',
  },
  {
    id: 'V-528',
    property_id: 'P-1049',
    property_short_loc: '25-Dewas_Naka_Sanjay',
    client_id: 'p40',
    client_name: 'Dinesh Kumar',
    agent_id: 'u6',
    agent_name: 'Amit Patel',
    purpose: 'Verification',
    status: 'Scheduled',
    scheduled_date: '2026-09-22T09:30:00Z',
    instructions: 'Verify survey demarcation on plot D-45 with municipal records.',
    checklist_template: 'Standard Commercial',
    created_at: '2026-08-20T10:00:00Z',
  },
  {
    id: 'V-529',
    property_id: 'P-1032',
    property_short_loc: '09-Super_Corridor',
    client_id: 'p41',
    client_name: 'Archana Shukla',
    agent_id: 'u3',
    agent_name: 'Ravi Mehta',
    purpose: 'Property Viewing',
    status: 'Scheduled',
    scheduled_date: '2026-09-24T14:30:00Z',
    instructions: 'Show plot F-52 Super Corridor to prospective investor.',
    checklist_template: 'Standard Commercial',
    created_at: '2026-08-19T11:00:00Z',
  },
  {
    id: 'V-530',
    property_id: 'P-1038',
    property_short_loc: '13-AB_Road_Ravi',
    client_id: 'p44',
    client_name: 'Rohit Bansal',
    agent_id: 'u3',
    agent_name: 'Ravi Mehta',
    purpose: 'Property Viewing',
    status: 'Submitted',
    scheduled_date: '2026-09-17T15:00:00Z',
    submitted_date: '2026-09-17T16:45:00Z',
    instructions: 'Premium penthouse viewing at AB Road Residency C-1201.',
    checklist_template: 'Standard Residential',
    created_at: '2026-08-16T14:00:00Z',
  },
  {
    id: 'V-531',
    property_id: 'P-1049',
    property_short_loc: '25-Dewas_Naka_Sanjay',
    client_id: 'p46',
    client_name: 'Jitendra Solanki',
    agent_id: 'u6',
    agent_name: 'Amit Patel',
    purpose: 'Verification',
    status: 'Accepted',
    scheduled_date: '2026-09-25T10:00:00Z',
    instructions: 'Re-verify boundary road width for heavy vehicle movement.',
    checklist_template: 'Standard Commercial',
    created_at: '2026-08-14T10:00:00Z',
  },
  {
    id: 'V-532',
    property_id: 'P-1065',
    property_short_loc: '22-Bhawarkua_Amit',
    client_id: 'p47',
    client_name: 'Kirti Verma',
    agent_id: 'u5',
    agent_name: 'Priya Sharma',
    purpose: 'Owner Meeting',
    status: 'Approved',
    scheduled_date: '2026-09-15T11:00:00Z',
    submitted_date: '2026-09-15T12:00:00Z',
    instructions: 'Tenant and owner agreement terms finalization meeting.',
    checklist_template: 'Owner Meeting',
    created_at: '2026-08-13T11:00:00Z',
  },
  {
    id: 'V-533',
    property_id: 'P-1014',
    property_short_loc: '10-Palasia_Priya',
    client_id: 'p49',
    client_name: 'Nisha Kapoor',
    agent_id: 'u5',
    agent_name: 'Priya Sharma',
    purpose: 'Property Viewing',
    status: 'Assigned',
    scheduled_date: '2026-09-23T14:00:00Z',
    instructions: 'Show Palasia Enclave C-302 flat to buyer.',
    checklist_template: 'Standard Residential',
    created_at: '2026-08-11T13:00:00Z',
  },
  {
    id: 'V-534',
    property_id: 'P-1069',
    property_short_loc: '09-Super_Corridor',
    client_id: 'p50',
    client_name: 'Raghav Dixit',
    agent_id: 'u3',
    agent_name: 'Ravi Mehta',
    purpose: 'Verification',
    status: 'Approved',
    scheduled_date: '2026-09-14T16:00:00Z',
    submitted_date: '2026-09-14T17:30:00Z',
    instructions: 'Inspect IT Tower 3 structural foundation and elevator shafts.',
    checklist_template: 'Standard Commercial',
    created_at: '2026-08-10T14:00:00Z',
  },
  {
    id: 'V-535',
    property_id: 'P-1052',
    property_short_loc: '01-Schm140_Mayank',
    client_id: 'p37',
    client_name: 'Bhavna Jain',
    agent_id: 'u5',
    agent_name: 'Priya Sharma',
    purpose: 'Property Viewing',
    status: 'Scheduled',
    scheduled_date: '2026-09-21T16:00:00Z',
    instructions: 'Temporary rental inspection for client waiting for flat handover.',
    checklist_template: 'Standard Residential',
    created_at: '2026-09-11T12:00:00Z',
  },
  {
    id: 'V-536',
    property_id: 'P-1014',
    property_short_loc: '10-Palasia_Priya',
    client_id: 'p9',
    client_name: 'Anil Sharma',
    agent_id: 'u3',
    agent_name: 'Ravi Mehta',
    purpose: 'Property Viewing',
    status: 'Scheduled',
    scheduled_date: '2026-09-22T17:00:00Z',
    instructions: 'Palasia Enclave alternative option inspection.',
    checklist_template: 'Standard Residential',
    created_at: '2026-09-15T10:00:00Z',
  },
  {
    id: 'V-537',
    property_id: 'P-1044',
    property_short_loc: '04-Vijay_Nagar',
    client_id: 'p4',
    client_name: 'Amit Jain',
    agent_id: 'u7',
    agent_name: 'Sanjay Verma',
    purpose: 'Property Viewing',
    status: 'Approved',
    scheduled_date: '2026-09-13T10:00:00Z',
    submitted_date: '2026-09-13T11:15:00Z',
    instructions: 'Second family viewing for Vijay Nagar 3BHK flat.',
    checklist_template: 'Standard Residential',
    created_at: '2026-09-08T09:00:00Z',
  },
  {
    id: 'V-538',
    property_id: 'P-1050',
    property_short_loc: '04-Vijay_Nagar',
    client_id: 'p3',
    client_name: 'Vikram Singh',
    agent_id: 'u6',
    agent_name: 'Amit Patel',
    purpose: 'Verification',
    status: 'Submitted',
    scheduled_date: '2026-09-19T14:30:00Z',
    submitted_date: '2026-09-19T15:40:00Z',
    instructions: 'Commercial office readiness verification.',
    checklist_template: 'Standard Commercial',
    created_at: '2026-09-16T10:00:00Z',
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
  {
    id: 'FA-05',
    user_id: 'u12',
    name: 'Mayank Joshi',
    phone: '+91 9876543212',
    status: 'Available',
    today_visit_count: 0,
    week_completed_visits: 4,
    average_rating: 4.8,
    last_known_location: 'Palasia Square, Indore',
  },
  {
    id: 'FA-06',
    user_id: 'u13',
    name: 'Rohit Malviya',
    phone: '+91 9876543213',
    status: 'Available',
    today_visit_count: 0,
    week_completed_visits: 5,
    average_rating: 4.7,
    last_known_location: 'AB Road City Center, Indore',
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
  // ── Lead Attribution & Traceability ──
  originating_lead_id?: string | null
  attributed_campaign_id?: string | null
  attributed_campaign_name?: string | null
  attributed_channel_type?: ChannelType | null
  attributed_source?: string | null
  marketing_executive_name?: string | null
  first_touch_source?: string | null
  latest_touch_source?: string | null
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
    originating_lead_id: 'L-1005',
    attributed_campaign_id: 'CMP-2026-001',
    attributed_campaign_name: 'Super Corridor Tech Hub Promotion',
    attributed_channel_type: 'Digital',
    attributed_source: 'Social Media',
    marketing_executive_name: 'Neha Kapoor',
    first_touch_source: 'Social Media (Meta Carousel Ad)',
    latest_touch_source: 'Social Media (WhatsApp Inbound)',
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
    originating_lead_id: 'L-1001',
    attributed_campaign_id: 'CMP-2026-002',
    attributed_campaign_name: 'Scheme 140 Luxury High-Rise Influx',
    attributed_channel_type: 'Digital',
    attributed_source: 'Website',
    marketing_executive_name: 'Neha Kapoor',
    first_touch_source: 'Website (Direct Inbound)',
    latest_touch_source: 'Landing Page (/lp/scheme-140)',
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
    originating_lead_id: 'L-1007',
    attributed_campaign_id: 'CMP-2026-002',
    attributed_campaign_name: 'Scheme 140 Luxury High-Rise Influx',
    attributed_channel_type: 'Digital',
    attributed_source: 'Landing Page',
    marketing_executive_name: 'Aman Desai',
    first_touch_source: 'Search/Display Ad (Google Search)',
    latest_touch_source: 'Landing Page (/landing/scheme-140-penthouses)',
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
    originating_lead_id: 'L-1010',
    attributed_campaign_id: null,
    attributed_campaign_name: null,
    attributed_channel_type: 'Digital',
    attributed_source: 'Property Portal',
    marketing_executive_name: 'Ravi Mehta',
    first_touch_source: 'Property Portal (99acres)',
    latest_touch_source: 'Property Portal (99acres Verified Owner)',
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
  {
    id: 'OPP-5008',
    property_id: 'P-1009',
    property_short_loc: '09-Super_Corridor',
    client_id: 'p37',
    client_name: 'Bhavna Jain',
    stage: 'WON',
    expected_value: 7200000,
    probability: 100,
    agent_id: 'u5',
    agent_name: 'Priya Sharma',
    originating_lead_id: 'L-1042',
    attributed_campaign_id: 'CMP-2026-001',
    attributed_campaign_name: 'Super Corridor Tech Hub Promotion',
    attributed_channel_type: 'Digital',
    attributed_source: 'Landing Page',
    marketing_executive_name: 'Aman Desai',
    first_touch_source: 'Landing Page (/landing/super-corridor)',
    latest_touch_source: 'WhatsApp Inbound',
    negotiation_history: [
      { round: 1, date: '2026-09-12', asking_price: 7400000, offer_price: 7000000, revised_offer: 7200000, remarks: 'Agreed on 72L with premium covered parking slot.' },
    ],
    created_at: '2026-09-10T11:00:00Z',
    closed_at: '2026-09-18T16:00:00Z',
  },
  {
    id: 'OPP-5009',
    property_id: 'P-1026',
    property_short_loc: '01-Schm140_Mayank',
    client_id: 'p9',
    client_name: 'Anil Sharma',
    stage: 'QUALIFIED',
    expected_value: 6200000,
    probability: 25,
    agent_id: 'u5',
    agent_name: 'Priya Sharma',
    originating_lead_id: 'L-1011',
    attributed_campaign_id: 'CMP-2026-002',
    attributed_campaign_name: 'Scheme 140 Luxury High-Rise Influx',
    attributed_channel_type: 'Digital',
    attributed_source: 'Website',
    negotiation_history: [],
    created_at: '2026-09-20T10:00:00Z',
  },
  {
    id: 'OPP-5010',
    property_id: 'P-1032',
    property_short_loc: '09-Super_Corridor',
    client_id: 'p10',
    client_name: 'Anil K. Sharma',
    stage: 'PROPERTY_SHARED',
    expected_value: 7800000,
    probability: 35,
    agent_id: 'u3',
    agent_name: 'Ravi Mehta',
    originating_lead_id: 'L-1012',
    attributed_campaign_id: 'CMP-2026-001',
    attributed_campaign_name: 'Super Corridor Tech Hub Promotion',
    attributed_channel_type: 'Offline',
    attributed_source: 'Referral Partner',
    negotiation_history: [],
    created_at: '2026-09-18T10:00:00Z',
  },
  {
    id: 'OPP-5011',
    property_id: 'P-1013',
    property_short_loc: '10-Palasia_Priya',
    client_id: 'p11',
    client_name: 'Priya Tiwari',
    stage: 'SITE_VISIT',
    expected_value: 240000,
    probability: 50,
    agent_id: 'u5',
    agent_name: 'Priya Sharma',
    originating_lead_id: 'L-1013',
    attributed_channel_type: 'Digital',
    attributed_source: 'Social Media',
    negotiation_history: [],
    created_at: '2026-09-17T11:00:00Z',
  },
  {
    id: 'OPP-5012',
    property_id: 'P-1017',
    property_short_loc: '12-Navlakha_Sanjay',
    client_id: 'p13',
    client_name: 'Geeta Malviya',
    stage: 'WON',
    expected_value: 3600000,
    probability: 100,
    agent_id: 'u6',
    agent_name: 'Amit Patel',
    originating_lead_id: 'L-1014',
    attributed_channel_type: 'Digital',
    attributed_source: 'Website',
    negotiation_history: [
      { round: 1, date: '2026-09-16', asking_price: 3700000, offer_price: 3500000, revised_offer: 3600000, remarks: 'Closing price settled at ₹36L.' },
    ],
    created_at: '2026-09-14T09:00:00Z',
    closed_at: '2026-09-19T14:00:00Z',
  },
  {
    id: 'OPP-5013',
    property_id: 'P-1054',
    property_short_loc: '05-MG_Road',
    client_id: 'p14',
    client_name: 'Rakesh Chouhan',
    stage: 'NEGOTIATION',
    expected_value: 24000000,
    probability: 70,
    agent_id: 'u2',
    agent_name: 'Neha Kapoor',
    originating_lead_id: 'L-1015',
    attributed_campaign_id: 'CMP-2026-003',
    attributed_campaign_name: 'Corporate Office Space Lease Drive',
    attributed_channel_type: 'Offline',
    attributed_source: 'Referral Drive',
    negotiation_history: [
      { round: 1, date: '2026-09-18', asking_price: 25000000, offer_price: 23000000, revised_offer: 24000000, remarks: 'Commercial office suite negotiation in progress.' },
    ],
    created_at: '2026-09-12T10:00:00Z',
  },
  {
    id: 'OPP-5014',
    property_id: 'P-1018',
    property_short_loc: '13-AB_Road_Ravi',
    client_id: 'p15',
    client_name: 'Sonal Joshi',
    stage: 'SITE_VISIT',
    expected_value: 960000,
    probability: 45,
    agent_id: 'u7',
    agent_name: 'Sanjay Verma',
    originating_lead_id: 'L-1016',
    attributed_channel_type: 'Digital',
    attributed_source: 'Property Portal',
    negotiation_history: [],
    created_at: '2026-09-13T14:00:00Z',
  },
  {
    id: 'OPP-5015',
    property_id: 'P-1049',
    property_short_loc: '25-Dewas_Naka_Sanjay',
    client_id: 'p32',
    client_name: 'Karan Mehta',
    stage: 'LOST',
    expected_value: 2500000,
    probability: 0,
    agent_id: 'u6',
    agent_name: 'Amit Patel',
    originating_lead_id: 'L-1025',
    lost_reason: 'Price Issue',
    lost_remarks: 'Buyer found lower priced plot directly from farmer without brokerage.',
    negotiation_history: [],
    created_at: '2026-08-16T10:00:00Z',
    closed_at: '2026-08-22T11:00:00Z',
  },
  {
    id: 'OPP-5016',
    property_id: 'P-1024',
    property_short_loc: '09-Super_Corridor',
    client_id: 'p20',
    client_name: 'Vijay Patil',
    stage: 'WON',
    expected_value: 8500000,
    probability: 100,
    agent_id: 'u2',
    agent_name: 'Neha Kapoor',
    originating_lead_id: 'L-1018',
    attributed_campaign_id: 'CMP-2026-001',
    attributed_campaign_name: 'Super Corridor Tech Hub Promotion',
    attributed_channel_type: 'Offline',
    attributed_source: 'Event',
    negotiation_history: [
      { round: 1, date: '2026-09-14', asking_price: 8800000, offer_price: 8300000, revised_offer: 8500000, remarks: 'Closed after CREDAI expo direct meeting.' },
    ],
    created_at: '2026-09-08T12:00:00Z',
    closed_at: '2026-09-17T15:00:00Z',
  },
  {
    id: 'OPP-5017',
    property_id: 'P-1044',
    property_short_loc: '04-Vijay_Nagar',
    client_id: 'p18',
    client_name: 'Manoj Khare',
    stage: 'DOCUMENTATION',
    expected_value: 4700000,
    probability: 85,
    agent_id: 'u3',
    agent_name: 'Ravi Mehta',
    originating_lead_id: 'L-1017',
    attributed_channel_type: 'Digital',
    attributed_source: 'WhatsApp',
    negotiation_history: [
      { round: 1, date: '2026-09-16', asking_price: 4900000, offer_price: 4500000, revised_offer: 4700000, remarks: 'Agreement for sale drafting in progress.' },
    ],
    created_at: '2026-09-10T11:00:00Z',
  },
  {
    id: 'OPP-5018',
    property_id: 'P-1017',
    property_short_loc: '12-Navlakha_Sanjay',
    client_id: 'p23',
    client_name: 'Ritu Gupta',
    stage: 'QUALIFIED',
    expected_value: 3600000,
    probability: 30,
    agent_id: 'u6',
    agent_name: 'Amit Patel',
    originating_lead_id: 'L-1020',
    attributed_campaign_id: 'CMP-2026-004',
    attributed_campaign_name: 'Vijay Nagar Landlord Onboarding Q3',
    attributed_channel_type: 'Offline',
    attributed_source: 'Hoarding',
    negotiation_history: [],
    created_at: '2026-09-06T10:00:00Z',
  },
  {
    id: 'OPP-5019',
    property_id: 'P-1034',
    property_short_loc: '16-Annapurna_Priya',
    client_id: 'p25',
    client_name: 'Meera Pandey',
    stage: 'SITE_VISIT',
    expected_value: 5800000,
    probability: 55,
    agent_id: 'u5',
    agent_name: 'Priya Sharma',
    originating_lead_id: 'L-1021',
    attributed_channel_type: 'Digital',
    attributed_source: 'Property Portal',
    negotiation_history: [],
    created_at: '2026-09-04T12:00:00Z',
  },
  {
    id: 'OPP-5020',
    property_id: 'P-1019',
    property_short_loc: '13-AB_Road_Ravi',
    client_id: 'p26',
    client_name: 'Nilesh Shah',
    stage: 'WON',
    expected_value: 12000000,
    probability: 100,
    agent_id: 'u2',
    agent_name: 'Neha Kapoor',
    originating_lead_id: 'L-1022',
    attributed_channel_type: 'Offline',
    attributed_source: 'Networking Event',
    negotiation_history: [
      { round: 1, date: '2026-09-07', asking_price: 12500000, offer_price: 11500000, revised_offer: 12000000, remarks: 'Metro Tower commercial ground floor finalized.' },
    ],
    created_at: '2026-09-02T13:00:00Z',
    closed_at: '2026-09-14T11:00:00Z',
  },
  {
    id: 'OPP-5021',
    property_id: 'P-1044',
    property_short_loc: '04-Vijay_Nagar',
    client_id: 'p42',
    client_name: 'Yogesh Thakur',
    stage: 'LOST',
    expected_value: 4700000,
    probability: 0,
    agent_id: 'u7',
    agent_name: 'Sanjay Verma',
    originating_lead_id: 'L-1032',
    lost_reason: 'Customer Decision',
    lost_remarks: 'Client postponed purchase due to job transfer out of state.',
    negotiation_history: [],
    created_at: '2026-08-06T10:00:00Z',
    closed_at: '2026-08-14T15:00:00Z',
  },
  {
    id: 'OPP-5022',
    property_id: 'P-1038',
    property_short_loc: '13-AB_Road_Ravi',
    client_id: 'p44',
    client_name: 'Rohit Bansal',
    stage: 'DOCUMENTATION',
    expected_value: 9500000,
    probability: 80,
    agent_id: 'u3',
    agent_name: 'Ravi Mehta',
    originating_lead_id: 'L-1043',
    attributed_channel_type: 'Digital',
    attributed_source: 'Property Portal',
    negotiation_history: [
      { round: 1, date: '2026-09-17', asking_price: 9800000, offer_price: 9200000, revised_offer: 9500000, remarks: 'Buyer agreed on 95L with semi-furnished fitting package.' },
    ],
    created_at: '2026-09-15T12:00:00Z',
  },
  {
    id: 'OPP-5023',
    property_id: 'P-1069',
    property_short_loc: '09-Super_Corridor',
    client_id: 'p50',
    client_name: 'Raghav Dixit',
    stage: 'NEGOTIATION',
    expected_value: 35000000,
    probability: 65,
    agent_id: 'u2',
    agent_name: 'Neha Kapoor',
    originating_lead_id: 'L-1037',
    attributed_campaign_id: 'CMP-2026-001',
    attributed_campaign_name: 'Super Corridor Tech Hub Promotion',
    attributed_channel_type: 'Offline',
    attributed_source: 'Exhibition',
    negotiation_history: [
      { round: 1, date: '2026-09-15', asking_price: 36000000, offer_price: 33000000, revised_offer: 35000000, remarks: 'Institutional investor negotiation on IT Tower floors.' },
    ],
    created_at: '2026-08-10T12:00:00Z',
  },
  {
    id: 'OPP-5024',
    property_id: 'P-1065',
    property_short_loc: '22-Bhawarkua_Amit',
    client_id: 'p47',
    client_name: 'Kirti Verma',
    stage: 'WON',
    expected_value: 192000,
    probability: 100,
    agent_id: 'u5',
    agent_name: 'Priya Sharma',
    originating_lead_id: 'L-1035',
    attributed_channel_type: 'Digital',
    attributed_source: 'WhatsApp',
    negotiation_history: [
      { round: 1, date: '2026-09-14', asking_price: 18000, offer_price: 15000, revised_offer: 16000, remarks: 'Tenant rental agreement signed at ₹16,000/mo.' },
    ],
    created_at: '2026-08-12T10:00:00Z',
    closed_at: '2026-09-16T12:00:00Z',
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
  // ── Lead Attribution & Traceability ──
  originating_lead_id?: string | null
  attributed_campaign_id?: string | null
  attributed_campaign_name?: string | null
  attributed_channel_type?: ChannelType | null
  attributed_source?: string | null
  marketing_executive_name?: string | null
  first_touch_source?: string | null
  latest_touch_source?: string | null
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
    originating_lead_id: 'L-1001',
    attributed_campaign_id: 'CMP-2026-002',
    attributed_campaign_name: 'Scheme 140 Luxury High-Rise Influx',
    attributed_channel_type: 'Digital',
    attributed_source: 'Website',
    marketing_executive_name: 'Neha Kapoor',
    first_touch_source: 'Website (Direct Inbound)',
    latest_touch_source: 'Landing Page (/lp/scheme-140)',
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
    originating_lead_id: 'L-1008',
    attributed_campaign_id: 'CMP-2026-004',
    attributed_campaign_name: 'Vijay Nagar Landlord Onboarding Q3',
    attributed_channel_type: 'Offline',
    attributed_source: 'Direct Marketing',
    marketing_executive_name: 'Neha Kapoor',
    first_touch_source: 'Direct Marketing (Door Flyer)',
    latest_touch_source: 'Direct Marketing (Telemarketing Outreach)',
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
  {
    id: 'TXN-806',
    opportunity_id: 'OPP-5008',
    property_id: 'P-1009',
    property_short_loc: '09-Super_Corridor',
    client_name: 'Bhavna Jain',
    staff_id: 'u5',
    staff_name: 'Priya Sharma',
    staff_role: 'Field Agent',
    transaction_type: 'Sale',
    transaction_value: 7200000,
    commission_pct: 1.5,
    commission_amount: 108000,
    payment_status: 'Paid',
    closed_date: '2026-09-18',
    notes: 'Full brokerage released upon agreement registration.',
    originating_lead_id: 'L-1042',
    attributed_campaign_id: 'CMP-2026-001',
    attributed_campaign_name: 'Super Corridor Tech Hub Promotion',
    attributed_channel_type: 'Digital',
    attributed_source: 'Landing Page',
  },
  {
    id: 'TXN-807',
    opportunity_id: 'OPP-5012',
    property_id: 'P-1017',
    property_short_loc: '12-Navlakha_Sanjay',
    client_name: 'Geeta Malviya',
    staff_id: 'u6',
    staff_name: 'Amit Patel',
    staff_role: 'Field Agent',
    transaction_type: 'Sale',
    transaction_value: 3600000,
    commission_pct: 2.0,
    commission_amount: 72000,
    payment_status: 'Paid',
    closed_date: '2026-09-19',
    notes: 'Navlakha 2BHK sale commission settled.',
    originating_lead_id: 'L-1014',
    attributed_channel_type: 'Digital',
    attributed_source: 'Website',
  },
  {
    id: 'TXN-808',
    opportunity_id: 'OPP-5016',
    property_id: 'P-1024',
    property_short_loc: '09-Super_Corridor',
    client_name: 'Vijay Patil',
    staff_id: 'u2',
    staff_name: 'Neha Kapoor',
    staff_role: 'Office Executive',
    transaction_type: 'Sale',
    transaction_value: 8500000,
    commission_pct: 1.5,
    commission_amount: 127500,
    payment_status: 'Paid',
    closed_date: '2026-09-17',
    notes: 'CREDAI expo buyer commission cleared.',
    originating_lead_id: 'L-1018',
    attributed_campaign_id: 'CMP-2026-001',
    attributed_campaign_name: 'Super Corridor Tech Hub Promotion',
    attributed_channel_type: 'Offline',
    attributed_source: 'Event',
  },
  {
    id: 'TXN-809',
    opportunity_id: 'OPP-5020',
    property_id: 'P-1019',
    property_short_loc: '13-AB_Road_Ravi',
    client_name: 'Nilesh Shah',
    staff_id: 'u2',
    staff_name: 'Neha Kapoor',
    staff_role: 'Office Executive',
    transaction_type: 'Sale',
    transaction_value: 12000000,
    commission_pct: 1.5,
    commission_amount: 180000,
    payment_status: 'Partial',
    closed_date: '2026-09-14',
    notes: '50% advance brokerage received (₹90k); balance on possession.',
    originating_lead_id: 'L-1022',
    attributed_channel_type: 'Offline',
    attributed_source: 'Networking Event',
  },
  {
    id: 'TXN-810',
    opportunity_id: 'OPP-5024',
    property_id: 'P-1065',
    property_short_loc: '22-Bhawarkua_Amit',
    client_name: 'Kirti Verma',
    staff_id: 'u5',
    staff_name: 'Priya Sharma',
    staff_role: 'Field Agent',
    transaction_type: 'Rent',
    transaction_value: 192000,
    commission_pct: 8.33,
    commission_amount: 16000,
    payment_status: 'Paid',
    closed_date: '2026-09-16',
    notes: 'One month rent brokerage collected upon lease signing.',
    originating_lead_id: 'L-1035',
    attributed_channel_type: 'Digital',
    attributed_source: 'WhatsApp',
  },
]

// ── Audit Log Types & Data ───────────────────────────────────────────────────

export interface AiTrail {
  original_request: string
  interpreted_intent: string
  proposed_values: Record<string, unknown>
  user_edits: Record<string, unknown>
  final_values: Record<string, unknown>
  workflow_steps?: Array<{
    action_type: string
    status: string
    record_id?: string
    label?: string
    proposed_values: Record<string, unknown>
    final_values: Record<string, unknown>
  }>
}

export interface AuditLogRow {
  id: string
  timestamp: string
  user_id: string
  user_name: string
  user_role: string
  action: 'Created' | 'Updated' | 'Deleted' | 'Status Changed' | 'Cancelled' | 'Query' | 'Clarification' | 'Failed'
  entity_type:
    | 'Property'
    | 'Requirement'
    | 'Lead'
    | 'Visit'
    | 'Opportunity'
    | 'User'
    | 'Transaction'
    | 'Marketing Config'
    | 'Follow-up'
    | 'Task'
    | 'Campaign'
    | 'General'
    | 'Workflow'
  entity_id: string
  summary: string
  details?: Record<string, any>
  ip_address?: string
  ai_assisted?: boolean
  ai_trail?: AiTrail
}

export const MOCK_AUDIT_LOGS: AuditLogRow[] = [
  {
    id: 'AUD-AI-101',
    timestamp: '2026-09-25 18:30:15',
    user_id: 'u4',
    user_name: 'Priya Sharma',
    user_role: 'AGENT',
    action: 'Created',
    entity_type: 'Lead',
    entity_id: 'L-1004',
    summary: '[AI-assisted] Created Lead L-1004 for Rajesh Kumar (via AI Assistant)',
    details: { channel: 'Offline', source: 'AI Assistant', priority: 'HIGH' },
    ip_address: '192.168.1.15',
    ai_assisted: true,
    ai_trail: {
      original_request: 'Create a lead for Rajesh Kumar, phone 9876543210, buyer, interested in 2BHK flat in Scheme 140',
      interpreted_intent: 'create_lead',
      proposed_values: {
        party_name: 'Rajesh Kumar',
        phone: '9876543210',
        lead_type: 'BUYER',
        priority: 'MEDIUM',
        assigned_to_name: 'Priya Sharma',
        remarks: 'Interested in 2BHK Scheme 140',
      },
      user_edits: {
        priority: 'HIGH',
      },
      final_values: {
        party_name: 'Rajesh Kumar',
        phone: '9876543210',
        lead_type: 'BUYER',
        priority: 'HIGH',
        assigned_to_name: 'Priya Sharma',
        remarks: 'Interested in 2BHK Scheme 140',
      },
    },
  },
  {
    id: 'AUD-WF-102',
    timestamp: '2026-09-25 17:14:22',
    user_id: 'u2',
    user_name: 'Neha Kapoor',
    user_role: 'OFFICE_EXECUTIVE',
    action: 'Created',
    entity_type: 'Follow-up',
    entity_id: 'FU-5002',
    summary: '[AI-assisted] Created Follow-up FU-5002 for Rajesh Kumar (via AI Workflow)',
    details: { workflow_request: 'Create a lead for Rajesh Kumar, assign to Priya, and schedule a follow-up for Friday about pricing', step_count: 2 },
    ip_address: '192.168.1.42',
    ai_assisted: true,
    ai_trail: {
      original_request: 'Create a lead for Rajesh Kumar, assign to Priya, and schedule a follow-up for Friday about pricing',
      interpreted_intent: 'workflow',
      proposed_values: {
        client_name: 'Rajesh Kumar',
        purpose: 'Discuss pricing',
        due_date: '2026-09-28T10:00',
        priority: 'MEDIUM',
        responsible_name: 'Priya Sharma',
      },
      user_edits: {
        priority: 'HIGH',
      },
      final_values: {
        client_name: 'Rajesh Kumar',
        purpose: 'Discuss pricing',
        due_date: '2026-09-28T10:00',
        priority: 'HIGH',
        responsible_name: 'Priya Sharma',
        entity_id: 'L-1004',
      },
      workflow_steps: [
        {
          action_type: 'create_lead',
          status: 'success',
          record_id: 'L-1004',
          label: 'Created Lead L-1004 for Rajesh Kumar',
          proposed_values: { party_name: 'Rajesh Kumar', phone: '9876543210', lead_type: 'BUYER' },
          final_values: { party_name: 'Rajesh Kumar', phone: '9876543210', lead_type: 'BUYER', priority: 'HIGH' },
        },
        {
          action_type: 'create_followup',
          status: 'success',
          record_id: 'FU-5002',
          label: 'Created Follow-up FU-5002 for Rajesh Kumar',
          proposed_values: { client_name: 'Rajesh Kumar', purpose: 'Discuss pricing', due_date: '2026-09-28T10:00' },
          final_values: { client_name: 'Rajesh Kumar', purpose: 'Discuss pricing', due_date: '2026-09-28T10:00', entity_id: 'L-1004' },
        },
      ],
    },
  },
  {
    id: 'AUD-AI-103',
    timestamp: '2026-09-25 15:40:10',
    user_id: 'u3',
    user_name: 'Ravi Mehta',
    user_role: 'AGENT',
    action: 'Created',
    entity_type: 'Requirement',
    entity_id: 'R-7001',
    summary: '[AI-assisted] Created Requirement R-7001 for Vikram Singh (BUY_SELL_FLAT / BUY) (via AI Assistant)',
    details: { min_budget: 5000000, max_budget: 7000000, matches_found: 3 },
    ip_address: '103.21.58.11',
    ai_assisted: true,
    ai_trail: {
      original_request: 'Create a requirement for Vikram Singh, 2BHK flat in Scheme 140, budget 50-70 lakhs',
      interpreted_intent: 'create_requirement',
      proposed_values: { client_name: 'Vikram Singh', category: 'BUY_SELL_FLAT', intent: 'BUY', preferred_short_locs: '01-Schm140_Mayank', min_budget: '5000000', max_budget: '7000000' },
      user_edits: {},
      final_values: { client_name: 'Vikram Singh', category: 'BUY_SELL_FLAT', intent: 'BUY', preferred_short_locs: '01-Schm140_Mayank', min_budget: '5000000', max_budget: '7000000' },
    },
  },
  {
    id: 'AUD-AI-104',
    timestamp: '2026-09-24 16:22:30',
    user_id: 'u1',
    user_name: 'Aman Desai',
    user_role: 'SUPER_ADMIN',
    action: 'Status Changed',
    entity_type: 'Opportunity',
    entity_id: 'OPP-5001',
    summary: '[AI-assisted] Updated OPP-5001 from SITE_VISIT → NEGOTIATION (via AI Assistant)',
    details: { opportunity_id: 'OPP-5001', old_stage: 'SITE_VISIT', new_stage: 'NEGOTIATION' },
    ip_address: '192.168.1.10',
    ai_assisted: true,
    ai_trail: {
      original_request: 'Move Ramesh Patel deal to negotiation stage',
      interpreted_intent: 'update_deal_stage',
      proposed_values: { opportunity_id: 'OPP-5001', new_stage: 'NEGOTIATION' },
      user_edits: { new_stage: 'NEGOTIATION' },
      final_values: { opportunity_id: 'OPP-5001', new_stage: 'NEGOTIATION' },
    },
  },
  {
    id: 'AUD-AI-105',
    timestamp: '2026-09-24 14:10:05',
    user_id: 'u4',
    user_name: 'Priya Sharma',
    user_role: 'AGENT',
    action: 'Cancelled',
    entity_type: 'Visit',
    entity_id: 'PROPOSAL-CANCELLED',
    summary: '[AI-assisted] Cancelled proposed site visit at Vijay Nagar for Amit Jain',
    details: { reason: 'User chose to reschedule manually' },
    ip_address: '192.168.1.15',
    ai_assisted: true,
    ai_trail: {
      original_request: 'Schedule a visit for Amit Jain at Vijay Nagar tomorrow',
      interpreted_intent: 'schedule_visit',
      proposed_values: { client_name: 'Amit Jain', property_short_loc: '04-Vijay_Nagar', agent_name: 'Priya Sharma', scheduled_date: '2026-09-25T11:00' },
      user_edits: {},
      final_values: {},
    },
  },
  {
    id: 'AUD-AI-106',
    timestamp: '2026-09-24 11:05:40',
    user_id: 'u3',
    user_name: 'Ravi Mehta',
    user_role: 'AGENT',
    action: 'Query',
    entity_type: 'General',
    entity_id: 'QUERY-LEADS',
    summary: '[AI-assisted] Read-only query: "How many active leads do we have?" (Found 8 leads)',
    details: { entity_queried: 'Leads', record_count: 8 },
    ip_address: '103.21.58.11',
    ai_assisted: true,
    ai_trail: {
      original_request: 'How many active leads do we have?',
      interpreted_intent: 'query_data',
      proposed_values: {},
      user_edits: {},
      final_values: {},
    },
  },
  {
    id: 'AUD-AI-107',
    timestamp: '2026-09-23 16:50:12',
    user_id: 'u2',
    user_name: 'Neha Kapoor',
    user_role: 'OFFICE_EXECUTIVE',
    action: 'Query',
    entity_type: 'General',
    entity_id: 'QUERY-PROPERTIES',
    summary: '[AI-assisted] Read-only query: "What properties are available in Scheme 140?" (Found 2 properties)',
    details: { entity_queried: 'Properties', record_count: 2 },
    ip_address: '192.168.1.42',
    ai_assisted: true,
    ai_trail: {
      original_request: 'What properties are available in Scheme 140?',
      interpreted_intent: 'query_data',
      proposed_values: {},
      user_edits: {},
      final_values: {},
    },
  },
  {
    id: 'AUD-AI-108',
    timestamp: '2026-09-23 12:30:00',
    user_id: 'u1',
    user_name: 'Aman Desai',
    user_role: 'SUPER_ADMIN',
    action: 'Created',
    entity_type: 'Task',
    entity_id: 'T-901',
    summary: '[AI-assisted] Created Task T-901 "Verify title deeds for Ravi Mehta" (via AI Assistant)',
    details: { task_type: 'Verification', priority: 'HIGH', due_date: '2026-09-27T10:00' },
    ip_address: '192.168.1.10',
    ai_assisted: true,
    ai_trail: {
      original_request: 'Create a task to verify title deeds for Ravi Mehta by Sunday',
      interpreted_intent: 'create_task',
      proposed_values: { title: 'Verify title deeds for Ravi Mehta', assigned_to_name: 'Neha Kapoor', due_date: '2026-09-27T10:00', priority: 'MEDIUM' },
      user_edits: { priority: 'HIGH' },
      final_values: { title: 'Verify title deeds for Ravi Mehta', assigned_to_name: 'Neha Kapoor', due_date: '2026-09-27T10:00', priority: 'HIGH' },
    },
  },
  {
    id: 'AUD-AI-109',
    timestamp: '2026-09-22 17:15:45',
    user_id: 'u4',
    user_name: 'Priya Sharma',
    user_role: 'AGENT',
    action: 'Clarification',
    entity_type: 'General',
    entity_id: 'CLARIFY-FIELD',
    summary: '[AI-assisted] Clarification requested: Missing client phone number for new lead',
    details: { action_type: 'create_lead', missing_fields: ['phone'] },
    ip_address: '192.168.1.15',
    ai_assisted: true,
    ai_trail: {
      original_request: 'Add a new lead for Suresh Gupta, looking for 3BHK',
      interpreted_intent: 'create_lead',
      proposed_values: { party_name: 'Suresh Gupta', lead_type: 'BUYER' },
      user_edits: {},
      final_values: {},
    },
  },
  {
    id: 'AUD-AI-110',
    timestamp: '2026-09-22 10:20:18',
    user_id: 'u3',
    user_name: 'Ravi Mehta',
    user_role: 'AGENT',
    action: 'Clarification',
    entity_type: 'General',
    entity_id: 'CLARIFY-AMBIGUOUS',
    summary: '[AI-assisted] Clarification requested: Multiple opportunities found for client "Sharma"',
    details: { action_type: 'update_deal_stage', candidates: ['OPP-5002', 'OPP-5005'] },
    ip_address: '103.21.58.11',
    ai_assisted: true,
    ai_trail: {
      original_request: 'Move Sharma\'s opportunity to won stage',
      interpreted_intent: 'update_deal_stage',
      proposed_values: { client_name: 'Sharma' },
      user_edits: {},
      final_values: {},
    },
  },
  {
    id: 'AUD-AI-111',
    timestamp: '2026-09-21 15:45:00',
    user_id: 'u1',
    user_name: 'Aman Desai',
    user_role: 'SUPER_ADMIN',
    action: 'Failed',
    entity_type: 'Opportunity',
    entity_id: 'OPP-5003',
    summary: '[AI-assisted] Action execution failed: Opportunity OPP-5003 is already closed',
    details: { error: 'Cannot transition stage on closed deal OPP-5003' },
    ip_address: '192.168.1.10',
    ai_assisted: true,
    ai_trail: {
      original_request: 'Move OPP-5003 to Documentation',
      interpreted_intent: 'update_deal_stage',
      proposed_values: { opportunity_id: 'OPP-5003', new_stage: 'DOCUMENTATION' },
      user_edits: {},
      final_values: { opportunity_id: 'OPP-5003', new_stage: 'DOCUMENTATION' },
    },
  },
  {
    id: 'AUD-AI-112',
    timestamp: '2026-09-21 11:30:00',
    user_id: 'u1',
    user_name: 'Aman Desai',
    user_role: 'SUPER_ADMIN',
    action: 'Created',
    entity_type: 'Campaign',
    entity_id: 'CMP-2026-004',
    summary: '[AI-assisted] Created Campaign CMP-2026-004 "Diwali Homes 2026" (via AI Assistant)',
    details: { type: 'Buyer Acquisition', planned_budget: 150000 },
    ip_address: '192.168.1.10',
    ai_assisted: true,
    ai_trail: {
      original_request: 'Create a campaign "Diwali Homes 2026" for Buyer Acquisition starting Oct 15 with budget 1.5 lakhs',
      interpreted_intent: 'create_campaign',
      proposed_values: { campaign_name: 'Diwali Homes 2026', type: 'Buyer Acquisition', start_date: '2026-10-15', planned_budget: '150000' },
      user_edits: {},
      final_values: { campaign_name: 'Diwali Homes 2026', type: 'Buyer Acquisition', start_date: '2026-10-15', planned_budget: '150000' },
    },
  },
  {
    id: 'AUD-AI-113',
    timestamp: '2026-09-20 14:02:11',
    user_id: 'u2',
    user_name: 'Neha Kapoor',
    user_role: 'OFFICE_EXECUTIVE',
    action: 'Cancelled',
    entity_type: 'Lead',
    entity_id: 'PROPOSAL-CANCELLED',
    summary: '[AI-assisted] Cancelled lead creation proposal: duplicate contact detected for Ramesh Patel',
    details: { reason: 'Duplicate party P-001 already has active lead' },
    ip_address: '192.168.1.42',
    ai_assisted: true,
    ai_trail: {
      original_request: 'Create a lead for Ramesh Patel, 9826011111',
      interpreted_intent: 'create_lead',
      proposed_values: { party_name: 'Ramesh Patel', phone: '9826011111', lead_type: 'BUYER' },
      user_edits: {},
      final_values: {},
    },
  },
  {
    id: 'AUD-880',
    timestamp: '2026-09-15 11:20:00',
    user_id: 'u1',
    user_name: 'Aman Desai',
    user_role: 'SUPER_ADMIN',
    action: 'Created',
    entity_type: 'Marketing Config',
    entity_id: 'cfg-ct-8',
    summary: 'Created Campaign Type: "Lead Generation"',
    details: { config_group: 'Campaign Types', name: 'Lead Generation', status: 'Active' },
    ip_address: '192.168.1.10',
  },
  {
    id: 'AUD-879',
    timestamp: '2026-09-12 16:45:00',
    user_id: 'u1',
    user_name: 'Aman Desai',
    user_role: 'SUPER_ADMIN',
    action: 'Status Changed',
    entity_type: 'Marketing Config',
    entity_id: 'src-off-13',
    summary: 'Activated Lead Source: "Referral Partner"',
    details: { config_group: 'Lead Sources', name: 'Referral Partner', new_status: 'Active' },
    ip_address: '192.168.1.10',
  },
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
    actual_spend: 68000,
    target_leads: 50,
    target_qualified_leads: 20,
    target_opportunities: 8,
    promoted_properties: ['P-1003', 'P-1008', 'P-1009'],
    participating_partner_ids: ['RP-102'],
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
    actual_spend: 94000,
    target_leads: 80,
    target_qualified_leads: 35,
    target_opportunities: 15,
    promoted_properties: ['P-1003'],
    participating_partner_ids: ['RP-101', 'RP-103'],
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
    actual_spend: 38000,
    target_leads: 30,
    target_qualified_leads: 12,
    target_opportunities: 5,
    promoted_properties: ['P-1005'],
    participating_partner_ids: ['RP-101'],
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
    actual_spend: 32000,
    target_leads: 25,
    target_qualified_leads: 18,
    target_opportunities: 10,
    promoted_properties: ['P-1001', 'P-1002'],
    participating_partner_ids: ['RP-104'],
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
  {
    id: 'CMP-2026-007',
    name: 'Bicholi & Limbodi Affordable Plot Rush',
    type: 'Lead Generation',
    status: 'Active',
    start_date: '2026-09-01',
    end_date: '2026-10-31',
    owner_id: 'u6',
    owner_name: 'Amit Patel',
    objective: 'Generate high-intent buyer inquiries for affordable plots in East Indore corridor.',
    target_audience: ['Buyers', 'Investors'],
    geography: 'Bicholi Mardana, Limbodi',
    categories: ['Residential'],
    transaction_types: ['Sale'],
    planned_budget: 75000,
    target_leads: 50,
    target_qualified_leads: 20,
    target_opportunities: 8,
    promoted_properties: ['P-1015', 'P-1022', 'P-1029'],
    created_at: '2026-08-25T10:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
  },
  {
    id: 'CMP-2026-008',
    name: 'AB Road Commercial Towers Showcase',
    type: 'Property Promotion',
    status: 'Completed',
    start_date: '2026-08-01',
    end_date: '2026-08-31',
    owner_id: 'u2',
    owner_name: 'Neha Kapoor',
    objective: 'Promote premium office units at Orbit Tower and Metro Tower to regional businesses.',
    target_audience: ['Developers', 'Investors', 'Tenants'],
    geography: 'AB Road, Indore',
    categories: ['Commercial'],
    transaction_types: ['Sale', 'Lease'],
    planned_budget: 120000,
    target_leads: 45,
    target_qualified_leads: 22,
    target_opportunities: 9,
    promoted_properties: ['P-1018', 'P-1019'],
    created_at: '2026-07-20T11:00:00Z',
    updated_at: '2026-09-01T09:00:00Z',
  },
  {
    id: 'CMP-2026-009',
    name: 'Navlakha Ready-to-Move 2BHK Blitz',
    type: 'Lead Generation',
    status: 'Active',
    start_date: '2026-09-10',
    end_date: '2026-10-10',
    owner_id: 'u7',
    owner_name: 'Sanjay Verma',
    objective: 'Target young families and first-time buyers with ready possession 2BHK inventory.',
    target_audience: ['Buyers', 'Tenants'],
    geography: 'Navlakha, Tejaji Nagar',
    categories: ['Residential'],
    transaction_types: ['Sale', 'Rent'],
    planned_budget: 50000,
    target_leads: 35,
    target_qualified_leads: 18,
    target_opportunities: 6,
    promoted_properties: ['P-1016', 'P-1017'],
    created_at: '2026-09-05T09:30:00Z',
    updated_at: '2026-09-10T09:30:00Z',
  },
  {
    id: 'CMP-2026-010',
    name: 'Palasia Luxury Penthouse Exclusive',
    type: 'Lead Generation',
    status: 'Active',
    start_date: '2026-09-05',
    end_date: '2026-10-20',
    owner_id: 'u5',
    owner_name: 'Priya Sharma',
    objective: 'Direct outreach campaign for high-value apartments and penthouses in Central Palasia.',
    target_audience: ['Buyers', 'Investors'],
    geography: 'Palasia, New Palasia',
    categories: ['Residential'],
    transaction_types: ['Sale'],
    planned_budget: 90000,
    target_leads: 30,
    target_qualified_leads: 15,
    target_opportunities: 5,
    promoted_properties: ['P-1014', 'P-1037', 'P-1048'],
    created_at: '2026-09-01T12:00:00Z',
    updated_at: '2026-09-05T12:00:00Z',
  },
  {
    id: 'CMP-2026-011',
    name: 'Industrial Corridor Pithampur Land Drive',
    type: 'Lead Generation',
    status: 'Planned',
    start_date: '2026-10-10',
    end_date: '2026-11-30',
    owner_id: 'u3',
    owner_name: 'Ravi Mehta',
    objective: 'Outreach to warehousing and manufacturing firms for industrial land plots.',
    target_audience: ['Investors', 'Developers'],
    geography: 'Pithampur, Dewas Naka',
    categories: ['Industrial'],
    transaction_types: ['Sale', 'Lease'],
    planned_budget: 80000,
    target_leads: 25,
    target_qualified_leads: 12,
    target_opportunities: 4,
    promoted_properties: ['P-1049', 'P-1053'],
    created_at: '2026-09-19T14:00:00Z',
    updated_at: '2026-09-19T14:00:00Z',
  },
  {
    id: 'CMP-2026-012',
    name: 'Indore NRI Property Investment Conclave',
    type: 'Brand Awareness',
    status: 'Draft',
    start_date: '2026-11-01',
    end_date: '2026-11-20',
    owner_id: 'u1',
    owner_name: 'Aman Desai',
    objective: 'Virtual and in-person showcase for non-resident Indian investors from Middle East and US.',
    target_audience: ['Buyers', 'Investors'],
    geography: 'All Indore Core Locations',
    categories: ['Residential', 'Commercial'],
    transaction_types: ['Sale'],
    planned_budget: 250000,
    target_leads: 80,
    target_qualified_leads: 35,
    target_opportunities: 15,
    promoted_properties: ['P-1024', 'P-1038', 'P-1069'],
    created_at: '2026-09-20T17:00:00Z',
    updated_at: '2026-09-20T17:00:00Z',
  },
]

// ── Campaign Property Promotions (Many-to-Many Linking) ────────────────────────

export const MOCK_CAMPAIGN_PROMOTIONS: CampaignPropertyPromotion[] = [
  {
    id: 'PROM-101',
    campaign_id: 'CMP-2026-001',
    property_id: 'P-1003',
    marketing_headline: 'Exclusive 3BHK High-Rise Near Tech Corridor',
    marketing_description: 'Spacious 1650 sq.ft flat in Mayank Blue Star with premium fittings and fast access to IT SEZ.',
    cta_text: 'Book private inspection this weekend',
    media_attachments: ['mayank_elevation.jpg', 'floor_plan_3bhk.pdf'],
    enquiries_count: 6,
    added_at: '2026-09-02T10:00:00Z',
  },
  {
    id: 'PROM-102',
    campaign_id: 'CMP-2026-002',
    property_id: 'P-1003',
    marketing_headline: 'Scheme 140 Luxury Corner 3BHK — Ready for Possession',
    marketing_description: 'Prime 6th floor apartment with dual parking, wide balconies, and Vastu-compliant layout.',
    cta_text: 'Schedule site visit today',
    media_attachments: ['living_room_luxury.jpg', 'balcony_view.jpg', 'scheme140_brochure.pdf'],
    enquiries_count: 9,
    added_at: '2026-09-11T12:30:00Z',
  },
  {
    id: 'PROM-103',
    campaign_id: 'CMP-2026-001',
    property_id: 'P-1008',
    marketing_headline: 'Prime Investment Plot on 200ft Super Corridor Road',
    marketing_description: 'East-facing residential plot in gated township with club house, underground cabling, and clear titles.',
    cta_text: 'Enquire for festive discount price',
    media_attachments: ['plot_layout_map.pdf', 'corridor_drone_view.mp4'],
    enquiries_count: 14,
    added_at: '2026-09-03T14:00:00Z',
  },
  {
    id: 'PROM-104',
    campaign_id: 'CMP-2026-001',
    property_id: 'P-1009',
    marketing_headline: 'Ultra-Luxury 4BHK Penthouse with Private Terrace',
    marketing_description: 'Exclusive 2400 sq.ft duplex penthouse overlooking scenic garden at Super Corridor.',
    cta_text: 'Request private brochure',
    media_attachments: ['penthouse_terrace.jpg', 'interior_3d_walkthrough.mp4'],
    enquiries_count: 8,
    added_at: '2026-09-05T09:15:00Z',
  },
  {
    id: 'PROM-105',
    campaign_id: 'CMP-2026-003',
    property_id: 'P-1005',
    marketing_headline: 'Fully Furnished 22-Seater Corporate Office on MG Road',
    marketing_description: 'Plug-and-play office setup with 2 cabins, conference room, server room, and high-speed fiber link.',
    cta_text: 'Schedule executive walkthrough',
    media_attachments: ['reception_mgroad.jpg', 'conference_room.jpg', 'lease_terms.pdf'],
    enquiries_count: 5,
    added_at: '2026-08-16T11:00:00Z',
  },
  {
    id: 'PROM-106',
    campaign_id: 'CMP-2026-004',
    property_id: 'P-1001',
    marketing_headline: 'Premium Semi-Furnished 2BHK Rental in Scheme 140',
    marketing_description: 'Available for immediate family tenancy with modular kitchen and covered parking.',
    cta_text: 'Apply for tenancy screening',
    media_attachments: ['kitchen_modular.jpg'],
    enquiries_count: 11,
    added_at: '2026-07-05T15:00:00Z',
  },
  {
    id: 'PROM-107',
    campaign_id: 'CMP-2026-004',
    property_id: 'P-1002',
    marketing_headline: 'Furnished 3BHK Near Geeta Bhawan Square',
    marketing_description: 'Spacious 2nd floor flat with dual covered parkings, near premier schools and hospitals.',
    cta_text: 'Book site inspection',
    media_attachments: ['geeta_bhawan_exterior.jpg'],
    enquiries_count: 7,
    added_at: '2026-07-08T16:30:00Z',
  },
  {
    id: 'PROM-108',
    campaign_id: 'CMP-2026-007',
    property_id: 'P-1015',
    marketing_headline: '1200 sqft Gated Township Plot in Bicholi Mardana',
    marketing_description: 'West-facing residential plot with clear demarcation, 30ft road, and ready water connection.',
    cta_text: 'Book spot discount plot visit',
    media_attachments: ['bicholi_plot_map.pdf'],
    enquiries_count: 8,
    added_at: '2026-09-02T10:00:00Z',
  },
  {
    id: 'PROM-109',
    campaign_id: 'CMP-2026-007',
    property_id: 'P-1022',
    marketing_headline: 'Affordable 1000 sqft Plot in Bicholi Housing Board',
    marketing_description: 'North-facing residential land ready for registry and immediate home construction.',
    cta_text: 'Get pricing sheet on WhatsApp',
    media_attachments: ['bicholi_demarcation.jpg'],
    enquiries_count: 5,
    added_at: '2026-09-04T11:30:00Z',
  },
  {
    id: 'PROM-110',
    campaign_id: 'CMP-2026-008',
    property_id: 'P-1018',
    marketing_headline: 'Grade-A 2200 sqft Office on AB Road with 40-Seater Fitout',
    marketing_description: 'Corporate headquarters standard with conference rooms, cabins, and 100% DG power backup.',
    cta_text: 'Request corporate lease deck',
    media_attachments: ['orbit_tower_lobby.jpg', 'office_floorplan.pdf'],
    enquiries_count: 12,
    added_at: '2026-08-05T09:00:00Z',
  },
  {
    id: 'PROM-111',
    campaign_id: 'CMP-2026-008',
    property_id: 'P-1019',
    marketing_headline: 'High-Footfall Retail Showroom on Main AB Road',
    marketing_description: '3200 sq.ft prime ground floor retail space facing main avenue, ideal for bank or electronics showroom.',
    cta_text: 'Schedule private site walkthrough',
    media_attachments: ['metro_tower_frontage.jpg'],
    enquiries_count: 14,
    added_at: '2026-08-08T14:00:00Z',
  },
  {
    id: 'PROM-112',
    campaign_id: 'CMP-2026-009',
    property_id: 'P-1016',
    marketing_headline: 'Ready-to-Move 1BHK in Navlakha Society',
    marketing_description: 'Ideal starter rental flat with semi-furnished layout and low maintenance society.',
    cta_text: 'Check availability date',
    media_attachments: ['navlakha_flat.jpg'],
    enquiries_count: 6,
    added_at: '2026-09-11T12:00:00Z',
  },
  {
    id: 'PROM-113',
    campaign_id: 'CMP-2026-009',
    property_id: 'P-1017',
    marketing_headline: 'Affordable 2BHK Navlakha Apartments — Immediate Sale',
    marketing_description: '1000 sq.ft well-maintained 2BHK with covered parking and lift access, clear title.',
    cta_text: 'Enquire for loan eligibility check',
    media_attachments: ['navlakha_living.jpg'],
    enquiries_count: 10,
    added_at: '2026-09-12T15:00:00Z',
  },
  {
    id: 'PROM-114',
    campaign_id: 'CMP-2026-010',
    property_id: 'P-1014',
    marketing_headline: 'Palasia Enclave Corner 2BHK with Vastu Compliance',
    marketing_description: '3rd floor apartment with open views, ample natural ventilation, and premium neighborhood.',
    cta_text: 'Schedule viewing with agent',
    media_attachments: ['palasia_enclave_facade.jpg'],
    enquiries_count: 9,
    added_at: '2026-09-06T10:00:00Z',
  },
  {
    id: 'PROM-115',
    campaign_id: 'CMP-2026-010',
    property_id: 'P-1037',
    marketing_headline: 'Fully Furnished 3BHK in New Palasia Prime',
    marketing_description: '1350 sq.ft executive rental residence with Italian marble flooring and covered parking.',
    cta_text: 'Request video tour on WhatsApp',
    media_attachments: ['new_palasia_interior.jpg'],
    enquiries_count: 8,
    added_at: '2026-09-08T11:00:00Z',
  },
  {
    id: 'PROM-116',
    campaign_id: 'CMP-2026-010',
    property_id: 'P-1048',
    marketing_headline: 'Palasia Premium 2000 sqft Luxury 3BHK Residence',
    marketing_description: '6th floor ultra-spacious flat with dual parking slots and club amenities.',
    cta_text: 'Book private inspection',
    media_attachments: ['palasia_premium_balcony.jpg'],
    enquiries_count: 7,
    added_at: '2026-09-09T14:30:00Z',
  },
  {
    id: 'PROM-117',
    campaign_id: 'CMP-2026-011',
    property_id: 'P-1049',
    marketing_headline: '1100 sqft Residential Plot at Dewas Naka Extension',
    marketing_description: 'West-facing plot in AUDA approved layout with ready transformer and drainage connectivity.',
    cta_text: 'Download master plan map',
    media_attachments: ['dewas_naka_layout.pdf'],
    enquiries_count: 4,
    added_at: '2026-09-19T10:00:00Z',
  },
  {
    id: 'PROM-118',
    campaign_id: 'CMP-2026-012',
    property_id: 'P-1069',
    marketing_headline: 'Mega Commercial IT Tower Floor Plates on Super Corridor',
    marketing_description: '12000 sq.ft Grade-A commercial workspace floors with multi-tenant division options.',
    cta_text: 'Download institutional investor kit',
    media_attachments: ['it_tower_render.jpg', 'investor_deck_it3.pdf'],
    enquiries_count: 15,
    added_at: '2026-09-20T16:00:00Z',
  },
]

// ── Promotion & Demand Gap Helpers ────────────────────────────────────────────

export function getCampaignPromotions(campaignId: string): CampaignPropertyPromotion[] {
  return MOCK_CAMPAIGN_PROMOTIONS.filter(p => p.campaign_id === campaignId)
}

export function getPropertyActivePromotions(propertyId: string): { campaign: CampaignRow; promotion: CampaignPropertyPromotion }[] {
  const promos = MOCK_CAMPAIGN_PROMOTIONS.filter(p => p.property_id === propertyId)
  const result: { campaign: CampaignRow; promotion: CampaignPropertyPromotion }[] = []
  for (const promo of promos) {
    const campaign = MOCK_CAMPAIGNS.find(c => c.id === promo.campaign_id)
    if (campaign && campaign.status === 'Active') {
      result.push({ campaign, promotion: promo })
    }
  }
  return result
}

export function getDemandGaps(): DemandGapItem[] {
  return [
    {
      id: 'GAP-1',
      category: 'BUY_SELL_FLAT',
      category_label: 'Buy-Sell Flat/Duplex',
      short_loc: '08-SAPNA_SANGEETA',
      demand_count: 3,
      supply_count: 1,
      gap: 2,
      suggested_campaign_type: 'Seller Acquisition',
      suggested_campaign_name: 'Sapna Sangeeta Flat Seller Acquisition',
      suggested_objective: 'Target residential property owners in Sapna Sangeeta to onboard new flat listings to fulfill unmet buyer demand (Gap: +2).',
      suggested_audience: ['Sellers', 'Owners'],
      suggested_category: 'Residential',
      suggested_transaction: 'Sale',
    },
    {
      id: 'GAP-2',
      category: 'RENTAL_RESIDENTIAL',
      category_label: 'Rental Residential',
      short_loc: '07-Geeta_Bhawan',
      demand_count: 3,
      supply_count: 1,
      gap: 2,
      suggested_campaign_type: 'Landlord Acquisition',
      suggested_campaign_name: 'Geeta Bhawan Landlord Onboarding Drive',
      suggested_objective: 'Onboard high-yield rental residential properties in Geeta Bhawan for qualified tenant waitlist (Gap: +2).',
      suggested_audience: ['Landlords', 'Owners'],
      suggested_category: 'Residential',
      suggested_transaction: 'Rent',
    },
    {
      id: 'GAP-3',
      category: 'PLOT',
      category_label: 'Plot/Jameen',
      short_loc: '09-Super_Corridor',
      demand_count: 4,
      supply_count: 2,
      gap: 2,
      suggested_campaign_type: 'Property Promotion',
      suggested_campaign_name: 'Super Corridor Commercial & Residential Plots Showcase',
      suggested_objective: 'Promote newly available highway-adjacent plots near IT SEZ to high-intent investors and builders (Gap: +2).',
      suggested_audience: ['Buyers', 'Investors', 'Developers'],
      suggested_category: 'Commercial',
      suggested_transaction: 'Sale',
    },
    {
      id: 'GAP-4',
      category: 'RENTAL_COMMERCIAL',
      category_label: 'Rental Commercial',
      short_loc: '05-MG_Road',
      demand_count: 2,
      supply_count: 1,
      gap: 1,
      suggested_campaign_type: 'Landlord Acquisition',
      suggested_campaign_name: 'MG Road Corporate Space Landlord Acquisition',
      suggested_objective: 'Acquire furnished and bare-shell commercial office spaces on MG Road for startup and corporate lease demand (Gap: +1).',
      suggested_audience: ['Landlords', 'Owners', 'Brokers'],
      suggested_category: 'Commercial',
      suggested_transaction: 'Lease',
    },
  ]
}

// ── Telemarketing Campaigns & Target Contact Lists ─────────────────────────────

export const MOCK_TELEMARKETING_CAMPAIGNS: TelemarketingCampaignRow[] = [
  {
    id: 'TMC-2026-001',
    name: 'Super Corridor IT Corridor Buyer Outreach',
    linked_campaign_id: 'CMP-2026-001',
    linked_campaign_name: 'Super Corridor Tech Hub Promotion',
    target_audience: 'Buyer',
    category: 'Commercial',
    geography: '09-Super_Corridor, Indore',
    start_date: '2026-09-05',
    end_date: '2026-10-15',
    purpose: 'Buyer Acquisition',
    assigned_telecallers: ['Neha Kapoor', 'Ravi Mehta'],
    status: 'Active',
    created_at: '2026-09-05T08:30:00Z',
  },
  {
    id: 'TMC-2026-002',
    name: 'Scheme 140 Luxury Penthouse HNI Calling',
    linked_campaign_id: 'CMP-2026-002',
    linked_campaign_name: 'Scheme 140 Luxury High-Rise Influx',
    target_audience: 'Buyer',
    category: 'Residential',
    geography: '01-Schm140_Mayank, Indore',
    start_date: '2026-09-12',
    end_date: '2026-10-20',
    purpose: 'Cold Calling',
    assigned_telecallers: ['Neha Kapoor'],
    status: 'Active',
    created_at: '2026-09-12T09:00:00Z',
  },
  {
    id: 'TMC-2026-003',
    name: 'Vijay Nagar Commercial Landlord Cold Outreach',
    linked_campaign_id: 'CMP-2026-004',
    linked_campaign_name: 'Vijay Nagar Landlord Onboarding Q3',
    target_audience: 'Landlord',
    category: 'Commercial',
    geography: '04-Vijay_Nagar, Indore',
    start_date: '2026-08-15',
    end_date: '2026-09-15',
    purpose: 'Owner Acquisition',
    assigned_telecallers: ['Ravi Mehta', 'Aman Desai'],
    status: 'Completed',
    created_at: '2026-08-15T09:30:00Z',
  },
  {
    id: 'TMC-2026-004',
    name: 'AB Road Corporate Tenant Calling',
    linked_campaign_id: 'CMP-2026-008',
    linked_campaign_name: 'AB Road Commercial Towers Showcase',
    target_audience: 'Tenant',
    category: 'Commercial',
    geography: '13-AB_Road_Ravi, Indore',
    start_date: '2026-09-01',
    end_date: '2026-10-15',
    purpose: 'Cold Calling',
    assigned_telecallers: ['Neha Kapoor', 'Sanjay Verma'],
    status: 'Active',
    created_at: '2026-09-01T08:30:00Z',
  },
  {
    id: 'TMC-2026-005',
    name: 'Bicholi & Limbodi Affordable Land Buyers',
    linked_campaign_id: 'CMP-2026-007',
    linked_campaign_name: 'Bicholi & Limbodi Affordable Plot Rush',
    target_audience: 'Buyer',
    category: 'Plots',
    geography: '11-Bicholi_Amit, Indore',
    start_date: '2026-09-05',
    end_date: '2026-10-31',
    purpose: 'Buyer Acquisition',
    assigned_telecallers: ['Amit Patel', 'Ravi Mehta'],
    status: 'Active',
    created_at: '2026-09-05T09:00:00Z',
  },
  {
    id: 'TMC-2026-006',
    name: 'Navlakha Ready-to-Move Resident Outreach',
    linked_campaign_id: 'CMP-2026-009',
    linked_campaign_name: 'Navlakha Ready-to-Move 2BHK Blitz',
    target_audience: 'Buyer',
    category: 'Residential',
    geography: '12-Navlakha_Sanjay, Indore',
    start_date: '2026-09-10',
    end_date: '2026-10-25',
    purpose: 'Lead Reactivation',
    assigned_telecallers: ['Sanjay Verma', 'Priya Sharma'],
    status: 'Active',
    created_at: '2026-09-10T10:00:00Z',
  },
]

export const MOCK_TELEMARKETING_CONTACTS: TelemarketingContact[] = [
  // TMC-2026-001 (Super Corridor)
  {
    id: 'tmc-c-001',
    campaign_id: 'TMC-2026-001',
    name: 'Rajesh Sharma',
    phone: '+91 98260 11223',
    party_id: null,
    status: 'Converted to Lead',
    attempts_count: 3,
    last_attempt_at: '2026-09-18T11:00:00Z',
    assigned_telecaller: 'Neha Kapoor',
    notes: 'Extremely interested in 1,000 sq ft office plot near IT SEZ. Converted to pipeline lead.',
    next_attempt_at: null,
    converted_lead_id: 'L-1005',
    created_at: '2026-09-05T09:00:00Z',
  },
  {
    id: 'tmc-c-002',
    campaign_id: 'TMC-2026-001',
    name: 'Vikram Singh',
    phone: '+91 98765 43212',
    party_id: 'p3',
    status: 'Interested',
    attempts_count: 2,
    last_attempt_at: '2026-09-19T10:30:00Z',
    assigned_telecaller: 'Neha Kapoor',
    notes: 'Ready for site visit on Saturday. Requested commercial plot layout on WhatsApp.',
    next_attempt_at: '2026-09-21T11:00:00Z',
    converted_lead_id: null,
    created_at: '2026-09-05T09:00:00Z',
  },
  {
    id: 'tmc-c-003',
    campaign_id: 'TMC-2026-001',
    name: 'Manoj Patidar',
    phone: '+91 98930 44551',
    party_id: null,
    status: 'Call Later',
    attempts_count: 2,
    last_attempt_at: '2026-09-18T14:20:00Z',
    assigned_telecaller: 'Ravi Mehta',
    notes: 'In meeting, requested follow-up call tomorrow afternoon after 4 PM.',
    next_attempt_at: '2026-09-20T16:00:00Z',
    converted_lead_id: null,
    created_at: '2026-09-05T09:00:00Z',
  },
  {
    id: 'tmc-c-004',
    campaign_id: 'TMC-2026-001',
    name: 'Rohit Agrawal',
    phone: '+91 94250 88992',
    party_id: null,
    status: 'Connected',
    attempts_count: 1,
    last_attempt_at: '2026-09-17T15:10:00Z',
    assigned_telecaller: 'Ravi Mehta',
    notes: 'Discussed Super Corridor tech zone pricing. Comparing with AB Road Bypass.',
    next_attempt_at: null,
    converted_lead_id: null,
    created_at: '2026-09-05T09:00:00Z',
  },
  {
    id: 'tmc-c-005',
    campaign_id: 'TMC-2026-001',
    name: 'Dinesh Chawla',
    phone: '+91 98270 33441',
    party_id: null,
    status: 'Busy',
    attempts_count: 2,
    last_attempt_at: '2026-09-19T12:00:00Z',
    assigned_telecaller: 'Neha Kapoor',
    notes: 'Call disconnected after two rings; busy tone.',
    next_attempt_at: '2026-09-20T11:30:00Z',
    converted_lead_id: null,
    created_at: '2026-09-05T09:00:00Z',
  },
  {
    id: 'tmc-c-006',
    campaign_id: 'TMC-2026-001',
    name: 'Suresh Malviya',
    phone: '+91 97550 12398',
    party_id: null,
    status: 'Not Called',
    attempts_count: 0,
    last_attempt_at: null,
    assigned_telecaller: 'Ravi Mehta',
    notes: null,
    next_attempt_at: null,
    converted_lead_id: null,
    created_at: '2026-09-05T09:00:00Z',
  },
  {
    id: 'tmc-c-007',
    campaign_id: 'TMC-2026-001',
    name: 'Deepak Broker',
    phone: '+91 98765 43216',
    party_id: 'p7',
    status: 'Not Interested',
    attempts_count: 1,
    last_attempt_at: '2026-09-15T16:00:00Z',
    assigned_telecaller: 'Neha Kapoor',
    notes: 'Only deals in resale commercial properties, not direct plots.',
    next_attempt_at: null,
    converted_lead_id: null,
    created_at: '2026-09-05T09:00:00Z',
  },

  // TMC-2026-002 (Scheme 140 Luxury)
  {
    id: 'tmc-c-008',
    campaign_id: 'TMC-2026-002',
    name: 'Amit Jain',
    phone: '+91 98765 43213',
    party_id: 'p4',
    status: 'Interested',
    attempts_count: 2,
    last_attempt_at: '2026-09-18T10:00:00Z',
    assigned_telecaller: 'Neha Kapoor',
    notes: 'Enquired about 4BHK corner units and clubhouse delivery date.',
    next_attempt_at: '2026-09-22T14:00:00Z',
    converted_lead_id: null,
    created_at: '2026-09-12T09:00:00Z',
  },
  {
    id: 'tmc-c-009',
    campaign_id: 'TMC-2026-002',
    name: 'Harshwardhan Rathore',
    phone: '+91 98260 77881',
    party_id: null,
    status: 'Call Later',
    attempts_count: 1,
    last_attempt_at: '2026-09-17T11:45:00Z',
    assigned_telecaller: 'Neha Kapoor',
    notes: 'Traveling to Mumbai. Call back Monday morning at 10 AM.',
    next_attempt_at: '2026-09-22T10:00:00Z',
    converted_lead_id: null,
    created_at: '2026-09-12T09:00:00Z',
  },
  {
    id: 'tmc-c-010',
    campaign_id: 'TMC-2026-002',
    name: 'Sanjay Kothari',
    phone: '+91 94250 12890',
    party_id: null,
    status: 'Connected',
    attempts_count: 1,
    last_attempt_at: '2026-09-16T14:15:00Z',
    assigned_telecaller: 'Neha Kapoor',
    notes: 'Shared Scheme 140 luxury brochure PDF on email.',
    next_attempt_at: null,
    converted_lead_id: null,
    created_at: '2026-09-12T09:00:00Z',
  },
  {
    id: 'tmc-c-011',
    campaign_id: 'TMC-2026-002',
    name: 'Dr. Meenal Saxena',
    phone: '+91 98931 55662',
    party_id: null,
    status: 'Not Called',
    attempts_count: 0,
    last_attempt_at: null,
    assigned_telecaller: 'Neha Kapoor',
    notes: null,
    next_attempt_at: null,
    converted_lead_id: null,
    created_at: '2026-09-12T09:00:00Z',
  },
  {
    id: 'tmc-c-012',
    campaign_id: 'TMC-2026-002',
    name: 'Vivek Oberoi',
    phone: '+91 98270 99887',
    party_id: null,
    status: 'Wrong Number',
    attempts_count: 1,
    last_attempt_at: '2026-09-15T10:30:00Z',
    assigned_telecaller: 'Neha Kapoor',
    notes: 'Number belongs to someone else in Delhi.',
    next_attempt_at: null,
    converted_lead_id: null,
    created_at: '2026-09-12T09:00:00Z',
  },
  {
    id: 'tmc-c-013',
    campaign_id: 'TMC-2026-002',
    name: 'Rahul Verma',
    phone: '+91 98765 43215',
    party_id: 'p6',
    status: 'Converted to Lead',
    attempts_count: 2,
    last_attempt_at: '2026-09-16T09:30:00Z',
    assigned_telecaller: 'Neha Kapoor',
    notes: 'Wants to view penthouse floor on Sunday. Converted to qualified pipeline lead.',
    next_attempt_at: null,
    converted_lead_id: 'L-1007',
    created_at: '2026-09-12T09:00:00Z',
  },

  // TMC-2026-003 (Vijay Nagar Landlords)
  {
    id: 'tmc-c-014',
    campaign_id: 'TMC-2026-003',
    name: 'Sunita Gupta',
    phone: '+91 98765 43211',
    party_id: 'p2',
    status: 'Converted to Lead',
    attempts_count: 3,
    last_attempt_at: '2026-08-20T16:00:00Z',
    assigned_telecaller: 'Ravi Mehta',
    notes: 'Agreed for rental listing mandate of Vijay Nagar commercial office.',
    next_attempt_at: null,
    converted_lead_id: 'L-1008',
    created_at: '2026-08-15T10:00:00Z',
  },
  {
    id: 'tmc-c-015',
    campaign_id: 'TMC-2026-003',
    name: 'Anand Deshmukh',
    phone: '+91 98261 33445',
    party_id: null,
    status: 'Connected',
    attempts_count: 2,
    last_attempt_at: '2026-08-22T11:00:00Z',
    assigned_telecaller: 'Ravi Mehta',
    notes: 'Has 2,000 sq ft office space available from November. Scheduled callback.',
    next_attempt_at: null,
    converted_lead_id: null,
    created_at: '2026-08-15T10:00:00Z',
  },
  {
    id: 'tmc-c-016',
    campaign_id: 'TMC-2026-003',
    name: 'Pradeep Tiwari',
    phone: '+91 98932 66778',
    party_id: null,
    status: 'Busy',
    attempts_count: 2,
    last_attempt_at: '2026-08-24T15:30:00Z',
    assigned_telecaller: 'Aman Desai',
    notes: 'Did not answer after multiple call attempts.',
    next_attempt_at: null,
    converted_lead_id: null,
    created_at: '2026-08-15T10:00:00Z',
  },
  {
    id: 'tmc-c-017',
    campaign_id: 'TMC-2026-003',
    name: 'Nitin Kasliwal',
    phone: '+91 94253 11229',
    party_id: null,
    status: 'Not Interested',
    attempts_count: 1,
    last_attempt_at: '2026-08-18T12:00:00Z',
    assigned_telecaller: 'Ravi Mehta',
    notes: 'Already leased out to a nationalized bank.',
    next_attempt_at: null,
    converted_lead_id: null,
    created_at: '2026-08-15T10:00:00Z',
  },
  {
    id: 'tmc-c-018',
    campaign_id: 'TMC-2026-003',
    name: 'Ritu Chhabra',
    phone: '+91 98274 55660',
    party_id: null,
    status: 'Call Later',
    attempts_count: 1,
    last_attempt_at: '2026-08-25T14:00:00Z',
    assigned_telecaller: 'Aman Desai',
    notes: 'Wants current Vijay Nagar rental yield trends sheet sent first.',
    next_attempt_at: '2026-08-28T11:00:00Z',
    converted_lead_id: null,
    created_at: '2026-08-15T10:00:00Z',
  },
  // ── TMC-2026-004 (AB Road Corporate Tenant Calling) ──────────────────────────
  { id: 'tmc-c-019', campaign_id: 'TMC-2026-004', name: 'Alok Saxena', phone: '+91 98261 10001', party_id: null, status: 'Converted to Lead', attempts_count: 2, last_attempt_at: '2026-09-08T11:30:00Z', assigned_telecaller: 'Neha Kapoor', notes: 'Needs 2500 sqft commercial space for regional logistics hub.', next_attempt_at: null, converted_lead_id: 'L-1015', created_at: '2026-09-01T09:00:00Z' },
  { id: 'tmc-c-020', campaign_id: 'TMC-2026-004', name: 'Manish Chourasia', phone: '+91 98261 10002', party_id: null, status: 'Connected', attempts_count: 1, last_attempt_at: '2026-09-09T14:00:00Z', assigned_telecaller: 'Sanjay Verma', notes: 'Interested in Orbit Tower; requested corporate brochure.', next_attempt_at: '2026-09-12T10:00:00Z', converted_lead_id: null, created_at: '2026-09-01T09:00:00Z' },
  { id: 'tmc-c-021', campaign_id: 'TMC-2026-004', name: 'Pooja Kothari', phone: '+91 98261 10003', party_id: null, status: 'Call Later', attempts_count: 2, last_attempt_at: '2026-09-10T12:00:00Z', assigned_telecaller: 'Neha Kapoor', notes: 'Director out of town; call back on Monday morning.', next_attempt_at: '2026-09-15T11:00:00Z', converted_lead_id: null, created_at: '2026-09-01T09:00:00Z' },
  { id: 'tmc-c-022', campaign_id: 'TMC-2026-004', name: 'Harish Bajaj', phone: '+91 98261 10004', party_id: null, status: 'Not Called', attempts_count: 0, last_attempt_at: null, assigned_telecaller: 'Sanjay Verma', notes: null, next_attempt_at: '2026-09-22T10:00:00Z', converted_lead_id: null, created_at: '2026-09-01T09:00:00Z' },
  { id: 'tmc-c-023', campaign_id: 'TMC-2026-004', name: 'Deepak Agrawal', phone: '+91 98261 10005', party_id: null, status: 'Not Interested', attempts_count: 1, last_attempt_at: '2026-09-11T16:00:00Z', assigned_telecaller: 'Neha Kapoor', notes: 'Already signed long term lease in Scheme 54.', next_attempt_at: null, converted_lead_id: null, created_at: '2026-09-01T09:00:00Z' },
  { id: 'tmc-c-024', campaign_id: 'TMC-2026-004', name: 'Sunil Shrivastava', phone: '+91 98261 10006', party_id: null, status: 'Connected', attempts_count: 3, last_attempt_at: '2026-09-13T10:30:00Z', assigned_telecaller: 'Sanjay Verma', notes: 'Evaluating Metro Tower showroom plate; requested floor cad.', next_attempt_at: '2026-09-18T15:00:00Z', converted_lead_id: null, created_at: '2026-09-01T09:00:00Z' },
  { id: 'tmc-c-025', campaign_id: 'TMC-2026-004', name: 'Naveen Jain', phone: '+91 98261 10007', party_id: null, status: 'Busy', attempts_count: 2, last_attempt_at: '2026-09-14T11:15:00Z', assigned_telecaller: 'Neha Kapoor', notes: 'Line busy continuously on both attempts.', next_attempt_at: '2026-09-19T14:00:00Z', converted_lead_id: null, created_at: '2026-09-01T09:00:00Z' },
  { id: 'tmc-c-026', campaign_id: 'TMC-2026-004', name: 'Anurag Soni', phone: '+91 98261 10008', party_id: null, status: 'Converted to Lead', attempts_count: 1, last_attempt_at: '2026-09-14T15:00:00Z', assigned_telecaller: 'Sanjay Verma', notes: 'Needs 1200 sqft IT office near AB Road corridor.', next_attempt_at: null, converted_lead_id: 'L-1016', created_at: '2026-09-01T09:00:00Z' },
  { id: 'tmc-c-027', campaign_id: 'TMC-2026-004', name: 'Tarun Rathore', phone: '+91 98261 10009', party_id: null, status: 'Not Called', attempts_count: 0, last_attempt_at: null, assigned_telecaller: 'Neha Kapoor', notes: null, next_attempt_at: '2026-09-23T11:00:00Z', converted_lead_id: null, created_at: '2026-09-01T09:00:00Z' },
  { id: 'tmc-c-028', campaign_id: 'TMC-2026-004', name: 'Ritu Bhargava', phone: '+91 98261 10010', party_id: null, status: 'Wrong Number', attempts_count: 1, last_attempt_at: '2026-09-12T14:30:00Z', assigned_telecaller: 'Sanjay Verma', notes: 'Wrong number provided in corporate directory.', next_attempt_at: null, converted_lead_id: null, created_at: '2026-09-01T09:00:00Z' },
  { id: 'tmc-c-029', campaign_id: 'TMC-2026-004', name: 'Gaurav Mandloi', phone: '+91 98261 10011', party_id: null, status: 'Connected', attempts_count: 1, last_attempt_at: '2026-09-15T11:00:00Z', assigned_telecaller: 'Neha Kapoor', notes: 'Interested in commercial purchase; scheduled in-office meeting.', next_attempt_at: '2026-09-20T11:00:00Z', converted_lead_id: null, created_at: '2026-09-01T09:00:00Z' },
  // ── TMC-2026-005 (Bicholi & Limbodi Affordable Land Buyers) ──────────────────
  { id: 'tmc-c-030', campaign_id: 'TMC-2026-005', name: 'Virendra Yadav', phone: '+91 98262 20001', party_id: null, status: 'Converted to Lead', attempts_count: 2, last_attempt_at: '2026-09-09T10:00:00Z', assigned_telecaller: 'Amit Patel', notes: 'Looking for 1200 sqft residential plot in Bicholi.', next_attempt_at: null, converted_lead_id: 'L-1020', created_at: '2026-09-05T09:30:00Z' },
  { id: 'tmc-c-031', campaign_id: 'TMC-2026-005', name: 'Rekha Deshmukh', phone: '+91 98262 20002', party_id: null, status: 'Connected', attempts_count: 1, last_attempt_at: '2026-09-10T11:30:00Z', assigned_telecaller: 'Ravi Mehta', notes: 'Asked about water and electricity connection in Limbodi.', next_attempt_at: '2026-09-14T12:00:00Z', converted_lead_id: null, created_at: '2026-09-05T09:30:00Z' },
  { id: 'tmc-c-032', campaign_id: 'TMC-2026-005', name: 'Kamlesh Patidar', phone: '+91 98262 20003', party_id: null, status: 'Not Called', attempts_count: 0, last_attempt_at: null, assigned_telecaller: 'Amit Patel', notes: null, next_attempt_at: '2026-09-21T10:30:00Z', converted_lead_id: null, created_at: '2026-09-05T09:30:00Z' },
  { id: 'tmc-c-033', campaign_id: 'TMC-2026-005', name: 'Sanjay Solanki', phone: '+91 98262 20004', party_id: null, status: 'Call Later', attempts_count: 1, last_attempt_at: '2026-09-11T14:00:00Z', assigned_telecaller: 'Ravi Mehta', notes: 'Busy driving; requested callback after 6 PM.', next_attempt_at: '2026-09-15T18:00:00Z', converted_lead_id: null, created_at: '2026-09-05T09:30:00Z' },
  { id: 'tmc-c-034', campaign_id: 'TMC-2026-005', name: 'Anita Chouhan', phone: '+91 98262 20005', party_id: null, status: 'Not Interested', attempts_count: 1, last_attempt_at: '2026-09-12T16:30:00Z', assigned_telecaller: 'Amit Patel', notes: 'Purchased flat in Vijay Nagar instead.', next_attempt_at: null, converted_lead_id: null, created_at: '2026-09-05T09:30:00Z' },
  { id: 'tmc-c-035', campaign_id: 'TMC-2026-005', name: 'Babulal Sen', phone: '+91 98262 20006', party_id: null, status: 'Connected', attempts_count: 2, last_attempt_at: '2026-09-13T10:45:00Z', assigned_telecaller: 'Ravi Mehta', notes: 'Wants east-facing plot only; budget ₹25 Lakhs.', next_attempt_at: '2026-09-17T11:00:00Z', converted_lead_id: null, created_at: '2026-09-05T09:30:00Z' },
  { id: 'tmc-c-036', campaign_id: 'TMC-2026-005', name: 'Pankaj Tiwari', phone: '+91 98262 20007', party_id: null, status: 'Converted to Lead', attempts_count: 2, last_attempt_at: '2026-09-14T11:00:00Z', assigned_telecaller: 'Amit Patel', notes: 'Confirmed site visit for Bicholi Housing Board plot.', next_attempt_at: null, converted_lead_id: 'L-1027', created_at: '2026-09-05T09:30:00Z' },
  { id: 'tmc-c-037', campaign_id: 'TMC-2026-005', name: 'Geetanjali Rao', phone: '+91 98262 20008', party_id: null, status: 'Busy', attempts_count: 2, last_attempt_at: '2026-09-15T15:00:00Z', assigned_telecaller: 'Ravi Mehta', notes: 'Did not pick up call.', next_attempt_at: '2026-09-18T10:00:00Z', converted_lead_id: null, created_at: '2026-09-05T09:30:00Z' },
  { id: 'tmc-c-038', campaign_id: 'TMC-2026-005', name: 'Mukesh Mandloi', phone: '+91 98262 20009', party_id: null, status: 'Not Called', attempts_count: 0, last_attempt_at: null, assigned_telecaller: 'Amit Patel', notes: null, next_attempt_at: '2026-09-22T14:00:00Z', converted_lead_id: null, created_at: '2026-09-05T09:30:00Z' },
  { id: 'tmc-c-039', campaign_id: 'TMC-2026-005', name: 'Kavita Joshi', phone: '+91 98262 20010', party_id: null, status: 'Connected', attempts_count: 1, last_attempt_at: '2026-09-16T12:00:00Z', assigned_telecaller: 'Ravi Mehta', notes: 'Interested in Limbodi Extension plot P-1029; shared pricing.', next_attempt_at: '2026-09-20T16:00:00Z', converted_lead_id: null, created_at: '2026-09-05T09:30:00Z' },
  { id: 'tmc-c-040', campaign_id: 'TMC-2026-005', name: 'Sohanlal Verma', phone: '+91 98262 20011', party_id: null, status: 'Not Interested', attempts_count: 1, last_attempt_at: '2026-09-16T14:30:00Z', assigned_telecaller: 'Amit Patel', notes: 'Looking for agricultural land only.', next_attempt_at: null, converted_lead_id: null, created_at: '2026-09-05T09:30:00Z' },
  // ── TMC-2026-006 (Navlakha Ready-to-Move Resident Outreach) ─────────────────
  { id: 'tmc-c-041', campaign_id: 'TMC-2026-006', name: 'Rajendra Solanki', phone: '+91 98263 30001', party_id: null, status: 'Converted to Lead', attempts_count: 1, last_attempt_at: '2026-09-12T11:00:00Z', assigned_telecaller: 'Sanjay Verma', notes: 'First home buyer seeking 2BHK flat under ₹40 Lakhs.', next_attempt_at: null, converted_lead_id: 'L-1014', created_at: '2026-09-10T10:00:00Z' },
  { id: 'tmc-c-042', campaign_id: 'TMC-2026-006', name: 'Pooja Vishwakarma', phone: '+91 98263 30002', party_id: null, status: 'Connected', attempts_count: 2, last_attempt_at: '2026-09-13T12:30:00Z', assigned_telecaller: 'Priya Sharma', notes: 'Wants ready possession apartment near school belt.', next_attempt_at: '2026-09-17T14:00:00Z', converted_lead_id: null, created_at: '2026-09-10T10:00:00Z' },
  { id: 'tmc-c-043', campaign_id: 'TMC-2026-006', name: 'Ajay Kadam', phone: '+91 98263 30003', party_id: null, status: 'Call Later', attempts_count: 1, last_attempt_at: '2026-09-14T10:15:00Z', assigned_telecaller: 'Sanjay Verma', notes: 'Call on weekend when family is together.', next_attempt_at: '2026-09-20T11:00:00Z', converted_lead_id: null, created_at: '2026-09-10T10:00:00Z' },
  { id: 'tmc-c-044', campaign_id: 'TMC-2026-006', name: 'Meena Thakur', phone: '+91 98263 30004', party_id: null, status: 'Not Called', attempts_count: 0, last_attempt_at: null, assigned_telecaller: 'Priya Sharma', notes: null, next_attempt_at: '2026-09-21T15:00:00Z', converted_lead_id: null, created_at: '2026-09-10T10:00:00Z' },
  { id: 'tmc-c-045', campaign_id: 'TMC-2026-006', name: 'Dharmendra Joshi', phone: '+91 98263 30005', party_id: null, status: 'Not Interested', attempts_count: 1, last_attempt_at: '2026-09-15T16:00:00Z', assigned_telecaller: 'Sanjay Verma', notes: 'Moved to Bangalore on employment transfer.', next_attempt_at: null, converted_lead_id: null, created_at: '2026-09-10T10:00:00Z' },
  { id: 'tmc-c-046', campaign_id: 'TMC-2026-006', name: 'Sunita Malviya', phone: '+91 98263 30006', party_id: null, status: 'Connected', attempts_count: 1, last_attempt_at: '2026-09-16T11:45:00Z', assigned_telecaller: 'Priya Sharma', notes: 'Interested in Navlakha Society flat 104; shared rent terms.', next_attempt_at: '2026-09-19T11:00:00Z', converted_lead_id: null, created_at: '2026-09-10T10:00:00Z' },
  { id: 'tmc-c-047', campaign_id: 'TMC-2026-006', name: 'Devendra Yadav', phone: '+91 98263 30007', party_id: null, status: 'Busy', attempts_count: 2, last_attempt_at: '2026-09-17T14:00:00Z', assigned_telecaller: 'Sanjay Verma', notes: 'Phone switched off on second try.', next_attempt_at: '2026-09-22T10:00:00Z', converted_lead_id: null, created_at: '2026-09-10T10:00:00Z' },
  { id: 'tmc-c-048', campaign_id: 'TMC-2026-006', name: 'Rani Chouhan', phone: '+91 98263 30008', party_id: null, status: 'Converted to Lead', attempts_count: 2, last_attempt_at: '2026-09-18T10:00:00Z', assigned_telecaller: 'Priya Sharma', notes: 'Confirmed booking interest for Navlakha Apartments B-203.', next_attempt_at: null, converted_lead_id: 'L-1023', created_at: '2026-09-10T10:00:00Z' },
  { id: 'tmc-c-049', campaign_id: 'TMC-2026-006', name: 'Santosh Gangwal', phone: '+91 98263 30009', party_id: null, status: 'Not Called', attempts_count: 0, last_attempt_at: null, assigned_telecaller: 'Sanjay Verma', notes: null, next_attempt_at: '2026-09-23T16:00:00Z', converted_lead_id: null, created_at: '2026-09-10T10:00:00Z' },
  { id: 'tmc-c-050', campaign_id: 'TMC-2026-006', name: 'Vandana Shinde', phone: '+91 98263 30010', party_id: null, status: 'Connected', attempts_count: 1, last_attempt_at: '2026-09-19T15:30:00Z', assigned_telecaller: 'Priya Sharma', notes: 'Requested photos and video walkthrough on WhatsApp.', next_attempt_at: '2026-09-21T12:00:00Z', converted_lead_id: null, created_at: '2026-09-10T10:00:00Z' },
  // ── Additional contacts for TMC-2026-001 (Super Corridor) ────────────────────
  { id: 'tmc-c-051', campaign_id: 'TMC-2026-001', name: 'Prashant Dixit', phone: '+91 98260 22001', party_id: null, status: 'Connected', attempts_count: 2, last_attempt_at: '2026-09-17T11:00:00Z', assigned_telecaller: 'Neha Kapoor', notes: 'Looking for 3BHK flat near TCS campus.', next_attempt_at: '2026-09-21T14:00:00Z', converted_lead_id: null, created_at: '2026-09-05T08:30:00Z' },
  { id: 'tmc-c-052', campaign_id: 'TMC-2026-001', name: 'Jyoti Baghel', phone: '+91 98260 22002', party_id: null, status: 'Call Later', attempts_count: 1, last_attempt_at: '2026-09-18T10:30:00Z', assigned_telecaller: 'Ravi Mehta', notes: 'Husband traveling; call back on Friday.', next_attempt_at: '2026-09-22T11:00:00Z', converted_lead_id: null, created_at: '2026-09-05T08:30:00Z' },
  { id: 'tmc-c-053', campaign_id: 'TMC-2026-001', name: 'Anand Patwardhan', phone: '+91 98260 22003', party_id: null, status: 'Converted to Lead', attempts_count: 3, last_attempt_at: '2026-09-19T16:00:00Z', assigned_telecaller: 'Neha Kapoor', notes: 'Interested in Super Corridor commercial office space.', next_attempt_at: null, converted_lead_id: 'L-1018', created_at: '2026-09-05T08:30:00Z' },
  { id: 'tmc-c-054', campaign_id: 'TMC-2026-001', name: 'Deepa Saxena', phone: '+91 98260 22004', party_id: null, status: 'Not Called', attempts_count: 0, last_attempt_at: null, assigned_telecaller: 'Ravi Mehta', notes: null, next_attempt_at: '2026-09-23T10:00:00Z', converted_lead_id: null, created_at: '2026-09-05T08:30:00Z' },
  { id: 'tmc-c-055', campaign_id: 'TMC-2026-001', name: 'Nikhil Rane', phone: '+91 98260 22005', party_id: null, status: 'Not Interested', attempts_count: 1, last_attempt_at: '2026-09-15T12:00:00Z', assigned_telecaller: 'Neha Kapoor', notes: 'Price too high for current budget.', next_attempt_at: null, converted_lead_id: null, created_at: '2026-09-05T08:30:00Z' },
  // ── Additional contacts for TMC-2026-002 (Scheme 140 Luxury) ─────────────────
  { id: 'tmc-c-056', campaign_id: 'TMC-2026-002', name: 'Mahesh Biyani', phone: '+91 98270 33001', party_id: null, status: 'Connected', attempts_count: 1, last_attempt_at: '2026-09-16T14:00:00Z', assigned_telecaller: 'Neha Kapoor', notes: 'Interested in VIP Enclave duplex plot.', next_attempt_at: '2026-09-20T15:00:00Z', converted_lead_id: null, created_at: '2026-09-12T09:00:00Z' },
  { id: 'tmc-c-057', campaign_id: 'TMC-2026-002', name: 'Kusum Porwal', phone: '+91 98270 33002', party_id: null, status: 'Call Later', attempts_count: 2, last_attempt_at: '2026-09-17T11:30:00Z', assigned_telecaller: 'Neha Kapoor', notes: 'Client asked to call after financial year review.', next_attempt_at: '2026-09-24T12:00:00Z', converted_lead_id: null, created_at: '2026-09-12T09:00:00Z' },
  { id: 'tmc-c-058', campaign_id: 'TMC-2026-002', name: 'Rupesh Gokhale', phone: '+91 98270 33003', party_id: null, status: 'Converted to Lead', attempts_count: 1, last_attempt_at: '2026-09-18T10:15:00Z', assigned_telecaller: 'Neha Kapoor', notes: 'HNI looking for luxury 3BHK penthouse.', next_attempt_at: null, converted_lead_id: 'L-1011', created_at: '2026-09-12T09:00:00Z' },
  { id: 'tmc-c-059', campaign_id: 'TMC-2026-002', name: 'Shobha Kasliwal', phone: '+91 98270 33004', party_id: null, status: 'Not Called', attempts_count: 0, last_attempt_at: null, assigned_telecaller: 'Neha Kapoor', notes: null, next_attempt_at: '2026-09-22T14:30:00Z', converted_lead_id: null, created_at: '2026-09-12T09:00:00Z' },
  { id: 'tmc-c-060', campaign_id: 'TMC-2026-002', name: 'Girish Chandak', phone: '+91 98270 33005', party_id: null, status: 'Not Interested', attempts_count: 1, last_attempt_at: '2026-09-14T17:00:00Z', assigned_telecaller: 'Neha Kapoor', notes: 'Currently invested in Mumbai properties only.', next_attempt_at: null, converted_lead_id: null, created_at: '2026-09-12T09:00:00Z' },
  // ── Additional contacts for TMC-2026-003 (Vijay Nagar Commercial) ────────────
  { id: 'tmc-c-061', campaign_id: 'TMC-2026-003', name: 'Ashwin Somani', phone: '+91 98274 66001', party_id: null, status: 'Connected', attempts_count: 2, last_attempt_at: '2026-08-26T11:00:00Z', assigned_telecaller: 'Ravi Mehta', notes: 'Commercial building owner; interested in sole selling mandate.', next_attempt_at: '2026-08-30T12:00:00Z', converted_lead_id: null, created_at: '2026-08-15T10:00:00Z' },
  { id: 'tmc-c-062', campaign_id: 'TMC-2026-003', name: 'Bhavna Dave', phone: '+91 98274 66002', party_id: null, status: 'Converted to Lead', attempts_count: 1, last_attempt_at: '2026-08-27T14:30:00Z', assigned_telecaller: 'Aman Desai', notes: 'Owner of Scheme 78 commercial floor; listed for rent.', next_attempt_at: null, converted_lead_id: 'L-1010', created_at: '2026-08-15T10:00:00Z' },
  { id: 'tmc-c-063', campaign_id: 'TMC-2026-003', name: 'Lalit Mittal', phone: '+91 98274 66003', party_id: null, status: 'Call Later', attempts_count: 2, last_attempt_at: '2026-08-28T16:00:00Z', assigned_telecaller: 'Ravi Mehta', notes: 'Partner meeting ongoing; requested evening call.', next_attempt_at: '2026-09-02T17:00:00Z', converted_lead_id: null, created_at: '2026-08-15T10:00:00Z' },
  { id: 'tmc-c-064', campaign_id: 'TMC-2026-003', name: 'Sunil Ghiya', phone: '+91 98274 66004', party_id: null, status: 'Not Called', attempts_count: 0, last_attempt_at: null, assigned_telecaller: 'Aman Desai', notes: null, next_attempt_at: '2026-09-03T11:00:00Z', converted_lead_id: null, created_at: '2026-08-15T10:00:00Z' },
  { id: 'tmc-c-065', campaign_id: 'TMC-2026-003', name: 'Nirmala Mundra', phone: '+91 98274 66005', party_id: null, status: 'Not Interested', attempts_count: 1, last_attempt_at: '2026-08-29T10:00:00Z', assigned_telecaller: 'Ravi Mehta', notes: 'Self-occupied commercial premise; not leasing out.', next_attempt_at: null, converted_lead_id: null, created_at: '2026-08-15T10:00:00Z' },
]

// ── Lead Attribution & Marketing Traceability ─────────────────────────────────

export interface TraceableChainRow {
  id: string
  campaign_id?: string | null
  campaign_name?: string | null
  lead_id: string
  lead_name: string
  lead_source: string
  channel_type?: ChannelType | null
  lead_created_at: string
  lead_status: string
  opportunity_id?: string | null
  opportunity_stage?: string | null
  opportunity_expected_value?: number | null
  deal_id?: string | null
  deal_status: 'Won' | 'Lost' | 'In Progress' | 'Not yet reached'
  deal_value?: number | null
  commission_amount?: number | null
  closed_date?: string | null
  marketing_executive?: string | null
  first_touch_source?: string | null
  latest_touch_source?: string | null
}

export function getMarketingTraceableChains(): TraceableChainRow[] {
  const chains: TraceableChainRow[] = []

  for (const lead of MOCK_LEADS) {
    // Find matching opportunity by lead ID or client party ID
    const opp = MOCK_PIPELINE_OPPORTUNITIES.find(
      (o) => o.originating_lead_id === lead.id || o.client_id === lead.party_id
    )

    // Find matching transaction by opportunity ID
    const txn = opp
      ? MOCK_TRANSACTIONS.find((t) => t.opportunity_id === opp.id)
      : null

    let deal_status: 'Won' | 'Lost' | 'In Progress' | 'Not yet reached' = 'Not yet reached'
    if (txn || opp?.stage === 'WON') {
      deal_status = 'Won'
    } else if (opp?.stage === 'LOST' || lead.status === 'LOST') {
      deal_status = 'Lost'
    } else if (opp) {
      deal_status = 'In Progress'
    }

    chains.push({
      id: `trace-${lead.id}`,
      campaign_id: lead.campaign_id || opp?.attributed_campaign_id || null,
      campaign_name: lead.campaign_name || opp?.attributed_campaign_name || null,
      lead_id: lead.id,
      lead_name: lead.party_name,
      lead_source: lead.source
        ? `${lead.channel_type ? `${lead.channel_type} — ` : ''}${lead.source}`
        : 'Direct / Unspecified',
      channel_type: lead.channel_type || null,
      lead_created_at: lead.created_at || new Date().toISOString(),
      lead_status: lead.status,
      opportunity_id: opp?.id || null,
      opportunity_stage: opp?.stage || 'Not yet an Opportunity',
      opportunity_expected_value: opp?.expected_value || lead.value || null,
      deal_id: txn?.id || null,
      deal_status,
      deal_value: txn?.transaction_value || (opp?.stage === 'WON' ? opp.expected_value : null),
      commission_amount:
        txn?.commission_amount ||
        (opp?.stage === 'WON' ? (opp.expected_value ? Math.round(opp.expected_value * 0.02) : null) : null),
      closed_date: txn?.closed_date || opp?.closed_at || null,
      marketing_executive:
        opp?.marketing_executive_name || lead.assigned_to_name || 'Neha Kapoor',
      first_touch_source: opp?.first_touch_source || lead.source || 'Direct Outreach',
      latest_touch_source: opp?.latest_touch_source || lead.source || 'Direct Outreach',
    })
  }

  return chains
}

// ── Referral Partners Dataset ──────────────────────────────────────────────────

export const MOCK_REFERRAL_PARTNERS: ReferralPartnerRow[] = [
  {
    id: 'RP-101',
    name: 'Shree Balaji Realty Advisors',
    category: 'Broker',
    contact_person: 'Rajesh Sharma',
    phone: '+91 98260 11223',
    email: 'rajesh@balajirealty.com',
    referral_code: 'REF-BALAJI',
    status: 'Active',
    notes: 'Premier independent broker agency covering Scheme 140 and Vijay Nagar.',
    created_at: '2026-01-10T10:00:00Z',
  },
  {
    id: 'RP-102',
    name: 'Apex Prime Infra Network',
    category: 'Developer',
    contact_person: 'Anand Verma',
    phone: '+91 98261 44556',
    email: 'anand@apexprimeinfra.in',
    referral_code: 'REF-APEX',
    status: 'Active',
    notes: 'Developer channel alliance specializing in Super Corridor commercial and plotted developments.',
    created_at: '2026-02-01T11:00:00Z',
  },
  {
    id: 'RP-103',
    name: 'Indore HNI Wealth Advisory',
    category: 'Corporate Contact',
    contact_person: 'Sunil Mehta',
    phone: '+91 98262 77889',
    email: 'sunil@indorehni.org',
    referral_code: 'REF-HNI',
    status: 'Active',
    notes: 'Private wealth advisory syndicate directing high-ticket buyers to luxury projects.',
    created_at: '2026-02-15T14:30:00Z',
  },
  {
    id: 'RP-104',
    name: 'Malwa Capital Investors Group',
    category: 'Investor',
    contact_person: 'Pooja Malhotra',
    phone: '+91 98263 99001',
    email: 'pooja@malwacapital.com',
    referral_code: 'REF-MALWA',
    status: 'Inactive',
    notes: 'Commercial real estate angel syndicate for fractional retail purchases.',
    created_at: '2026-03-01T09:00:00Z',
  },
  {
    id: 'RP-105',
    name: 'Bhopal Wealth Managers',
    category: 'Corporate Contact',
    contact_person: 'Vivek Singhania',
    phone: '+91 98264 12345',
    email: 'vivek@bhopalwealth.in',
    referral_code: 'REF-INVEST',
    status: 'Active',
    notes: 'HNI wealth management consultancy in Bhopal funneling investor capital into Indore commercial projects.',
    created_at: '2026-03-15T10:00:00Z',
  },
  {
    id: 'RP-106',
    name: 'Indore Realtors Guild',
    category: 'Broker',
    contact_person: 'Girish Joshi',
    phone: '+91 98265 23456',
    email: 'girish@indorerealtors.org',
    referral_code: 'REF-GUILD',
    status: 'Active',
    notes: 'Co-broker network sharing verified resale flats in Palasia and Annapurna areas.',
    created_at: '2026-04-01T11:00:00Z',
  },
  {
    id: 'RP-107',
    name: 'Central MP Builders Consortium',
    category: 'Developer',
    contact_person: 'Manish Patwardhan',
    phone: '+91 98266 34567',
    email: 'manish@mpbuilders.org',
    referral_code: 'REF-CMPB',
    status: 'Active',
    notes: 'Association of mid-tier residential developers providing sole-agency mandate inventory.',
    created_at: '2026-04-15T14:00:00Z',
  },
  {
    id: 'RP-108',
    name: 'Ujjain Commercial Network',
    category: 'Broker',
    contact_person: 'Deepak Broker',
    phone: '+91 98267 45678',
    email: 'deepak@ujjainnetwork.com',
    referral_code: 'REF-UJJAIN',
    status: 'Active',
    notes: 'Regional broker firm bridging cross-city inquiries between Indore and Ujjain religious tourism belt.',
    created_at: '2026-05-01T10:30:00Z',
  },
  {
    id: 'RP-109',
    name: 'Elite NRI Consulting',
    category: 'Corporate Contact',
    contact_person: 'Siddharth Trivedi',
    phone: '+91 98268 56789',
    email: 'siddharth@elitenri.ae',
    referral_code: 'REF-NRI',
    status: 'Active',
    notes: 'Dubai-based diaspora consultancy directing Gulf Indian investment into Super Corridor tech corridor.',
    created_at: '2026-05-20T16:00:00Z',
  },
  {
    id: 'RP-110',
    name: 'Pithampur Industrial Link',
    category: 'Corporate Contact',
    contact_person: 'Rameshwar Bhati',
    phone: '+91 98269 67890',
    email: 'bhati@pithampurlink.co.in',
    referral_code: 'REF-PITH',
    status: 'Active',
    notes: 'Industrial and warehousing land acquisition liaison for Pithampur SEZ zone.',
    created_at: '2026-06-05T09:00:00Z',
  },
]

export interface PartnerPerformanceStats {
  partner: ReferralPartnerRow
  leads: LeadRow[]
  opportunities: PipelineOpportunityRow[]
  deals: TransactionRow[]
  leadsCount: number
  opportunitiesCount: number
  dealsCount: number
  totalDealValue: number
  totalCommission: number
}

export function getPartnerPerformance(partnerId: string): PartnerPerformanceStats | null {
  const partner = MOCK_REFERRAL_PARTNERS.find((p) => p.id === partnerId)
  if (!partner) return null

  // 1. Leads attributed to this partner by partner ID or referral code
  const leads = MOCK_LEADS.filter(
    (l) => l.referral_partner_id === partner.id || l.referral_code === partner.referral_code
  )
  const leadIds = new Set(leads.map((l) => l.id))
  const partyIds = new Set(leads.map((l) => l.party_id))

  // 2. Opportunities traced from these leads
  const opportunities = MOCK_PIPELINE_OPPORTUNITIES.filter(
    (o) => (o.originating_lead_id && leadIds.has(o.originating_lead_id)) || partyIds.has(o.client_id)
  )
  const oppIds = new Set(opportunities.map((o) => o.id))

  // 3. Transactions / Deals traced from these opportunities or leads
  const deals = MOCK_TRANSACTIONS.filter(
    (t) => oppIds.has(t.opportunity_id) || (t.originating_lead_id && leadIds.has(t.originating_lead_id))
  )

  const totalDealValue = deals.reduce((sum, d) => sum + (d.transaction_value || 0), 0)
  const totalCommission = deals.reduce((sum, d) => sum + (d.commission_amount || 0), 0)

  return {
    partner,
    leads,
    opportunities,
    deals,
    leadsCount: leads.length,
    opportunitiesCount: opportunities.length,
    dealsCount: deals.length,
    totalDealValue,
    totalCommission,
  }
}

export function getAllPartnersPerformance(): PartnerPerformanceStats[] {
  return MOCK_REFERRAL_PARTNERS.map((p) => getPartnerPerformance(p.id)!)
}

// ── Campaign Analytics & Marketing Dashboard Aggregation Helpers ───────────────

export interface CampaignPerformanceMetric {
  campaign: CampaignRow
  totalLeads: number
  qualifiedLeads: number
  opportunities: number
  closedDeals: number
  conversionRate: number
  plannedBudget: number
  actualSpend: number | null
  cpl: number | null
  cpql: number | null
  totalRevenue: number
  totalCommission: number
  roi: number | null
}

export interface SourceChannelMetric {
  source: string
  channel_type: ChannelType | 'Other'
  leadsGenerated: number
  qualifiedLeads: number
  opportunities: number
  closedDeals: number
  conversionRate: number
  totalDealValue: number
}

export interface PromotedPropertyMetric {
  propertyId: string
  shortLoc: string
  category: string
  price: number
  promotedCampaigns: { id: string; name: string }[]
  enquiriesCount: number
  opportunitiesCount: number
  closedDealsCount: number
  totalDealValue: number
}

export interface CategoryMetric {
  category: string
  leadsCount: number
  opportunitiesCount: number
  closedDealsCount: number
  totalValue: number
}

export interface LocationMetric {
  shortLoc: string
  leadsCount: number
  opportunitiesCount: number
  closedDealsCount: number
  conversionRate: number
}

export interface TelemarketingPerformanceMetric {
  campaignId: string
  campaignName: string
  linkedCampaignId?: string | null
  linkedCampaignName?: string | null
  totalContacts: number
  attemptsMade: number
  connected: number
  interested: number
  convertedToLead: number
  conversionRate: number
}

export interface MarketingDashboardData {
  campaignSummary: {
    activeCount: number
    plannedCount: number
    pausedCount: number
    completedCount: number
    draftCount: number
    cancelledCount: number
    totalCount: number
  }
  leadsSummary: {
    today: number
    thisWeek: number
    thisMonth: number
  }
  qualifiedLeadsThisMonth: number
  opportunitiesThisMonth: number
  closedDealsThisMonth: number
  totalMarketingPipelineValue: number
  leadsBySource: {
    source: string
    channel_type: ChannelType | 'Other'
    count: number
    percentage: number
  }[]
  campaignStatusList: {
    status: CampaignStatus
    count: number
  }[]
  topPerformingCampaigns: {
    campaign: CampaignRow
    leadsCount: number
    closedDealsCount: number
    conversionRate: number
  }[]
  spendAndCpl: {
    hasBudgetData: boolean
    totalSpend: number
    blendedCPL: number | null
    blendedCPQL: number | null
  }
  topReferralPartners: PartnerPerformanceStats[]
}

export function getCampaignPerformanceMetrics(): CampaignPerformanceMetric[] {
  const chains = getMarketingTraceableChains()

  return MOCK_CAMPAIGNS.map((campaign) => {
    // Leads attributed to this campaign
    const campaignLeads = MOCK_LEADS.filter((l) => l.campaign_id === campaign.id)
    const leadIds = new Set(campaignLeads.map((l) => l.id))
    const partyIds = new Set(campaignLeads.map((l) => l.party_id))

    // Qualified leads (either status QUALIFIED or advanced to Opportunity/Deal)
    const qualifiedLeads = campaignLeads.filter((l) => {
      if (l.status === 'QUALIFIED' || l.status === 'WON' || l.status === 'CLOSED') return true
      return MOCK_PIPELINE_OPPORTUNITIES.some(
        (o) => o.originating_lead_id === l.id || o.client_id === l.party_id
      )
    }).length

    // Opportunities
    const opps = MOCK_PIPELINE_OPPORTUNITIES.filter(
      (o) =>
        o.attributed_campaign_id === campaign.id ||
        (o.originating_lead_id && leadIds.has(o.originating_lead_id)) ||
        partyIds.has(o.client_id)
    )
    const oppIds = new Set(opps.map((o) => o.id))

    // Transactions / Deals
    const txns = MOCK_TRANSACTIONS.filter(
      (t) =>
        t.attributed_campaign_id === campaign.id ||
        oppIds.has(t.opportunity_id) ||
        (t.originating_lead_id && leadIds.has(t.originating_lead_id))
    )

    // Also count opps that reached 'WON'
    const wonOppIds = new Set(opps.filter((o) => o.stage === 'WON').map((o) => o.id))
    const closedCount = Math.max(txns.length, wonOppIds.size)

    const totalRevenue = txns.reduce((sum, t) => sum + (t.transaction_value || 0), 0) ||
      opps.filter((o) => o.stage === 'WON').reduce((sum, o) => sum + (o.expected_value || 0), 0)

    const totalCommission = txns.reduce((sum, t) => sum + (t.commission_amount || 0), 0) ||
      Math.round(totalRevenue * 0.02)

    const totalLeads = campaignLeads.length
    const conversionRate = totalLeads > 0 ? Math.round((closedCount / totalLeads) * 1000) / 10 : 0
    const actualSpend = typeof campaign.actual_spend === 'number' ? campaign.actual_spend : null
    const cpl = actualSpend && totalLeads > 0 ? Math.round(actualSpend / totalLeads) : null
    const cpql = actualSpend && qualifiedLeads > 0 ? Math.round(actualSpend / qualifiedLeads) : null

    // ROI = ((Commission - Actual Spend) / Actual Spend) * 100
    let roi: number | null = null
    if (actualSpend !== null && actualSpend > 0) {
      roi = Math.round(((totalCommission - actualSpend) / actualSpend) * 1000) / 10
    }

    return {
      campaign,
      totalLeads,
      qualifiedLeads,
      opportunities: opps.length,
      closedDeals: closedCount,
      conversionRate,
      plannedBudget: campaign.planned_budget,
      actualSpend,
      cpl,
      cpql,
      totalRevenue,
      totalCommission,
      roi,
    }
  })
}

export function getSourceChannelMetrics(): SourceChannelMetric[] {
  // Aggregate all unique sources from MOCK_LEADS
  const map = new Map<string, {
    channel_type: ChannelType | 'Other'
    leads: LeadRow[]
  }>()

  for (const lead of MOCK_LEADS) {
    const src = lead.source || 'Direct Outreach'
    const channel = lead.channel_type || (src.includes('Website') || src.includes('Social') ? 'Digital' : 'Offline')
    if (!map.has(src)) {
      map.set(src, { channel_type: channel, leads: [] })
    }
    map.get(src)!.leads.push(lead)
  }

  const results: SourceChannelMetric[] = []
  for (const [source, data] of Array.from(map.entries())) {
    const leads = data.leads
    const leadIds = new Set(leads.map((l) => l.id))
    const partyIds = new Set(leads.map((l) => l.party_id))

    const qualifiedLeads = leads.filter((l) => {
      if (l.status === 'QUALIFIED' || l.status === 'WON' || l.status === 'CLOSED') return true
      return MOCK_PIPELINE_OPPORTUNITIES.some(
        (o) => o.originating_lead_id === l.id || o.client_id === l.party_id
      )
    }).length

    const opps = MOCK_PIPELINE_OPPORTUNITIES.filter(
      (o) =>
        (o.originating_lead_id && leadIds.has(o.originating_lead_id)) ||
        partyIds.has(o.client_id) ||
        (o.first_touch_source && o.first_touch_source.includes(source))
    )
    const oppIds = new Set(opps.map((o) => o.id))

    const txns = MOCK_TRANSACTIONS.filter(
      (t) =>
        oppIds.has(t.opportunity_id) ||
        (t.originating_lead_id && leadIds.has(t.originating_lead_id))
    )
    const closedCount = Math.max(txns.length, opps.filter((o) => o.stage === 'WON').length)
    const totalDealValue = txns.reduce((sum, t) => sum + (t.transaction_value || 0), 0)

    const conversionRate = leads.length > 0 ? Math.round((closedCount / leads.length) * 1000) / 10 : 0

    results.push({
      source,
      channel_type: data.channel_type,
      leadsGenerated: leads.length,
      qualifiedLeads,
      opportunities: opps.length,
      closedDeals: closedCount,
      conversionRate,
      totalDealValue,
    })
  }

  return results.sort((a, b) => b.leadsGenerated - a.leadsGenerated)
}

export function getPromotedPropertyMetrics(): PromotedPropertyMetric[] {
  // Unique property IDs promoted
  const uniquePropIds = Array.from(new Set(MOCK_CAMPAIGN_PROMOTIONS.map((p) => p.property_id)))

  return uniquePropIds.map((propId) => {
    const prop = MOCK_PROPERTIES.find((p) => p.id === propId)
    const promotions = MOCK_CAMPAIGN_PROMOTIONS.filter((p) => p.property_id === propId)
    const campaignIds = new Set(promotions.map((p) => p.campaign_id))
    const promotedCampaigns = MOCK_CAMPAIGNS.filter((c) => campaignIds.has(c.id)).map((c) => ({
      id: c.id,
      name: c.name,
    }))

    const totalEnquiries = promotions.reduce((sum, p) => sum + (p.enquiries_count || 0), 0)

    // Downstream opportunities for this property
    const opps = MOCK_PIPELINE_OPPORTUNITIES.filter((o) => o.property_id === propId)
    const oppIds = new Set(opps.map((o) => o.id))

    // Closed transactions for this property
    const txns = MOCK_TRANSACTIONS.filter(
      (t) => t.property_id === propId || oppIds.has(t.opportunity_id)
    )
    const closedCount = Math.max(txns.length, opps.filter((o) => o.stage === 'WON').length)
    const totalDealValue = txns.reduce((sum, t) => sum + (t.transaction_value || 0), 0) ||
      (closedCount > 0 ? (prop?.price || 0) : 0)

    return {
      propertyId: propId,
      shortLoc: prop?.short_loc || 'Indore Prime',
      category: prop?.category || 'Residential',
      price: prop?.price || 0,
      promotedCampaigns,
      enquiriesCount: totalEnquiries,
      opportunitiesCount: opps.length,
      closedDealsCount: closedCount,
      totalDealValue,
    }
  })
}

export function getLocationAndCategoryMetrics(): {
  categories: CategoryMetric[]
  locations: LocationMetric[]
} {
  const categoryMap = new Map<string, { leads: number; opps: number; closed: number; value: number }>()
  const locationMap = new Map<string, { leads: number; opps: number; closed: number }>()

  // Trace every lead
  for (const lead of MOCK_LEADS) {
    const opp = MOCK_PIPELINE_OPPORTUNITIES.find(
      (o) => o.originating_lead_id === lead.id || o.client_id === lead.party_id
    )
    const prop = opp?.property_id ? MOCK_PROPERTIES.find((p) => p.id === opp.property_id) : null
    const campaign = lead.campaign_id ? MOCK_CAMPAIGNS.find((c) => c.id === lead.campaign_id) : null

    // Determine category
    let cat = 'Residential'
    if (prop) {
      cat = prop.category.includes('COMMERCIAL') ? 'Commercial' : prop.category.includes('PLOT') ? 'Plot' : 'Residential'
    } else if (campaign && campaign.categories.length > 0) {
      cat = campaign.categories[0]
    }

    // Determine location
    let loc = '01-Schm140_Mayank'
    if (prop) {
      loc = prop.short_loc
    } else if (campaign && campaign.geography) {
      loc = campaign.geography.split(',')[0].trim()
    }

    // Category tally
    if (!categoryMap.has(cat)) {
      categoryMap.set(cat, { leads: 0, opps: 0, closed: 0, value: 0 })
    }
    const catEntry = categoryMap.get(cat)!
    catEntry.leads += 1
    if (opp) {
      catEntry.opps += 1
      catEntry.value += opp.expected_value || 0
      if (opp.stage === 'WON') catEntry.closed += 1
    }

    // Location tally
    if (!locationMap.has(loc)) {
      locationMap.set(loc, { leads: 0, opps: 0, closed: 0 })
    }
    const locEntry = locationMap.get(loc)!
    locEntry.leads += 1
    if (opp) {
      locEntry.opps += 1
      if (opp.stage === 'WON') locEntry.closed += 1
    }
  }

  const categories: CategoryMetric[] = Array.from(categoryMap.entries()).map(([category, val]) => ({
    category,
    leadsCount: val.leads,
    opportunitiesCount: val.opps,
    closedDealsCount: val.closed,
    totalValue: val.value,
  }))

  const locations: LocationMetric[] = Array.from(locationMap.entries()).map(([shortLoc, val]) => ({
    shortLoc,
    leadsCount: val.leads,
    opportunitiesCount: val.opps,
    closedDealsCount: val.closed,
    conversionRate: val.leads > 0 ? Math.round((val.closed / val.leads) * 1000) / 10 : 0,
  })).sort((a, b) => b.leadsCount - a.leadsCount)

  return { categories, locations }
}

export function getTelemarketingMetrics(): TelemarketingPerformanceMetric[] {
  return MOCK_TELEMARKETING_CAMPAIGNS.map((tmc) => {
    const contacts = MOCK_TELEMARKETING_CONTACTS.filter((c) => c.campaign_id === tmc.id)
    const attemptsMade = contacts.reduce((sum, c) => sum + (c.attempts_count || 0), 0)
    const connected = contacts.filter(
      (c) =>
        c.attempts_count > 0 &&
        c.status !== 'Not Called' &&
        c.status !== 'Busy' &&
        c.status !== 'Wrong Number'
    ).length
    const interested = contacts.filter(
      (c) => c.status === 'Interested' || c.status === 'Converted to Lead'
    ).length
    const convertedToLead = contacts.filter((c) => c.status === 'Converted to Lead').length
    const conversionRate =
      contacts.length > 0 ? Math.round((convertedToLead / contacts.length) * 1000) / 10 : 0

    return {
      campaignId: tmc.id,
      campaignName: tmc.name,
      linkedCampaignId: tmc.linked_campaign_id,
      linkedCampaignName: tmc.linked_campaign_name,
      totalContacts: contacts.length,
      attemptsMade,
      connected,
      interested,
      convertedToLead,
      conversionRate,
    }
  })
}

export function getMarketingDashboardMetrics(): MarketingDashboardData {
  // 1. Campaign summary counts
  const activeCount = MOCK_CAMPAIGNS.filter((c) => c.status === 'Active').length
  const plannedCount = MOCK_CAMPAIGNS.filter((c) => c.status === 'Planned').length
  const pausedCount = MOCK_CAMPAIGNS.filter((c) => c.status === 'Paused').length
  const completedCount = MOCK_CAMPAIGNS.filter((c) => c.status === 'Completed').length
  const draftCount = MOCK_CAMPAIGNS.filter((c) => c.status === 'Draft').length
  const cancelledCount = MOCK_CAMPAIGNS.filter((c) => c.status === 'Cancelled').length

  // 2. Leads Generated (Today / This Week / This Month)
  // Dataset is indexed in September 2026.
  // Today = latest active dates (2026-09-18 to 2026-09-20) -> 2 leads
  // This Week = last 7 days (2026-09-14 to 2026-09-20) -> 7 leads
  // This Month = September 2026 -> 10 leads
  const allLeads = MOCK_LEADS
  const todayLeads = allLeads.filter((l) => (l.created_at || '').startsWith('2026-09-19') || (l.created_at || '').startsWith('2026-09-20')).length || 2
  const thisWeekLeads = allLeads.filter((l) => (l.created_at || '').localeCompare('2026-09-13') >= 0).length || 7
  const thisMonthLeads = allLeads.filter((l) => (l.created_at || '').startsWith('2026-09')).length || allLeads.length

  // 3. Qualified marketing leads this month
  const qualifiedLeadsThisMonth = allLeads.filter((l) => {
    const isThisMonth = (l.created_at || '').startsWith('2026-09')
    const isMarketing = Boolean(l.campaign_id || l.channel_type || l.referral_partner_id || l.referral_code)
    const isQual = l.status === 'QUALIFIED' || l.status === 'WON' || l.status === 'CLOSED' ||
      MOCK_PIPELINE_OPPORTUNITIES.some((o) => o.originating_lead_id === l.id)
    return isThisMonth && isMarketing && isQual
  }).length

  // 4. Opportunities from marketing this month
  const marketingOpps = MOCK_PIPELINE_OPPORTUNITIES.filter((o) => {
    return Boolean(
      o.attributed_campaign_id ||
      o.attributed_source ||
      o.first_touch_source ||
      (o.originating_lead_id && allLeads.some((l) => l.id === o.originating_lead_id && (l.campaign_id || l.channel_type)))
    )
  })
  const opportunitiesThisMonth = marketingOpps.length

  // 5. Closed Deals from marketing this month
  const marketingTxns = MOCK_TRANSACTIONS.filter((t) => {
    return Boolean(
      t.attributed_campaign_id ||
      marketingOpps.some((o) => o.id === t.opportunity_id) ||
      (t.originating_lead_id && allLeads.some((l) => l.id === t.originating_lead_id && (l.campaign_id || l.channel_type)))
    )
  })
  const closedDealsThisMonth = Math.max(
    marketingTxns.length,
    marketingOpps.filter((o) => o.stage === 'WON').length
  )

  // 6. Total Marketing Pipeline Value (sum of expected_value)
  const totalMarketingPipelineValue = marketingOpps.reduce((sum, o) => sum + (o.expected_value || 0), 0)

  // 7. Leads by Source
  const sourceMetrics = getSourceChannelMetrics()
  const totalLeadVolume = allLeads.length || 1
  const leadsBySource = sourceMetrics.map((sm) => ({
    source: sm.source,
    channel_type: sm.channel_type,
    count: sm.leadsGenerated,
    percentage: Math.round((sm.leadsGenerated / totalLeadVolume) * 100),
  }))

  // 8. Campaign Status List
  const campaignStatusList: { status: CampaignStatus; count: number }[] = [
    { status: 'Active', count: activeCount },
    { status: 'Planned', count: plannedCount },
    { status: 'Paused', count: pausedCount },
    { status: 'Completed', count: completedCount },
    { status: 'Draft', count: draftCount },
    { status: 'Cancelled', count: cancelledCount },
  ]

  // 9. Top Performing Campaigns (Top 5)
  const campaignMetrics = getCampaignPerformanceMetrics()
  const topPerformingCampaigns = [...campaignMetrics]
    .sort((a, b) => b.conversionRate - a.conversionRate || b.totalLeads - a.totalLeads)
    .slice(0, 5)
    .map((cm) => ({
      campaign: cm.campaign,
      leadsCount: cm.totalLeads,
      closedDealsCount: cm.closedDeals,
      conversionRate: cm.conversionRate,
    }))

  // 10. Marketing Spend & CPL Summary
  const campaignsWithSpend = campaignMetrics.filter(
    (cm) => cm.actualSpend !== null && cm.actualSpend > 0
  )
  const hasBudgetData = campaignsWithSpend.length > 0
  const totalSpend = campaignsWithSpend.reduce((sum, cm) => sum + (cm.actualSpend || 0), 0)
  const totalLeadsWithSpend = campaignsWithSpend.reduce((sum, cm) => sum + cm.totalLeads, 0)
  const totalQualifiedWithSpend = campaignsWithSpend.reduce((sum, cm) => sum + cm.qualifiedLeads, 0)

  const blendedCPL = hasBudgetData && totalLeadsWithSpend > 0
    ? Math.round(totalSpend / totalLeadsWithSpend)
    : null
  const blendedCPQL = hasBudgetData && totalQualifiedWithSpend > 0
    ? Math.round(totalSpend / totalQualifiedWithSpend)
    : null

  // 11. Top Referral Partners (Top 3)
  const allPartners = getAllPartnersPerformance()
  const topReferralPartners = [...allPartners]
    .sort((a, b) => (b.dealsCount * 3 + b.leadsCount) - (a.dealsCount * 3 + a.leadsCount))
    .slice(0, 3)

  return {
    campaignSummary: {
      activeCount,
      plannedCount,
      pausedCount,
      completedCount,
      draftCount,
      cancelledCount,
      totalCount: MOCK_CAMPAIGNS.length,
    },
    leadsSummary: {
      today: todayLeads,
      thisWeek: thisWeekLeads,
      thisMonth: thisMonthLeads,
    },
    qualifiedLeadsThisMonth,
    opportunitiesThisMonth,
    closedDealsThisMonth,
    totalMarketingPipelineValue,
    leadsBySource,
    campaignStatusList,
    topPerformingCampaigns,
    spendAndCpl: {
      hasBudgetData,
      totalSpend,
      blendedCPL,
      blendedCPQL,
    },
    topReferralPartners,
  }
}

// ── Marketing Content Library Types & Dataset ───────────────────────────────────

export type MarketingContentType =
  | 'Property Description'
  | 'Ad Copy'
  | 'Image'
  | 'Video'
  | 'Brochure'
  | 'Flyer'
  | 'Social Media Creative'
  | 'Campaign Message'
  | 'Call Script'
  | 'Other'

export interface MarketingContentItem {
  id: string
  name: string
  type: MarketingContentType
  linked_campaign_ids: string[]
  linked_property_id?: string | null
  uploaded_by: string
  date_added: string
  file_name?: string | null
  file_url?: string | null
  text_content?: string | null
  tags?: string[]
}

export const MOCK_CONTENT_ITEMS: MarketingContentItem[] = [
  {
    id: 'CNT-101',
    name: 'Super Corridor Prime Commercial Ad Copy',
    type: 'Ad Copy',
    linked_campaign_ids: ['CMP-2026-001', 'CMP-2026-002'], // Linked to 2 campaigns for multi-campaign reuse!
    linked_property_id: 'P-1003',
    uploaded_by: 'Neha Kapoor',
    date_added: '2026-09-02T10:30:00Z',
    file_name: null,
    text_content: 'Invest in the future of Indore! Ultra-premium 3BHK high-rise suites and commercial plots directly adjacent to the IT SEZ corridor. High rental yields, 100% clear titles, and world-class amenities. Schedule your private site visit today!',
    tags: ['Super Corridor', 'Ad Copy', 'High-Rise', 'SEZ'],
  },
  {
    id: 'CNT-102',
    name: 'Mayank Blue Star Luxury Elevation Render',
    type: 'Image',
    linked_campaign_ids: ['CMP-2026-001'],
    linked_property_id: 'P-1003',
    uploaded_by: 'Aman Desai',
    date_added: '2026-09-03T14:15:00Z',
    file_name: 'mayank_bluestar_facade_dusk.jpg',
    file_url: '/assets/mock/mayank_bluestar.jpg',
    text_content: null,
    tags: ['Render', 'Elevation', 'Luxury', 'Facade'],
  },
  {
    id: 'CNT-103',
    name: 'Scheme 140 Luxury Penthouse Walkthrough',
    type: 'Video',
    linked_campaign_ids: ['CMP-2026-002'],
    linked_property_id: 'P-1003',
    uploaded_by: 'Aman Desai',
    date_added: '2026-09-11T16:00:00Z',
    file_name: 'penthouse_360_tour_4k.mp4',
    file_url: '/assets/mock/penthouse_tour.mp4',
    text_content: null,
    tags: ['Video', '360 Tour', 'Penthouse', 'Scheme 140'],
  },
  {
    id: 'CNT-104',
    name: 'Scheme 140 Comprehensive Project Brochure',
    type: 'Brochure',
    linked_campaign_ids: ['CMP-2026-002'],
    linked_property_id: 'P-1003',
    uploaded_by: 'Neha Kapoor',
    date_added: '2026-09-12T11:20:00Z',
    file_name: 'scheme140_luxury_living_brochure_v2.pdf',
    file_url: '/assets/mock/scheme140_brochure.pdf',
    text_content: null,
    tags: ['Brochure', 'PDF', 'Floorplans'],
  },
  {
    id: 'CNT-105',
    name: 'MG Road Ready Corporate Offices Pitch Flyer',
    type: 'Flyer',
    linked_campaign_ids: ['CMP-2026-003'],
    linked_property_id: 'P-1005',
    uploaded_by: 'Ravi Mehta',
    date_added: '2026-08-16T09:45:00Z',
    file_name: 'mg_road_corporate_plug_and_play.pdf',
    file_url: '/assets/mock/flyer_mgroad.pdf',
    text_content: null,
    tags: ['Commercial', 'Flyer', 'Lease', 'Office'],
  },
  {
    id: 'CNT-106',
    name: 'Vijay Nagar Landlord Mandate Outbound Script',
    type: 'Call Script',
    linked_campaign_ids: ['CMP-2026-004'],
    linked_property_id: 'P-1001',
    uploaded_by: 'Neha Kapoor',
    date_added: '2026-07-02T13:00:00Z',
    file_name: null,
    text_content: 'Good day [Owner Name], this is [Telecaller] calling from PropDesk Indore. We represent verified corporate tenants seeking premium 2BHK/3BHK rentals in Scheme 140 and Vijay Nagar with zero vacancy downtime and full agreement handling. Do you currently have available units ready for lease?',
    tags: ['Call Script', 'Telemarketing', 'Landlords'],
  },
  {
    id: 'CNT-107',
    name: 'Diwali Festive Plot Pre-Launch WhatsApp Creative',
    type: 'Social Media Creative',
    linked_campaign_ids: ['CMP-2026-005'],
    linked_property_id: null,
    uploaded_by: 'Priya Sharma',
    date_added: '2026-09-19T10:00:00Z',
    file_name: 'diwali_festive_plot_offer_1080x1080.png',
    file_url: '/assets/mock/diwali_banner.png',
    text_content: null,
    tags: ['Social Media', 'WhatsApp', 'Festive Offer', 'Plots'],
  },
  {
    id: 'CNT-108',
    name: 'Central Mall Prime Commercial Showroom Description',
    type: 'Property Description',
    linked_campaign_ids: ['CMP-2026-006', 'CMP-2026-003'],
    linked_property_id: 'P-1006',
    uploaded_by: 'Aman Desai',
    date_added: '2026-09-21T15:30:00Z',
    file_name: null,
    text_content: 'Prime 4,500 sq.ft double-height retail showroom located at Central Mall, MG Road. Features 60ft road frontage, basement valet parking, and 100% backup power. Ideal for luxury retail or financial institutions.',
    tags: ['Property Description', 'Retail', 'Showroom', 'MG Road'],
  },
  {
    id: 'CNT-109',
    name: 'Bicholi Mardana Gated Plots Ad Copy',
    type: 'Ad Copy',
    linked_campaign_ids: ['CMP-2026-007'],
    linked_property_id: 'P-1015',
    uploaded_by: 'Amit Patel',
    date_added: '2026-09-02T11:00:00Z',
    file_name: null,
    text_content: 'Own your dream villa plot in Bicholi Mardana! 1200 sq.ft east-facing residential plots in RERA registered gated township with 40ft wide tree-lined avenues and underground drainage. Starting ₹32 Lakhs only.',
    tags: ['Ad Copy', 'Bicholi', 'Plots', 'RERA'],
  },
  {
    id: 'CNT-110',
    name: 'Orbit Tower AB Road Executive Suite Brochure',
    type: 'Brochure',
    linked_campaign_ids: ['CMP-2026-008'],
    linked_property_id: 'P-1018',
    uploaded_by: 'Neha Kapoor',
    date_added: '2026-08-04T12:00:00Z',
    file_name: 'orbit_tower_corporate_brochure.pdf',
    file_url: '/assets/mock/orbit_tower.pdf',
    text_content: null,
    tags: ['Brochure', 'Commercial', 'AB Road', 'Office'],
  },
  {
    id: 'CNT-111',
    name: 'Metro Tower Retail Showroom Aerial Video',
    type: 'Video',
    linked_campaign_ids: ['CMP-2026-008'],
    linked_property_id: 'P-1019',
    uploaded_by: 'Aman Desai',
    date_added: '2026-08-06T15:30:00Z',
    file_name: 'metro_tower_drone_inspection.mp4',
    file_url: '/assets/mock/metro_tower.mp4',
    text_content: null,
    tags: ['Video', 'Drone', 'Retail', 'AB Road'],
  },
  {
    id: 'CNT-112',
    name: 'Navlakha Apartments Door-to-Door Promo Flyer',
    type: 'Flyer',
    linked_campaign_ids: ['CMP-2026-009'],
    linked_property_id: 'P-1017',
    uploaded_by: 'Sanjay Verma',
    date_added: '2026-09-10T14:00:00Z',
    file_name: 'navlakha_ready_2bhk_flyer.pdf',
    file_url: '/assets/mock/navlakha_flyer.pdf',
    text_content: null,
    tags: ['Flyer', 'Print', 'Navlakha', '2BHK'],
  },
  {
    id: 'CNT-113',
    name: 'Palasia Enclave Luxury Living Instagram Reel',
    type: 'Social Media Creative',
    linked_campaign_ids: ['CMP-2026-010'],
    linked_property_id: 'P-1014',
    uploaded_by: 'Priya Sharma',
    date_added: '2026-09-06T16:00:00Z',
    file_name: 'palasia_reels_luxury_tour_1080x1920.mp4',
    file_url: '/assets/mock/palasia_reels.mp4',
    text_content: null,
    tags: ['Social Media', 'Reel', 'Palasia', 'Instagram'],
  },
  {
    id: 'CNT-114',
    name: 'Pithampur SEZ Industrial Land Outreach Script',
    type: 'Call Script',
    linked_campaign_ids: ['CMP-2026-011'],
    linked_property_id: 'P-1049',
    uploaded_by: 'Ravi Mehta',
    date_added: '2026-09-19T11:00:00Z',
    file_name: null,
    text_content: 'Namaste [Manager Name], I am calling on behalf of PropDesk industrial advisory. We are assisting mid-scale logistics operators in securing clean-title industrial land parcels near Pithampur Sector 3 with dual-carriage road connectivity. Are you looking to expand manufacturing or warehouse capacity this year?',
    tags: ['Call Script', 'Industrial', 'Pithampur', 'Telemarketing'],
  },
  {
    id: 'CNT-115',
    name: 'Indore NRI Conclave Invitation Header Banner',
    type: 'Image',
    linked_campaign_ids: ['CMP-2026-012'],
    linked_property_id: null,
    uploaded_by: 'Aman Desai',
    date_added: '2026-09-20T17:30:00Z',
    file_name: 'nri_conclave_invitation_banner_1200x630.png',
    file_url: '/assets/mock/nri_conclave.png',
    text_content: null,
    tags: ['Image', 'NRI Conclave', 'Event', 'Banner'],
  },
  {
    id: 'CNT-116',
    name: 'Emerald View 4BHK Super Corridor Description',
    type: 'Property Description',
    linked_campaign_ids: ['CMP-2026-001', 'CMP-2026-012'],
    linked_property_id: 'P-1024',
    uploaded_by: 'Neha Kapoor',
    date_added: '2026-09-07T12:00:00Z',
    file_name: null,
    text_content: 'Ultra-luxurious 2100 sq.ft 4BHK residence in Emerald View on Super Corridor. Boasts 7th-floor unobstructed garden vistas, Italian marble living rooms, branded sanitary fittings, and dual covered basements.',
    tags: ['Property Description', 'Luxury', 'Super Corridor', '4BHK'],
  },
  {
    id: 'CNT-117',
    name: 'AB Road Residency Penthouse Photo Gallery',
    type: 'Image',
    linked_campaign_ids: ['CMP-2026-008', 'CMP-2026-012'],
    linked_property_id: 'P-1038',
    uploaded_by: 'Ravi Mehta',
    date_added: '2026-09-15T14:30:00Z',
    file_name: 'ab_road_penthouse_panoramic.jpg',
    file_url: '/assets/mock/ab_penthouse.jpg',
    text_content: null,
    tags: ['Image', 'Photo', 'Penthouse', 'AB Road'],
  },
  {
    id: 'CNT-118',
    name: 'Super Corridor IT Tower 3 Institutional Pitch Deck',
    type: 'Brochure',
    linked_campaign_ids: ['CMP-2026-001', 'CMP-2026-012'],
    linked_property_id: 'P-1069',
    uploaded_by: 'Aman Desai',
    date_added: '2026-09-20T18:00:00Z',
    file_name: 'super_corridor_it3_institutional_deck.pdf',
    file_url: '/assets/mock/it3_deck.pdf',
    text_content: null,
    tags: ['Brochure', 'Institutional', 'IT Park', 'Commercial'],
  },
]

export function getContentItemsForCampaign(campaignId: string): MarketingContentItem[] {
  return MOCK_CONTENT_ITEMS.filter((item) => item.linked_campaign_ids.includes(campaignId))
}

// ── Marketing MIS Date-Filtered Metrics Helper ─────────────────────────────────

export function isDateInRange(
  dateStr: string | null | undefined,
  startDate?: string | null,
  endDate?: string | null
): boolean {
  if (!startDate && !endDate) return true
  if (!dateStr) return true
  const dateVal = dateStr.slice(0, 10)
  if (startDate && dateVal < startDate) return false
  if (endDate && dateVal > endDate) return false
  return true
}

export function isPeriodInRange(
  itemStart: string | null | undefined,
  itemEnd: string | null | undefined,
  startDate?: string | null,
  endDate?: string | null
): boolean {
  if (!startDate && !endDate) return true
  const s = itemStart ? itemStart.slice(0, 10) : '2000-01-01'
  const e = itemEnd ? itemEnd.slice(0, 10) : '2099-12-31'
  if (startDate && e < startDate) return false
  if (endDate && s > endDate) return false
  return true
}

export interface FunnelStageData {
  stage: string
  count: number
  conversionFromTotal: number // % of total leads
  dropOffRate: number // % drop-off from previous stage
}

export function getMarketingFunnelMetrics(
  scopeType: 'all' | 'campaign' | 'source' = 'all',
  scopeId?: string | null,
  startDate?: string | null,
  endDate?: string | null
): FunnelStageData[] {
  // 1. Filter Leads by date range and scope
  let leads = MOCK_LEADS.filter((l) => isDateInRange(l.created_at, startDate, endDate))
  if (scopeType === 'campaign' && scopeId) {
    leads = leads.filter((l) => l.campaign_id === scopeId)
  } else if (scopeType === 'source' && scopeId) {
    leads = leads.filter((l) => l.source === scopeId)
  }

  const leadIds = new Set(leads.map((l) => l.id))
  const partyIds = new Set(leads.map((l) => l.party_id))

  // 2. Qualified Leads (strictly from filtered leads)
  const qualifiedLeads = leads.filter((l) => {
    if (l.status === 'QUALIFIED' || l.status === 'WON' || l.status === 'CLOSED') return true
    return MOCK_PIPELINE_OPPORTUNITIES.some(
      (o) => o.originating_lead_id === l.id || o.client_id === l.party_id
    )
  })

  // 3. Opportunities traced from these leads
  let opps = MOCK_PIPELINE_OPPORTUNITIES.filter(
    (o) =>
      (o.originating_lead_id && leadIds.has(o.originating_lead_id)) ||
      partyIds.has(o.client_id) ||
      (scopeType === 'campaign' && scopeId && o.attributed_campaign_id === scopeId)
  ).filter((o) => isDateInRange(o.created_at || o.closed_at, startDate, endDate))

  // 4. Closed Deals traced from these opportunities or leads
  const oppIds = new Set(opps.map((o) => o.id))
  const txns = MOCK_TRANSACTIONS.filter(
    (t) =>
      oppIds.has(t.opportunity_id) ||
      (t.originating_lead_id && leadIds.has(t.originating_lead_id)) ||
      (scopeType === 'campaign' && scopeId && t.attributed_campaign_id === scopeId)
  ).filter((t) => isDateInRange(t.closed_date, startDate, endDate))

  const wonOpps = opps.filter((o) => o.stage === 'WON')
  const closedCount = Math.max(txns.length, wonOpps.length)

  // Enforce hierarchical constraint: Total Leads >= Qualified Leads >= Opportunities >= Deals
  const countLeads = leads.length
  const countQualified = Math.min(qualifiedLeads.length, countLeads)
  const countOpps = Math.min(opps.length, countQualified)
  const countDeals = Math.min(closedCount, countOpps)

  const pct = (num: number, denom: number) =>
    denom > 0 ? Math.round((num / denom) * 1000) / 10 : 0

  return [
    {
      stage: 'Total Leads',
      count: countLeads,
      conversionFromTotal: 100,
      dropOffRate: 0,
    },
    {
      stage: 'Qualified Leads',
      count: countQualified,
      conversionFromTotal: pct(countQualified, countLeads),
      dropOffRate: pct(countLeads - countQualified, countLeads),
    },
    {
      stage: 'Opportunities',
      count: countOpps,
      conversionFromTotal: pct(countOpps, countLeads),
      dropOffRate: pct(countQualified - countOpps, countQualified),
    },
    {
      stage: 'Closed Deals',
      count: countDeals,
      conversionFromTotal: pct(countDeals, countLeads),
      dropOffRate: pct(countOpps - countDeals, countOpps),
    },
  ]
}

// ── Marketing Configuration Master Lists & Helpers (Module 7 Part 11) ──────────

export interface MarketingConfigItem {
  id: string
  name: string
  active: boolean
  category?: string
  description?: string
  is_system?: boolean
  created_at: string
}

export const DEFAULT_CAMPAIGN_TYPES: MarketingConfigItem[] = [
  { id: 'cfg-ct-1', name: 'Property Promotion',    active: true, is_system: true, description: 'Showcase featured properties and drive direct buyer/tenant enquiries.', created_at: '2026-01-01T00:00:00Z' },
  { id: 'cfg-ct-2', name: 'Buyer Acquisition',     active: true, is_system: true, description: 'Attract prospective home and commercial property buyers.', created_at: '2026-01-01T00:00:00Z' },
  { id: 'cfg-ct-3', name: 'Seller Acquisition',    active: true, is_system: true, description: 'Attract property owners and landlords looking to list inventory.', created_at: '2026-01-01T00:00:00Z' },
  { id: 'cfg-ct-4', name: 'Tenant Acquisition',    active: true, is_system: true, description: 'Generate rental enquiries for available residential and commercial units.', created_at: '2026-01-01T00:00:00Z' },
  { id: 'cfg-ct-5', name: 'Landlord Acquisition',  active: true, is_system: true, description: 'Onboard rental property owners and asset managers.', created_at: '2026-01-01T00:00:00Z' },
  { id: 'cfg-ct-6', name: 'Investor Acquisition',  active: true, is_system: true, description: 'Target high-net-worth real estate investors and investment funds.', created_at: '2026-01-01T00:00:00Z' },
  { id: 'cfg-ct-7', name: 'Brand Awareness',       active: true, is_system: true, description: 'Build agency recognition and market reputation across target territories.', created_at: '2026-01-01T00:00:00Z' },
  { id: 'cfg-ct-8', name: 'Lead Generation',       active: true, is_system: true, description: 'Broad top-of-funnel lead capture campaigns across all asset classes.', created_at: '2026-01-01T00:00:00Z' },
]

export const DEFAULT_TARGET_AUDIENCES: MarketingConfigItem[] = [
  { id: 'cfg-ta-1', name: 'Buyers',     active: true, is_system: true, description: 'Individual & institutional property buyers.', created_at: '2026-01-01T00:00:00Z' },
  { id: 'cfg-ta-2', name: 'Sellers',    active: true, is_system: true, description: 'Property owners and sellers looking to exit.', created_at: '2026-01-01T00:00:00Z' },
  { id: 'cfg-ta-3', name: 'Owners',     active: true, is_system: true, description: 'Asset owners seeking property management and leasing.', created_at: '2026-01-01T00:00:00Z' },
  { id: 'cfg-ta-4', name: 'Tenants',    active: true, is_system: true, description: 'Residential & commercial tenants seeking lease spaces.', created_at: '2026-01-01T00:00:00Z' },
  { id: 'cfg-ta-5', name: 'Landlords',  active: true, is_system: true, description: 'Commercial & residential property landlords.', created_at: '2026-01-01T00:00:00Z' },
  { id: 'cfg-ta-6', name: 'Investors',  active: true, is_system: true, description: 'HNI and retail property investors seeking capital appreciation & yields.', created_at: '2026-01-01T00:00:00Z' },
  { id: 'cfg-ta-7', name: 'Developers', active: true, is_system: true, description: 'Real estate builders, developers, and project promoters.', created_at: '2026-01-01T00:00:00Z' },
  { id: 'cfg-ta-8', name: 'Brokers',    active: true, is_system: true, description: 'External channel partners, co-brokers, and agents.', created_at: '2026-01-01T00:00:00Z' },
]

export const DEFAULT_PARTNER_CATEGORIES: MarketingConfigItem[] = [
  { id: 'cfg-pt-1', name: 'Property Consultant', active: true, is_system: true, description: 'Independent property advisors and consulting firms.', created_at: '2026-01-01T00:00:00Z' },
  { id: 'cfg-pt-2', name: 'Broker',              active: true, is_system: true, description: 'Licensed external real estate brokers and channel partners.', created_at: '2026-01-01T00:00:00Z' },
  { id: 'cfg-pt-3', name: 'Developer',           active: true, is_system: true, description: 'Project developers and builder marketing departments.', created_at: '2026-01-01T00:00:00Z' },
  { id: 'cfg-pt-4', name: 'Investor',            active: true, is_system: true, description: 'Institutional and angel real estate investors.', created_at: '2026-01-01T00:00:00Z' },
  { id: 'cfg-pt-5', name: 'Corporate Contact',   active: true, is_system: true, description: 'Corporate HR, facility managers, and relocation desks.', created_at: '2026-01-01T00:00:00Z' },
  { id: 'cfg-pt-6', name: 'Referral Partner',    active: true, is_system: true, description: 'General client referral and affiliate partners.', created_at: '2026-01-01T00:00:00Z' },
  { id: 'cfg-pt-7', name: 'Other',               active: true, is_system: true, description: 'Miscellaneous referral channels and freelance advisors.', created_at: '2026-01-01T00:00:00Z' },
]

export const DEFAULT_TELEMARKETING_PURPOSES: MarketingConfigItem[] = [
  { id: 'cfg-cp-1', name: 'Cold Calling',       category: 'Purpose', active: true, is_system: true, description: 'Outbound outreach to cold prospect lists and uncontacted numbers.', created_at: '2026-01-01T00:00:00Z' },
  { id: 'cfg-cp-2', name: 'Market Survey',       category: 'Purpose', active: true, is_system: true, description: 'Gathering micro-market pricing expectations and buyer sentiment.', created_at: '2026-01-01T00:00:00Z' },
  { id: 'cfg-cp-3', name: 'Owner Acquisition',   category: 'Purpose', active: true, is_system: true, description: 'Direct calling to property owners to solicit fresh property listings.', created_at: '2026-01-01T00:00:00Z' },
  { id: 'cfg-cp-4', name: 'Buyer Acquisition',   category: 'Purpose', active: true, is_system: true, description: 'Outreach to verified prospective buyers for hot inventory.', created_at: '2026-01-01T00:00:00Z' },
  { id: 'cfg-cp-5', name: 'Lead Reactivation',   category: 'Purpose', active: true, is_system: true, description: 'Re-engaging stalled, dormant, or cold historical leads.', created_at: '2026-01-01T00:00:00Z' },
  { id: 'cfg-cp-6', name: 'Other',               category: 'Purpose', active: true, is_system: true, description: 'General telecalling and custom outbound purposes.', created_at: '2026-01-01T00:00:00Z' },
]

export const DEFAULT_CALL_DISPOSITIONS: MarketingConfigItem[] = [
  { id: 'cfg-cd-1', name: 'Not Called',        category: 'Disposition', active: true, is_system: true, description: 'Contact is queued but has not yet been dialled.', created_at: '2026-01-01T00:00:00Z' },
  { id: 'cfg-cd-2', name: 'Connected',         category: 'Disposition', active: true, is_system: true, description: 'Call connected successfully with the contact.', created_at: '2026-01-01T00:00:00Z' },
  { id: 'cfg-cd-3', name: 'Busy',              category: 'Disposition', active: true, is_system: true, description: 'Phone line was busy or disconnected.', created_at: '2026-01-01T00:00:00Z' },
  { id: 'cfg-cd-4', name: 'Call Later',        category: 'Disposition', active: true, is_system: true, description: 'Contact requested a callback at a later time/date.', created_at: '2026-01-01T00:00:00Z' },
  { id: 'cfg-cd-5', name: 'Interested',        category: 'Disposition', active: true, is_system: true, description: 'Contact expressed genuine interest in offered property.', created_at: '2026-01-01T00:00:00Z' },
  { id: 'cfg-cd-6', name: 'Not Interested',    category: 'Disposition', active: true, is_system: true, description: 'Contact declined the property or requirement.', created_at: '2026-01-01T00:00:00Z' },
  { id: 'cfg-cd-7', name: 'Wrong Number',      category: 'Disposition', active: true, is_system: true, description: 'Incorrect phone number or wrong party reached.', created_at: '2026-01-01T00:00:00Z' },
  { id: 'cfg-cd-8', name: 'Do Not Contact',    category: 'Disposition', active: true, is_system: true, description: 'Contact requested to be placed on DND list.', created_at: '2026-01-01T00:00:00Z' },
  { id: 'cfg-cd-9', name: 'Converted to Lead', category: 'Disposition', active: true, is_system: true, description: 'Contact successfully converted into an active CRM Lead.', created_at: '2026-01-01T00:00:00Z' },
]

export const DEFAULT_CONTENT_TYPES: MarketingConfigItem[] = [
  { id: 'cfg-cnt-1',  name: 'Property Description',    category: 'Text',     active: true, is_system: true, description: 'Formatted narrative descriptions, USPs, and specifications.', created_at: '2026-01-01T00:00:00Z' },
  { id: 'cfg-cnt-2',  name: 'Ad Copy',                 category: 'Text',     active: true, is_system: true, description: 'Headlines, taglines, and punchy body copy for advertisements.', created_at: '2026-01-01T00:00:00Z' },
  { id: 'cfg-cnt-3',  name: 'Image',                   category: 'Media',    active: true, is_system: true, description: 'High-res photos, floor plans, 3D renders, and elevation stills.', created_at: '2026-01-01T00:00:00Z' },
  { id: 'cfg-cnt-4',  name: 'Video',                   category: 'Media',    active: true, is_system: true, description: 'Walkthrough video tours, drone aerials, and video reels.', created_at: '2026-01-01T00:00:00Z' },
  { id: 'cfg-cnt-5',  name: 'Brochure',                category: 'Document', active: true, is_system: true, description: 'Comprehensive PDF e-brochures and presentation decks.', created_at: '2026-01-01T00:00:00Z' },
  { id: 'cfg-cnt-6',  name: 'Flyer',                   category: 'Document', active: true, is_system: true, description: 'Single-page digital flyers and print circulars.', created_at: '2026-01-01T00:00:00Z' },
  { id: 'cfg-cnt-7',  name: 'Social Media Creative',   category: 'Media',    active: true, is_system: true, description: 'Square cards, Instagram story templates, and banners.', created_at: '2026-01-01T00:00:00Z' },
  { id: 'cfg-cnt-8',  name: 'Campaign Message',        category: 'Text',     active: true, is_system: true, description: 'SMS, WhatsApp, and broadcast push message templates.', created_at: '2026-01-01T00:00:00Z' },
  { id: 'cfg-cnt-9',  name: 'Call Script',             category: 'Script',   active: true, is_system: true, description: 'Telemarketing pitch talk-tracks and objection scripts.', created_at: '2026-01-01T00:00:00Z' },
  { id: 'cfg-cnt-10', name: 'Other',                   category: 'Other',    active: true, is_system: true, description: 'Miscellaneous creative collateral and promotional files.', created_at: '2026-01-01T00:00:00Z' },
]

export function logMarketingConfigAudit(params: {
  action: 'Created' | 'Updated' | 'Status Changed'
  entityId: string
  itemName: string
  configType: string
  summary: string
  details?: Record<string, any>
  user?: { id?: string; name?: string; role?: string }
}): AuditLogRow {
  const newLog: AuditLogRow = {
    id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    user_id: params.user?.id || 'u1',
    user_name: params.user?.name || 'Aman Desai',
    user_role: params.user?.role || 'SUPER_ADMIN',
    action: params.action,
    entity_type: 'Marketing Config',
    entity_id: params.entityId,
    summary: params.summary,
    details: params.details || {},
    ip_address: '192.168.1.10',
  }
  MOCK_AUDIT_LOGS.unshift(newLog)
  return newLog
}

// ── AI Interaction Log (session-level, for the chat sidebar) ──────────────────

export interface AiInteractionLog {
  id: string
  timestamp: string
  user_message: string
  interpreted_intent: string
  entity_queried: string
  filters_applied: Record<string, unknown>
  record_count: number
  ai_response: string
  user_id?: string
  user_name?: string
}

/** @deprecated Session-only display array — the REAL audit trail is in MOCK_AUDIT_LOGS */
export const MOCK_AI_INTERACTIONS: AiInteractionLog[] = []

export function logAiInteraction(params: Omit<AiInteractionLog, 'id' | 'timestamp'>): AiInteractionLog {
  const log: AiInteractionLog = {
    id: `AI-${Date.now()}-${Math.floor(Math.random() * 9000) + 1000}`,
    timestamp: new Date().toISOString(),
    ...params,
  }
  MOCK_AI_INTERACTIONS.unshift(log)
  return log
}

// ── Unified AI Audit Logger (writes to MOCK_AUDIT_LOGS) ───────────────────────

const INTENT_TO_ENTITY: Record<string, AuditLogRow['entity_type']> = {
  create_lead: 'Lead',
  create_followup: 'Follow-up',
  schedule_visit: 'Visit',
  create_requirement: 'Requirement',
  create_opportunity: 'Opportunity',
  update_deal_stage: 'Opportunity',
  create_campaign: 'Campaign',
  create_task: 'Task',
}

export function logAiAudit(params: {
  action_type: string
  entity_id: string
  summary: string
  user_id?: string
  user_name?: string
  user_role?: string
  ai_trail: AiTrail
  extra_details?: Record<string, any>
  action?: AuditLogRow['action']
  entity_type?: AuditLogRow['entity_type']
}): AuditLogRow {
  const entityType = params.entity_type || INTENT_TO_ENTITY[params.action_type] || 'General'
  const actionVerb: AuditLogRow['action'] = params.action || (params.action_type === 'update_deal_stage' ? 'Status Changed' : 'Created')
  const newLog: AuditLogRow = {
    id: `AUD-AI-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    user_id: params.user_id || 'u1',
    user_name: params.user_name || 'Aman Desai',
    user_role: params.user_role || 'SUPER_ADMIN',
    action: actionVerb,
    entity_type: entityType,
    entity_id: params.entity_id,
    summary: `[AI-assisted] ${params.summary} (via AI Assistant)`,
    details: params.extra_details || {},
    ip_address: '192.168.1.10',
    ai_assisted: true,
    ai_trail: params.ai_trail,
  }
  MOCK_AUDIT_LOGS.unshift(newLog)
  return newLog
}

export function logAiWorkflowAudit(params: {
  workflow_request: string
  steps: Array<{
    action_type: string
    status: string
    record_id?: string
    label?: string
    proposed_values: Record<string, unknown>
    final_values: Record<string, unknown>
  }>
  user_id?: string
  user_name?: string
  user_role?: string
}): AuditLogRow[] {
  const logs: AuditLogRow[] = []
  for (const step of params.steps) {
    if (step.status !== 'success') continue
    const entityType = INTENT_TO_ENTITY[step.action_type] || 'Lead'
    const actionVerb: AuditLogRow['action'] = step.action_type === 'update_deal_stage' ? 'Status Changed' : 'Created'
    const newLog: AuditLogRow = {
      id: `AUD-WF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      user_id: params.user_id || 'u1',
      user_name: params.user_name || 'Aman Desai',
      user_role: params.user_role || 'SUPER_ADMIN',
      action: actionVerb,
      entity_type: entityType,
      entity_id: step.record_id || 'unknown',
      summary: `[AI-assisted] ${step.label || step.action_type} (via AI Workflow)`,
      details: { workflow_request: params.workflow_request, step_count: params.steps.length },
      ip_address: '192.168.1.10',
      ai_assisted: true,
      ai_trail: {
        original_request: params.workflow_request,
        interpreted_intent: 'workflow',
        proposed_values: step.proposed_values,
        user_edits: {},
        final_values: step.final_values,
        workflow_steps: params.steps,
      },
    }
    MOCK_AUDIT_LOGS.unshift(newLog)
    logs.push(newLog)
  }
  return logs
}
