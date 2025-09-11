const bot = require("../utils/telegramBot");
const { getChatsBatch, saveChat } = require("../utils/saveChat");
const { getFact } = require("./factsService");

async function broadcastFact() {
  const delayPerMessage = 3000;
  const batchSize = 100;
  let skip = 0;

  const fact = getFact();
  const message = `📝 ${fact}`;

  while (true) {
    const chats = await getChatsBatch(skip, batchSize);
    if (chats.length === 0) break;

    for (const { chatId, topicId, chatTitle, lastFactMessageId } of chats) {
      try {
        if (lastFactMessageId) {
          try {
            await bot.telegram.deleteMessage(chatId, lastFactMessageId);
            console.log(`🗑 Deleted previous fact from ${chatId}`);
          } catch (err) {
            console.log(
              `⚠ Could not delete previous message in ${chatId}: ${err.message}`
            );
          }
        }

        // Use the same fact for all
        const sentMessage = await bot.telegram.sendMessage(chatId, message, {
          ...(topicId ? { message_thread_id: topicId } : {}),
          parse_mode: "Markdown",
        });

        console.log(`✅ Sent new fact to ${chatId}`);

        await saveChat(chatId, topicId, chatTitle, sentMessage.message_id);
      } catch (err) {
        console.error(`❌ Failed for ${chatId}: ${err.message}`);
      }

      await new Promise((res) => setTimeout(res, delayPerMessage));
    }

    skip += batchSize;
  }

  console.log("✅ Finished broadcasting facts.");
}

module.exports = { broadcastFact };
