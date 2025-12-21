export const schemaPrompt = `
WORKFLOW JSON SCHEMA (STRICT)
=============================

{
  "nodes": [
    {
      "id": "string",
      "type": "allowed-type",
      "data": {
        "label": "string",
        "fields": {}
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
NODE FIELD DEFINITIONS
=====================================================

INPUT
-----
fields.variables: Array<{ name: string, type?: string }>

INPUT VALIDATION
----------------
fields.rules: Array<{
  field: "{{variable}}",
  required?: boolean,
  type?: string
}>

DB FIND
-------
fields.collection
fields.findType
fields.filters
fields.outputVar

DB INSERT
---------
fields.collection
fields.data
fields.outputVar

DB UPDATE
---------
fields.collection
fields.filters
fields.update
fields.outputVar

DB DELETE
---------
fields.collection
fields.filters
fields.outputVar

EMAIL SEND
----------
fields.to
fields.subject
fields.body
fields.outputVar

USER LOGIN
----------
fields.email
fields.password
fields.outputVar

AUTH MIDDLEWARE
---------------
fields: {}

RESPONSE
--------
fields.statusCode
fields.body

=====================================================
IMPORTANT
=====================================================

- node.data.label is REQUIRED
- NEVER omit label
- NEVER invent fields
`;
