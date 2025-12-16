"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseNode } from "./BaseNode";
import { Send } from "lucide-react";

export function ApiRequestNode(props: any) {
  return (
    <BaseNode
      {...props}
      data={{
        ...props.data,
        label: props.data.label ?? "API Request",
        icon: <Send size={14} className="stroke-[2.5]" />,
      }}
    />
  );
}
