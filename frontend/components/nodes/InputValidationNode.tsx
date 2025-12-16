"use client";
import { BaseNode } from "./BaseNode";
import { ShieldCheck } from "lucide-react";

export function InputValidationNode(props: any) {
  return (
    <BaseNode
      {...props}
      data={{
        ...props.data,
        fields: props.data.fields || { rules: [] },
        label: props.data.label ?? "Validate Input",
        icon: <ShieldCheck size={14} className="stroke-[2.5]" />,
      }}
    />
  );
}
