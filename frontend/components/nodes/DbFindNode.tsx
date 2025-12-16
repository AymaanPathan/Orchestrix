/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { BaseNode } from "./BaseNode";
import { Search } from "lucide-react";

export function DBFindNode(props: any) {
  return (
    <BaseNode
      {...props}
      data={{
        ...props.data,
        label: props.data.label ?? "DB: Find",
        icon: <Search size={14} className="stroke-[2.5]" />,
      }}
    />
  );
}
