"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseNode } from "./BaseNode";
import { Play } from "lucide-react";

export function EventStepNode(props: any) {
  return (
    <BaseNode
      {...props}
      data={{
        ...props.data,
        label: props.data.label ?? "Event Step",
        icon: <Play size={14} className="stroke-[2.5]" />,
      }}
    />
  );
}
