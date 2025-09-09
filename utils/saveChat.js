const Chat = require("../models/chats");

async function saveChat(chatId, topicId, chatTitle) {
  try {
    const existing = await Chat.findOne({ chatId });

    if (existing) {
      if (existing.topicId !== topicId) {
        existing.topicId = topicId;
        existing.chatTitle = chatTitle;
        await existing.save();
      }
    } else {
      const chat = new Chat({ chatId, topicId, chatTitle });
      await chat.save();
    }
  } catch (err) {
    console.error("❌ Error saving chat:", err);
  }
}

async function getChatsBatch(skip = 0, limit = 100) {
  try {
    return await Chat.find({}).skip(skip).limit(limit);
  } catch (err) {
    console.error("❌ Error fetching chat batch:", err);
    return [];
  }
}

module.exports = { saveChat, getChatsBatch };
