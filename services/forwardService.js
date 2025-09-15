const bot = require("../utils/telegramBot");
const { getChatsBatch } = require("../utils/saveChat");
const eventRecordBot = require("../utils/eventRecordBot");

const BROADCAST_GROUP_ID = Number(process.env.BROADCAST_NEWS_GROUP);
const BROADCAST_TOPIC_ID = Number(process.env.BROADCAST_NEWS_GROUP_TOPIC_ID);
const DELAY_PER_MESSAGE = 2000;
const BATCH_SIZE = 100;

// Function to log events
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
      console.log(`⏳ Rate limited. Waiting ${retryAfter} ms...`);
      await new Promise((res) => setTimeout(res, retryAfter));
      return recordEvent(message);
    }
    console.error("⚠ Failed to record event:", err.message);
  }
}

// Forward a single message to all user chats
async function forwardMessageToAll(msg) {
  let skip = 0;
  const allSuccessChats = [];
  const allFailedChats = [];

  while (true) {
    const chats = await getChatsBatch(skip, BATCH_SIZE);
    if (!chats.length) break;

    const successChatsBatch = [];
    const failedChatsBatch = [];
    const logs = [];

    for (const { chatId, topicId, chatTitle } of chats) {
      try {
        await bot.telegram.copyMessage(chatId, msg.chat.id, msg.message_id, {
          ...(topicId ? { message_thread_id: topicId } : {}),
          protect_content: true,
        });

        logs.push(`✅ Forwarded to ${chatTitle}`);
        successChatsBatch.push(chatTitle);
        allSuccessChats.push(chatTitle);
      } catch (err) {
        logs.push(`❌ Failed for ${chatTitle}: ${err.message}`);
        failedChatsBatch.push(chatTitle);
        allFailedChats.push(chatTitle);
      }

      await new Promise((res) => setTimeout(res, DELAY_PER_MESSAGE));
    }

    const now = new Date();
    const timestampIST = now.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour12: false,
    });

    await recordEvent(
      `📦 Batch completed at ${timestampIST}\n` +
        `• ✅ Success: ${successChatsBatch.length}\n` +
        `• ❌ Failed: ${failedChatsBatch.length}\n` +
        `📝 Logs:\n${logs.join("\n")}`
    );

    skip += BATCH_SIZE;
  }

  // Final summary
  const now = new Date();
  const timestampIST = now.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour12: false,
  });

  await recordEvent(
    `✅ Finished forwarding at ${timestampIST}\n` +
      `• ✅ Success: ${allSuccessChats.length}\n` +
      `• ❌ Failed: ${allFailedChats.length}`
  );
}

// Command to forward a message manually
bot.command("forwardnews", async (ctx) => {
  if (!ctx.message.reply_to_message) {
    return ctx.reply(
      "❌ Please reply to the message (text, file, image, or document) you want to forward with /forwardnews."
    );
  }

  const msg = ctx.message.reply_to_message;

  // Only allow messages from broadcast group topic
  if (msg.chat.id !== BROADCAST_GROUP_ID) {
    return ctx.reply("❌ This message is not from the broadcast group.");
  }
  if (msg.message_thread_id !== BROADCAST_TOPIC_ID) {
    return ctx.reply("❌ This message is not from the broadcast topic.");
  }

  if (BROADCAST_TOPIC_ID && msg.message_thread_id !== BROADCAST_TOPIC_ID) {
    return ctx.reply("❌ This message is not from the broadcast topic.");
  }

  await ctx.reply("⏳ Forwarding message to all users...");
  await forwardMessageToAll(msg);
  await ctx.reply("✅ Forwarding completed!");
});

module.exports = { forwardMessageToAll };
