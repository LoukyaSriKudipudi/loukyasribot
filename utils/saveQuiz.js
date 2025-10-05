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
      // Update fields
      existing.topicId = topicId ?? existing.topicId;
      existing.chatTitle = chatTitle ?? existing.chatTitle;

      if (lastQuizMessageId !== null)
        existing.lastQuizMessageId = lastQuizMessageId;

      if (extra.quizIndex !== undefined) existing.quizIndex = extra.quizIndex;
      if (extra.frequency !== undefined)
        existing.quizFrequencyMinutes = extra.frequency;

      // Next quiz time
      existing.nextQuizTime =
        extra.nextQuizTime ??
        existing.nextQuizTime ??
        new Date(
          Date.now() + (existing.quizFrequencyMinutes || 60) * 60 * 1000
        );

      // Set defaults
      existing.quizIndex = existing.quizIndex ?? 0;
      existing.quizFrequencyMinutes = existing.quizFrequencyMinutes ?? 60;

      // Force enable
      if (
        chatType === "group" ||
        chatType === "supergroup" ||
        chatType === "channel"
      ) {
        existing.quizEnabled = true;
        existing.canSend = true;

        // Fix next time
        if (!existing.nextQuizTime || existing.nextQuizTime < new Date()) {
          existing.nextQuizTime = new Date(
            Date.now() + (existing.quizFrequencyMinutes || 60) * 60 * 1000
          );
        }
      }

      await existing.save();
    } else {
      // Group check
      const isGroupOrChannel =
        chatType === "group" ||
        chatType === "supergroup" ||
        chatType === "channel";

      // Initial next time
      const initialNextQuizTime =
        extra.nextQuizTime ??
        new Date(Date.now() + (extra.frequency ?? 60) * 60 * 1000);

      // New chat
      const chat = new Chat({
        chatId,
        topicId,
        chatTitle,
        lastQuizMessageId,
        quizEnabled: isGroupOrChannel,
        canSend: isGroupOrChannel,
        quizIndex: extra.quizIndex ?? 0,
        nextQuizTime: initialNextQuizTime,
        quizFrequencyMinutes: extra.frequency ?? 60,
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
