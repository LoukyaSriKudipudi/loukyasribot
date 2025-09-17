const Chat = require("../models/chats");

async function saveQuiz(
  chatId,
  topicId,
  chatTitle,
  lastQuizMessageId = null,
  chatType = "private"
) {
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
      const isGroupOrChannel =
        chatType === "group" ||
        chatType === "supergroup" ||
        chatType === "channel";

      const chat = new Chat({
        chatId,
        topicId,
        chatTitle,
        lastQuizMessageId,
        quizEnabled: isGroupOrChannel,
      });

      await chat.save();
    }
  } catch (err) {
    console.error("❌ Error saving quiz chat:", err);
  }
}

async function getQuizChatsBatch(skip = 0, limit = 100) {
  try {
    return await Chat.find({ factsEnabled: true }).skip(skip).limit(limit);
  } catch (err) {
    console.error("❌ Error fetching quiz chat batch:", err);
    return [];
  }
}

module.exports = { saveQuiz, getQuizChatsBatch };
