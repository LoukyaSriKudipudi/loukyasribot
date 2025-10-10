const Chat = require("../models/chats");

async function saveChat(
  chatId,
  topicId,
  chatTitle,
  lastFactMessageId = null,
  chatType = "private"
) {
  try {
    const existing = await Chat.findOne({ chatId });

    if (existing) {
      existing.topicId = topicId ?? existing.topicId;
      existing.chatTitle = chatTitle ?? existing.chatTitle;

      if (lastFactMessageId !== null) {
        existing.lastFactMessageId = lastFactMessageId;
      }

      // Force enable
      if (
        chatType === "group" ||
        chatType === "supergroup" ||
        chatType === "channel"
      ) {
        existing.factsEnabled = true;

        // Auto-enable
        existing.canSend = true;

        // Fix next time
        if (!existing.nextQuizTime || existing.nextQuizTime < new Date()) {
          existing.nextQuizTime = new Date(Date.now() + 5 * 60 * 1000);
        }
      }

      await existing.save();
    } else {
      // Group check
      const isGroupOrChannel =
        chatType === "group" ||
        chatType === "supergroup" ||
        chatType === "channel";

      // New chat
      const chat = new Chat({
        chatId,
        topicId,
        chatTitle,
        lastFactMessageId,
        factsEnabled: isGroupOrChannel,
        canSend: isGroupOrChannel,
        nextQuizTime: isGroupOrChannel
          ? new Date(Date.now() + 5 * 60 * 1000)
          : null,
      });

      await chat.save();
    }
  } catch (err) {
    console.error("❌ Error saving chat:", err);
  }
}

async function getChatsBatch(skip = 0, limit = 100) {
  try {
    return await Chat.find({ factsEnabled: true }).skip(skip).limit(limit);
  } catch (err) {
    console.error("❌ Error fetching chat batch:", err);
    return [];
  }
}

module.exports = { saveChat, getChatsBatch };
