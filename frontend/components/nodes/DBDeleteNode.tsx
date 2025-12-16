/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { BaseNode } from "./BaseNode";
import { Trash2 } from "lucide-react";

export function DBDeleteNode(props: any) {
  return (
    <BaseNode
      {...props}
      data={{
        ...props.data,
        label: props.data.label ?? "DB: Delete",
        icon: <Trash2 size={14} className="stroke-[2.5]" />,
      }}
    />
  );
}
