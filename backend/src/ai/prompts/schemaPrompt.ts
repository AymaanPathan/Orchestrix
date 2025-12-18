export const schemaPrompt = `
The workflow JSON must follow this structure EXACTLY:

{
  "nodes": [
    {
      "id": "string",
      "type": "string (allowed type)",
      "data": {
        "fields": {
          // Node-specific fields
        }
      }
    }
  ],
  "edges": [
    {
      "id": "unique-edge-id",
      "source": "node-id",
      "target": "node-id"
    }
  ]
}

======================================================
ALLOWED NODE TYPES
======================================================
input
inputValidation
dbFind
dbInsert
dbUpdate
dbDelete
emailSend
userLogin
authMiddleware
response

======================================================
TEMPLATE VARIABLE RULES
======================================================
Correct:
  {{email}}
  {{password}}
  {{foundData}}
  {{createdRecord}}

Wrong (never do this):
  input.email
  node1.email
  user.password
  input_main.password

======================================================
COMPLETE CORRECT EXAMPLE
======================================================

{
  "nodes": [
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
    },
    {
      "id": "find_user",
      "type": "dbFind",
      "data": {
        "fields": {
          "collection": "users",
          "findType": "findOne",
          "filters": {
            "email": "{{email}}"
          },
          "outputVar": "foundData"
        }
      }
    },
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
  ],
  "edges": [
    { "id": "e1", "source": "input_main", "target": "find_user" },
    { "id": "e2", "source": "find_user", "target": "login_user" }
  ]
}

======================================================
IMPORTANT FIELD NAMES
======================================================
dbInsert → fields.data  
dbFind → fields.filters  
emailSend → fields.to, subject, body  
userLogin → fields.email, password  
dbUpdate → fields.update, filters  
dbDelete → fields.filters  

======================================================
FINAL RULE
======================================================
Your output MUST be a valid JSON object with:
{
  "nodes": [...],
  "edges": [...]
}
Nothing else.
`;
