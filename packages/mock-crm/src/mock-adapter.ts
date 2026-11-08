import type { Activity, Contact, Deal } from "@ai-marketomg/core";
import type { CrmAdapter, ListActivitiesQuery } from "@ai-marketomg/crm-adapter";
import contactsJson from "./fixtures/contacts.json" with { type: "json" };
import dealsJson from "./fixtures/deals.json" with { type: "json" };
import activitiesJson from "./fixtures/activities.json" with { type: "json" };

const contacts = contactsJson as Contact[];
const deals = dealsJson as Deal[];
const activities = activitiesJson as Activity[];

function inRange(iso: string, from: string, to: string): boolean {
  const t = Date.parse(iso);
  return t >= Date.parse(from) && t <= Date.parse(to);
}

export class MockCrmAdapter implements CrmAdapter {
  async listContacts(): Promise<Contact[]> {
    return [...contacts];
  }

  async getContact(id: string): Promise<Contact | null> {
    return contacts.find((c) => c.id === id) ?? null;
  }

  async listDeals(): Promise<Deal[]> {
    return [...deals];
  }

  async getDeal(id: string): Promise<Deal | null> {
    return deals.find((d) => d.id === id) ?? null;
  }

  async listActivities(query: ListActivitiesQuery): Promise<Activity[]> {
    return activities
      .filter((a) => inRange(a.occurredAt, query.from, query.to))
      .filter((a) => (query.dealId ? a.dealId === query.dealId : true))
      .sort((a, b) => Date.parse(a.occurredAt) - Date.parse(b.occurredAt));
  }
}

export function createMockCrmAdapter(): CrmAdapter {
  return new MockCrmAdapter();
}
