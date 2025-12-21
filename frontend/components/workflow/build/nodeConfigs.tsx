"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useSelector } from "react-redux";
import { RootState } from "../../../store";
import { findSchema } from "../../../utils/findSchemaForCollection.utils";
import { Plus, Trash2, Filter, Edit3, Shield } from "lucide-react";

const ValueSelector = ({ value, type, onChange }: any) => {
  if (type === "boolean")
    return (
      <select
        value={String(value ?? false)}
        onChange={(e) => onChange(e.target.value === "true")}
        className="bg-black/40 border border-neutral-800 px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-neutral-600 transition-colors"
      >
        <option value="true">true</option>
        <option value="false">false</option>
      </select>
    );

  if (type === "number")
    return (
      <input
        type="number"
        className="bg-black/40 border border-neutral-800 px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-neutral-600 transition-colors"
        value={value ?? ""}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    );

  return (
    <input
      className="bg-black/40 border border-neutral-800 px-3 py-2 rounded-lg text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Enter value..."
    />
  );
};
/* ---------------------------------------------------
  CLEAN LABELED VAR LIST
--------------------------------------------------- */
const getLabeledVars = (availableVars: any[]) => {
  const seen = new Set<string>();

  return availableVars
    .filter((item: any) => {
      if (seen.has(item.var)) return false;
      seen.add(item.var);
      return true;
    })
    .map((item: any) => ({
      value: item.var,
      label: item.display,
    }));
};

/* ---------------------------------------------------
  DB FILTER BLOCK (Shared)
--------------------------------------------------- */
const FiltersBlock = ({
  localFields,
  setField,
  schemaFields,
  labeledVars,
}: any) => {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-xs text-neutral-400 font-medium flex items-center gap-2">
          <Filter size={12} />
          Filters (Find By)
        </label>

        <button
          className="px-3 py-1.5 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95"
          onClick={() => {
            if (!schemaFields[0]) return;
            setField("filters", {
              ...(localFields.filters || {}),
              [schemaFields[0]]: "",
            });
          }}
        >
          <Plus size={12} />
          Add Filter
        </button>
      </div>

      <div className="space-y-2">
        {(Object.entries(localFields.filters || {}) as any).map(
          ([key, val]: any) => {
            return (
              <div
                key={key}
                className="flex gap-2 bg-neutral-950 border border-neutral-800 p-3 rounded-lg hover:border-neutral-700 transition-colors"
              >
                {/* Field Name */}
                <select
                  value={key}
                  onChange={(e) =>
                    setField("filters", {
                      ...localFields.filters,
                      [e.target.value]: val,
                    })
                  }
                  className="bg-black/40 border border-neutral-800 px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-neutral-600 transition-colors"
                >
                  {schemaFields.map((f: string) => (
                    <option key={f}>{f}</option>
                  ))}
                </select>

                {/* Variable Binding */}
                <select
                  value={val.startsWith("{{") ? val.slice(2, -2) : ""}
                  onChange={(e) =>
                    setField("filters", {
                      ...localFields.filters,
                      [key]: `{{${e.target.value}}}`,
                    })
                  }
                  className="flex-1 bg-black/40 border border-neutral-800 px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-neutral-600 transition-colors"
                >
                  <option value="">Select variable…</option>

                  {labeledVars.map((opt: any, i: number) => (
                    <option key={`${opt.value}-${i}`} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => {
                    const newFilters = { ...localFields.filters };
                    delete newFilters[key];
                    setField("filters", newFilters);
                  }}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-950/30 border border-neutral-800 rounded-lg transition-all"
                  title="Remove filter"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          }
        )}
      </div>
    </div>
  );
};

/* ---------------------------------------------------
  DB UPDATE BLOCK (Shared)
--------------------------------------------------- */
const UpdateBlock = ({
  localFields,
  setField,
  schemaFields,
  labeledVars,
}: any) => {
  return (
    <div className="space-y-3 mt-5">
      <div className="flex justify-between items-center">
        <label className="text-xs text-neutral-400 font-medium flex items-center gap-2">
          <Edit3 size={12} />
          Update Values
        </label>

        <button
          className="px-3 py-1.5 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95"
          onClick={() => {
            if (!schemaFields[0]) return;
            setField("update", {
              ...(localFields.update || {}),
              [schemaFields[0]]: "",
            });
          }}
        >
          <Plus size={12} />
          Add Update
        </button>
      </div>

      <div className="space-y-2">
        {(Object.entries(localFields.update || {}) as any).map(
          ([key, val]: any) => {
            return (
              <div
                key={key}
                className="flex gap-2 bg-neutral-950 border border-neutral-800 p-3 rounded-lg hover:border-neutral-700 transition-colors"
              >
                <select
                  value={key}
                  onChange={(e) =>
                    setField("update", {
                      ...localFields.update,
                      [e.target.value]: val,
                    })
                  }
                  className="bg-black/40 border border-neutral-800 px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-neutral-600 transition-colors"
                >
                  {schemaFields.map((f: string) => (
                    <option key={f}>{f}</option>
                  ))}
                </select>

                <select
                  value={val.startsWith("{{") ? val.slice(2, -2) : ""}
                  onChange={(e) =>
                    setField("update", {
                      ...localFields.update,
                      [key]: `{{${e.target.value}}}`,
                    })
                  }
                  className="flex-1 bg-black/40 border border-neutral-800 px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-neutral-600 transition-colors"
                >
                  <option value="">Select variable…</option>

                  {labeledVars.map((opt: any, i: number) => (
                    <option key={`${opt.value}-${i}`} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => {
                    const newUpdate = { ...localFields.update };
                    delete newUpdate[key];
                    setField("update", newUpdate);
                  }}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-950/30 border border-neutral-800 rounded-lg transition-all"
                  title="Remove update"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          }
        )}
      </div>
    </div>
  );
};

/* ---------------------------------------------------
  NODE CONFIGS (FINAL)
--------------------------------------------------- */
export const useNodeConfigs = () => {
  const dbSchemas = useSelector((state: RootState) => state.dbSchemas.schemas);
  return {
    /* ---------------------------------------------------
        INPUT NODE
  --------------------------------------------------- */
    input: {
      outputVar: false,
      render: ({ localFields, setField }: any) => {
        const vars = localFields.variables || [];

        const updateVar = (i: number, key: string, val: any) => {
          const copy = [...vars];
          copy[i][key] = val;
          setField("variables", copy);
        };

        return (
          <div className="space-y-4">
            <label className="text-xs text-neutral-400 font-medium">
              Input Variables
            </label>

            <div className="space-y-3">
              {vars.map((v: any, i: number) => (
                <div
                  key={i}
                  className="bg-neutral-950 border border-neutral-800 p-4 rounded-lg space-y-3 hover:border-neutral-700 transition-colors"
                >
                  <input
                    value={v.name}
                    onChange={(e) => updateVar(i, "name", e.target.value)}
                    placeholder="Variable name"
                    className="w-full bg-black/40 border border-neutral-800 px-3 py-2 rounded-lg text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors"
                  />

                  <select
                    value={v.type}
                    onChange={(e) => updateVar(i, "type", e.target.value)}
                    className="w-full bg-black/40 border border-neutral-800 px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-neutral-600 transition-colors"
                  >
                    <option value="string">string</option>
                    <option value="number">number</option>
                    <option value="boolean">boolean</option>
                  </select>

                  <div>
                    <label className="text-[11px] text-neutral-500 mb-1.5 block">
                      Default Value
                    </label>
                    <ValueSelector
                      type={v.type}
                      value={v.default}
                      onChange={(val: any) => updateVar(i, "default", val)}
                    />
                  </div>

                  <button
                    onClick={() => {
                      const copy = [...vars];
                      copy.splice(i, 1);
                      setField("variables", copy);
                    }}
                    className="w-full px-3 py-2 text-xs font-medium text-red-400 hover:text-red-300 bg-red-950/20 hover:bg-red-950/30 border border-red-900/30 rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 size={12} />
                    Remove Variable
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() =>
                setField("variables", [
                  ...vars,
                  { name: "", type: "string", default: "" },
                ])
              }
              className="w-full px-3 py-2.5 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus size={14} />
              Add Variable
            </button>
          </div>
        );
      },
    },

    /* ---------------------------------------------------
        DB FIND
  --------------------------------------------------- */
    dbFind: {
      outputVar: true,
      outputVarDefault: "foundData",

      getOutputShape: (fields) => {
        const schema = findSchema(fields.collection, dbSchemas);
        if (!schema) return {};

        return schema.reduce((acc, f) => {
          acc[f] = "any";
          return acc;
        }, {});
      },

      render: ({ localFields, setField, availableVars }: any) => {
        const collection = localFields.collection || "";
        const schemaFields = collection
          ? findSchema(collection, dbSchemas)
          : [];
        const labeledVars = getLabeledVars(availableVars);

        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs text-neutral-400 font-medium">
                Collection
              </label>
              <select
                value={collection}
                onChange={(e) => setField("collection", e.target.value)}
                className="w-full bg-black/40 border border-neutral-800 px-3 py-2.5 rounded-lg text-sm text-white focus:outline-none focus:border-neutral-600 transition-colors"
              >
                <option value="">Select collection…</option>
                {Object.keys(dbSchemas).map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>

            {collection && (
              <FiltersBlock
                localFields={localFields}
                setField={setField}
                labeledVars={labeledVars}
                schemaFields={schemaFields}
              />
            )}
          </div>
        );
      },
    },

    /* ---------------------------------------------------
        DB INSERT
  --------------------------------------------------- */
    dbInsert: {
      outputVar: true,
      outputVarDefault: "createdRecord",

      getOutputShape: (fields) => {
        const c = fields.collection;
        if (!c || !dbSchemas[c]) return null;

        return dbSchemas[c].reduce((acc, f) => {
          acc[f] = "any";
          return acc;
        }, {});
      },

      render: ({ localFields, setField, availableVars }) => {
        const collection = localFields.collection || "";
        const schemaFields = collection ? dbSchemas[collection] : [];
        const labeledVars = getLabeledVars(availableVars);

        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs text-neutral-400 font-medium">
                Collection
              </label>
              <select
                value={collection}
                onChange={(e) => setField("collection", e.target.value)}
                className="w-full bg-black/40 border border-neutral-800 px-3 py-2.5 rounded-lg text-sm text-white focus:outline-none focus:border-neutral-600 transition-colors"
              >
                <option value="">Select collection…</option>
                {Object.keys(dbSchemas).map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>

            {collection && schemaFields?.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs text-neutral-400 font-medium">
                  Field Mappings
                </label>
                {schemaFields?.map((field) => (
                  <div
                    key={field}
                    className="flex gap-2 bg-neutral-950 border border-neutral-800 p-3 rounded-lg items-center hover:border-neutral-700 transition-colors"
                  >
                    <div className="w-28 text-xs text-neutral-400 font-mono">
                      {field}
                    </div>

                    <select
                      value={
                        (localFields.data?.[field] || "").startsWith("{{")
                          ? localFields.data[field].slice(2, -2)
                          : ""
                      }
                      onChange={(e) =>
                        setField("data", {
                          ...(localFields.data || {}),
                          [field]: `{{${e.target.value}}}`,
                        })
                      }
                      className="flex-1 bg-black/40 border border-neutral-800 px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-neutral-600 transition-colors"
                    >
                      <option value="">Select variable…</option>

                      {labeledVars.map((opt: any) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      },
    },

    /* ---------------------------------------------------
        DB UPDATE
  --------------------------------------------------- */
    dbUpdate: {
      outputVar: true,
      outputVarDefault: "updatedRecord",

      getOutputShape: (fields) => {
        const c = fields.collection;
        if (!c || !dbSchemas[c]) return null;

        return dbSchemas[c].reduce((acc, f) => {
          acc[f] = "any";
          return acc;
        }, {});
      },

      render: ({ localFields, setField, availableVars }) => {
        const collection = localFields.collection || "";
        const schemaFields = collection ? dbSchemas[collection] : [];
        const labeledVars = getLabeledVars(availableVars);

        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs text-neutral-400 font-medium">
                Collection
              </label>
              <select
                value={collection}
                onChange={(e) => setField("collection", e.target.value)}
                className="w-full bg-black/40 border border-neutral-800 px-3 py-2.5 rounded-lg text-sm text-white focus:outline-none focus:border-neutral-600 transition-colors"
              >
                <option value="">Select collection…</option>
                {Object.keys(dbSchemas).map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>

            {collection && (
              <>
                <FiltersBlock
                  localFields={localFields}
                  setField={setField}
                  labeledVars={labeledVars}
                  schemaFields={schemaFields}
                />

                <UpdateBlock
                  localFields={localFields}
                  setField={setField}
                  labeledVars={labeledVars}
                  schemaFields={schemaFields}
                />
              </>
            )}
          </div>
        );
      },
    },

    /* ---------------------------------------------------
        DB DELETE
  --------------------------------------------------- */
    dbDelete: {
      outputVar: true,
      outputVarDefault: "deletedRecord",

      render: ({ localFields, setField, availableVars }) => {
        const collection = localFields.collection || "";
        const schemaFields = collection ? dbSchemas[collection] : [];
        const labeledVars = getLabeledVars(availableVars);

        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs text-neutral-400 font-medium">
                Collection
              </label>
              <select
                value={collection}
                onChange={(e) => setField("collection", e.target.value)}
                className="w-full bg-black/40 border border-neutral-800 px-3 py-2.5 rounded-lg text-sm text-white focus:outline-none focus:border-neutral-600 transition-colors"
              >
                <option value="">Select collection…</option>
                {Object.keys(dbSchemas).map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>

            {collection && (
              <FiltersBlock
                localFields={localFields}
                setField={setField}
                labeledVars={labeledVars}
                schemaFields={schemaFields}
              />
            )}
          </div>
        );
      },
    },

    /* ---------------------------------------------------
        EMAIL SEND
  --------------------------------------------------- */
    emailSend: {
      outputVar: true,
      outputVarDefault: "emailResult",

      getOutputShape: () => ({
        success: "boolean",
        messageId: "string",
      }),

      render: ({ localFields, setField, availableVars }: any) => {
        const labeledVars = availableVars.map((v: any) => ({
          value: v.var,
          label: v.display,
        }));

        const updateField = (key: string, val: any) => {
          setField(key, val);
        };

        const insertAtCursor = (fieldKey: string, text: string) => {
          const el = document.getElementById(`email-${fieldKey}`) as
            | HTMLInputElement
            | HTMLTextAreaElement;
          if (!el) return;

          const start = el.selectionStart || 0;
          const end = el.selectionEnd || 0;
          const current = localFields[fieldKey] || "";

          const updated =
            current.substring(0, start) + text + current.substring(end);

          setField(fieldKey, updated);

          setTimeout(() => {
            el.selectionStart = el.selectionEnd = start + text.length;
            el.focus();
          }, 0);
        };

        return (
          <div className="space-y-4">
            {/* TO FIELD */}
            <div className="space-y-2">
              <label className="text-xs text-neutral-400 font-medium">
                To (email)
              </label>
              <select
                value={
                  localFields.to?.startsWith("{{")
                    ? localFields.to.slice(2, -2)
                    : ""
                }
                onChange={(e) => updateField("to", `{{${e.target.value}}}`)}
                className="w-full bg-black/40 border border-neutral-800 px-3 py-2.5 rounded-lg text-xs text-white focus:outline-none focus:border-neutral-600 transition-colors"
              >
                <option value="">Select variable…</option>

                {labeledVars.map((opt: any) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* SUBJECT FIELD */}
            <div className="space-y-2">
              <label className="text-xs text-neutral-400 font-medium">
                Subject
              </label>
              <div className="flex gap-2">
                <input
                  id="email-subject"
                  className="flex-1 bg-black/40 border border-neutral-800 px-3 py-2.5 rounded-lg text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors"
                  value={localFields.subject || ""}
                  onChange={(e) => updateField("subject", e.target.value)}
                  placeholder="Welcome to our platform!"
                />

                <select
                  className="bg-black/40 border border-neutral-800 px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-neutral-600 transition-colors"
                  onChange={(e) => {
                    if (!e.target.value) return;
                    insertAtCursor("subject", `{{${e.target.value}}}`);
                    e.target.value = "";
                  }}
                >
                  <option value="">Insert var…</option>
                  {labeledVars.map((opt: any) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* BODY FIELD */}
            <div className="space-y-2">
              <label className="text-xs text-neutral-400 font-medium">
                Email Body (HTML allowed)
              </label>

              <div className="flex gap-2">
                <textarea
                  id="email-body"
                  className="flex-1 bg-black/40 border border-neutral-800 px-3 py-2.5 rounded-lg text-xs text-white placeholder-neutral-600 resize-none focus:outline-none focus:border-neutral-600 transition-colors h-28"
                  value={localFields.body || ""}
                  onChange={(e) => updateField("body", e.target.value)}
                  placeholder="<h1>Hello</h1><p>Thanks for joining!</p>"
                />

                <select
                  className="bg-black/40 border border-neutral-800 px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-neutral-600 transition-colors h-10"
                  onChange={(e) => {
                    if (!e.target.value) return;
                    insertAtCursor("body", `{{${e.target.value}}}`);
                    e.target.value = "";
                  }}
                >
                  <option value="">Insert var…</option>
                  {labeledVars.map((opt: any) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );
      },
    },

    /* ---------------------------------------------------
        INPUT VALIDATION
  --------------------------------------------------- */
    inputValidation: {
      outputVar: true,
      outputVarDefault: "validated",

      getOutputShape: () => ({
        ok: "boolean",
      }),

      render: ({ localFields, setField, availableVars }) => {
        const rules = localFields.rules || [];

        const updateRule = (i: number, key: string, value: any) => {
          const copy = [...rules];
          copy[i][key] = value;
          setField("rules", copy);
        };

        return (
          <div className="space-y-4">
            <label className="text-xs text-neutral-400 font-medium">
              Validation Rules
            </label>

            <div className="space-y-3">
              {rules.map((r: any, i: number) => (
                <div
                  key={i}
                  className="bg-neutral-950 border border-neutral-800 p-4 rounded-lg space-y-3 hover:border-neutral-700 transition-colors"
                >
                  {/* FIELD VARIABLE */}
                  <div className="space-y-2">
                    <label className="text-xs text-neutral-400 font-medium">
                      Field
                    </label>
                    <select
                      value={
                        r.field.startsWith("{{") ? r.field.slice(2, -2) : ""
                      }
                      onChange={(e) =>
                        updateRule(
                          i,
                          "field",
                          e.target.value ? `{{${e.target.value}}}` : ""
                        )
                      }
                      className="w-full bg-black/40 border border-neutral-800 px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-neutral-600 transition-colors"
                    >
                      <option value="">Select variable…</option>
                      {availableVars.map((v: any) => (
                        <option key={v.var} value={v.var}>
                          {v.display}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* TYPE */}
                  <div className="space-y-2">
                    <label className="text-xs text-neutral-400 font-medium">
                      Type
                    </label>
                    <select
                      value={r.type}
                      onChange={(e) => updateRule(i, "type", e.target.value)}
                      className="w-full bg-black/40 border border-neutral-800 px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-neutral-600 transition-colors"
                    >
                      <option value="string">string</option>
                      <option value="number">number</option>
                      <option value="boolean">boolean</option>
                    </select>
                  </div>

                  {/* REQUIRED */}
                  <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={r.required}
                      onChange={(e) =>
                        updateRule(i, "required", e.target.checked)
                      }
                      className="w-4 h-4 bg-black/40 border-neutral-800 rounded"
                    />
                    Required field
                  </label>

                  {/* REMOVE */}
                  <button
                    onClick={() => {
                      const copy = [...rules];
                      copy.splice(i, 1);
                      setField("rules", copy);
                    }}
                    className="w-full px-3 py-2 text-xs font-medium text-red-400 hover:text-red-300 bg-red-950/20 hover:bg-red-950/30 border border-red-900/30 rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 size={12} />
                    Remove Rule
                  </button>
                </div>
              ))}
            </div>

            {/* ADD RULE */}
            <button
              onClick={() =>
                setField("rules", [
                  ...rules,
                  { field: "", required: true, type: "string" },
                ])
              }
              className="w-full px-3 py-2.5 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus size={14} />
              Add Rule
            </button>
          </div>
        );
      },
    },

    /* ---------------------------------------------------
        USER LOGIN NODE
  --------------------------------------------------- */
    userLogin: {
      outputVar: true,
      outputVarDefault: "loginResult",

      getOutputShape: () => ({
        ok: "boolean",
        userId: "string",
        email: "string",
        name: "string",
      }),

      render: ({ localFields, setField, availableVars }: any) => {
        const labeledVars = getLabeledVars(availableVars);

        const updateField = (key: string, val: any) => {
          setField(key, val);
        };

        return (
          <div className="space-y-4">
            {/* EMAIL VARIABLE */}
            <div className="space-y-2">
              <label className="text-xs text-neutral-400 font-medium">
                Email Variable
              </label>

              <select
                value={
                  localFields.email?.startsWith("{{")
                    ? localFields.email.slice(2, -2)
                    : ""
                }
                onChange={(e) => updateField("email", `{{${e.target.value}}}`)}
                className="w-full bg-black/40 border border-neutral-800 px-3 py-2.5 rounded-lg text-xs text-white focus:outline-none focus:border-neutral-600 transition-colors"
              >
                <option value="">Select email variable…</option>
                {labeledVars.map((opt: any) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* PASSWORD VARIABLE */}
            <div className="space-y-2">
              <label className="text-xs text-neutral-400 font-medium">
                Password Variable
              </label>

              <select
                value={
                  localFields.password?.startsWith("{{")
                    ? localFields.password.slice(2, -2)
                    : ""
                }
                onChange={(e) =>
                  updateField("password", `{{${e.target.value}}}`)
                }
                className="w-full bg-black/40 border border-neutral-800 px-3 py-2.5 rounded-lg text-xs text-white focus:outline-none focus:border-neutral-600 transition-colors"
              >
                <option value="">Select password variable…</option>
                {labeledVars.map((opt: any) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );
      },
    },

    /* ---------------------------------------------------
        AUTH MIDDLEWARE NODE
  --------------------------------------------------- */
    authMiddleware: {
      outputVar: false,

      render: () => (
        <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm text-white font-medium">
            <Shield size={16} className="text-blue-400" />
            Auth Middleware
          </div>

          <p className="text-xs text-neutral-400 leading-relaxed">
            This step validates the JWT from the{" "}
            <span className="font-mono text-blue-400">Authorization</span>{" "}
            header.
          </p>

          <div className="space-y-2">
            <p className="text-[11px] text-neutral-500">
              Send your request with:
            </p>

            <div className="bg-black/60 border border-neutral-800 p-3 rounded-lg font-mono text-[11px] text-neutral-300">
              Authorization: Bearer &lt;your_token&gt;
            </div>
          </div>

          <p className="text-xs text-neutral-500">
            No configuration needed — this step simply guards the workflow.
          </p>
        </div>
      ),
    },
  };
};
