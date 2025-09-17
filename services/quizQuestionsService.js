const bot = require("../utils/telegramBot");
const { getQuizChatsBatch, saveQuiz } = require("../utils/saveQuiz");
const path = require("path");
const fs = require("fs");
const eventRecordBot = require("../utils/eventRecordBot");

const quizQuestionsFile = path.join(
  __dirname,
  "..",
  "localDB",
  "quizQuestions.json"
);
const quizQuestions = JSON.parse(fs.readFileSync(quizQuestionsFile));

let index = 0;
function getQuizQuestion() {
  const quizQuestion = quizQuestions[index];
  index = (index + 1) % quizQuestions.length;
  return quizQuestion;
}

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
    console.error("⚠ Failed to record quiz event:", err.message);
  }
}

async function broadcastQuizQuestion() {
  const delayPerMessage = 3000;
  const batchSize = 100;
  let skip = 0;

  const { question, options, correct, explanation } = getQuizQuestion();

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
        // 🗑 delete previous quiz
        if (lastQuizMessageId) {
          try {
            await bot.telegram.deleteMessage(chatId, lastQuizMessageId);
            logs.push(`🗑 Deleted previous quiz in ${chatTitle}`);
          } catch (err) {
            logs.push(
              `⚠ Could not delete previous quiz in ${chatTitle}: ${err.message}`
            );
          }
        }

        // 📩 send new quiz
        const sentQuiz = await bot.telegram.sendQuiz(
          chatId,
          question,
          options,
          {
            correct_option_id: correct,
            explanation,
            is_anonymous: true,
            ...(topicId ? { message_thread_id: topicId } : {}),
          }
        );

        logs.push(`✅ Sent quiz to ${chatTitle} (${chatId})`);
        successChatsBatch.push(chatTitle);
        allSuccessChats.push(chatTitle);

        // 💾 save last quiz ID
        await saveQuiz(chatId, topicId, chatTitle, sentQuiz.message_id);
      } catch (err) {
        logs.push(`❌ Failed for ${chatTitle} (${chatId}): ${err.message}`);
        failedChatsBatch.push(chatTitle);
        allFailedChats.push(chatTitle);
      }

      await new Promise((res) => setTimeout(res, delayPerMessage));
    }

    // 📦 batch log
    const now = new Date();
    const timestampIST = now.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour12: false,
    });

    await recordEvent(
      `📦 Finished quiz batch at ${timestampIST}\n\n` +
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
    `✅ Finished broadcasting all quizzes at ${timestampIST}\n\n` +
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

module.exports = { broadcastQuizQuestion };
