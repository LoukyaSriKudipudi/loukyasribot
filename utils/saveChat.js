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

      // 🔑 Force enable facts again if bot is re-added to a group/channel
      if (
        chatType === "group" ||
        chatType === "supergroup" ||
        chatType === "channel"
      ) {
        existing.factsEnabled = true;
      }

      await existing.save();
    } else {
      // Auto-enable facts only if group or channel
      const isGroupOrChannel =
        chatType === "group" ||
        chatType === "supergroup" ||
        chatType === "channel";

      const chat = new Chat({
        chatId,
        topicId,
        chatTitle,
        lastFactMessageId,
        factsEnabled: isGroupOrChannel,
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
