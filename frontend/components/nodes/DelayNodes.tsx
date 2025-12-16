"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseNode } from "./BaseNode";
import { Clock } from "lucide-react";

export function DelayNode(props: any) {
  return (
    <BaseNode
      {...props}
      data={{
        ...props.data,
        label: props.data.label ?? "Delay",
        icon: <Clock size={14} className="stroke-[2.5]" />,
      }}
    />
  );
}
