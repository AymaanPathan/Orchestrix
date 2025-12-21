export function userPrompt(userText: string, nodeCatalog: any[]) {
  return `
USER REQUEST
============
"${userText}"

=====================================================
YOU MUST GENERATE A WORKFLOW USING ONLY THESE NODE TYPES
=====================================================

${nodeCatalog.map((n) => `- ${n.type}`).join("\n")}

=====================================================
IMPORTANT REMINDERS
=====================================================

• Use ONLY allowed node types  
• Use ONLY {{variable}} syntax  
• NEVER invent new fields  
• NEVER use dot notation  
• Every node MUST include data.fields  
• Output ONLY valid JSON  

Generate the workflow now.
`;
}
