const Chat = require("../models/chats");

async function saveChat(
  chatId,
  topicId,
  chatTitle,
  lastFactMessageId = null,
  chatType = "private",
  extra = {}
) {
  try {
    const existing = await Chat.findOne({ chatId });

    if (existing) {
      // Update basic fields
      existing.topicId = topicId ?? existing.topicId;
      existing.chatTitle = chatTitle ?? existing.chatTitle;
      if (lastFactMessageId !== null)
        existing.lastFactMessageId = lastFactMessageId;

      // Update extra fields if provided
      if (extra.factIndex !== undefined) existing.factIndex = extra.factIndex;
      if (extra.nextFactTime !== undefined)
        existing.nextFactTime = extra.nextFactTime;
      if (extra.frequency !== undefined)
        existing.factFrequencyMinutes = extra.frequency;

      // Ensure default values exist
      existing.factIndex = existing.factIndex ?? 0;
      existing.nextFactTime = existing.nextFactTime ?? new Date();
      existing.factFrequencyMinutes = existing.factFrequencyMinutes ?? 30;

      await existing.save();
    } else {
      // Determine if chat should have facts enabled
      const isGroupOrChannel =
        chatType === "group" ||
        chatType === "supergroup" ||
        chatType === "channel";

      // Create new chat document
      const chat = new Chat({
        chatId,
        topicId,
        chatTitle,
        lastFactMessageId,
        factsEnabled: isGroupOrChannel,
        factIndex: extra.factIndex ?? 0,
        nextFactTime: extra.nextFactTime ?? new Date(),
        factFrequencyMinutes: extra.frequency ?? 30,
      });

      await chat.save();
    }
  } catch (err) {
    console.error("❌ Error saving fact chat:", err);
  }
}

async function getFactChatsBatch(skip = 0, limit = 100) {
  try {
    return await Chat.find({ factsEnabled: true }).skip(skip).limit(limit);
  } catch (err) {
    console.error("❌ Error fetching fact chat batch:", err);
    return [];
  }
}

module.exports = { saveChat, getFactChatsBatch };
