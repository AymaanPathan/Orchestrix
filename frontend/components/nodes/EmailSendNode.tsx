/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { BaseNode } from "./BaseNode";
import { Mail } from "lucide-react";

export function EmailSendNode(props: any) {
  return (
    <BaseNode
      {...props}
      data={{
        ...props.data,
        label: props.data.label ?? "Email: Send",
        icon: <Mail size={14} className="stroke-[2.5]" />,
      }}
    />
  );
}
