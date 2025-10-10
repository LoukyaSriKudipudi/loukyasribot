const fs = require("fs");
const path = require("path");
const Chat = require("../models/chats");
const bot = require("../utils/telegramBot");

const factsFile = fs.readFileSync(
  path.join(__dirname, "..", "localDB", "facts.json")
);
const facts = JSON.parse(factsFile);
let index = 0;

function getFact() {
  const fact = facts[index];
  index = (index + 1) % facts.length;
  return fact;
}

bot.command("startquiz", async (ctx) => {
  // Block private chats
  if (ctx.chat.type === "private" || ctx.chat.id > 0) {
    try {
      await ctx.reply(
        "❌ Facts and quizzes are not available in private chats."
      );
    } catch (err) {
      console.log("⚠ Could not send private chat message:", err.message);
    }
    return;
  }

  const nextTime = new Date(Date.now() + 10 * 60 * 1000);

  try {
    await Chat.updateOne(
      { chatId: ctx.chat.id },
      {
        $set: {
          factsEnabled: true,
          quizEnabled: true,
          canSend: true,
          chatTitle: ctx.chat.title || "Unknown Chat",
          nextQuizTime: nextTime,
          quizFrequencyMinutes: 60,
        },
      },
      { upsert: true }
    );
  } catch (err) {
    console.log("⚠ Failed to update chat in DB:", err.message);
  }

  try {
    await ctx.reply("✅ Facts and quizzes enabled in this chat.");
  } catch (err) {
    console.log(
      `🚫 Cannot send enable message to chat ${ctx.chat.id}:`,
      err.message
    );
  }
});

bot.command("stopquiz", async (ctx) => {
  // Block private chats
  if (ctx.chat.type === "private" || ctx.chat.id > 0) {
    try {
      await ctx.reply("❌ No facts/quizzes are running in private chats.");
    } catch (err) {
      console.log("⚠ Could not send private chat message:", err.message);
    }
    return;
  }

  try {
    await Chat.updateOne(
      { chatId: ctx.chat.id },
      {
        $set: {
          factsEnabled: false,
          canSend: false,
          quizEnabled: false,
          nextQuizTime: null,
        },
      }
    );
  } catch (err) {
    console.log("⚠ Failed to update chat in DB:", err.message);
  }

  try {
    await ctx.reply("🛑 Facts and quizzes disabled in this chat.");
  } catch (err) {
    console.log(
      `🚫 Cannot send disable message to chat ${ctx.chat.id}:`,
      err.message
    );
  }
});

module.exports = { getFact };
