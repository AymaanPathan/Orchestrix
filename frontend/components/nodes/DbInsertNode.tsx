/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { BaseNode } from "./BaseNode";
import { Database } from "lucide-react";

export function DBInsertNode(props: any) {
  return (
    <BaseNode
      {...props}
      data={{
        ...props.data,
        label: props.data.label ?? "DB: Insert",
        icon: <Database size={14} className="stroke-[2.5]" />,
      }}
    />
  );
}
