"use client";

import { useNodeConfigs } from "@/nodeConfigs";
import { BaseNodeEditor } from "../Ui/BaseNodeEditor";

export default function InputValidationNodeEditor(props: any) {
  const NODE_CONFIGS = useNodeConfigs();
  return <BaseNodeEditor {...props} config={NODE_CONFIGS.inputValidation} />;
}
