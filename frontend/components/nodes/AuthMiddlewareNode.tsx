"use client";

import { BaseNode } from "./BaseNode";
import { Lock } from "lucide-react";

export function AuthMiddlewareNode(props: any) {
  return (
    <BaseNode
      {...props}
      data={{
        ...props.data,
        label: props.data.label ?? "Auth Middleware",
        icon: <Lock size={14} className="stroke-[2.5]" />,
        fields: props.data.fields || {
          tokenVar: "input.token", // default – user can change
          required: true,
        },
      }}
    />
  );
}
