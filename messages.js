import mongoose from "mongoose";

const chatSchema = mongoose.Schema({
  roomId: Number,
  message: String,
  name: String,
  timestamp: String,
  received: Boolean,
});

export default mongoose.model("messagecontents", chatSchema);
