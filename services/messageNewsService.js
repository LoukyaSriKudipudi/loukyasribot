const bot = require("../utils/telegramBot");
const { getChatsBatch } = require("../utils/saveChat");
const path = require("path");
const fs = require("fs");
const eventRecordBot = require("../utils/eventRecordBot");

async function recordEvent(message) {
  try {
    const groupId = Number(process.env.EVENT_RECORD_GROUP_ID);
    const topicId = Number(process.env.EVENT_RECORD_GROUP_TOPIC_ID);

    await new Promise((res) => setTimeout(res, 1000));

    return await eventRecordBot.telegram.sendMessage(groupId, message, {
      ...(topicId ? { message_thread_id: topicId } : {}),
      parse_mode: "Markdown",
    });
  } catch (err) {
    if (err.response && err.response.error_code === 429) {
      const retryAfter = err.response.parameters.retry_after * 1000;
      console.log(`⏳ Rate limited. Waiting ${retryAfter} ms before retry...`);
      await new Promise((res) => setTimeout(res, retryAfter));
      return recordEvent(message);
    }
    console.error("⚠ Failed to record news event:", err.message);
  }
}

async function broadcastNews() {
  const delayPerMessage = 3000;
  const batchSize = 100;
  let skip = 0;

  const newsMessage = `
Hello ${chatTitle} 👋

For the bot to work smoothly, please grant it admin rights in this group. Some features may not function properly without it. 

Thanks!
`;

  const allSuccessChats = [];
  const allFailedChats = [];

  while (true) {
    const chats = await getChatsBatch(skip, batchSize);
    if (chats.length === 0) break;

    const successChatsBatch = [];
    const failedChatsBatch = [];
    const logs = [];

    for (const { chatId, topicId, chatTitle } of chats) {
      try {
        await bot.telegram.sendMessage(chatId, newsMessage, {
          parse_mode: "Markdown",
          ...(topicId ? { message_thread_id: topicId } : {}),
        });

        logs.push(`✅ Sent news to ${chatTitle} (${chatId})`);
        successChatsBatch.push(chatTitle);
        allSuccessChats.push(chatTitle);
      } catch (err) {
        logs.push(`❌ Failed for ${chatTitle} (${chatId}): ${err.message}`);
        failedChatsBatch.push(chatTitle);
        allFailedChats.push(chatTitle);
      }

      await new Promise((res) => setTimeout(res, delayPerMessage));
    }

    // 📦 log after each batch
    const now = new Date();
    const timestampIST = now.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour12: false,
    });

    await recordEvent(
      `📦 Finished news batch at ${timestampIST}\n\n` +
        `📊 Batch Summary:\n` +
        `• ✅ Success: ${successChatsBatch.length} → ${
          successChatsBatch.join(", ") || "None"
        }\n` +
        `• ❌ Failed: ${failedChatsBatch.length} → ${
          failedChatsBatch.join(", ") || "None"
        }\n\n` +
        `📝 Logs:\n${logs.join("\n")}`
    );

    skip += batchSize;
  }

  // ✅ final summary
  const now = new Date();
  const timestampIST = now.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour12: false,
  });

  await recordEvent(
    `✅ Finished broadcasting news at ${timestampIST}\n\n` +
      `📊 Final Summary:\n` +
      `• Total chats: ${allSuccessChats.length + allFailedChats.length}\n` +
      `• ✅ Success: ${allSuccessChats.length} → ${
        allSuccessChats.join(", ") || "None"
      }\n` +
      `• ❌ Failed: ${allFailedChats.length} → ${
        allFailedChats.join(", ") || "None"
      }`
  );
}

module.exports = { broadcastNews };
