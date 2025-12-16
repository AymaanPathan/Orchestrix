"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Code, Database } from "lucide-react";

export function BaseNodeEditor({
  node,
  localData,
  setLocalData,
  graphMeta,
  config,
  onSave,
}: any) {
  const fields = localData.fields ?? {};
  const [label, setLabel] = useState(localData.label || "");

  const availableVars = graphMeta?.meta?.[node.id]?.availableVars || [];

  useEffect(() => {
    setLabel(localData.label || "");
  }, [localData]);

  const setField = (key: string, value: any) => {
    setLocalData((prev: any) => ({
      ...prev,
      fields: {
        ...(prev.fields || {}),
        [key]: value,
      },
    }));
  };

  const applySave = () => {
    onSave(node.id, {
      ...localData,
      label,
      fields: {
        ...(localData.fields || {}),
        ...fields,
      },
      pass: localData.pass,
    });
  };

  return (
    <div className="space-y-5 text-white">
      {/* NODE LABEL */}
      <div className="space-y-2">
        <label className="text-xs text-neutral-400 font-medium">
          Node Label
        </label>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Enter node label..."
          className="w-full bg-black/40 border border-neutral-800 px-3 py-2.5 rounded-lg text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors"
        />
      </div>

      {/* LOGIN NODE - Special handling */}
      {node.type === "userLogin" && (
        <div className="space-y-4 bg-neutral-950 border border-neutral-800 p-4 rounded-lg">
          {/* EMAIL */}
          <div className="space-y-2">
            <label className="text-xs text-neutral-400 font-medium">
              Email Variable
            </label>
            <select
              value={
                fields.email?.startsWith("{{") ? fields.email.slice(2, -2) : ""
              }
              onChange={(e) =>
                setField("email", e.target.value ? `{{${e.target.value}}}` : "")
              }
              className="w-full bg-black/40 border border-neutral-800 px-3 py-2.5 rounded-lg text-sm text-white focus:outline-none focus:border-neutral-600 transition-colors"
            >
              <option value="">Select variable...</option>
              {availableVars.map((v: any) => (
                <option key={v.var} value={v.var}>
                  {v.display}
                </option>
              ))}
            </select>
          </div>

          {/* PASSWORD */}
          <div className="space-y-2">
            <label className="text-xs text-neutral-400 font-medium">
              Password Variable
            </label>
            <select
              value={
                fields.password?.startsWith("{{")
                  ? fields.password.slice(2, -2)
                  : ""
              }
              onChange={(e) =>
                setField(
                  "password",
                  e.target.value ? `{{${e.target.value}}}` : ""
                )
              }
              className="w-full bg-black/40 border border-neutral-800 px-3 py-2.5 rounded-lg text-sm text-white focus:outline-none focus:border-neutral-600 transition-colors"
            >
              <option value="">Select variable...</option>
              {availableVars.map((v: any) => (
                <option key={v.var} value={v.var}>
                  {v.display}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* NORMAL NODES - Render from config */}
      {node.type !== "userLogin" &&
        config.render({
          localFields: fields,
          setField,
          availableVars,
        })}

      {/* OUTPUT VAR FIELD */}
      {config.outputVar && (
        <div className="space-y-2">
          <label className="text-xs text-neutral-400 font-medium">
            Output Variable
          </label>
          <input
            value={fields.outputVar || config.outputVarDefault}
            onChange={(e) => setField("outputVar", e.target.value)}
            placeholder={config.outputVarDefault}
            className="w-full bg-black/40 border border-neutral-800 px-3 py-2.5 rounded-lg text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors"
          />
        </div>
      )}

      {/* RUNTIME OUTPUT PREVIEW */}
      {config.outputVar &&
        graphMeta?.runtimeShapes &&
        (() => {
          const outVar = fields.outputVar || config.outputVarDefault;
          const runtimeObj = graphMeta.runtimeShapes[outVar];

          if (!runtimeObj) return null;

          return (
            <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs text-neutral-400 font-medium">
                <Code size={12} className="text-blue-400" />
                Runtime Output ({outVar})
              </div>

              <div className="space-y-2">
                {Object.entries(runtimeObj).map(([k, v]) => (
                  <div
                    key={k}
                    className="flex justify-between items-center py-1.5 px-2 bg-black/40 rounded border border-neutral-800/50"
                  >
                    <span className="text-xs text-neutral-400 font-mono">
                      {k}
                    </span>
                    <span className="text-xs text-neutral-200 font-mono">
                      {String(v)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

      {/* PASS-FORWARD SELECT */}
      {config.outputVar && (
        <div className="space-y-2">
          <label className="text-xs text-neutral-400 font-medium">
            Pass Data to Next Node
          </label>

          {(() => {
            const outVar = fields.outputVar || config.outputVarDefault;

            // Merge static + runtime shapes
            let shape = graphMeta?.runtimeShapes?.[outVar];
            if (!shape) shape = graphMeta?.staticShapes?.[outVar];
            if (!shape && config.getOutputShape) {
              const liveShape = config.getOutputShape(localData.fields || {});
              if (liveShape) shape = liveShape;
            }

            let objectFields: string[] = [];
            if (shape) {
              objectFields = Object.keys(shape).map((f) => `${outVar}.${f}`);
            }

            const passedVars = availableVars?.filter(
              (x: any) => !x?.var?.startsWith(outVar)
            );

            return (
              <select
                value={localData.pass || "full"}
                onChange={(e) =>
                  setLocalData((prev: any) => ({
                    ...prev,
                    pass: e.target.value,
                  }))
                }
                className="w-full bg-black/40 border border-neutral-800 px-3 py-2.5 rounded-lg text-sm text-white focus:outline-none focus:border-neutral-600 transition-colors"
              >
                <optgroup label="Full Object">
                  <option value="full">{outVar} (full)</option>
                </optgroup>

                {objectFields.length > 0 && (
                  <optgroup label="Object Fields">
                    {objectFields.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </optgroup>
                )}

                {passedVars.length > 0 && (
                  <optgroup label="Variables from Previous Nodes">
                    {passedVars.map((x: any) => (
                      <option key={x.var} value={x.var}>
                        {x.display}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            );
          })()}
        </div>
      )}

      {/* SAVE BUTTON */}
      <button
        onClick={applySave}
        className="w-full px-4 py-3 text-sm font-medium text-black bg-white hover:bg-neutral-100 rounded-lg transition-all flex items-center justify-center gap-2 group hover:scale-[1.02] active:scale-[0.98]"
      >
        <CheckCircle
          size={16}
          className="group-hover:scale-110 transition-transform"
        />
        Save Changes
      </button>
    </div>
  );
}
