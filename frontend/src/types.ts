export interface Account {
  id: number;
  client_id: number;
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
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  notes?: string;
  created_at: string;
}

export type Interaction = {
  id: number;
  contact_date: string;
  summary: string;
  outcome: string;
  notes: string;
  follow_up?: string;
};

export interface Lead {
  id: number;
  name: string;
  contact_person?: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  status: string;
  notes?: string;
  created_at: string;
}

export interface Project {
  id: number;
  tenant_id: number;
  project_name: string;
  project_description?: string;
  project_status: string;
  project_start?: string; // ISO datetime string
  project_end?: string;
  project_worth?: number;
  client_id?: number;
  lead_id?: number;
  created_by: number;
  created_at: string;
  updated_at?: string;
  last_updated_by?: number;
}