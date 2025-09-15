const Chat = require("../models/chats");

// Save chat with last quiz message
async function saveQuiz(chatId, topicId, chatTitle, lastQuizMessageId = null) {
  try {
    const existing = await Chat.findOne({ chatId });

    if (existing) {
      existing.topicId = topicId ?? existing.topicId;
      existing.chatTitle = chatTitle ?? existing.chatTitle;

      if (lastQuizMessageId !== null) {
        existing.lastQuizMessageId = lastQuizMessageId;
      }

      await existing.save();
    } else {
      const chat = new Chat({
        chatId,
        topicId,
        chatTitle,
        quizEnabled: false,
        lastQuizMessageId,
      });
      await chat.save();
    }
  } catch (err) {
    console.error("❌ Error saving quiz chat:", err);
  }
}

// Get chats with quiz enabled
async function getQuizChatsBatch(skip = 0, limit = 100) {
  try {
    return await Chat.find({ quizEnabled: true }).skip(skip).limit(limit);
  } catch (err) {
    console.error("❌ Error fetching quiz chat batch:", err);
    return [];
  }
}

module.exports = { saveQuiz, getQuizChatsBatch };
