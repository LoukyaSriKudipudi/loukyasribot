const bot = require("../utils/telegramBot");
const { getChatsBatch } = require("../utils/saveChat");
const { getFact } = require("./factsService");

async function broadcastFact() {
  const fact = getFact();
  const message = `🧠 *Fact* of the Hour:\n\n${fact}`;

  const delayPerMessage = 3000;
  const batchSize = 100;
  let skip = 0;

  while (true) {
    const chats = await getChatsBatch(skip, batchSize);
    if (chats.length === 0) break;

    for (const { chatId, topicId } of chats) {
      try {
        await bot.telegram.sendMessage(chatId, message, {
          ...(topicId ? { message_thread_id: topicId } : {}),
          parse_mode: "Markdown",
        });
        console.log(`✅ Sent fact to ${chatId}`);
      } catch (err) {
        console.error(`❌ Failed to send to ${chatId}`, err.message);
      }

      await new Promise((res) => setTimeout(res, delayPerMessage));
    }

    skip += batchSize;
  }

  console.log("✅ Finished broadcasting facts.");
}

module.exports = { broadcastFact };
