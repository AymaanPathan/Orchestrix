import mongoose from "mongoose";

const StepSchema = new mongoose.Schema({}, { strict: false, _id: false });

const WorkflowSchema = new mongoose.Schema(
  {
    workflowId: { type: String, required: true, unique: true },
    ownerId: { type: String, required: true },
    name: { type: String },
    steps: { type: [StepSchema], default: [] },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdBy: { type: String },
    createdAt: { type: Date, default: () => new Date() },
    updatedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
);

export default mongoose.models.Workflow ||
  mongoose.model("Workflow", WorkflowSchema);
