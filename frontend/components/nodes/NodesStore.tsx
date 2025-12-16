"use client";
import { ApiRequestNode } from "./ApiRequestNode";
import { AuthMiddlewareNode } from "./AuthMiddlewareNode";
import { BackgroundStepNode } from "./BackGroundStepNode";
import { ComputeNode } from "./ComputeNodes";
import { ConditionNode } from "./ConditionNode";
import { DBDeleteNode } from "./DBDeleteNode";

import { DBFindNode } from "./DbFindNode";
import { DBInsertNode } from "./DbInsertNode";
import { DBUpdateNode } from "./DbUpdateNode";
import { DelayNode } from "./DelayNodes";
import { EmailSendNode } from "./EmailSendNode";
import { EventStepNode } from "./EventStepNode";
import { InputNode } from "./InputNode";
import { InputValidationNode } from "./InputValidationNode";
import { LogNode } from "./LogNode";
import { LoopNode } from "./LoopNode";
import { ParallelStepNode } from "./ParallelStepNode";
import { ResponseNode } from "./ResponseNode";
import { UserLoginNode } from "./UserLoginNode";

export const nodeTypes = {
  input: InputNode,
  dbFind: DBFindNode,
  dbInsert: DBInsertNode,
  dbUpdate: DBUpdateNode,
  dbDelete: DBDeleteNode,
  inputValidation: InputValidationNode,
  userLogin: UserLoginNode,
  authMiddleware: AuthMiddlewareNode,
  emailSend: EmailSendNode,
  condition: ConditionNode,
  response: ResponseNode,
  apiRequest: ApiRequestNode,
  compute: ComputeNode,
  delay: DelayNode,
  loop: LoopNode,
  log: LogNode,
  eventStep: EventStepNode,
  backgroundStep: BackgroundStepNode,
  parallelStep: ParallelStepNode,
};
