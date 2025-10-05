const bot = require("../utils/telegramBot");
const path = require("path");
const fs = require("fs");
const eventRecordBot = require("../utils/eventRecordBot");
const Chat = require("../models/chats");
const validateQuiz = require("../utils/quizValidator");
const isBotAdmin = require("../utils/isBotAdmin");

const quizQuestionsFile = path.join(
  __dirname,
  "..",
  "localDB",
  "quizQuestions.json"
);
const quizQuestions = JSON.parse(fs.readFileSync(quizQuestionsFile));

function getQuizQuestionForGroup(chat) {
  const index = chat.quizIndex || 0;
  return quizQuestions[index % quizQuestions.length];
}

let isBroadcasting = false;

async function recordEvent(message) {
  try {
    const groupId = Number(process.env.EVENT_RECORD_GROUP_ID);
    const topicId = Number(process.env.EVENT_RECORD_GROUP_TOPIC_ID);

    const MAX_LENGTH = 4000; // message size limit

    const parts = [];
    for (let i = 0; i < message.length; i += MAX_LENGTH) {
      parts.push(message.slice(i, i + MAX_LENGTH));
    }

    for (const [index, part] of parts.entries()) {
      await new Promise((res) => setTimeout(res, 500)); // small delay

      await eventRecordBot.telegram.sendMessage(
        groupId,
        parts.length > 1
          ? `📄 Part ${index + 1}/${parts.length}\n\n${part}`
          : part,
        {
          ...(topicId ? { message_thread_id: topicId } : {}),
          parse_mode: "Markdown",
        }
      );
    }
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

async function broadcastQuizQuestion() {
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
      const chats = await Chat.find({
        quizEnabled: true,
        canSend: true,
        nextQuizTime: { $lte: new Date() },
      }).limit(batchSize);

      if (!chats.length) break;

      const successBatch = [];
      const failedBatch = [];
      const logs = [];

      for (const chat of chats) {
        const { chatId, topicId, chatTitle, lastQuizMessageId } = chat;

        try {
          // delete old quiz
          if (lastQuizMessageId) {
            try {
              await bot.telegram.deleteMessage(chatId, lastQuizMessageId);
              logs.push(`🗑 Deleted previous quiz in ${chatTitle}`);
            } catch (err) {
              logs.push(`⚠ Could not delete in ${chatTitle}: ${err.message}`);
            }
          }

          if (chat.canSend === false) {
            logs.push(
              `🚫 Skipped ${chatTitle}: bot has no send rights (canSend=false)`
            );
            continue;
          }

          const { question, options, correct, explanation } =
            getQuizQuestionForGroup(chat);

          const validationError = validateQuiz({
            question,
            options,
            explanation,
          });
          if (validationError) {
            logs.push(`❌ Skipped in ${chatTitle}: ${validationError}`);
            failedBatch.push(chatTitle);
            allFailedChats.push(chatTitle);

            chat.quizIndex = (chat.quizIndex + 1) % quizQuestions.length;
            chat.nextQuizTime = new Date(
              Date.now() + (chat.quizFrequencyMinutes || 60) * 60 * 1000
            );
            await chat.save();

            continue;
          }

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

          logs.push(`✅ Sent quiz to ${chatTitle}`);
          successBatch.push(chatTitle);
          allSuccessChats.push(chatTitle);

          // update progress
          chat.lastQuizMessageId = sentQuiz.message_id;
          chat.quizIndex = (chat.quizIndex + 1) % quizQuestions.length;
          chat.nextQuizTime = new Date(
            Date.now() + (chat.quizFrequencyMinutes || 60) * 60 * 1000
          );
          await chat.save();
        } catch (err) {
          if (
            err.response?.error_code === 403 ||
            err.message.includes("bot was kicked")
          ) {
            // bot removed
            chat.canSend = false;
            chat.quizEnabled = false;
            chat.nextQuizTime = null;
            await chat.save();
            logs.push(`❌ Quiz disabled for ${chatTitle}: bot was kicked`);
          } else if (
            err.response?.error_code === 400 &&
            (err.description?.includes("not enough rights to send") ||
              err.description?.includes("polls") ||
              (err.description &&
                err.description.toLowerCase().includes("chat_write_forbidden")))
          ) {
            // locked group
            chat.canSend = false;
            chat.quizEnabled = null;
            chat.nextQuizTime = null;
            await chat.save();
            logs.push(
              `❌ Quiz auto disabled for ${chatTitle}: group is locked (no send rights)`
            );
          } else if (
            err.response?.error_code === 400 &&
            err.description?.toLowerCase().includes("message thread not found")
          ) {
            chat.topicId = null;
            chat.nextQuizTime = new Date(Date.now() + 5000);
            await chat.save();
            logs.push(
              `⚠ Topic deleted in ${chatTitle}, sending future quizzes in main chat`
            );
          } else {
            logs.push(`❌ Failed in ${chatTitle}: ${err.message}`);
          }
          failedBatch.push(chatTitle);
          allFailedChats.push(chatTitle);
        }

        await new Promise((res) => setTimeout(res, delayPerMessage));
      }

      // batch summary
      if (successBatch.length > 0 || failedBatch.length > 0) {
        const now = new Date().toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
          hour12: false,
        });

        await recordEvent(
          `📦 Finished quiz batch at ${now}\n\n` +
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

    // final summary
    if (allSuccessChats.length > 0 || allFailedChats.length > 0) {
      const now = new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour12: false,
      });

      await recordEvent(
        `✅ Finished broadcasting all quizzes at ${now}\n\n` +
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
    console.error("❌ Error during quiz broadcast:", err);
  } finally {
    isBroadcasting = false;
  }
}

module.exports = { broadcastQuizQuestion };
