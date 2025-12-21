export const nodeCatalog = [
  {
    type: "input",
    description:
      "Reads user input variables. Define variables in the variables array.",
    example: {
      id: "input_main",
      type: "input",
      data: {
        fields: {
          variables: [{ name: "email" }, { name: "password" }],
        },
      },
    },
    usage: "Reference input variables using {{variableName}} syntax",
  },
  {
    type: "inputValidation",
    description: "Validates input fields using rules array.",
    example: {
      id: "validate_input",
      type: "inputValidation",
      data: {
        fields: {
          rules: [
            { field: "{{email}}", required: true, type: "email" },
            { field: "{{password}}", required: true, minLength: 8 },
          ],
        },
      },
    },
    usage: "Use {{variableName}} to reference variables to validate",
  },
  {
    type: "dbFind",
    description: "Finds document(s) in MongoDB collection.",
    example: {
      id: "find_user",
      type: "dbFind",
      data: {
        fields: {
          collection: "users",
          findType: "findOne",
          filters: { email: "{{email}}" },
          output: "foundUser",
        },
      },
    },
    usage:
      "Use {{variable}} in filters. Output var can be referenced as {{outputName}} in later nodes",
  },
  {
    type: "dbInsert",
    description: "Inserts a new document into MongoDB collection.",
    example: {
      id: "create_user",
      type: "dbInsert",
      data: {
        fields: {
          collection: "users",
          document: {
            email: "{{email}}",
            password: "{{hashedPassword}}",
            createdAt: "{{timestamp}}",
          },
          output: "newUser",
        },
      },
    },
    usage: "Use {{variable}} in document fields",
  },
  {
    type: "dbUpdate",
    description: "Updates document(s) in MongoDB collection.",
    example: {
      id: "update_user",
      type: "dbUpdate",
      data: {
        fields: {
          collection: "users",
          filters: { _id: "{{userId}}" },
          update: { lastLogin: "{{timestamp}}" },
          output: "updatedUser",
        },
      },
    },
    usage: "Use {{variable}} in both filters and update objects",
  },
  {
    type: "dbDelete",
    description: "Deletes document(s) from MongoDB collection.",
    example: {
      id: "delete_user",
      type: "dbDelete",
      data: {
        fields: {
          collection: "users",
          filters: { email: "{{email}}" },
          output: "deleteResult",
        },
      },
    },
    usage: "Use {{variable}} in filters",
  },
  {
    type: "emailSend",
    description: "Sends an email using configured mail service.",
    example: {
      id: "send_welcome",
      type: "emailSend",
      data: {
        fields: {
          to: "{{email}}",
          subject: "Welcome to our platform",
          body: "Hello {{name}}, welcome!",
          from: "noreply@example.com",
        },
      },
    },
    usage: "Use {{variable}} for dynamic email content",
  },
  {
    type: "userLogin",
    description: "Validates user credentials and returns login result.",
    example: {
      id: "login_user",
      type: "userLogin",
      data: {
        fields: {
          email: "{{email}}",
          password: "{{password}}",
          output: "loginResult",
        },
      },
    },
    usage: "Requires {{email}} and {{password}} from input or previous steps",
  },
  {
    type: "authMiddleware",
    description: "Validates JWT token and checks user permissions.",
    example: {
      id: "check_auth",
      type: "authMiddleware",
      data: {
        fields: {
          token: "{{authToken}}",
          requiredRole: "admin",
          output: "authUser",
        },
      },
    },
    usage: "Use {{token}} to reference JWT token variable",
  },
];
