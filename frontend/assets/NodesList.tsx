import {
  GitFork,
  Send,
  Cpu,
  Clock,
  Repeat,
  Bug,
  MousePointerClick,
  Play,
  Layers,
  Table2,
  Reply,
  ShieldCheck,
} from "lucide-react";

export const nodeTemplates = [
  // Core Inputs
  {
    type: "input",
    label: "Input",
    description: "Workflow input variables",
    icon: <MousePointerClick size={16} />,
    color: "blue",
  },

  // Database Nodes
  {
    type: "dbFind",
    label: "DB: Find Record",
    description: "Query existing records",
    icon: <Table2 size={16} />,
    color: "purple",
  },
  {
    type: "dbInsert",
    label: "DB: Insert Record",
    description: "Insert new row",
    icon: <Table2 size={16} />,
    color: "purple",
  },
  {
    type: "dbUpdate",
    label: "DB: Update Record",
    description: "Update existing row",
    icon: <Table2 size={16} />,
    color: "purple",
  },
  {
    type: "dbDelete",
    label: "DB: Delete Record",
    description: "Delete existing row",
    icon: <Table2 size={16} />,
    color: "purple",
  },
  // Email
  {
    type: "emailSend",
    label: "Send Email",
    description: "Send an email via SMTP",
    icon: <Send size={16} />,
    color: "red",
  },
  // Validate input
  {
    type: "inputValidation",
    label: "Validate Input",
    description: "Validate incoming data",
    icon: <ShieldCheck size={16} />,
    color: "orange",
  },
  // Login
  // {
  //   type: "userLogin",
  //   label: "users Login",
  //   description: "Authenticate a user",
  //   icon: <ShieldCheck size={16} />,
  //   color: "orange",
  // },
  // {
  //   type: "authMiddleware",
  //   label: "Auth Middleware",
  //   description: "Authenticate requests",
  //   icon: <ShieldCheck size={16} />,
  //   color: "orange",
  // },
  // {
  //   type: "delay",
  //   label: "Delay",
  //   description: "Wait for X seconds",
  //   icon: <Clock size={16} />,
  //   color: "yellow",
  // },
  // {
  //   type: "loop",
  //   label: "Loop",
  //   description: "Repeat for each item",
  //   icon: <Repeat size={16} />,
  //   color: "pink",
  // },

  // {
  //   type: "eventStep",
  //   label: "Motia Event Step",
  //   description: "Event trigger step",
  //   icon: <Play size={16} />,
  //   color: "blue",
  // },
  // {
  //   type: "backgroundStep",
  //   label: "Motia Background Step",
  //   description: "Background job step",
  //   icon: <Layers size={16} />,
  //   color: "green",
  // },
];
