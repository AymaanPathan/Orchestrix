/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { BaseNode } from "./BaseNode";
import { GitFork } from "lucide-react";

export function ConditionNode(props: any) {
  return (
    <BaseNode
      {...props}
      data={{
        ...props.data,
        label: props.data.label ?? "Condition",
        icon: <GitFork size={14} className="stroke-[2.5]" />,
      }}
    />
  );
}
