"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseNode } from "./BaseNode";
import { Bug } from "lucide-react";

export function LogNode(props: any) {
  return (
    <BaseNode
      {...props}
      data={{
        ...props.data,
        label: props.data.label ?? "Log",
        icon: <Bug size={14} className="stroke-[2.5]" />,
      }}
    />
  );
}
