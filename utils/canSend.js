const bot = require("./telegramBot");
const Chat = require("../models/chats");
const eventRecordBot = require("./eventRecordBot"); // import your event record bot

// Helper to send message to your event record group
async function recordEvent(message) {
  try {
    const groupId = Number(process.env.EVENT_RECORD_GROUP_ID);
    const topicId = Number(process.env.EVENT_RECORD_GROUP_TOPIC_ID);

    await eventRecordBot.telegram.sendMessage(groupId, message, {
      ...(topicId ? { message_thread_id: topicId } : {}),
      parse_mode: "Markdown",
    });
  } catch (err) {
    console.error("⚠ Failed to send event record:", err.message);
  }
}

async function checkAndUpdateCanSend(chatId = null) {
  try {
    if (chatId) {
      // Single chat check
      return await updateChatCanSend(chatId);
    } else {
      // No chatId → check all locked chats
      const lockedChats = await Chat.find({ canSend: false });

      for (const chat of lockedChats) {
        const updated = await updateChatCanSend(chat.chatId);
        if (updated) {
          const msg = `✅ canSend restored and quizEnabled=true for ${
            chat.chatTitle || chat.chatId
          }`;
          await recordEvent(msg); // send to event record
        }
      }
    }
  } catch (err) {
    console.error("⚠ Error in auto-enable check:", err.message);
    await recordEvent(`⚠ Error in auto-enable check: ${err.message}`);
  }
}

// Helper function for updating a single chat
async function updateChatCanSend(chatId) {
  try {
    const botInfo = await bot.telegram.getMe();
    const member = await bot.telegram.getChatMember(chatId, botInfo.id);

    let canSendNow = false;

    if (member.status === "administrator" || member.status === "creator") {
      canSendNow = true;
    } else if (member.status === "member") {
      const chatInfo = await bot.telegram.getChat(chatId);
      canSendNow =
        chatInfo.permissions?.can_send_messages !== false ||
        chatInfo.permissions == null;
    }

    const chatDoc = await Chat.findOne({ chatId });
    if (chatDoc) {
      let updated = false;

      if (chatDoc.canSend !== canSendNow) {
        chatDoc.canSend = canSendNow;
        updated = true;
      }

      // Only auto-enable if quizEnabled is null/undefined (respect manual false)
      if (
        canSendNow &&
        (chatDoc.quizEnabled === undefined || chatDoc.quizEnabled === null)
      ) {
        chatDoc.quizEnabled = true;
        updated = true;
      }

      // Set nextQuizTime if canSend restored and nextQuizTime is missing or in past
      if (
        canSendNow &&
        (!chatDoc.nextQuizTime || chatDoc.nextQuizTime < new Date())
      ) {
        chatDoc.nextQuizTime = new Date(Date.now() + 15 * 60 * 1000);
        updated = true;
      }

      if (updated) {
        await chatDoc.save();
        const msg = `✅ Updated chat ${
          chatDoc.chatTitle || chatId
        }: canSend=${canSendNow}, quizEnabled=${
          chatDoc.quizEnabled
        }, nextQuizTime=${chatDoc.nextQuizTime}`;
        await recordEvent(msg); // send to event record
      }
    }

    return canSendNow;
  } catch (err) {
    const msg = `⚠ Failed to update canSend for ${chatId}: ${err.message}`;
    console.log(msg);
    await recordEvent(msg);
    return false;
  }
}

module.exports = checkAndUpdateCanSend;
