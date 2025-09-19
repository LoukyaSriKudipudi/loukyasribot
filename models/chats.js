const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    chatId: { type: Number, required: true, unique: true },
    topicId: { type: Number },
    chatTitle: { type: String },

    // Enable toggles
    factsEnabled: { type: Boolean, default: false },
    quizEnabled: { type: Boolean, default: false },

    // Last sent messages
    lastFactMessageId: { type: Number, default: null },
    lastQuizMessageId: { type: Number, default: null },

    // Quiz tracking
    quizIndex: { type: Number, default: 0 },
    nextQuizTime: { type: Date, default: null },
    quizFrequencyMinutes: { type: Number, default: 30 },

    // Fact tracking (new fields)
    factIndex: { type: Number, default: 0 },
    nextFactTime: { type: Date, default: null },
    factFrequencyMinutes: { type: Number, default: 30 },

    // Optional createdAt for ordering by join time
    createdAt: { type: Date, default: Date.now },
  },
  { minimize: false }
);

module.exports = mongoose.model("Chat", chatSchema);
