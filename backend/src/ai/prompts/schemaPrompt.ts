export const schemaPrompt = `
WORKFLOW JSON SCHEMA (EXACT)
===========================

{
  "nodes": [
    {
      "id": "string",
      "type": "allowed-type",
      "data": {
        "fields": { }
      }
    }
  ],
  "edges": [
    {
      "id": "string",
      "source": "node-id",
      "target": "node-id"
    }
  ]
}

=====================================================
NODE FIELD DEFINITIONS (STRICT)
=====================================================

INPUT
-----
fields.variables: Array<{ name: string, type?: string, default?: any }>

INPUT VALIDATION
----------------
fields.rules: Array<{
  field: "{{variable}}",
  required?: boolean,
  type?: string
}>

DB FIND
-------
fields.collection: string
fields.findType: "findOne" | "findMany"
fields.filters: object
fields.outputVar: string

DB INSERT
---------
fields.collection: string
fields.data: object
fields.outputVar: string

❗ MUST use "data" (NOT document)

DB UPDATE
---------
fields.collection: string
fields.filters: object
fields.update: object
fields.outputVar: string

DB DELETE
---------
fields.collection: string
fields.filters: object
fields.outputVar: string

EMAIL SEND
----------
type MUST be "emailSend"

fields.to: "{{variable}}"
fields.subject: string
fields.body: string
fields.outputVar: string

USER LOGIN
----------
fields.email: "{{email}}"
fields.password: "{{password}}"
fields.outputVar: string

AUTH MIDDLEWARE
---------------
fields: {}

RESPONSE
--------
fields.statusCode: number
fields.body: object

=====================================================
COMPLETE VALID EXAMPLE
=====================================================

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
      "id": "login_user",
      "type": "userLogin",
      "data": {
        "fields": {
          "email": "{{email}}",
          "password": "{{password}}",
          "outputVar": "loginResult"
        }
      }
    },
    {
      "id": "response_ok",
      "type": "response",
      "data": {
        "fields": {
          "statusCode": 200,
          "body": { "result": "{{loginResult}}" }
        }
      }
    }
  ],
  "edges": [
    { "id": "e1", "source": "input_main", "target": "login_user" },
    { "id": "e2", "source": "login_user", "target": "response_ok" }
  ]
}
`;
