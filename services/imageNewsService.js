const bot = require("../utils/telegramBot");
const { getChatsBatch } = require("../utils/saveChat");
const eventRecordBot = require("../utils/eventRecordBot");
const path = require("path");

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

async function broadcastNewsWithImage() {
  const delayPerMessage = 3000;
  const batchSize = 100;
  let skip = 0;

  const newsCaption = `
📰 *యునెస్కో ఇండియా*

🇮🇳 *భారత్ యొక్క తాత్కాలిక వరల్డ్ హెరిటేజ్ జాబితాలో చేరిన 7 కొత్త సహజ స్థలాలు:*  

🌋 డెక్కన్ ట్రాప్స్ (మహారాష్ట్ర)  
🏝️ సెయింట్ మేరీస్ దీవులు (కర్ణాటక)  
🕳️ మేఘాలయన్ యుగ గుహలు (మెఘాలయ)  
⛰️ నాగా హిల్ ఓఫియోలైట్ (నాగాలాండ్)  
🟤 ఎర్ర మట్టి దిబ్బలు (ఆంధ్రప్రదేశ్)  
⛩️ తిరుమల కొండలు (ఆంధ్రప్రదేశ్)  
🏞️ వర్కల యొక్క సహజ వారసత్వం (కేరళ)  
`;

  const imageUrl = path.join(__dirname, "..", "localDB", "image.png");

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
        await bot.telegram.sendPhoto(chatId, imageUrl, {
          caption: newsCaption,
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

module.exports = { broadcastNewsWithImage };
