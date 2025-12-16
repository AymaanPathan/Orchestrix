"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseNode } from "./BaseNode";
import { Repeat } from "lucide-react";

export function LoopNode(props: any) {
  return (
    <BaseNode
      {...props}
      data={{
        ...props.data,
        label: props.data.label ?? "Loop",
        icon: <Repeat size={14} className="stroke-[2.5]" />,
      }}
    />
  );
}
