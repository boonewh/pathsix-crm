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

export type Interaction = {
  id: number;
  contact_date: string;
  summary: string;
  outcome: string;
  notes: string;
  follow_up?: string;
};