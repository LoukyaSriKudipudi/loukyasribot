const bot = require("../utils/telegramBot");
const { getChatsBatch, saveChat } = require("../utils/saveChat");
const { getFact } = require("./factsService");
const eventRecordBot = require("../utils/eventRecordBot");

async function recordEvent(message) {
  try {
    const groupId = Number(process.env.EVENT_RECORD_GROUP_ID);
    const topicId = Number(process.env.EVENT_RECORD_GROUP_TOPIC_ID);

    await new Promise((res) => setTimeout(res, 1000));

    return await eventRecordBot.telegram.sendMessage(groupId, message, {
      ...(topicId ? { message_thread_id: topicId } : {}),
    });
  } catch (err) {
    if (err.response && err.response.error_code === 429) {
      const retryAfter = err.response.parameters.retry_after * 1000;
      console.log(`⏳ Rate limited. Waiting ${retryAfter} ms before retry...`);
      await new Promise((res) => setTimeout(res, retryAfter));
      return recordEvent(message);
    }
    console.error("⚠ Failed to record event:", err.message);
  }
}

async function broadcastFact() {
  const delayPerMessage = 3000;
  const batchSize = 100;
  let skip = 0;

  const fact = getFact();
  const message = `📝 ${fact}`;

  const allSuccessChats = [];
  const allFailedChats = [];

  while (true) {
    const chats = await getChatsBatch(skip, batchSize);
    if (chats.length === 0) break;

    const successChatsBatch = [];
    const failedChatsBatch = [];
    const logs = [];

    for (const chat of chats) {
      const { chatId, topicId, chatTitle, lastFactMessageId } = chat;

      try {
        if (lastFactMessageId) {
          try {
            await bot.telegram.deleteMessage(chatId, lastFactMessageId);
            logs.push(`🗑 Deleted previous fact in ${chatTitle} (${chatId})`);
          } catch (err) {
            logs.push(
              `⚠ Could not delete previous message in ${chatTitle} (${chatId}): ${err.message}`
            );
          }
        }

        // Send fact
        const sentMessage = await bot.telegram.sendMessage(chatId, message, {
          ...(topicId
            ? { message_thread_id: topicId, protect_content: true }
            : { protect_content: true }),
          parse_mode: "Markdown",
        });

        logs.push(`✅ Sent new fact to ${chatTitle} (${chatId})`);
        successChatsBatch.push(chatTitle);
        allSuccessChats.push(chatTitle);

        await saveChat(chatId, topicId, chatTitle, sentMessage.message_id);
      } catch (err) {
        if (
          err.response?.error_code === 403 ||
          err.message.includes("bot was kicked")
        ) {
          // Bot removed from group → disable facts
          chat.factsEnabled = false;
          chat.nextFactTime = null;
          await chat.save();
          logs.push(`❌ Facts disabled for ${chatTitle}: bot was kicked`);
        } else if (
          err.response?.error_code === 400 &&
          (err.description?.includes("not enough rights to send") ||
            err.description?.includes("polls"))
        ) {
          // Group locked → disable facts
          chat.factsEnabled = false;
          chat.nextFactTime = null;
          await chat.save();
          logs.push(
            `❌ Facts disabled for ${chatTitle}: group is locked (no send rights)`
          );
        } else {
          logs.push(`❌ Failed in ${chatTitle}: ${err.message}`);
        }

        failedChatsBatch.push(chatTitle);
        allFailedChats.push(chatTitle);
      }

      // delay between sending messages
      await new Promise((res) => setTimeout(res, delayPerMessage));
    }

    // send logs for this batch
    const now = new Date();
    const timestampIST = now.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour12: false,
    });

    const batchTotal = successChatsBatch.length + failedChatsBatch.length;
    await recordEvent(
      `📦 Finished batch at ${timestampIST}\n\n` +
        `📊 Batch Summary:\n` +
        `• Total chats: ${batchTotal}\n` +
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

  // final summary
  const now = new Date();
  const timestampIST = now.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour12: false,
  });

  const total = allSuccessChats.length + allFailedChats.length;
  await recordEvent(
    `✅ Finished broadcasting all facts at ${timestampIST}\n\n` +
      `📊 Final Summary:\n` +
      `• Total chats: ${total}\n` +
      `• ✅ Success: ${allSuccessChats.length} → ${
        allSuccessChats.join(", ") || "None"
      }\n` +
      `• ❌ Failed: ${allFailedChats.length} → ${
        allFailedChats.join(", ") || "None"
      }`
  );
}

module.exports = { broadcastFact };
