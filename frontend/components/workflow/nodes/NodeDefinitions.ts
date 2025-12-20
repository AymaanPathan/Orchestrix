export interface NodeConfig {
  type: string;
  defaultFields: any;
  autoMap?: (args: {
    node: any;
    connectedInputs: any[];
    dbSchemas: any;
  }) => any;
  toStep: (node: any, stepId: string) => any;
}

// Utility: wrap variable in {{var}}
const varWrap = (name: string) => `{{${name}}}`;

// Collect available variables from ALL parents
const collectAvailableVars = (connectedInputs: any[]) => {
  const vars: string[] = [];

  connectedInputs.forEach((p) => {
    // From INPUT node
    if (p.type === "input") {
      (p?.data?.fields?.variables || [])?.forEach((v: any) => {
        if (v?.name) vars?.push(v?.name);
      });
    }

    // From ANY node that outputs data
    if (p?.data?.fields?.outputVar) {
      vars.push(p?.data?.fields?.outputVar);
    }
  });

  return vars;
};

// ----------------------------------------------------------
// ALL NODES
// ----------------------------------------------------------

export const NodeDefinitions: Record<string, NodeConfig> = {
  // --------------------------------------------------------
  // ⭐ INPUT NODE
  // --------------------------------------------------------
  input: {
    type: "input",
    defaultFields: { variables: [] },

    toStep(node, id) {
      const vars = node?.data?.fields?.variables?.map((v: any) => ({
        name: v.name.trim(),
      }));

      return {
        id,
        type: "input",
        variables: vars,
      };
    },
  },

  // --------------------------------------------------------
  // ⭐ DB INSERT
  // --------------------------------------------------------
  dbInsert: {
    type: "dbInsert",
    defaultFields: {
      collection: "",
      data: {},
      outputVar: "createdRecord",
    },

    autoMap({ node, connectedInputs, dbSchemas }) {
      const fields = node?.data?.fields;
      const schema = dbSchemas[fields?.collection] || [];

      const available = collectAvailableVars(connectedInputs);

      const newData: any = {};
      schema?.forEach((key: string) => {
        if (available?.includes(key)) {
          newData[key] = varWrap(key);
        } else {
          newData[key] = "";
        }
      });

      return { ...fields, data: newData };
    },

    toStep(node, id) {
      return {
        id,
        type: "dbInsert",
        collection: node?.data?.fields?.collection,
        data: node?.data?.fields?.data,
        output: node?.data?.fields?.outputVar || "createdRecord",
      };
    },
  },

  // --------------------------------------------------------
  // ⭐ DB FIND
  // --------------------------------------------------------
  dbFind: {
    type: "dbFind",
    defaultFields: {
      collection: "",
      findType: "findOne",
      filters: {},
      outputVar: "foundData",
    },

    autoMap({ node, connectedInputs }) {
      const fields = node?.data?.fields;
      const available = collectAvailableVars(connectedInputs);

      const newFilters: any = {};
      Object.keys(fields?.filters || {}).forEach((key) => {
        if (available?.includes(key)) newFilters[key] = varWrap(key);
        else newFilters[key] = fields?.filters?.[key];
      });

      return { ...fields, filters: newFilters };
    },

    toStep(node, id) {
      return {
        id,
        type: "dbFind",
        collection: node?.data?.fields?.collection,
        findType: node?.data?.fields?.findType,
        filters: node?.data?.fields?.filters,
        output: node?.data?.fields?.outputVar || "foundData",
      };
    },
  },

  // --------------------------------------------------------
  // ⭐ DB UPDATE
  // --------------------------------------------------------
  dbUpdate: {
    type: "dbUpdate",
    defaultFields: {
      collection: "",
      filters: {},
      update: {},
      updateType: "updateOne",
      outputVar: "updatedRecord",
    },

    autoMap({ node, connectedInputs }) {
      const fields = node?.data?.fields;
      const available = collectAvailableVars(connectedInputs);

      const newFilters: any = {};
      Object.keys(fields?.filters || {}).forEach((key) => {
        newFilters[key] = available?.includes(key)
          ? varWrap(key)
          : fields?.filters?.[key];
      });

      const newUpdate: any = {};
      Object.keys(fields?.update || {}).forEach((key) => {
        newUpdate[key] = available?.includes(key)
          ? varWrap(key)
          : fields?.update?.[key];
      });

      return { ...fields, filters: newFilters, update: newUpdate };
    },

    toStep(node, id) {
      return {
        id,
        type: "dbUpdate",
        collection: node?.data?.fields?.collection,
        updateType: node?.data?.fields?.updateType,
        filters: node?.data?.fields?.filters,
        update: node?.data?.fields?.update,
        output: node?.data?.fields?.outputVar || "updatedRecord",
      };
    },
  },

  // --------------------------------------------------------
  // ⭐ DB DELETE
  // --------------------------------------------------------
  dbDelete: {
    type: "dbDelete",
    defaultFields: {
      collection: "",
      deleteType: "deleteOne",
      filters: {},
      outputVar: "deletedRecord",
    },

    autoMap({ node, connectedInputs }) {
      const fields = node?.data?.fields;
      const available = collectAvailableVars(connectedInputs);

      const newFilters: any = {};
      Object.keys(fields?.filters || {}).forEach((key) => {
        newFilters[key] = available?.includes(key)
          ? varWrap(key)
          : fields.filters[key];
      });

      return { ...fields, filters: newFilters };
    },

    toStep(node, id) {
      return {
        id,
        type: "dbDelete",
        collection: node?.data?.fields?.collection,
        deleteType: node?.data?.fields?.deleteType,
        filters: node?.data?.fields?.filters,
        output: node?.data?.fields?.outputVar || "deletedRecord",
      };
    },
  },

  // --------------------------------------------------------
  // ⭐ LOG
  // --------------------------------------------------------
  log: {
    type: "log",
    defaultFields: { input: {} },

    toStep(node, id) {
      return {
        id,
        type: "log",
        input: node?.data?.fields?.input,
      };
    },
  },

  // --------------------------------------------------------
  // ⭐ INPUT VALIDATION NODE
  // --------------------------------------------------------
  inputValidation: {
    type: "inputValidation",

    defaultFields: {
      rules: [],
      outputVar: "validated",
    },

    autoMap({ node, connectedInputs }) {
      const available = collectAvailableVars(connectedInputs);

      const fields = node?.data?.fields;
      const newRules = (fields.rules || []).map((r: any) => {
        if (available?.includes(r.field)) {
          return { ...r, field: `input.${r.field}` };
        }
        return r;
      });

      return { ...fields, rules: newRules };
    },

    toStep(node, id) {
      return {
        id,
        type: "inputValidation",
        rules: node?.data?.fields?.rules || [],
        output: node?.data?.fields?.outputVar || "validated",
      };
    },
  },

  // --------------------------------------------------------
  // ⭐ USER LOGIN NODE
  // --------------------------------------------------------
  userLogin: {
    type: "userLogin",

    defaultFields: {
      email: "",
      password: "",
      outputVar: "loginResult",
    },

    autoMap({ connectedInputs }) {
      const available = collectAvailableVars(connectedInputs);

      return {
        email: available?.includes("email") ? varWrap("email") : "",
        password: available?.includes("password") ? varWrap("password") : "",
        outputVar: "loginResult",
      };
    },

    toStep(node, id) {
      return {
        id,
        type: "userLogin",
        email: node?.data?.fields?.email,
        password: node?.data?.fields?.password,
        output: node?.data?.fields?.outputVar || "loginResult",
      };
    },
  },

  // --------------------------------------------------------
  // ⭐ AUTH MIDDLEWARE NODE
  // --------------------------------------------------------
  authMiddleware: {
    type: "authMiddleware",

    defaultFields: {},

    autoMap() {
      return {};
    },

    toStep(node, id) {
      return {
        id,
        type: "authMiddleware",
      };
    },
  },

  // --------------------------------------------------------
  // ⭐ EMAIL SEND NODE
  // --------------------------------------------------------
  emailSend: {
    type: "emailSend",

    defaultFields: {
      to: "",
      subject: "",
      body: "",
      outputVar: "emailResult",
    },

    toStep(node, id) {
      const f = node.data?.fields || {};

      return {
        id,
        type: "emailSend",
        to: f.to,
        subject: f.subject,
        body: f.body,
        output: f.outputVar || "emailResult",
        pass: node.data?.pass,
      };
    },
  },
};
