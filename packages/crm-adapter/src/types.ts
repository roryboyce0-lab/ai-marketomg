import type { Activity, Contact, Deal } from "@ai-marketomg/core";

export interface ListActivitiesQuery {
  from: string;
  to: string;
  dealId?: string;
}

export interface CrmAdapter {
  listContacts(): Promise<Contact[]>;
  getContact(id: string): Promise<Contact | null>;
  listDeals(): Promise<Deal[]>;
  getDeal(id: string): Promise<Deal | null>;
  listActivities(query: ListActivitiesQuery): Promise<Activity[]>;
}
