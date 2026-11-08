import { createMockCrmAdapter } from "@ai-marketomg/mock-crm";
import type { CrmAdapter } from "@ai-marketomg/crm-adapter";
import { loadPilotConfig, type PilotConfig } from "@ai-marketomg/core";

export interface AgentContext {
  crm: CrmAdapter;
  config: PilotConfig;
}

export function createAgentContext(overrides?: Partial<AgentContext>): AgentContext {
  return {
    crm: overrides?.crm ?? createMockCrmAdapter(),
    config: overrides?.config ?? loadPilotConfig(),
  };
}
