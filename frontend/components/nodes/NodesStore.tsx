"use client";
import { AuthMiddlewareNode } from "./AuthMiddlewareNode";

import { DBDeleteNode } from "./DBDeleteNode";

import { DBFindNode } from "./DbFindNode";
import { DBInsertNode } from "./DbInsertNode";
import { DBUpdateNode } from "./DbUpdateNode";
import { EmailSendNode } from "./EmailSendNode";
import { InputNode } from "./InputNode";
import { InputValidationNode } from "./InputValidationNode";

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
};
