const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
  chatId: { type: Number, required: true, unique: true },
  topicId: { type: Number, default: null },
  chatTitle: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Chat", chatSchema);
