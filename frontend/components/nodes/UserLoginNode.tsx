"use client";

import { BaseNode } from "./BaseNode";
import { Lock } from "lucide-react";

export function UserLoginNode(props: any) {
  return (
    <BaseNode
      {...props}
      data={{
        ...props.data,
        type: "userLogin",
        label: props.data.label ?? "users Login",
        icon: <Lock size={14} className="stroke-[2.5]" />,
        fields: props.data.fields ?? {
          email: "{{email}}",
          password: "{{password}}",
        },
      }}
    />
  );
}
