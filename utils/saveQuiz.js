const Chat = require("../models/chats");

async function saveQuiz(
  chatId,
  topicId,
  chatTitle,
  lastQuizMessageId = null,
  chatType = "private",
  extra = {}
) {
  try {
    const existing = await Chat.findOne({ chatId });

    if (existing) {
      // Update basic fields
      existing.topicId = topicId ?? existing.topicId;
      existing.chatTitle = chatTitle ?? existing.chatTitle;
      if (lastQuizMessageId !== null)
        existing.lastQuizMessageId = lastQuizMessageId;

      // Update extra fields if provided
      if (extra.quizIndex !== undefined) existing.quizIndex = extra.quizIndex;
      if (extra.nextQuizTime !== undefined)
        existing.nextQuizTime = extra.nextQuizTime;
      if (extra.frequency !== undefined)
        existing.quizFrequencyMinutes = extra.frequency;

      // Ensure default values exist
      existing.quizIndex = existing.quizIndex ?? 0;
      existing.nextQuizTime = existing.nextQuizTime ?? new Date();
      existing.quizFrequencyMinutes = existing.quizFrequencyMinutes ?? 30;

      await existing.save();
    } else {
      // Determine if chat should have quiz enabled
      const isGroupOrChannel =
        chatType === "group" ||
        chatType === "supergroup" ||
        chatType === "channel";

      // Create new chat document
      const chat = new Chat({
        chatId,
        topicId,
        chatTitle,
        lastQuizMessageId,
        quizEnabled: isGroupOrChannel,
        quizIndex: extra.quizIndex ?? 0,
        nextQuizTime: extra.nextQuizTime ?? new Date(),
        quizFrequencyMinutes: extra.frequency ?? 30,
      });

      await chat.save();
    }
  } catch (err) {
    console.error("❌ Error saving quiz chat:", err);
  }
}

async function getQuizChatsBatch(skip = 0, limit = 100) {
  try {
    return await Chat.find({ quizEnabled: true }).skip(skip).limit(limit);
  } catch (err) {
    console.error("❌ Error fetching quiz chat batch:", err);
    return [];
  }
}

module.exports = { saveQuiz, getQuizChatsBatch };
