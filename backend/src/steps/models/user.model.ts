import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});

export default mongoose.models.users || mongoose.model("users", UserSchema);
