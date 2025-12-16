"use client";

import { BaseNodeEditor } from "../Ui/BaseNodeEditor";
import { useNodeConfigs } from "@/nodeConfigs";

export default function LoginNodeEditor(props: any) {
  const NODE_CONFIGS = useNodeConfigs();
  return <BaseNodeEditor {...props} config={NODE_CONFIGS.userLogin} />;
}
