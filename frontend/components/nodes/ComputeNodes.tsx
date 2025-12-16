/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { BaseNode } from "./BaseNode";
import { Cpu } from "lucide-react";

export function ComputeNode(props: any) {
  return (
    <BaseNode
      {...props}
      data={{
        ...props.data,
        label: props.data.label ?? "Compute",
        icon: <Cpu size={14} className="stroke-[2.5]" />,
      }}
    />
  );
}
