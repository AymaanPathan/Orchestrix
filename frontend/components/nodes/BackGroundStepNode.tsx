"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { BaseNode } from "./BaseNode";
import { Layers } from "lucide-react";

export function BackgroundStepNode(props: any) {
  return (
    <BaseNode
      {...props}
      data={{
        ...props.data,
        label: props.data.label ?? "Background Step",
        icon: <Layers size={14} className="stroke-[2.5]" />,
      }}
    />
  );
}
