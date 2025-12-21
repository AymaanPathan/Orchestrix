export function userPrompt(userText: string, nodeCatalog: any[]) {
  return `
USER REQUEST
============
"${userText}"

=====================================================
STRICT SCOPE RULE
=====================================================

Generate ONLY what is required.
Do NOT add extra steps.
Do NOT add login, auth, or email unless explicitly requested.

=====================================================
ALLOWED NODE TYPES
=====================================================

${nodeCatalog.map((n) => `- ${n.type}`).join("\n")}

=====================================================
FINAL RULE
=====================================================

- Output ONLY valid JSON
- Every node MUST include data.label
- Use ONLY {{variable}} syntax

Generate the minimal workflow now.
`;
}
