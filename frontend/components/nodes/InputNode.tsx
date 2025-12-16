"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseNode } from "./BaseNode";
import { MousePointerClick } from "lucide-react";

export function InputNode(props: any) {
  return (
    <BaseNode
      {...props}
      data={{
        ...props.data,
        label: props.data.label ?? "Input",
        icon: <MousePointerClick size={14} className="stroke-[2.5]" />,
      }}
    />
  );
}
