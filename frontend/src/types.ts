export interface Account {
  id: number;
  client_id: number;
  client_name?: string;
  tenant_id: number;
  account_number: string;
  account_name?: string;
  status?: string;
  opened_on?: string; // ISO datetime
  notes?: string;
}

export interface Client {
  id: number;
  name: string;
  contact_person?: string;
  contact_title?: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  notes?: string;
  created_at: string;
  accounts?: Account[];  
}

export type Interaction = {
  id: number;
  contact_date: string;
  summary: string;
  outcome: string;
  notes: string;
  follow_up?: string | null; // ISO datetime string or null
  client_id?: number;
  lead_id?: number;
  client_name?: string;
  lead_name?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  profile_link?: string;
  followup_status?: "pending" | "completed";
};

export type InteractionFormData = {
  contact_date: string;
  summary: string;
  outcome: string;
  notes: string;
  follow_up: string | null; 
};

export interface Lead {
  id: number;
  name: string;
  contact_person?: string;
  contact_title?: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  status: string;
  notes?: string;
  created_at: string;
  assigned_to?: number;
  assigned_to_name?: string;
  created_by_name?: string;
}

export interface Project {
  id: number;
  project_name: string;
  project_description?: string;
  project_status?: string;
  project_start?: string;
  project_end?: string;
  project_worth?: number;
  client_id?: number;
  lead_id?: number;
  client_name?: string;
  lead_name?: string;
  created_at?: string;
}