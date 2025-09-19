const bot = require("../utils/telegramBot");
const { getFactChatsBatch, saveChat } = require("../utils/saveChat");
const eventRecordBot = require("../utils/eventRecordBot");
const path = require("path");
const fs = require("fs");

const factsFile = path.join(__dirname, "..", "localDB", "facts.json");
const facts = JSON.parse(fs.readFileSync(factsFile));

function getFactForGroup(chat) {
  const index = chat.factIndex || 0;
  return facts[index % facts.length];
}

let isBroadcasting = false;

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
    console.error("⚠ Failed to record fact event:", err.message);
  }
}

async function broadcastFact() {
  if (isBroadcasting) {
    console.log("⏳ Previous broadcast still running. Skipping this run.");
    return;
  }
  isBroadcasting = true;

  try {
    const delayPerMessage = 3000;
    const batchSize = 100;

    const allSuccessChats = [];
    const allFailedChats = [];

    while (true) {
      const chats = await getFactChatsBatch(0, batchSize, {
        factsEnabled: true,
        nextFactTime: { $lte: new Date() },
      });
      if (!chats.length) break;

      const successBatch = [];
      const failedBatch = [];
      const logs = [];

      for (const chat of chats) {
        const {
          chatId,
          topicId,
          chatTitle,
          lastFactMessageId,
          factIndex,
          factFrequencyMinutes,
        } = chat;

        try {
          // Delete previous fact if exists
          if (lastFactMessageId) {
            try {
              await bot.telegram.deleteMessage(chatId, lastFactMessageId);
              logs.push(`🗑 Deleted previous fact in ${chatTitle}`);
            } catch (err) {
              logs.push(`⚠ Could not delete in ${chatTitle}: ${err.message}`);
            }
          }

          const fact = getFactForGroup(chat);

          const sentMessage = await bot.telegram.sendMessage(
            chatId,
            `📝 ${fact}`,
            {
              ...(topicId
                ? { message_thread_id: topicId, protect_content: true }
                : { protect_content: true }),
              parse_mode: "Markdown",
            }
          );

          logs.push(`✅ Sent new fact to ${chatTitle}`);
          successBatch.push(chatTitle);
          allSuccessChats.push(chatTitle);

          // Update chat progress
          chat.lastFactMessageId = sentMessage.message_id;
          chat.factIndex = (factIndex + 1) % facts.length;
          chat.nextFactTime = new Date(
            Date.now() + (factFrequencyMinutes || 60) * 60 * 1000
          );

          await saveChat(
            chatId,
            topicId,
            chatTitle,
            sentMessage.message_id,
            chat.factIndex,
            chat.nextFactTime
          );
        } catch (err) {
          logs.push(`❌ Failed for ${chatTitle}: ${err.message}`);
          failedBatch.push(chatTitle);
          allFailedChats.push(chatTitle);
        }

        await new Promise((res) => setTimeout(res, delayPerMessage));
      }

      // Batch summary
      if (successBatch.length > 0 || failedBatch.length > 0) {
        const now = new Date().toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
          hour12: false,
        });
        await recordEvent(
          `📦 Finished fact batch at ${now}\n\n` +
            `• ✅ Success: ${successBatch.length} → ${
              successBatch.join(", ") || "None"
            }\n` +
            `• ❌ Failed: ${failedBatch.length} → ${
              failedBatch.join(", ") || "None"
            }\n\n` +
            `📝 Logs:\n${logs.join("\n")}`
        );
      }
    }

    // Final summary
    if (allSuccessChats.length > 0 || allFailedChats.length > 0) {
      const now = new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour12: false,
      });
      await recordEvent(
        `✅ Finished broadcasting all facts at ${now}\n\n` +
          `• Total chats: ${allSuccessChats.length + allFailedChats.length}\n` +
          `• ✅ Success: ${allSuccessChats.length} → ${
            allSuccessChats.join(", ") || "None"
          }\n` +
          `• ❌ Failed: ${allFailedChats.length} → ${
            allFailedChats.join(", ") || "None"
          }`
      );
    }
  } catch (err) {
    console.error("❌ Error during fact broadcast:", err);
  } finally {
    isBroadcasting = false;
  }
}

module.exports = { broadcastFact };
