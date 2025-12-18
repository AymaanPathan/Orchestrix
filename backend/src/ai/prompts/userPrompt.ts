export function userPrompt(userText: string, nodeCatalog: any[]) {
  return `
User Request:
"${userText}"

You must generate a workflow using ONLY the node types listed below.

Allowed Node Types (IMPORTANT):
${JSON.stringify(
  nodeCatalog.map((n) => n.type),
  null,
  2
)}

=========================================================
CRITICAL RULES (MUST FOLLOW EXACTLY)
=========================================================

1. Every node MUST have:
   {
     "id": "string",
     "type": "string",
     "data": {
       "fields": { ... }
     }
   }

2. Every variable reference must use:
      {{variableName}}
   NEVER:
      input.email
      node.data.email
      user.email

3. Input node variables are defined like:
   {
     "name": "email",
     "type": "string"
   }
   You must reference them later as:
      {{email}}

4. Output variables from nodes such as dbInsert, dbFind, emailSend:
      {{createdRecord}}
      {{foundData}}
      {{emailResult}}

5. Edges MUST specify:
   {
     "id": "e1",
     "source": "nodeA",
     "target": "nodeB"
   }

6. No cycles allowed. Workflow must be linear or branching, but acyclic.

=========================================================
NODE SPECIFIC FIELD RULES
=========================================================

INPUT NODE
----------
{
  "id": "input_main",
  "type": "input",
  "data": {
    "fields": {
      "variables": [
        { "name": "email", "type": "string" },
        { "name": "password", "type": "string" }
      ]
    }
  }
}

INPUT VALIDATION
----------------
{
  "id": "validate_input",
  "type": "inputValidation",
  "data": {
    "fields": {
      "rules": [
        { "field": "{{email}}", "required": true, "type": "string" }
      ]
    }
  }
}

DB FIND
-------
{
  "id": "find_user",
  "type": "dbFind",
  "data": {
    "fields": {
      "collection": "users",
      "findType": "findOne",
      "filters": { "email": "{{email}}" },
      "outputVar": "foundData"
    }
  }
}

DB INSERT
---------
IMPORTANT: Must use field "data", not "document".
{
  "id": "insert_user",
  "type": "dbInsert",
  "data": {
    "fields": {
      "collection": "users",
      "data": {
        "email": "{{email}}",
        "password": "{{password}}"
      },
      "outputVar": "createdRecord"
    }
  }
}

EMAIL SEND
----------
Node type MUST be exactly "emailSend".
{
  "id": "send_email",
  "type": "emailSend",
  "data": {
    "fields": {
      "to": "{{email}}",
      "subject": "Welcome!",
      "body": "Hello {{email}}",
      "outputVar": "emailResult"
    }
  }
}

USER LOGIN
----------
{
  "id": "login_user",
  "type": "userLogin",
  "data": {
    "fields": {
      "email": "{{email}}",
      "password": "{{password}}",
      "outputVar": "loginResult"
    }
  }
}

AUTH MIDDLEWARE
---------------
{
  "id": "auth_guard",
  "type": "authMiddleware",
  "data": { "fields": {} }
}

=========================================================
WRONG EXAMPLES (DO NOT DO)
=========================================================
"email": "input.email"
"password": "node.password"
"output": "foundData"       ❌ WRONG FIELD NAME
"document": {...}           ❌ WRONG FIELD NAME

=========================================================
CORRECT EXAMPLES
=========================================================
"email": "{{email}}"
"password": "{{password}}"
"outputVar": "foundData"
"data": { "email": "{{email}}" }

=========================================================

Remember:
ALWAYS use {{variable}} syntax.
NEVER use dot notation.

`;
}
