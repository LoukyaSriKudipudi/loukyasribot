const bot = require("../utils/telegramBot");
const { getQuizChatsBatch, saveQuiz } = require("../utils/saveQuiz");
const { getQuestion } = require("./quizService");
const eventRecordBot = require("../utils/eventRecordBot");

// Function to log events to your event recording group
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

// Main function to broadcast quiz questions
async function broadcastQuiz() {
  const delayPerMessage = 3000;
  const batchSize = 100;
  let skip = 0;

  const quiz = getQuestion();

  let message = `❓ *${quiz.question}*\n`;

  for (const [key, value] of Object.entries(quiz.options)) {
    message += `\n*${key})* ${value}`;
  }

  const allSuccessChats = [];
  const allFailedChats = [];

  while (true) {
    const chats = await getQuizChatsBatch(skip, batchSize);
    if (!chats.length) break;

    const successChatsBatch = [];
    const failedChatsBatch = [];
    const logs = [];

    for (const { chatId, topicId, chatTitle, lastQuizMessageId } of chats) {
      try {
        // Delete previous quiz message if exists
        // if (lastQuizMessageId) {
        //   try {
        //     await bot.telegram.deleteMessage(chatId, lastQuizMessageId);
        //     logs.push(`🗑 Deleted previous quiz in ${chatTitle}`);
        //   } catch (err) {
        //     logs.push(
        //       `⚠ Could not delete previous quiz in ${chatTitle}: ${err.message}`
        //     );
        //   }
        // }

        // Send new quiz
        const sentMessage = await bot.telegram.sendMessage(chatId, message, {
          ...(topicId
            ? { message_thread_id: topicId, protect_content: true }
            : { protect_content: true }),
          parse_mode: "Markdown",
        });

        logs.push(`✅ Sent new quiz to ${chatTitle}`);
        successChatsBatch.push(chatTitle);
        allSuccessChats.push(chatTitle);

        // Save last quiz message ID
        await saveQuiz(chatId, topicId, chatTitle, sentMessage.message_id);
      } catch (err) {
        logs.push(`❌ Failed for ${chatTitle}: ${err.message}`);
        failedChatsBatch.push(chatTitle);
        allFailedChats.push(chatTitle);
      }

      // Delay between sending messages
      await new Promise((res) => setTimeout(res, delayPerMessage));
    }

    // Send batch logs to event group
    const now = new Date();
    const timestampIST = now.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour12: false,
    });

    await recordEvent(
      `📦 Finished batch at ${timestampIST}\n\n` +
        `📊 Batch Summary:\n` +
        `• Total chats: ${
          successChatsBatch.length + failedChatsBatch.length
        }\n` +
        `• ✅ Success: ${successChatsBatch.join(", ") || "None"}\n` +
        `• ❌ Failed: ${failedChatsBatch.join(", ") || "None"}\n\n` +
        `📝 Logs:\n${logs.join("\n")}`
    );

    skip += batchSize;
  }

  // Final summary
  const now = new Date();
  const timestampIST = now.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour12: false,
  });

  await recordEvent(
    `✅ Finished broadcasting all quizzes at ${timestampIST}\n\n` +
      `📊 Final Summary:\n` +
      `• Total chats: ${allSuccessChats.length + allFailedChats.length}\n` +
      `• ✅ Success: ${allSuccessChats.join(", ") || "None"}\n` +
      `• ❌ Failed: ${allFailedChats.join(", ") || "None"}`
  );
}

module.exports = { broadcastQuiz };
