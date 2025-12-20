import mongoose, { HydratedDocument } from "mongoose";
import bcrypt from "bcryptjs";

interface IUser {
  name?: string;
  email?: string;
  password?: string;
}

const UserSchema = new mongoose.Schema<IUser>(
  {
    name: { type: String },
    email: { type: String, },
    password: { type: String, select: false },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ✅ Correct async pre-save hook (NO next)
UserSchema.pre("save", async function (this: HydratedDocument<IUser>) {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password!, 10);
});

export default mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);
