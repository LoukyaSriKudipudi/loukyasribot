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

bot.command("startfacts", async (ctx) => {
  if (ctx.chat.type === "private" || ctx.chat.id > 0) {
    try {
      const message = await ctx.reply(
        "❌ Facts and quizzes are not available in private chats."
      );
      setTimeout(
        () => ctx.telegram.deleteMessage(ctx.chat.id, message.message_id),
        10000
      );
    } catch (err) {
      console.log("⚠ Could not send private chat message:", err.message);
    }
    return;
  }

  const nextTime = new Date(Date.now() + 60 * 60 * 1000); // first quiz 60 mins later

  await Chat.updateOne(
    { chatId: ctx.chat.id },
    {
      $set: {
        factsEnabled: true,
        quizEnabled: true,
        chatTitle: ctx.chat.title,
        nextQuizTime: nextTime,
        quizFrequencyMinutes: 60,
      },
    },
    { upsert: true }
  );

  try {
    await ctx.deleteMessage(ctx.message.message_id);
  } catch (err) {
    console.log("⚠ Could not delete user command message:", err.message);
  }

  try {
    const message = await ctx.reply(
      "✅ Facts and quizzes enabled in this chat."
    );
    setTimeout(
      () => ctx.telegram.deleteMessage(ctx.chat.id, message.message_id),
      30000
    );
  } catch (err) {
    console.log(
      `🚫 Cannot send enable message to chat ${ctx.chat.id}:`,
      err.message
    );
  }
});

bot.command("stopfacts", async (ctx) => {
  if (ctx.chat.type === "private" || ctx.chat.id > 0) {
    try {
      const message = await ctx.reply(
        "❌ No facts/quizzes are running in private chats."
      );
      setTimeout(
        () => ctx.telegram.deleteMessage(ctx.chat.id, message.message_id),
        10000
      );
    } catch (err) {
      console.log("⚠ Could not send private chat message:", err.message);
    }
    return;
  }

  await Chat.updateOne(
    { chatId: ctx.chat.id },
    { $set: { factsEnabled: false, quizEnabled: false, nextQuizTime: null } }
  );

  try {
    await ctx.deleteMessage(ctx.message.message_id);
  } catch (err) {
    console.log("⚠ Could not delete user command message:", err.message);
  }

  try {
    const message = await ctx.reply(
      "🛑 Facts and quizzes disabled in this chat."
    );
    setTimeout(
      () => ctx.telegram.deleteMessage(ctx.chat.id, message.message_id),
      30000
    );
  } catch (err) {
    console.log(
      `🚫 Cannot send disable message to chat ${ctx.chat.id}:`,
      err.message
    );
  }
});

module.exports = { getFact };
