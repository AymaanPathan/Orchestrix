// workflow/validation/validateGraph.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

import { buildGraphMeta } from "./buildGraph";
import {
  ruleSingleInputNode,
  ruleInputNoInbound,
  ruleNonInputHaveInbound,
  ruleNoOrphans,
  ruleNoCycles,
  ruleAllowedConnections,
  RuleResult,
} from "./rules";

type ValidateResult = {
  valid: boolean;
  message?: string;
  failedRule?: string;
  details?: any;
};

export function validateGraph(nodes: any[], edges: any[] , dbSchemas: Record<string, string[]>): ValidateResult {
  try {
    const meta = buildGraphMeta(nodes, edges, dbSchemas);

    const rules: { fn: (m: any) => RuleResult; name: string }[] = [
      { fn: ruleSingleInputNode, name: "ruleSingleInputNode" },
      { fn: ruleInputNoInbound, name: "ruleInputNoInbound" },
      { fn: ruleNonInputHaveInbound, name: "ruleNonInputHaveInbound" },
      { fn: ruleNoOrphans, name: "ruleNoOrphans" },
      { fn: ruleNoCycles, name: "ruleNoCycles" },
      { fn: ruleAllowedConnections, name: "ruleAllowedConnections" },
    ];

    for (const r of rules) {
      const res = r.fn(meta);
      if (!res.valid) {
        return {
          valid: false,
          message: res.message,
          failedRule: r.name,
          details: res.details,
        };
      }
    }

    return { valid: true };
  } catch (err: any) {
    return { valid: false, message: err?.message || String(err) };
  }
}
