"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseNode } from "./BaseNode";
import { Reply } from "lucide-react";

export function ResponseNode(props: any) {
  return (
    <BaseNode
      {...props}
      data={{
        ...props.data,
        label: props.data.label ?? "Response",
        icon: <Reply size={14} className="stroke-[2.5]" />,
      }}
    />
  );
}
