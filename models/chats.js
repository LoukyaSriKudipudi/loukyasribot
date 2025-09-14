const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
  chatId: { type: Number, required: true, unique: true },
  topicId: { type: Number },
  chatTitle: { type: String },
  factsEnabled: { type: Boolean, default: false },
  lastFactMessageId: { type: Number, default: null },
  quizEnabled: { type: Boolean, default: false },
  lastQuizMessageId: { type: Number, default: null },
});

module.exports = mongoose.model("Chat", chatSchema);
